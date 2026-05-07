import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { email, password, inviteCode } = await req.json()

  if (!email || !password || !inviteCode) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (inviteCode !== process.env.INVITE_CODE) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 })
  }

  const supabase = createServiceRoleClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 })
  }

  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    balance: 100,
    role: 'user',
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
