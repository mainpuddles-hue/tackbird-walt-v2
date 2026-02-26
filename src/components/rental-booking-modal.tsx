'use client'

import { useState } from 'react'
import { CalendarDays, Coins, ShieldCheck, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/format'
import type { Post } from '@/lib/types'

interface RentalBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
  onBooked?: (booking: Record<string, unknown>) => void
}

export function RentalBookingModal({ open, onOpenChange, post, onBooked }: RentalBookingModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const days = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const totalFee = days > 0 ? days * (post.daily_fee ?? 0) : 0
  const commissionRate = post.user?.is_pro ? 0.05 : 0.10
  const commission = Math.round(totalFee * commissionRate * 100) / 100
  const valid = days >= 1 && days <= 90

  const today = new Date().toISOString().split('T')[0]

  async function handleBook() {
    if (!valid) return
    setLoading(true)
    try {
      const res = await fetch('/api/rentals/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          start_date: startDate,
          end_date: endDate,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Varaus epäonnistui')
      }
      const booking = await res.json()
      toast.success('Varauspyyntö lähetetty!')
      onBooked?.(booking)
      onOpenChange(false)
      setStartDate('')
      setEndDate('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Varaus epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>Varaa lainaus</SheetTitle>
          <SheetDescription>{post.title}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Price info */}
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3.5 dark:bg-blue-950/30">
            <Coins className="size-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(post.daily_fee ?? 0)} / pv
              </div>
            </div>
          </div>

          {/* Date pickers */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> Alkupäivä
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> Loppupäivä
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
            />
          </div>

          {/* Price summary */}
          {days > 0 && (
            <div className="rounded-xl border p-4 space-y-2">
              <h3 className="text-sm font-bold">Yhteenveto</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{days} pv × {formatPrice(post.daily_fee ?? 0)}</span>
                <span className="font-semibold">{formatPrice(totalFee)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Palvelumaksu ({(commissionRate * 100).toFixed(0)} %)</span>
                <span>{formatPrice(commission)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="font-bold">Yhteensä</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{formatPrice(totalFee)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <ShieldCheck className="size-3" />
                Lainaaja saa {formatPrice(totalFee - commission)}
              </div>
            </div>
          )}

          {/* Validation error */}
          {!valid && days > 0 && (
            <p className="text-center text-xs text-destructive">
              Laina-aika 1–90 päivää
            </p>
          )}

          {/* Book button */}
          <Button
            onClick={handleBook}
            disabled={!valid || loading}
            className="w-full"
            size="lg"
          >
            <CreditCard className="size-4" />
            {loading ? 'Lähetetään...' : 'Lähetä varauspyyntö'}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            Lainaaja vahvistaa varauksesi ennen kuin maksu veloitetaan.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
