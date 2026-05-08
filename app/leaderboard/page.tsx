import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { displayName } from '@/types'

export default async function LeaderboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: users } = await supabase
    .from('users')
    .select('id, email, balance, role')
    .order('balance', { ascending: false })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Classement</h1>
      <p className="text-gray-400 mb-8">Tous les participants classés par tokens</p>

      <div className="space-y-2">
        {(users ?? []).map((u, i) => {
          const isMe = u.id === user.id
          const medal = medals[i] ?? null

          return (
            <div
              key={u.id}
              className={`flex items-center gap-4 rounded-xl px-5 py-4 border transition-colors ${
                isMe
                  ? 'bg-indigo-600/10 border-indigo-500/40'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="w-8 text-center shrink-0">
                {medal ? (
                  <span className="text-xl">{medal}</span>
                ) : (
                  <span className="text-gray-500 font-mono text-sm">{i + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isMe ? 'text-indigo-300' : 'text-gray-100'}`}>
                  {u.email.split('@')[0]}
                  {isMe && <span className="text-xs text-indigo-400 ml-2">(moi)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-lg font-bold ${isMe ? 'text-indigo-300' : 'text-gray-100'}`}>
                  {u.balance}
                </div>
                <div className="text-xs text-gray-500">tokens</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
