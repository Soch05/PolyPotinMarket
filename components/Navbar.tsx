'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@/types'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setUser(data)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-indigo-400 hover:text-indigo-300">
          PolyPotinMarket
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/markets" className="text-gray-300 hover:text-white">Markets</Link>
              <Link href="/markets/create" className="text-gray-300 hover:text-white">+ Create</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white">Classement</Link>
              {user.role === 'modo' && (
                <Link href="/admin" className="text-yellow-400 hover:text-yellow-300">Admin</Link>
              )}
              <span className="text-indigo-400 font-medium">{user.balance} tokens</span>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-300 hover:text-white">Login</Link>
              <Link
                href="/auth/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
