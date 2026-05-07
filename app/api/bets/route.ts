import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { market_id, side, amount } = await req.json()

  if (!market_id || !side || !amount) {
    return NextResponse.json({ error: 'market_id, side, and amount are required' }, { status: 400 })
  }

  if (!['yes', 'no'].includes(side)) {
    return NextResponse.json({ error: 'Side must be yes or no' }, { status: 400 })
  }

  const parsedAmount = parseInt(amount)
  if (isNaN(parsedAmount) || parsedAmount < 1) {
    return NextResponse.json({ error: 'Amount must be at least 1' }, { status: 400 })
  }

  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('id, status')
    .eq('id', market_id)
    .single()

  if (marketError || !market) {
    return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  }

  if (market.status !== 'open') {
    return NextResponse.json({ error: 'This market is closed' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  if (profile.balance < parsedAmount) {
    return NextResponse.json({ error: `Insufficient balance. You have ${profile.balance} tokens.` }, { status: 400 })
  }

  const { error: deductError } = await supabase
    .from('users')
    .update({ balance: profile.balance - parsedAmount })
    .eq('id', user.id)

  if (deductError) {
    return NextResponse.json({ error: 'Failed to deduct tokens' }, { status: 500 })
  }

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({ user_id: user.id, market_id, side, amount: parsedAmount })
    .select()
    .single()

  if (betError) {
    await supabase.from('users').update({ balance: profile.balance }).eq('id', user.id)
    return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
  }

  return NextResponse.json(bet, { status: 201 })
}
