import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import MarketDetail from './MarketDetail'

export default async function MarketPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: market }, { data: bets }, { data: profile }] = await Promise.all([
    supabase.from('markets').select('*').eq('id', params.id).single(),
    supabase.from('bets').select('*').eq('market_id', params.id),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ])

  if (!market) notFound()

  return <MarketDetail market={market} initialBets={bets ?? []} user={profile} />
}
