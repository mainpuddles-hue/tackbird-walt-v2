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
    .select('*')
    .eq('user_id', user.id)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_id', user.id)

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <ProfileClient
      profile={profile}
      badges={badges ?? []}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
    />
  )
}
