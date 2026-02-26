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
  currentUserId: string | null
}

export function PostDetailClient({
  post,
  reviews,
  avgRating,
  isSaved: initialSaved,
  currentUserId,
}: PostDetailClientProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editDescription, setEditDescription] = useState(post.description)
  const [editLocation, setEditLocation] = useState(post.location ?? '')
  const [editSaving, setEditSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
        reported_user_id: post.user_id,
        reported_post_id: post.id,
        reason: 'user_report',
      })
    if (error) {
      toast.error('Ilmianto epäonnistui')
    } else {
      toast.success('Ilmianto lähetetty')
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
        <div className="relative aspect-video overflow-hidden bg-muted mx-4 rounded-lg">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
        </div>
      )}

      {/* Additional images */}
      {post.images && post.images.length > 0 && (
        <div className="flex gap-2 px-4 overflow-x-auto">
          {post.images.map((img) => (
            <div
              key={img.id}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
            >
              <Image
                src={img.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
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

        {/* Price */}
        {post.daily_fee != null && (
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <Coins className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-semibold">{formatPrice(post.daily_fee)} / päivä</p>
                <p className="text-xs text-muted-foreground">Lainausmaksu</p>
              </div>
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
        <Card>
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
            <Button className="w-full" onClick={handleMessage}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Lähetä viesti
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleReport}
            >
              <Flag className="mr-2 h-3.5 w-3.5" />
              Ilmianna
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
