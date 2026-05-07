'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateMarketPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endHour, setEndHour] = useState('23')
  const [endMinute, setEndMinute] = useState('59')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Combine date + time into a full ISO string (local time)
    const endDateTime = new Date(`${endDate}T${endHour.padStart(2, '0')}:${endMinute.padStart(2, '0')}:00`)

    if (endDateTime <= new Date()) {
      setError("La date et l'heure de clôture doivent être dans le futur")
      setLoading(false)
      return
    }

    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, end_date: endDateTime.toISOString() }),
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
                {hours.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-gray-400 font-bold">:</span>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(e.target.value)}
                className="bg-transparent focus:outline-none text-sm"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
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
