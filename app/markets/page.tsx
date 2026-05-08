import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Market } from '@/types'
import { calculateProbability } from '@/lib/utils'

export default async function MarketsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: markets } = await supabase
    .from('markets')
    .select('*')
    .or(`hidden_user_id.is.null,hidden_user_id.neq.${user.id}`)
    .order('created_at', { ascending: false })

  const marketIds = (markets ?? []).map((m: Market) => m.id)
  const { data: bets } = marketIds.length
    ? await supabase.from('bets').select('market_id, side, amount').in('market_id', marketIds)
    : { data: [] }

  function getStats(marketId: string) {
    const marketBets = (bets ?? []).filter((b) => b.market_id === marketId)
    const totalYes = marketBets.filter((b) => b.side === 'yes').reduce((s, b) => s + b.amount, 0)
    const totalNo = marketBets.filter((b) => b.side === 'no').reduce((s, b) => s + b.amount, 0)
    return { totalYes, totalNo, probability: calculateProbability(totalYes, totalNo) }
  }

  const open = (markets ?? []).filter((m: Market) => m.status === 'open')
  const closed = (markets ?? []).filter((m: Market) => m.status === 'closed')

  function MarketCard({ market }: { market: Market }) {
    const { totalYes, totalNo, probability } = getStats(market.id)
    return (
      <Link
        href={`/markets/${market.id}`}
        className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500 transition-colors block"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{market.title}</h2>
              {market.status === 'closed' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  market.result === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {market.result?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {market.status === 'closed' ? 'Closed' : `Closes ${new Date(market.end_date).toLocaleDateString()}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-indigo-400">{probability}%</div>
            <div className="text-xs text-gray-400">Yes</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${probability}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{totalYes} Yes</span>
            <span>{totalNo} No</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">All Markets</h1>
        <Link
          href="/markets/create"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Create
        </Link>
      </div>

      {open.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Open</h2>
          <div className="grid gap-3">
            {open.map((m: Market) => <MarketCard key={m.id} market={m} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Closed</h2>
          <div className="grid gap-3 opacity-70">
            {closed.map((m: Market) => <MarketCard key={m.id} market={m} />)}
          </div>
        </section>
      )}

      {(!markets || markets.length === 0) && (
        <p className="text-center text-gray-400 py-20">No markets yet.</p>
      )}
    </div>
  )
}
