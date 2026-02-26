import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BlockedClient } from './blocked-client'

export default async function BlockedUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: blocked } = await supabase
    .from('blocked_users')
    .select('blocked_id, blocked:profiles!blocked_users_blocked_id_fkey(id, name, avatar_url, naapurusto)')
    .eq('blocker_id', user.id)

  // Supabase returns joined single relations as arrays; normalize to single objects
  const normalized = (blocked ?? []).map((b) => ({
    ...b,
    blocked: Array.isArray(b.blocked) ? b.blocked[0] ?? null : b.blocked ?? null,
  }))

  return <BlockedClient blockedUsers={normalized} />
}
