'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Star,
  MapPin,
  MessageCircle,
  ClipboardList,
  Flag,
  Ban,
  Crown,
} from 'lucide-react'
import { BADGES, CATEGORIES } from '@/lib/constants'
import { formatResponseRate, formatTimeAgo } from '@/lib/format'
import { toast } from 'sonner'
import type { Profile, Review, PostType } from '@/lib/types'
import Link from 'next/link'

interface UserProfileClientProps {
  profile: Profile
  badges: { badge_type: string }[]
  avgRating: number | null
  reviewCount: number
  reviews: Review[]
  posts: { id: string; type: string; title: string; created_at: string; image_url: string | null }[]
  isBlocked: boolean
  currentUserId: string | null
}

export function UserProfileClient({
  profile,
  badges,
  avgRating,
  reviewCount,
  reviews,
  posts,
  isBlocked: initialBlocked,
  currentUserId,
}: UserProfileClientProps) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [blockLoading, setBlockLoading] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleToggleBlock() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään')
      return
    }
    setBlockLoading(true)
    try {
      if (blocked) {
        await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', profile.id)
        setBlocked(false)
        toast.success('Esto poistettu')
      } else {
        await supabase
          .from('blocked_users')
          .insert({ blocker_id: currentUserId, blocked_id: profile.id })
        setBlocked(true)
        toast.success('Käyttäjä estetty')
      }
    } catch {
      toast.error('Toiminto epäonnistui')
    } finally {
      setBlockLoading(false)
    }
  }

  async function handleMessage() {
    if (!currentUserId) {
      toast.error('Kirjaudu sisään lähettääksesi viestin')
      return
    }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUserId})`
      )
      .limit(1)
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
    } else {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ user1_id: currentUserId, user2_id: profile.id })
        .select('id')
        .single()
      if (error) {
        toast.error('Keskustelun luonti epäonnistui')
        return
      }
      router.push(`/messages/${newConv.id}`)
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
        reported_user_id: profile.id,
        reason: 'user_report',
      })
    if (error) {
      toast.error('Ilmianto epäonnistui')
    } else {
      toast.success('Ilmianto lähetetty')
    }
  }

  async function handleSubmitReview() {
    if (!currentUserId) return
    setReviewSaving(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        reviewer_id: currentUserId,
        reviewed_id: profile.id,
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Profiili</h2>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
              )}
              <AvatarFallback className="text-lg">
                {profile.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                {profile.is_pro && <Crown className="h-5 w-5 text-amber-500" />}
              </div>
              {profile.naapurusto && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.naapurusto}
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => {
                const conf = BADGES[b.badge_type as keyof typeof BADGES]
                return (
                  <Badge
                    key={b.badge_type}
                    variant="secondary"
                    style={{
                      backgroundColor: `${conf?.color}15`,
                      color: conf?.color,
                    }}
                  >
                    {conf?.label ?? b.badge_type}
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-semibold">{formatResponseRate(profile.response_rate)}</p>
              <p className="text-xs text-muted-foreground">Vastausaste</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-semibold">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Ilmoitukset</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-0.5 mb-1">
                <Star className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-semibold">
                {avgRating ? `${avgRating.toFixed(1)} (${reviewCount})` : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Arvostelut</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {currentUserId && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleMessage}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Lähetä viesti
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowReviewDialog(true)}
          >
            <Star className="mr-2 h-4 w-4" />
            Arvostele
          </Button>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Arvostelut ({reviewCount})</h3>
          <div className="space-y-2">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      {r.reviewer?.avatar_url && (
                        <AvatarImage src={r.reviewer.avatar_url} alt={r.reviewer.name} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {r.reviewer?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{r.reviewer?.name}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < r.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(r.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        <h3 className="text-sm font-semibold mb-2">
          Ilmoitukset ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground rounded-lg bg-muted/50">
            <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Ei ilmoituksia</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {posts.map((p) => {
              const cat = CATEGORIES[p.type as PostType]
              return (
                <Link key={p.id} href={`/post/${p.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
                    <Badge
                      variant="secondary"
                      className="text-[10px] shrink-0"
                      style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                    >
                      {cat?.label}
                    </Badge>
                    <span className="text-sm font-medium flex-1 truncate">{p.title}</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(p.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Block / Report */}
      {currentUserId && (
        <div className="space-y-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleToggleBlock}
            disabled={blockLoading}
          >
            <Ban className="mr-2 h-3.5 w-3.5" />
            {blocked ? 'Poista esto' : 'Estä käyttäjä'}
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

      {/* Review dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Arvostele {profile.name}</DialogTitle>
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
    </div>
  )
}
