'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { CalendarDays, MapPin, Users, Plus, Check, List, Pencil, Trash2, Dice5, MessageCircle } from 'lucide-react'
import { formatEventDateShort, formatEventDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CalendarView } from '@/components/calendar-view'
import { SurpriseDayModal } from '@/components/surprise-day-modal'
import { useI18n } from '@/lib/i18n'
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [showSurpriseDay, setShowSurpriseDay] = useState(false)
  const { t } = useI18n()

  // Group chat conversation id for selected event
  const [groupConvId, setGroupConvId] = useState<string | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editMaxAttendees, setEditMaxAttendees] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Look up group conversation for selected event
  const lookupGroupConv = useCallback(async (eventId: string) => {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('event_id', eventId)
      .eq('is_group', true)
      .maybeSingle()
    setGroupConvId(data?.id ?? null)
  }, [supabase])

  useEffect(() => {
    if (selectedEvent?.is_attending && selectedEvent?.id) {
      lookupGroupConv(selectedEvent.id)
    } else {
      setGroupConvId(null)
    }
  }, [selectedEvent?.id, selectedEvent?.is_attending, lookupGroupConv])

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

  function openEditMode() {
    if (!selectedEvent) return
    setEditTitle(selectedEvent.title)
    setEditDesc(selectedEvent.description || '')
    setEditDate(selectedEvent.event_date ? selectedEvent.event_date.slice(0, 16) : '')
    setEditLocation(selectedEvent.location_name || '')
    setEditMaxAttendees(selectedEvent.max_attendees ? String(selectedEvent.max_attendees) : '')
    setEditing(true)
  }

  function closeEditMode() {
    setEditing(false)
    setEditTitle('')
    setEditDesc('')
    setEditDate('')
    setEditLocation('')
    setEditMaxAttendees('')
  }

  async function handleEditSave() {
    if (!selectedEvent || !currentUserId) return
    if (!editTitle.trim() || !editDate) {
      toast.error('Otsikko ja päivämäärä vaaditaan')
      return
    }
    setEditSaving(true)
    try {
      const updates = {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        event_date: editDate,
        location_name: editLocation.trim() || null,
        max_attendees: editMaxAttendees ? parseInt(editMaxAttendees) : null,
      }
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', selectedEvent.id)
      if (error) throw error

      const updatedEvent = { ...selectedEvent, ...updates }
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? updatedEvent : e))
      )
      setSelectedEvent(updatedEvent)
      closeEditMode()
      toast.success('Tapahtuma päivitetty')
    } catch {
      toast.error('Tapahtuman päivitys epäonnistui')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedEvent || !currentUserId) return
    if (!window.confirm('Haluatko varmasti poistaa tämän tapahtuman?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', selectedEvent.id)
      if (error) throw error

      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
      setSelectedEvent(null)
      toast.success('Tapahtuma poistettu')
    } catch {
      toast.error('Tapahtuman poisto epäonnistui')
    }
  }

  async function handleAttend(eventId: string) {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään osallistuaksesi')
      return
    }

    const event = events.find((e) => e.id === eventId)
    if (!event) return

    // Snapshot current state for rollback
    const prevEvents = events
    const prevSelected = selectedEvent

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
        // Un-attend: remove from event
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', currentUserId)
        if (error) throw error

        // Remove from group conversation
        const { data: groupConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('event_id', eventId)
          .eq('is_group', true)
          .maybeSingle()

        if (groupConv) {
          await supabase
            .from('conversation_members')
            .delete()
            .eq('conversation_id', groupConv.id)
            .eq('user_id', currentUserId)
        }
      } else {
        // Attend: join event
        const { error } = await supabase
          .from('event_attendees')
          .insert({ event_id: eventId, user_id: currentUserId })
        if (error) throw error

        // Create or join group conversation
        let { data: groupConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('event_id', eventId)
          .eq('is_group', true)
          .maybeSingle()

        if (!groupConv) {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              is_group: true,
              event_id: eventId,
              group_name: event.title,
              group_emoji: event.icon || '📅',
            })
            .select('id')
            .single()
          if (convError) throw convError
          groupConv = newConv
        }

        if (groupConv) {
          // Add as member (upsert to avoid duplicates)
          await supabase
            .from('conversation_members')
            .upsert(
              { conversation_id: groupConv.id, user_id: currentUserId },
              { onConflict: 'conversation_id,user_id' }
            )

          // Send system message
          await supabase.from('messages').insert({
            conversation_id: groupConv.id,
            sender_id: currentUserId,
            content: 'liittyi keskusteluun',
            is_system: true,
          })

          // Update conversation updated_at
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', groupConv.id)
        }
      }
    } catch {
      // Rollback to snapshot (not initial prop — preserves other optimistic updates)
      setEvents(prevEvents)
      setSelectedEvent(prevSelected)
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
        icon: '\ud83d\udcc5',
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

  function handleDialogClose(open: boolean) {
    if (!open) {
      setSelectedEvent(null)
      closeEditMode()
    }
  }

  const filters = [
    { key: 'all', label: 'Kaikki' },
    { key: 'today', label: 'Tänään' },
    { key: 'week', label: 'Tällä viikolla' },
  ]

  const isOwner = selectedEvent && currentUserId && selectedEvent.creator_id === currentUserId

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tapahtumat</h2>
          <p className="text-xs text-muted-foreground">{filteredEvents.length} tapahtumaa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            title={viewMode === 'list' ? 'Kalenterinäkymä' : 'Listanäkymä'}
          >
            {viewMode === 'list' ? (
              <CalendarDays className="h-5 w-5" />
            ) : (
              <List className="h-5 w-5" />
            )}
          </Button>
          {currentUserId && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" /> Luo
            </Button>
          )}
        </div>
      </div>

      {/* Surprise Day CTA */}
      {currentUserId && (
        <button
          onClick={() => setShowSurpriseDay(true)}
          className="w-full rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-3 flex items-center gap-3 transition-all hover:shadow-md active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-xl">
            🎲
          </span>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm">{t('events.surpriseDay')}</p>
            <p className="text-xs text-muted-foreground">{t('surpriseDay.subtitle')}</p>
          </div>
          <Dice5 className="h-5 w-5 text-primary" />
        </button>
      )}

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

      {/* Calendar view */}
      {viewMode === 'calendar' && (
        <CalendarView events={filteredEvents} onSelectEvent={setSelectedEvent} />
      )}

      {/* Events list */}
      {viewMode === 'list' && (
        <>
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
                        {event.icon || '\ud83d\udcc5'}
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
        </>
      )}

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          {selectedEvent && !editing && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedEvent.icon || '\ud83d\udcc5'}</span>
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

              {selectedEvent.is_attending && groupConvId && (
                <Link href={`/messages/${groupConvId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    {t('events.openChat')}
                  </Button>
                </Link>
              )}

              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={openEditMode}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Muokkaa
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Poista
                  </Button>
                </div>
              )}
            </>
          )}

          {selectedEvent && editing && (
            <>
              <DialogHeader>
                <DialogTitle>Muokkaa tapahtumaa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Otsikko</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Tapahtuman nimi"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kuvaus</Label>
                  <Textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Kerro tapahtumasta..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Päivämäärä ja aika</Label>
                  <Input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sijainti</Label>
                  <Input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Esim. Karhupuisto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maksimi osallistujamäärä (valinnainen)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editMaxAttendees}
                    onChange={(e) => setEditMaxAttendees(e.target.value)}
                    placeholder="Ei rajoitusta"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={closeEditMode}
                    disabled={editSaving}
                  >
                    Peruuta
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleEditSave}
                    disabled={editSaving}
                  >
                    {editSaving ? 'Tallennetaan...' : 'Tallenna'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Surprise Day modal */}
      <SurpriseDayModal
        open={showSurpriseDay}
        onOpenChange={setShowSurpriseDay}
      />

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
