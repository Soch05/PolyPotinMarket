'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { displayName } from '@/types'

interface UserOption {
  id: string
  email: string
  username: string | null
}

export default function CreateMarketPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endHour, setEndHour] = useState('23')
  const [endMinute, setEndMinute] = useState('59')
  const [hideEnabled, setHideEnabled] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [search, setSearch] = useState('')
  const [hiddenUser, setHiddenUser] = useState<UserOption | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.username ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (hideEnabled && !hiddenUser) {
      setError('Sélectionne un membre à masquer ou décoche l\'option')
      return
    }

    setLoading(true)

    const endDateTime = new Date(`${endDate}T${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}:00`)

    if (endDateTime <= new Date()) {
      setError("La date et l'heure de clôture doivent être dans le futur")
      setLoading(false)
      return
    }

    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        end_date: endDateTime.toISOString(),
        hidden_user_id: hideEnabled && hiddenUser ? hiddenUser.id : null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Échec de la création du marché')
      setLoading(false)
      return
    }

    router.push(`/markets/${data.id}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Créer un marché</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Va-t-il pleuvoir vendredi ?"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-gray-500 text-xs mt-1">Formule une question claire Oui/Non</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-gray-500">(optionnel)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Contexte ou critères de résolution…"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date et heure de clôture</label>
          <div className="flex gap-2">
            <input
              type="date"
              required
              min={today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-indigo-500">
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="bg-transparent focus:outline-none text-sm"
              >
                {hours.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-gray-400 font-bold">:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
                className="bg-transparent focus:outline-none text-sm"
              >
                {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {endDate && (
            <p className="text-gray-500 text-xs mt-1.5">
              Clôture le{' '}
              {new Date(`${endDate}T${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}:00`).toLocaleString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Masquer un membre */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hideEnabled}
              onChange={(e) => {
                setHideEnabled(e.target.checked)
                if (!e.target.checked) { setHiddenUser(null); setSearch('') }
              }}
              className="w-4 h-4 accent-indigo-500"
            />
            <div>
              <p className="font-medium text-sm">Masquer un membre</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Ce membre ne pourra pas voir ni accéder à ce marché
              </p>
            </div>
          </label>

          {hideEnabled && (
            <div className="mt-4 relative" ref={dropdownRef}>
              {hiddenUser ? (
                <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-indigo-300">
                      {displayName(hiddenUser)}
                    </p>
                    <p className="text-xs text-gray-500">{hiddenUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setHiddenUser(null); setSearch('') }}
                    className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true) }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Chercher par pseudo ou email…"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {dropdownOpen && filtered.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filtered.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setHiddenUser(u); setDropdownOpen(false); setSearch('') }}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-700 transition-colors"
                        >
                          <p className="text-sm font-medium">{displayName(u)}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen && search && filtered.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-gray-400">
                      Aucun résultat
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Création…' : 'Créer le marché'}
          </button>
        </div>
      </form>
    </div>
  )
}
