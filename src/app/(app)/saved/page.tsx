import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SavedClient } from './saved-client'
import type { Post } from '@/lib/types'

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: savedRaw } = await supabase
    .from('saved_posts')
    .select(`
      post_id,
      posts(
        *,
        user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto, is_pro)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (savedRaw?.map((s: any) => s.posts).filter(Boolean) ?? []) as Post[]

  return <SavedClient posts={posts} />
}
