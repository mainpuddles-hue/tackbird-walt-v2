'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'

type EventWithMeta = Event & { attendee_count: number; is_attending: boolean }

const DAY_NAMES = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']
const MONTH_NAMES = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
  'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

interface CalendarViewProps {
  events: EventWithMeta[]
  onSelectEvent: (event: EventWithMeta) => void
}

export function CalendarView({ events, onSelectEvent }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventWithMeta[]> = {}
    events.forEach((e) => {
      const d = new Date(e.event_date)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
    return eventsByDate[key] || []
  }, [selectedDate, eventsByDate])

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between py-3 mb-2">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-base font-bold">
          {MONTH_NAMES[month]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />

          const date = new Date(year, month, day)
          const key = `${year}-${month}-${day}`
          const hasEvents = !!eventsByDate[key]
          const isToday = isSameDay(date, today)
          const isSelected = selectedDate !== null && isSameDay(date, selectedDate)

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isToday
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-muted'
              )}
            >
              {day}
              {hasEvents && (
                <div
                  className={cn(
                    'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                    isSelected ? 'bg-primary-foreground' : 'bg-primary'
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            {selectedDate.getDate()}. {MONTH_NAMES[selectedDate.getMonth()].toLowerCase()}
            {selectedEvents.length > 0
              ? ` \u2014 ${selectedEvents.length} tapahtumaa`
              : ' \u2014 Ei tapahtumia'}
          </p>
          <div className="flex flex-col gap-2">
            {selectedEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEvent(e)}
                className="w-full rounded-xl border bg-card p-3 text-left transition-shadow hover:shadow-md"
              >
                <div className="font-semibold text-sm">{e.title}</div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  {e.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {e.location_name}
                    </span>
                  )}
                  {e.event_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(e.event_date).toLocaleTimeString('fi', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
