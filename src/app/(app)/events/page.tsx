import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { formatEventDateShort } from '@/lib/format'

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles!events_creator_id_fkey(id, name, avatar_url),
      attendees:event_attendees(count)
    `)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(20)

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">Tapahtumat</h2>

      {!events || events.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-lg font-medium">Ei tulevia tapahtumia</p>
          <p className="text-sm mt-1">Luo ensimmäinen tapahtuma!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium leading-snug">{event.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatEventDateShort(event.event_date)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {event.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {(event.attendees as { count: number }[])?.[0]?.count ?? 0} osallistujaa
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
