'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { displayName } from '@/types'
import type { User } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setUsername(data.username ?? '')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess('Pseudo mis à jour !')
      setProfile((p) => p ? { ...p, username: data.username } : p)
    }

    setLoading(false)
  }

  if (!profile) return <p className="text-gray-400">Chargement…</p>

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Paramètres</h1>
      <p className="text-gray-400 mb-8">Personnalise ton profil</p>

      <div className="bg-gray-900 rounded-xl p-6">
        <div className="mb-5 pb-5 border-b border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Email</p>
          <p className="text-gray-200">{profile.email}</p>
        </div>

        <div className="mb-5 pb-5 border-b border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Pseudo actuel</p>
          <p className="text-indigo-300 font-medium">{displayName(profile)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: jean_dupont"
              maxLength={20}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              2–20 caractères · lettres, chiffres, _ - . autorisés
            </p>
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
            disabled={loading || !username.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
