import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient, type AdminClientProps } from './admin-client'

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
  const [usersResult, postsResult, reportsResult, adsResult, rentalsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('advertisements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('rental_bookings').select('id', { count: 'exact', head: true }),
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

  // Recent posts with author info
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, title, type, is_active, is_pro_listing, created_at,
      user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // All advertisements with advertiser info
  const { data: ads } = await supabase
    .from('advertisements')
    .select(`
      id, title, status, impressions, clicks, daily_rate, total_cost, start_date, end_date, created_at,
      advertiser:profiles!advertisements_advertiser_id_fkey(id, name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  // Recent rental bookings with related data
  const { data: rentals } = await supabase
    .from('rental_bookings')
    .select(`
      id, status, total_fee, platform_commission, days, daily_fee, start_date, end_date, created_at,
      post:posts!rental_bookings_post_id_fkey(id, title),
      lender:profiles!rental_bookings_lender_id_fkey(id, name, avatar_url),
      borrower:profiles!rental_bookings_borrower_id_fkey(id, name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Supabase typed-joins infer foreign key relations as arrays,
  // but at runtime single-row joins return a single object. Cast via unknown.
  return (
    <AdminClient
      stats={{
        users: usersResult.count ?? 0,
        posts: postsResult.count ?? 0,
        pendingReports: reportsResult.count ?? 0,
        activeAds: adsResult.count ?? 0,
        totalRentals: rentalsResult.count ?? 0,
      }}
      reports={(reports ?? []) as unknown as AdminClientProps['reports']}
      users={users ?? []}
      posts={(posts ?? []) as unknown as AdminClientProps['posts']}
      ads={(ads ?? []) as unknown as AdminClientProps['ads']}
      rentals={(rentals ?? []) as unknown as AdminClientProps['rentals']}
    />
  )
}
