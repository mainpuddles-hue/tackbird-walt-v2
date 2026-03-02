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
import { Badge } from '@/components/ui/badge'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  X, MapPin, Loader2, Plus, Camera, ArrowLeft, ChevronRight,
  HandHelping, Gift, Heart, BookOpen, CalendarDays,
} from 'lucide-react'
import { optimizePostImage } from '@/lib/image-optimize'
import { useTheme } from 'next-themes'
import type { PostType } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

const MAX_EXTRA_IMAGES = 4

const ICON_MAP: Record<string, LucideIcon> = {
  HandHelping,
  Gift,
  Heart,
  BookOpen,
  CalendarDays,
}

const CATEGORY_DESCRIPTIONS: Record<PostType, string> = {
  tarvitsen: 'Tarvitsetko apua tai tavaraa?',
  tarjoan: 'Tarjoa palvelusta tai tavaraa',
  ilmaista: 'Anna pois ilmaiseksi',
  lainaa: 'Lainaa tai vuokraa tavaroita',
  tapahtuma: 'Luo naapuruston tapahtuma',
}

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState<PostType | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dailyFee, setDailyFee] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extraImages, setExtraImages] = useState<{ file: File; preview: string }[]>([])
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const cat = type ? CATEGORIES[type] : null
  const CatIcon = cat ? ICON_MAP[cat.icon] : null

  function handleCategorySelect(key: PostType) {
    setType(key)
    setStep(2)
  }

  function handleBack() {
    setStep(1)
  }

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

  function handleExtraImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kuva saa olla korkeintaan 5 MB')
      return
    }
    if (extraImages.length >= MAX_EXTRA_IMAGES) {
      toast.error(`Voit lisätä enintään ${MAX_EXTRA_IMAGES} lisäkuvaa`)
      return
    }
    setExtraImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }])
    if (extraInputRef.current) extraInputRef.current.value = ''
  }

  function removeExtraImage(index: number) {
    setExtraImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      toast.error('Selain ei tue paikannusta')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          toast.error('Virheelliset koordinaatit')
          setGeoLoading(false)
          return
        }
        setGeoCoords({ lat, lng })
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
    if (!type) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kirjaudu sisään luodaksesi ilmoituksen')
        return
      }

      let imageUrl: string | null = null

      if (imageFile) {
        const optimized = await optimizePostImage(imageFile)
        const ext = optimized.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, optimized, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
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
        .select('id')
        .single()

      if (error) throw error

      if (extraImages.length > 0 && newPost) {
        for (let i = 0; i < extraImages.length; i++) {
          const img = extraImages[i]
          const optimized = await optimizePostImage(img.file)
          const ext = optimized.name.split('.').pop()
          const path = `${user.id}/${Date.now()}-${i}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(path, optimized, { cacheControl: '3600' })
          if (uploadError) continue
          const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)
          await supabase.from('post_images').insert({
            post_id: newPost.id,
            image_url: urlData.publicUrl,
            sort_order: i,
          })
        }
      }

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

  /* ─── Step 1: Category Selection ─── */
  if (step === 1) {
    return (
      <div className="animate-page-in px-4 pt-6 pb-20">
        <h1 className="text-xl font-semibold">Luo ilmoitus</h1>
        <p className="text-sm text-muted-foreground mt-1">Valitse ilmoitustyyppi</p>

        <div className="mt-6 flex flex-col gap-3">
          {(Object.entries(CATEGORIES) as [PostType, (typeof CATEGORIES)[PostType]][]).map(
            ([key, c], index) => {
              const Icon = ICON_MAP[c.icon]
              return (
                <Card
                  key={key}
                  className={cn(
                    'animate-card-in relative overflow-hidden cursor-pointer transition-colors',
                    'hover:border-[var(--color-muted-foreground)]',
                    `stagger-${index + 1}`
                  )}
                  style={{ backgroundColor: isDark ? c.bgDark : c.bgLight }}
                  onClick={() => handleCategorySelect(key)}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ backgroundColor: c.color }}
                  />

                  <CardContent className="flex items-center gap-3 p-4 pl-5">
                    {/* Icon circle */}
                    <div
                      className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isDark ? c.bgLight + '20' : c.color + '15' }}
                    >
                      {Icon && <Icon className="h-5 w-5" style={{ color: c.color }} />}
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {CATEGORY_DESCRIPTIONS[key]}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              )
            }
          )}
        </div>
      </div>
    )
  }

  /* ─── Step 2: Form ─── */
  return (
    <div className="animate-page-in px-4 pt-6 pb-20">
      {/* Header: back + category badge */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {cat && CatIcon && (
          <Badge
            variant="secondary"
            className="gap-1.5 text-xs font-medium"
            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
          >
            <CatIcon className="h-3.5 w-3.5" />
            {cat.label}
          </Badge>
        )}
      </div>

      <Card className="shadow-[0_1px_4px_rgba(26,26,46,0.06)]">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
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

            {/* Description */}
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

            {/* Location */}
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
                className="transition-colors"
                style={
                  geoCoords && cat
                    ? { borderColor: cat.color, color: cat.color }
                    : undefined
                }
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

            {/* Daily fee (lainaa only) */}
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

            {/* Event date (tapahtuma only) */}
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

            {/* Main image upload */}
            <div className="space-y-2">
              <Label>Pääkuva (valinnainen)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
              {imagePreview ? (
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={cat ? { border: `2px solid ${cat.color}30` } : undefined}
                >
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
                  className="w-full rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <Camera className="mx-auto h-8 w-8 mb-2" />
                  Lisää kuva
                  <br />
                  <span className="text-xs">JPG, PNG, max 5 MB</span>
                </button>
              )}
            </div>

            {/* Extra images */}
            <div className="space-y-2">
              <Label>Lisäkuvat ({extraImages.length}/{MAX_EXTRA_IMAGES})</Label>
              <input
                ref={extraInputRef}
                type="file"
                accept="image/*"
                onChange={handleExtraImagePick}
                className="hidden"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {extraImages.map((img, i) => (
                  <div key={i} className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border">
                    <Image
                      src={img.preview}
                      alt={`Lisäkuva ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraImage(i)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {extraImages.length < MAX_EXTRA_IMAGES && (
                  <button
                    type="button"
                    onClick={() => extraInputRef.current?.click()}
                    className="h-20 w-20 shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-white font-semibold"
              style={cat ? { backgroundColor: cat.color } : undefined}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Julkaistaan...
                </>
              ) : (
                'Julkaise ilmoitus'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
