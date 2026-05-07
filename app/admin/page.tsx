import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AdminPanel from './AdminPanel'
import type { Market } from '@/types'

export default async function AdminPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (profile?.role !== 'modo') redirect('/')

  const { data: markets } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: users } = await supabase.from('users').select('id, email, balance, role')

  const { data: bets } = await supabase
    .from('bets')
    .select('*, users(email)')
    .order('created_at', { ascending: false })

  return <AdminPanel markets={markets ?? []} users={users ?? []} bets={bets ?? []} />
}
