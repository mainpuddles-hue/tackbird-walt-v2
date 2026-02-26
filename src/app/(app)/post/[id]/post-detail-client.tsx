'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Crown,
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Star,
  Flag,
  Share2,
  Coins,
  Calendar,
  Pencil,
  Trash2,
  CreditCard,
  ShieldOff,
} from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { formatTimeAgo, formatPrice, formatResponseRate, formatEventDate } from '@/lib/format'
import { toast } from 'sonner'
import type { Post, PostType, Review } from '@/lib/types'

interface PostDetailClientProps {
  post: Post
  reviews: Review[]
  avgRating: number | null
  isSaved: boolean
  isBlocked: boolean
  currentUserId: string | null
}

export function PostDetailClient({
  post,
  reviews,
  avgRating,
  isSaved: initialSaved,
  isBlocked: initialBlocked,
  currentUserId,
}: PostDetailClientProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [blocked, setBlocked] = useState(initialBlocked)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editDescription, setEditDescription] = useState(post.description)
  const [editLocation, setEditLocation] = useState(post.location ?? '')
  const [editSaving, setEditSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [bookingStart, setBookingStart] = useState('')
  const [bookingEnd, setBookingEnd] = useState('')
  const [bookingSaving, setBookingSaving] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const category = CATEGORIES[post.type as PostType]
  const user = post.user
  const isOwn = currentUserId === post.user_id

  async function handleToggleSave() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään tallentaaksesi ilmoituksen')
      return
    }
    setSavingBookmark(true)
    try {
      if (saved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', post.id)
        setSaved(false)
        toast.success('Poistettu tallennetuista')
      } else {
        await supabase
          .from('saved_posts')
          .insert({ user_id: currentUserId, post_id: post.id })
        setSaved(true)
        toast.success('Tallennettu')
      }
    } catch {
      toast.error('Toiminto epäonnistui')
    } finally {
      setSavingBookmark(false)
    }
  }

  async function handleMessage() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään lähettääksesi viestin')
      return
    }
    if (isOwn) return

    // Find or create conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${post.user_id}),and(user1_id.eq.${post.user_id},user2_id.eq.${currentUserId})`
      )
      .limit(1)
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: currentUserId,
          user2_id: post.user_id,
          post_id: post.id,
        })
        .select('id')
        .single()

      if (error) {
        toast.error('Keskustelun luonti epäonnistui')
        return
      }
      router.push(`/messages/${newConv.id}`)
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Linkki kopioitu leikepöydälle')
    }
  }

  async function handleReport() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään ilmiantaaksesi')
      return
    }
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: currentUserId,
        user_id: post.user_id,
        post_id: post.id,
        reason: 'user_report',
      })
    if (error) {
      toast.error('Ilmianto epäonnistui')
    } else {
      toast.success('Ilmianto lähetetty')
    }
  }

  async function handleToggleBlock() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään estääksesi käyttäjän')
      return
    }
    if (blockLoading) return
    if (!blocked) {
      const confirmed = window.confirm(
        `Haluatko varmasti estää käyttäjän ${user?.name ?? ''}? Et näe hänen ilmoituksiaan etkä voi viestiä hänen kanssaan.`
      )
      if (!confirmed) return
    }
    setBlockLoading(true)
    try {
      if (blocked) {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', post.user_id)
        if (error) throw error
        setBlocked(false)
        toast.success('Esto poistettu')
      } else {
        const { error } = await supabase
          .from('blocked_users')
          .insert({ blocker_id: currentUserId, blocked_id: post.user_id })
        if (error) throw error
        setBlocked(true)
        toast.success('Käyttäjä estetty')
      }
    } catch {
      toast.error('Toiminto epäonnistui')
    } finally {
      setBlockLoading(false)
    }
  }

  async function handleSubmitReview() {
    if (!currentUserId) return
    if (reviewRating < 1 || reviewRating > 5) return
    setReviewSaving(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        reviewer_id: currentUserId,
        reviewed_id: post.user_id,
        post_id: post.id,
        rating: reviewRating,
        comment: reviewComment || null,
      })
      if (error) {
        if (error.code === '23505') {
          toast.error('Olet jo arvostellut tämän käyttäjän')
        } else {
          throw error
        }
      } else {
        toast.success('Arvostelu lähetetty')
        setShowReviewDialog(false)
        setReviewComment('')
        setReviewRating(5)
        router.refresh()
      }
    } catch {
      toast.error('Arvostelun lähetys epäonnistui')
    } finally {
      setReviewSaving(false)
    }
  }

  async function handleBooking() {
    if (!currentUserId || !bookingStart || !bookingEnd) return
    const start = new Date(bookingStart)
    const end = new Date(bookingEnd)
    if (end <= start) {
      toast.error('Loppupäivä pitää olla alkupäivän jälkeen')
      return
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const dailyFee = post.daily_fee ?? 0
    const totalFee = days * dailyFee
    const commissionRate = 0.10
    const commission = totalFee * commissionRate

    setBookingSaving(true)
    try {
      const { error } = await supabase.from('rental_bookings').insert({
        post_id: post.id,
        lender_id: post.user_id,
        borrower_id: currentUserId,
        start_date: bookingStart,
        end_date: bookingEnd,
        days,
        daily_fee: dailyFee,
        total_fee: totalFee,
        platform_commission: commission,
        platform_commission_rate: commissionRate,
        status: 'pending',
      })
      if (error) {
        if (error.code === '23505') {
          toast.error('Sinulla on jo varaus tähän ilmoitukseen')
        } else {
          throw error
        }
      } else {
        toast.success('Varaus lähetetty! Odota lainaajan vahvistusta.')
        setShowBookingDialog(false)
        setBookingStart('')
        setBookingEnd('')
      }
    } catch {
      toast.error('Varaus epäonnistui')
    } finally {
      setBookingSaving(false)
    }
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Badge
          variant="secondary"
          style={{
            backgroundColor: `${category?.color}15`,
            color: category?.color,
          }}
        >
          {category?.label}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleSave}
          disabled={savingBookmark}
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Main image */}
      {post.image_url && (
        <button
          className="relative aspect-video overflow-hidden bg-muted mx-4 rounded-lg block w-[calc(100%-2rem)]"
          onClick={() => setLightboxImg(post.image_url)}
        >
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
        </button>
      )}

      {/* Additional images gallery */}
      {post.images && post.images.length > 0 && (
        <div className="flex gap-2 px-4 overflow-x-auto pb-1">
          {post.images.map((img, idx) => (
            <button
              key={img.id}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
              onClick={() => setLightboxImg(img.image_url)}
            >
              <Image
                src={img.image_url}
                alt={`${post.title} – kuva ${idx + 2}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
          <div className="relative max-h-[85vh] max-w-[90vw] aspect-auto">
            <Image
              src={lightboxImg}
              alt={post.title}
              width={800}
              height={600}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold leading-tight">{post.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimeAgo(post.created_at)}</span>
            {post.location && (
              <>
                <span>·</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{post.location}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.description}</p>

        {/* Price + Booking */}
        {post.daily_fee != null && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="font-semibold">{formatPrice(post.daily_fee)} / päivä</p>
                  <p className="text-xs text-muted-foreground">Lainausmaksu</p>
                </div>
              </div>
              {!isOwn && currentUserId && (
                <Button
                  className="w-full mt-3"
                  variant="outline"
                  onClick={() => setShowBookingDialog(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Varaa ja maksa
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event date */}
        {post.event_date && (
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">{formatEventDate(post.event_date)}</p>
                <p className="text-xs text-muted-foreground">Tapahtuman ajankohta</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Author card */}
        <Link href={isOwn ? '/profile' : `/profile/${post.user_id}`}>
        <Card className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {user?.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                )}
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold truncate">{user?.name}</span>
                  {user?.is_pro && <Crown className="h-4 w-4 text-amber-500" />}
                </div>
                {user?.naapurusto && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {user.naapurusto}
                  </p>
                )}
              </div>
              <div className="text-right text-sm">
                {avgRating != null && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{avgRating.toFixed(1)}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Vastausaste: {formatResponseRate(user?.response_rate ?? null)}
                </p>
              </div>
            </div>
            {user?.bio && (
              <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>
            )}
          </CardContent>
        </Card>
        </Link>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Arvostelut</h3>
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      {review.reviewer?.avatar_url && (
                        <AvatarImage src={review.reviewer.avatar_url} alt={review.reviewer.name} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {review.reviewer?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{review.reviewer?.name}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isOwn && currentUserId && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleMessage}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Lähetä viesti
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowReviewDialog(true)}>
                <Star className="mr-2 h-4 w-4" />
                Arvostele
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleReport}
            >
              <Flag className="mr-2 h-3.5 w-3.5" />
              Ilmianna
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleToggleBlock}
            >
              <ShieldOff className="mr-2 h-3.5 w-3.5" />
              {blocked ? 'Poista esto' : 'Estä käyttäjä'}
            </Button>
          </div>
        )}

        {isOwn && (
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Muokkaa ilmoitusta
            </Button>
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={async () => {
                if (!confirm('Haluatko varmasti poistaa tämän ilmoituksen?')) return
                setDeleting(true)
                try {
                  await supabase.from('posts').update({ is_active: false }).eq('id', post.id)
                  toast.success('Ilmoitus poistettu')
                  router.push('/')
                  router.refresh()
                } catch {
                  toast.error('Poistaminen epäonnistui')
                } finally {
                  setDeleting(false)
                }
              }}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Poistetaan...' : 'Poista ilmoitus'}
            </Button>
          </div>
        )}

        {!currentUserId && (
          <Button className="w-full" asChild>
            <Link href="/login">Kirjaudu sisään vastataksesi</Link>
          </Button>
        )}
      </div>

      {/* Review dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Arvostele {user?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Arvosana</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReviewRating(i + 1)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        i < reviewRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kommentti (valinnainen)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Kerro kokemuksestasi..."
                rows={3}
                maxLength={1000}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmitReview}
              disabled={reviewSaving}
            >
              {reviewSaving ? 'Lähetetään...' : 'Lähetä arvostelu'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking dialog */}
      {post.daily_fee != null && (
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Varaa lainaus</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alkupäivä</Label>
                <Input
                  type="date"
                  value={bookingStart}
                  onChange={(e) => setBookingStart(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Loppupäivä</Label>
                <Input
                  type="date"
                  value={bookingEnd}
                  onChange={(e) => setBookingEnd(e.target.value)}
                  min={bookingStart || new Date().toISOString().split('T')[0]}
                />
              </div>
              {bookingStart && bookingEnd && new Date(bookingEnd) > new Date(bookingStart) && (
                <Card>
                  <CardContent className="p-3 space-y-1.5 text-sm">
                    {(() => {
                      const days = Math.ceil(
                        (new Date(bookingEnd).getTime() - new Date(bookingStart).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                      const total = days * (post.daily_fee ?? 0)
                      const commission = total * 0.1
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>{days} pv × {formatPrice(post.daily_fee ?? 0)}</span>
                            <span className="font-medium">{formatPrice(total)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-xs">
                            <span>Palvelumaksu (10%)</span>
                            <span>{formatPrice(commission)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Yhteensä</span>
                            <span>{formatPrice(total + commission)}</span>
                          </div>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
              <Button
                className="w-full"
                onClick={handleBooking}
                disabled={bookingSaving || !bookingStart || !bookingEnd}
              >
                {bookingSaving ? 'Varataan...' : 'Lähetä varaus'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Muokkaa ilmoitusta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Otsikko</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Kuvaus</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                maxLength={5000}
              />
            </div>
            <div className="space-y-2">
              <Label>Sijainti</Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={editSaving}
              onClick={async () => {
                setEditSaving(true)
                try {
                  const { error } = await supabase
                    .from('posts')
                    .update({
                      title: editTitle,
                      description: editDescription,
                      location: editLocation || null,
                    })
                    .eq('id', post.id)
                  if (error) throw error
                  toast.success('Ilmoitus päivitetty')
                  setEditing(false)
                  router.refresh()
                } catch {
                  toast.error('Päivitys epäonnistui')
                } finally {
                  setEditSaving(false)
                }
              }}
            >
              {editSaving ? 'Tallennetaan...' : 'Tallenna muutokset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
