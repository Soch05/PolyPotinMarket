import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { calculateWinnings } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'modo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { market_id, result } = await req.json()

  if (!market_id || !result) {
    return NextResponse.json({ error: 'market_id and result are required' }, { status: 400 })
  }

  if (!['yes', 'no'].includes(result)) {
    return NextResponse.json({ error: 'Result must be yes or no' }, { status: 400 })
  }

  const serviceClient = createServiceRoleClient()

  const { data: market } = await serviceClient
    .from('markets')
    .select('id, status')
    .eq('id', market_id)
    .single()

  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.status === 'closed') return NextResponse.json({ error: 'Market already resolved' }, { status: 400 })

  const { data: bets } = await serviceClient
    .from('bets')
    .select('*')
    .eq('market_id', market_id)

  const allBets = bets ?? []
  const winningBets = allBets.filter((b) => b.side === result)
  const losingBets = allBets.filter((b) => b.side !== result)

  const losersPool = losingBets.reduce((s, b) => s + b.amount, 0)
  const totalWinningTokens = winningBets.reduce((s, b) => s + b.amount, 0)

  const payoutUpdates = winningBets.map(async (bet) => {
    const payout = calculateWinnings(bet.amount, totalWinningTokens, losersPool)
    const { data: userProfile } = await serviceClient
      .from('users')
      .select('balance')
      .eq('id', bet.user_id)
      .single()

    if (userProfile) {
      await serviceClient
        .from('users')
        .update({ balance: userProfile.balance + payout })
        .eq('id', bet.user_id)
    }
  })

  await Promise.all(payoutUpdates)

  await serviceClient
    .from('markets')
    .update({ status: 'closed', result })
    .eq('id', market_id)

  return NextResponse.json({
    message: `Market resolved as ${result.toUpperCase()}. ${winningBets.length} winners paid out.`,
  })
}
