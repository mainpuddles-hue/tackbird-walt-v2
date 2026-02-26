import { createClient } from '@/lib/supabase/server'
import { MapClient } from './map-client'

export default async function MapPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, type, title, location, latitude, longitude, image_url, daily_fee,
      user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto)
    `)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(200)

  // Supabase returns joined single relations as arrays; normalize to single objects
  const normalized = (posts ?? []).map((p) => ({
    ...p,
    user: Array.isArray(p.user) ? p.user[0] ?? null : p.user ?? null,
  }))

  return <MapClient posts={normalized} />
}
