import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { UserProfileClient } from './user-profile-client'

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Redirect to own profile if viewing self
  if (currentUser?.id === userId) {
    redirect('/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const { data: badges } = await supabase
    .from('user_badges')
    .select('badge_type')
    .eq('user_id', userId)

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)
    `)
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  const { data: posts } = await supabase
    .from('posts')
    .select('id, type, title, created_at, image_url')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  // Check if blocked
  let isBlocked = false
  if (currentUser) {
    const { data: block } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', currentUser.id)
      .eq('blocked_id', userId)
      .limit(1)
      .maybeSingle()
    isBlocked = !!block
  }

  return (
    <UserProfileClient
      profile={profile}
      badges={badges ?? []}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
      reviews={reviews ?? []}
      posts={posts ?? []}
      isBlocked={isBlocked}
      currentUserId={currentUser?.id ?? null}
    />
  )
}
