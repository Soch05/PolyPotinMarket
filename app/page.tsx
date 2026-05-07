import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Market } from '@/types'
import { calculateProbability } from '@/lib/utils'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: markets } = await supabase
    .from('markets')
    .select('*')
    .eq('status', 'open')
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Open Markets</h1>
        <Link
          href="/markets/create"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Create Market
        </Link>
      </div>

      {!markets || markets.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No open markets yet.</p>
          <Link href="/markets/create" className="text-indigo-400 hover:underline mt-2 inline-block">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {markets.map((market: Market) => {
            const { totalYes, totalNo, probability } = getStats(market.id)
            return (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{market.title}</h2>
                    {market.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{market.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      Closes {new Date(market.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-indigo-400">{probability}%</div>
                    <div className="text-xs text-gray-400">Yes</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Yes: {totalYes} tokens</span>
                    <span>No: {totalNo} tokens</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
