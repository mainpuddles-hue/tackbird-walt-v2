import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: badges } = await supabase
    .from('user_badges')
    .select('badge_type')
    .eq('user_id', user.id)

  // Reviews with reviewer info
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)
    `)
    .eq('reviewed_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  // Own posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, type, title, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  // Saved posts
  const { data: savedRaw } = await supabase
    .from('saved_posts')
    .select('post_id, posts(id, type, title, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const savedPosts = savedRaw?.map((s) => s.posts).filter(Boolean) ?? []

  // Rental bookings (as lender or borrower)
  const { data: rentals } = await supabase
    .from('rental_bookings')
    .select(`
      *,
      post:posts(id, title, type),
      lender:profiles!rental_bookings_lender_id_fkey(id, name, avatar_url),
      borrower:profiles!rental_bookings_borrower_id_fkey(id, name, avatar_url)
    `)
    .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <ProfileClient
      profile={profile}
      badges={badges ?? []}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
      reviews={reviews ?? []}
      posts={posts ?? []}
      savedPosts={savedPosts}
      rentals={rentals ?? []}
    />
  )
}
