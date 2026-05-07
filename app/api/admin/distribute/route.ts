import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'modo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceRoleClient()

  const { data: users, error: fetchError } = await serviceClient.from('users').select('id, balance')
  if (fetchError) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })

  const updates = (users ?? []).map((u: { id: string; balance: number }) =>
    serviceClient.from('users').update({ balance: u.balance + 10 }).eq('id', u.id)
  )

  await Promise.all(updates)

  return NextResponse.json({ message: `Distributed +10 tokens to ${(users ?? []).length} users` })
}
