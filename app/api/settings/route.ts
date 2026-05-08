import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await req.json()

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Pseudo invalide' }, { status: 400 })
  }

  const clean = username.trim()

  if (clean.length < 2 || clean.length > 20) {
    return NextResponse.json({ error: 'Le pseudo doit faire entre 2 et 20 caractères' }, { status: 400 })
  }

  if (!/^[a-zA-Z0-9_\-\.]+$/.test(clean)) {
    return NextResponse.json({ error: 'Caractères autorisés : lettres, chiffres, _ - .' }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update({ username: clean })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, username: clean })
}
