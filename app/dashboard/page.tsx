import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { BetWithMarket } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: bets }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('bets')
      .select('*, markets(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const totalBetted = (bets ?? []).reduce((s: number, b: BetWithMarket) => s + b.amount, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="text-sm text-gray-400 mb-1">Balance</div>
          <div className="text-3xl font-bold text-indigo-400">{profile?.balance ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">tokens</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="text-sm text-gray-400 mb-1">Total Bets</div>
          <div className="text-3xl font-bold">{(bets ?? []).length}</div>
          <div className="text-xs text-gray-500 mt-1">placed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="text-sm text-gray-400 mb-1">Tokens Bet</div>
          <div className="text-3xl font-bold">{totalBetted}</div>
          <div className="text-xs text-gray-500 mt-1">total wagered</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">My Bets</h2>

      {!bets || bets.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No bets yet. Go find a market!</p>
      ) : (
        <div className="space-y-3">
          {(bets as BetWithMarket[]).map((bet) => {
            const market = bet.markets
            const isResolved = market?.status === 'closed'
            const won = isResolved && market.result === bet.side

            return (
              <div key={bet.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{market?.title ?? 'Unknown market'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        bet.side === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {bet.side.toUpperCase()}
                      </span>
                      {isResolved && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          won ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {won ? 'Won' : 'Lost'}
                        </span>
                      )}
                      {!isResolved && (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{bet.amount} tokens</div>
                    <div className="text-xs text-gray-500">{new Date(bet.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
