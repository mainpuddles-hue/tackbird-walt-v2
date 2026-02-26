import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './admin-client'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  // Dashboard stats
  const [usersResult, postsResult, reportsResult, adsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('advertisements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  // Recent reports
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, name, avatar_url),
      reported_user:profiles!reports_reported_user_id_fkey(id, name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Recent users
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, naapurusto, is_pro, is_admin, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <AdminClient
      stats={{
        users: usersResult.count ?? 0,
        posts: postsResult.count ?? 0,
        pendingReports: reportsResult.count ?? 0,
        activeAds: adsResult.count ?? 0,
      }}
      reports={reports ?? []}
      users={users ?? []}
    />
  )
}
