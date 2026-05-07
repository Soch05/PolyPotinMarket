'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { calculateProbability } from '@/lib/utils'
import type { Market, Bet, User } from '@/types'
import ProbabilityChart from '@/components/ProbabilityChart'

interface Props {
  market: Market
  initialBets: Bet[]
  user: User
}

export default function MarketDetail({ market, initialBets, user }: Props) {
  const [bets, setBets] = useState<Bet[]>(initialBets)
  const [amount, setAmount] = useState('')
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(user.balance)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`market-${market.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bets', filter: `market_id=eq.${market.id}` },
        (payload) => {
          setBets((prev) => [...prev, payload.new as Bet])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [market.id])

  const totalYes = bets.filter((b) => b.side === 'yes').reduce((s, b) => s + b.amount, 0)
  const totalNo = bets.filter((b) => b.side === 'no').reduce((s, b) => s + b.amount, 0)
  const probability = calculateProbability(totalYes, totalNo)
  const totalPool = totalYes + totalNo

  async function handleBet(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const amt = parseInt(amount)

    if (isNaN(amt) || amt < 1) { setError('Minimum bet is 1 token'); return }
    if (amt > balance) { setError(`You only have ${balance} tokens`); return }

    setLoading(true)

    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_id: market.id, side, amount: amt }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to place bet')
    } else {
      setSuccess(`Pari placé ! ${amt} tokens sur ${side.toUpperCase()}`)
      setBalance((b) => b - amt)
      setAmount('')
    }

    setLoading(false)
  }

  const isClosed = market.status === 'closed'
  const userBets = bets.filter((b) => b.user_id === user.id)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{market.title}</h1>
        {market.description && (
          <p className="text-gray-400 mt-2">{market.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <span>Clôture le {new Date(market.end_date).toLocaleDateString('fr-FR')}</span>
          {isClosed && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              market.result === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              Résolu : {market.result?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ProbabilityChart bets={bets} />
      </div>

      {/* Yes/No bar */}
      <div className="bg-gray-900 rounded-xl p-5 mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span className="font-medium text-green-400">Yes — {totalYes} tokens</span>
          <span className="font-medium text-red-400">No — {totalNo} tokens</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${probability}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${100 - probability}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 text-gray-500">
          <span>{probability}%</span>
          <span>{totalPool} tokens dans la cagnotte · {bets.length} paris</span>
          <span>{100 - probability}%</span>
        </div>
      </div>

      {/* Bet form */}
      {!isClosed ? (
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Placer un pari</h2>
            <span className="text-sm text-indigo-400 font-medium">{balance} tokens</span>
          </div>

          <form onSubmit={handleBet} className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSide('yes')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  side === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setSide('no')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  side === 'no' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                No
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                max={balance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant (tokens)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setAmount(String(balance))}
                className="text-xs text-gray-400 hover:text-white px-3 py-2 bg-gray-800 rounded-lg"
              >
                All in
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'En cours…' : `Parier ${amount || '?'} sur ${side.toUpperCase()}`}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl p-6 mb-6 text-center text-gray-400">
          Ce marché est clôturé.
        </div>
      )}

      {/* User's bets */}
      {userBets.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Mes paris</h2>
          <div className="space-y-2">
            {userBets.map((b) => (
              <div key={b.id} className="flex justify-between items-center text-sm">
                <span className={b.side === 'yes' ? 'text-green-400' : 'text-red-400'}>
                  {b.side.toUpperCase()}
                </span>
                <span>{b.amount} tokens</span>
                <span className="text-gray-500">
                  {new Date(b.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
