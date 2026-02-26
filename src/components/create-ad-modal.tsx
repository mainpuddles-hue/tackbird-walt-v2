'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/format'

interface CreateAdModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPro: boolean
  advertiserId: string
}

export function CreateAdModal({
  open,
  onOpenChange,
  isPro,
  advertiserId,
}: CreateAdModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [ctaText, setCtaText] = useState('Lue lisää')
  const [imageUrl, setImageUrl] = useState('')
  const [days, setDays] = useState(3)
  const [submitting, setSubmitting] = useState(false)

  const dailyRate = isPro ? 2.39 : 2.99
  const totalCost = Math.round(days * dailyRate * 100) / 100

  function handleDaysChange(value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    setDays(Math.min(30, Math.max(3, num)))
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Otsikko on pakollinen')
      return
    }
    if (!description.trim()) {
      toast.error('Kuvaus on pakollinen')
      return
    }
    if (!linkUrl.trim()) {
      toast.error('Linkki on pakollinen')
      return
    }

    setSubmitting(true)
    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl.trim() || null,
          link_url: linkUrl.trim(),
          cta_text: ctaText.trim() || 'Lue lis\u00e4\u00e4',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      toast.success('Mainoskampanja luotu!')
      onOpenChange(false)
      resetForm()
    } catch {
      toast.error('Kampanjan luominen ep\u00e4onnistui')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setLinkUrl('')
    setCtaText('Lue lisää')
    setImageUrl('')
    setDays(3)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <DialogTitle>Luo mainoskampanja</DialogTitle>
          </div>
          <DialogDescription>
            Mainoksesi näytetään feedissä naapureille.
            {isPro && (
              <span className="text-amber-600 font-medium"> Pro-hinta: {formatPrice(dailyRate)}/pv</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="ad-title">Otsikko</Label>
            <Input
              id="ad-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Mainoksen otsikko"
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="ad-description">Kuvaus</Label>
            <Textarea
              id="ad-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="Kerro mainoksestasi..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="ad-url">Linkki</Label>
            <Input
              id="ad-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* CTA text */}
          <div className="space-y-2">
            <Label htmlFor="ad-cta">CTA-teksti</Label>
            <Input
              id="ad-cta"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              maxLength={50}
              placeholder="Lue lisää"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="ad-image">Kuva-URL (valinnainen)</Label>
            <Input
              id="ad-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/kuva.jpg"
            />
          </div>

          {/* Days */}
          <div className="space-y-2">
            <Label htmlFor="ad-days">Kesto (päivää)</Label>
            <Input
              id="ad-days"
              type="number"
              min={3}
              max={30}
              value={days}
              onChange={(e) => handleDaysChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimi 3 päivää, maksimi 30 päivää
            </p>
          </div>

          {/* Price calculation */}
          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>{days} pv x {formatPrice(dailyRate)}/pv</span>
              <span className="font-medium">{formatPrice(totalCost)}</span>
            </div>
            {isPro && (
              <p className="text-xs text-amber-600">
                Pro-alennus: {formatPrice(2.99)}/pv &rarr; {formatPrice(2.39)}/pv
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim() || !linkUrl.trim()}
            className="w-full"
          >
            {submitting
              ? 'Luodaan...'
              : `Luo kampanja (${formatPrice(totalCost)})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
