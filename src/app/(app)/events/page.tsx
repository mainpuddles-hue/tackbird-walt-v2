import { createClient } from '@/lib/supabase/server'
import { EventsClient } from './events-client'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles!events_creator_id_fkey(id, name, avatar_url),
      attendees:event_attendees(count)
    `)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(50)

  // Get user's attendance for each event
  let attendingIds: string[] = []
  if (user) {
    const { data: attending } = await supabase
      .from('event_attendees')
      .select('event_id')
      .eq('user_id', user.id)
    attendingIds = attending?.map((a) => a.event_id) ?? []
  }

  const enrichedEvents = (events ?? []).map((event) => ({
    ...event,
    attendee_count: (event.attendees as { count: number }[])?.[0]?.count ?? 0,
    is_attending: attendingIds.includes(event.id),
  }))

  return <EventsClient events={enrichedEvents} currentUserId={user?.id ?? null} />
}
