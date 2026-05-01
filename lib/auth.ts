import { supabase } from './supabase'

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(userId: string): Promise<'admin' | 'editor' | null> {
  const { data } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role ?? null
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}
