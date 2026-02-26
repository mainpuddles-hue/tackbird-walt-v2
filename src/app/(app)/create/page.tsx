'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ImageIcon, X, MapPin, Loader2 } from 'lucide-react'
import type { PostType } from '@/lib/types'

export default function CreatePage() {
  const [type, setType] = useState<PostType>('tarvitsen')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dailyFee, setDailyFee] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kuva saa olla korkeintaan 5 MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      toast.error('Selain ei tue paikannusta')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
        toast.success('Sijainti tallennettu')
      },
      () => {
        toast.error('Paikannus epäonnistui')
        setGeoLoading(false)
      }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kirjaudu sisään luodaksesi ilmoituksen')
        return
      }

      let imageUrl: string | null = null

      // Upload image to Supabase Storage
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        type,
        title,
        description,
        location: location || null,
        image_url: imageUrl,
        daily_fee: dailyFee ? parseFloat(dailyFee) : null,
        event_date: eventDate || null,
        latitude: geoCoords?.lat ?? null,
        longitude: geoCoords?.lng ?? null,
      })

      if (error) throw error

      toast.success('Ilmoitus julkaistu!')
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ilmoituksen luonti epäonnistui'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Luo ilmoitus</h2>

      {/* Category selector */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(CATEGORIES) as [PostType, (typeof CATEGORIES)[PostType]][]).map(
          ([key, cat]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={cn(
                'rounded-lg p-2 text-center text-xs font-medium transition-all',
                type === key
                  ? 'ring-2 ring-offset-1 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              style={
                type === key
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {cat.label}
            </button>
          )
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Otsikko</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mitä tarvitset tai tarjoat?"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Kuvaus</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kerro lisää..."
                maxLength={5000}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Sijainti</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Esim. Kallio"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeolocate}
                disabled={geoLoading}
                className={cn(geoCoords && 'border-primary text-primary')}
              >
                {geoLoading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-3.5 w-3.5" />
                )}
                {geoCoords
                  ? `Sijainti tallennettu (${geoCoords.lat.toFixed(4)}, ${geoCoords.lng.toFixed(4)})`
                  : 'Käytä nykyistä sijaintia'}
              </Button>
            </div>

            {type === 'lainaa' && (
              <div className="space-y-2">
                <Label htmlFor="dailyFee">Päivähinta (€)</Label>
                <Input
                  id="dailyFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={dailyFee}
                  onChange={(e) => setDailyFee(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            {type === 'tapahtuma' && (
              <div className="space-y-2">
                <Label htmlFor="eventDate">Päivämäärä ja aika</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            )}

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Kuva (valinnainen)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Esikatselu"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <ImageIcon className="mx-auto h-6 w-6 mb-2" />
                  Lisää kuva
                  <br />
                  <span className="text-xs">JPG, PNG, max 5 MB</span>
                </button>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Julkaistaan...' : 'Julkaise ilmoitus'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
