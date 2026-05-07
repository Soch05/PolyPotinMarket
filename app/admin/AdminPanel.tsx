'use client'

import { useState } from 'react'
import type { Market, User, Bet } from '@/types'

interface BetWithUser extends Bet {
  users: Pick<User, 'email'>
}

interface Props {
  markets: Market[]
  users: Pick<User, 'id' | 'email' | 'balance' | 'role'>[]
  bets: BetWithUser[]
}

export default function AdminPanel({ markets, users, bets: initialBets }: Props) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [resolvedMarkets, setResolvedMarkets] = useState<Set<string>>(
    new Set(markets.filter((m) => m.status === 'closed').map((m) => m.id))
  )
  const [bets, setBets] = useState<BetWithUser[]>(initialBets)
  const [betFilter, setBetFilter] = useState('')

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setMessage('') }
    else { setMessage(msg); setError('') }
    setTimeout(() => { setMessage(''); setError('') }, 4000)
  }

  async function distribute() {
    setLoading('distribute')
    const res = await fetch('/api/admin/distribute', { method: 'POST' })
    const data = await res.json()
    res.ok ? flash(data.message) : flash(data.error, true)
    setLoading(null)
  }

  async function resolve(marketId: string, result: 'yes' | 'no') {
    setLoading(`resolve-${marketId}-${result}`)
    const res = await fetch('/api/admin/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_id: marketId, result }),
    })
    const data = await res.json()
    if (res.ok) {
      setResolvedMarkets((prev) => new Set(Array.from(prev).concat(marketId)))
      flash(data.message)
    } else {
      flash(data.error, true)
    }
    setLoading(null)
  }

  async function deleteBet(betId: string) {
    if (!confirm('Supprimer ce pari ? Les tokens seront remboursés si le marché est encore ouvert.')) return
    setLoading(`delete-${betId}`)
    const res = await fetch(`/api/bets/${betId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      setBets((prev) => prev.filter((b) => b.id !== betId))
      flash(data.refunded ? 'Pari supprimé et tokens remboursés.' : 'Pari supprimé (marché clôturé, pas de remboursement).')
    } else {
      flash(data.error, true)
    }
    setLoading(null)
  }

  const openMarkets = markets.filter((m) => !resolvedMarkets.has(m.id))
  const closedMarkets = markets.filter((m) => resolvedMarkets.has(m.id))

  const marketTitles = Object.fromEntries(markets.map((m) => [m.id, m.title]))
  const filteredBets = betFilter
    ? bets.filter(
        (b) =>
          b.users?.email?.toLowerCase().includes(betFilter.toLowerCase()) ||
          marketTitles[b.market_id]?.toLowerCase().includes(betFilter.toLowerCase())
      )
    : bets

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
      <p className="text-gray-400 mb-8">Moderator controls</p>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg px-4 py-3 mb-6">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Token distribution */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-1">Daily Token Distribution</h2>
        <p className="text-gray-400 text-sm mb-4">Give +10 tokens to every user</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{users.length} users registered</span>
          <button
            onClick={distribute}
            disabled={loading === 'distribute'}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading === 'distribute' ? 'Distributing…' : 'Distribute +10 tokens'}
          </button>
        </div>
      </div>

      {/* Resolve markets */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-1">Resolve Markets</h2>
        <p className="text-gray-400 text-sm mb-4">Close a market and pay out winners</p>

        {openMarkets.length === 0 ? (
          <p className="text-gray-500 text-sm">No open markets to resolve.</p>
        ) : (
          <div className="space-y-3">
            {openMarkets.map((market) => (
              <div key={market.id} className="flex items-center justify-between gap-4 border border-gray-800 rounded-lg p-4">
                <div className="flex-1">
                  <p className="font-medium text-sm">{market.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Closes {new Date(market.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(market.id, 'yes')}
                    disabled={!!loading}
                    className="bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading === `resolve-${market.id}-yes` ? '…' : 'Yes'}
                  </button>
                  <button
                    onClick={() => resolve(market.id, 'no')}
                    disabled={!!loading}
                    className="bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading === `resolve-${market.id}-no` ? '…' : 'No'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete bets */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-1">Supprimer des paris</h2>
        <p className="text-gray-400 text-sm mb-4">
          Les tokens sont remboursés si le marché est encore ouvert.
        </p>
        <input
          type="text"
          placeholder="Filtrer par email ou marché…"
          value={betFilter}
          onChange={(e) => setBetFilter(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-indigo-500"
        />
        {filteredBets.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun pari trouvé.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredBets.map((bet) => (
              <div key={bet.id} className="flex items-center justify-between gap-3 border border-gray-800 rounded-lg px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{marketTitles[bet.market_id] ?? bet.market_id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bet.users?.email} ·{' '}
                    <span className={bet.side === 'yes' ? 'text-green-400' : 'text-red-400'}>
                      {bet.side.toUpperCase()}
                    </span>
                    {' '}· {bet.amount} tokens
                  </p>
                </div>
                <button
                  onClick={() => deleteBet(bet.id)}
                  disabled={loading === `delete-${bet.id}`}
                  className="shrink-0 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 disabled:opacity-50 px-2 py-1 rounded transition-colors"
                >
                  {loading === `delete-${bet.id}` ? '…' : 'Supprimer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Users ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left pb-2">Email</th>
                <th className="text-right pb-2">Balance</th>
                <th className="text-right pb-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-300">{u.email}</td>
                  <td className="py-2 text-right text-indigo-400">{u.balance}</td>
                  <td className="py-2 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'modo' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
