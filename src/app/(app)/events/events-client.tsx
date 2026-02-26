'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CalendarDays, MapPin, Users, Plus, Check } from 'lucide-react'
import { formatEventDateShort, formatEventDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Event } from '@/lib/types'

type EventWithMeta = Event & { attendee_count: number; is_attending: boolean }

interface EventsClientProps {
  events: EventWithMeta[]
  currentUserId: string | null
}

export function EventsClient({ events: initialEvents, currentUserId }: EventsClientProps) {
  const [events, setEvents] = useState(initialEvents)
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<EventWithMeta | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newMaxAttendees, setNewMaxAttendees] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true
    const date = new Date(e.event_date)
    const now = new Date()
    if (filter === 'today') return date.toDateString() === now.toDateString()
    if (filter === 'week') {
      const weekEnd = new Date(now.getTime() + 7 * 86400000)
      return date >= now && date <= weekEnd
    }
    return true
  })

  async function handleAttend(eventId: string) {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään osallistuaksesi')
      return
    }

    const event = events.find((e) => e.id === eventId)
    if (!event) return

    // Optimistic update
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              is_attending: !e.is_attending,
              attendee_count: e.is_attending ? e.attendee_count - 1 : e.attendee_count + 1,
            }
          : e
      )
    )
    if (selectedEvent?.id === eventId) {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              is_attending: !prev.is_attending,
              attendee_count: prev.is_attending ? prev.attendee_count - 1 : prev.attendee_count + 1,
            }
          : prev
      )
    }

    try {
      if (event.is_attending) {
        await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', currentUserId)
      } else {
        await supabase
          .from('event_attendees')
          .insert({ event_id: eventId, user_id: currentUserId })
      }
    } catch {
      // Rollback
      setEvents(initialEvents)
      toast.error('Osallistuminen epäonnistui')
    }
  }

  async function handleCreate() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään')
      return
    }
    if (!newTitle.trim() || !newDate) {
      toast.error('Otsikko ja päivämäärä vaaditaan')
      return
    }
    setCreating(true)
    try {
      const { error } = await supabase.from('events').insert({
        creator_id: currentUserId,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        event_date: newDate,
        location_name: newLocation.trim() || null,
        max_attendees: newMaxAttendees ? parseInt(newMaxAttendees) : null,
        icon: '📅',
      })
      if (error) throw error
      toast.success('Tapahtuma luotu!')
      setShowCreate(false)
      setNewTitle('')
      setNewDesc('')
      setNewDate('')
      setNewLocation('')
      setNewMaxAttendees('')
      router.refresh()
    } catch {
      toast.error('Tapahtuman luonti epäonnistui')
    } finally {
      setCreating(false)
    }
  }

  const filters = [
    { key: 'all', label: 'Kaikki' },
    { key: 'today', label: 'Tänään' },
    { key: 'week', label: 'Tällä viikolla' },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tapahtumat</h2>
          <p className="text-xs text-muted-foreground">{filteredEvents.length} tapahtumaa</p>
        </div>
        {currentUserId && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-4 w-4" /> Luo
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-lg font-medium">Ei tulevia tapahtumia</p>
          <p className="text-sm mt-1">Luo ensimmäinen tapahtuma!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedEvent(event)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                    {event.icon || '📅'}
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
                        {event.attendee_count} osallistujaa
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={event.is_attending ? 'secondary' : 'default'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAttend(event.id)
                    }}
                  >
                    {event.is_attending ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" /> Osallistun
                      </>
                    ) : (
                      'Osallistu'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedEvent.icon || '📅'}</span>
                  <DialogTitle className="text-left">{selectedEvent.title}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">{formatEventDate(selectedEvent.event_date)}</span>
                </div>
                {selectedEvent.location_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {selectedEvent.attendee_count} osallistujaa
                    {selectedEvent.max_attendees && ` / ${selectedEvent.max_attendees}`}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              )}

              {selectedEvent.discount && (
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                  {selectedEvent.discount}
                </div>
              )}

              <Button
                className="w-full"
                variant={selectedEvent.is_attending ? 'secondary' : 'default'}
                onClick={() => handleAttend(selectedEvent.id)}
              >
                {selectedEvent.is_attending ? 'Peru osallistuminen' : 'Osallistu tapahtumaan'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create event dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Luo tapahtuma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Otsikko</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tapahtuman nimi"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Kuvaus</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Kerro tapahtumasta..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Päivämäärä ja aika</Label>
              <Input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sijainti</Label>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Esim. Karhupuisto"
              />
            </div>
            <div className="space-y-2">
              <Label>Maksimi osallistujamäärä (valinnainen)</Label>
              <Input
                type="number"
                min="1"
                value={newMaxAttendees}
                onChange={(e) => setNewMaxAttendees(e.target.value)}
                placeholder="Ei rajoitusta"
              />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={creating}>
              {creating ? 'Luodaan...' : 'Luo tapahtuma'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
