import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PostDetailClient } from './post-detail-client'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto, response_rate, is_pro, bio),
      images:post_images(id, image_url, sort_order)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!post) notFound()

  // Check if saved
  let isSaved = false
  if (user) {
    const { count } = await supabase
      .from('saved_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('post_id', id)
    isSaved = (count ?? 0) > 0
  }

  // Check if blocked
  let isBlocked = false
  if (user && user.id !== post.user_id) {
    const { count } = await supabase
      .from('blocked_users')
      .select('*', { count: 'exact', head: true })
      .eq('blocker_id', user.id)
      .eq('blocked_id', post.user_id)
    isBlocked = (count ?? 0) > 0
  }

  // Get reviews for post author
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, name, avatar_url)
    `)
    .eq('reviewed_id', post.user_id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: ratingData } = await supabase
    .rpc('avg_rating', { user_id_param: post.user_id })

  return (
    <PostDetailClient
      post={post}
      reviews={reviews ?? []}
      avgRating={typeof ratingData === 'number' ? ratingData : null}
      isSaved={isSaved}
      isBlocked={isBlocked}
      currentUserId={user?.id ?? null}
    />
  )
}
