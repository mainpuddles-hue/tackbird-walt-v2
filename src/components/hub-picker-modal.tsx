'use client'

import { useState, useEffect } from 'react'
import { MapPin, ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Hub } from '@/lib/types'

interface HubPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (hub: Hub) => void
}

export function HubPickerModal({ open, onOpenChange, onSelect }: HubPickerModalProps) {
  const [hubs, setHubs] = useState<Hub[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('hubs')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setHubs(data ?? [])
        setLoading(false)
      })
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh] overflow-y-auto mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>Valitse noutopiste</SheetTitle>
          <SheetDescription>Valitse läheisin hub-piste</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Ladataan...</p>
          ) : hubs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Ei noutopisteitä saatavilla</p>
          ) : (
            hubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => {
                  onSelect(hub)
                  onOpenChange(false)
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                  <MapPin className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{hub.name}</div>
                  {hub.address && (
                    <div className="truncate text-xs text-muted-foreground mt-0.5">{hub.address}</div>
                  )}
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}

          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => onOpenChange(false)}
          >
            Peruuta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
