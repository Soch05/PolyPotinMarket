import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'modo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceRoleClient()

  const { data: bet } = await serviceClient
    .from('bets')
    .select('id, user_id, amount, market_id')
    .eq('id', params.id)
    .single()

  if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })

  // Check the market is still open — no refund on resolved markets
  const { data: market } = await serviceClient
    .from('markets')
    .select('status')
    .eq('id', bet.market_id)
    .single()

  const { error: deleteError } = await serviceClient
    .from('bets')
    .delete()
    .eq('id', params.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  // Refund tokens only if market is still open
  if (market?.status === 'open') {
    const { data: betOwner } = await serviceClient
      .from('users')
      .select('balance')
      .eq('id', bet.user_id)
      .single()

    if (betOwner) {
      await serviceClient
        .from('users')
        .update({ balance: betOwner.balance + bet.amount })
        .eq('id', bet.user_id)
    }
  }

  return NextResponse.json({ success: true, refunded: market?.status === 'open' })
}
