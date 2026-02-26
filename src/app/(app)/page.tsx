import { createClient } from '@/lib/supabase/server'
import { FeedClient } from './feed-client'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto, is_pro, is_hub),
      images:post_images(id, image_url, sort_order)
    `)
    .eq('is_active', true)
    .order('is_pro_listing', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  return <FeedClient initialPosts={posts ?? []} />
}
