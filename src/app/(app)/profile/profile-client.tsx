'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Settings,
  Star,
  MapPin,
  LogOut,
  Camera,
  MessageCircle,
  ClipboardList,
  Bookmark,
  Loader2,
  Shield,
  Package,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { BADGES, CATEGORIES } from '@/lib/constants'
import { formatResponseRate, formatTimeAgo, formatPrice } from '@/lib/format'
import { toast } from 'sonner'
import type { Profile, Review, PostType, RentalBooking } from '@/lib/types'
import Link from 'next/link'

interface ProfileClientProps {
  profile: Profile | null
  badges: { badge_type: string }[]
  avgRating: number | null
  reviewCount: number
  reviews: Review[]
  posts: { id: string; type: string; title: string; created_at: string }[]
  savedPosts: unknown[]
  rentals: RentalBooking[]
}

export function ProfileClient({
  profile,
  badges,
  avgRating,
  reviewCount,
  reviews,
  posts,
  savedPosts,
  rentals,
}: ProfileClientProps) {
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState(profile?.bio ?? '')
  const [bioSaving, setBioSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Kirjauduttu ulos')
  }

  async function handleBioSave() {
    setBioSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: bioText })
        .eq('id', profile?.id)
      if (error) throw error
      setEditingBio(false)
      toast.success('Bio päivitetty')
      router.refresh()
    } catch {
      toast.error('Bion tallennus epäonnistui')
    } finally {
      setBioSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kuva saa olla korkeintaan 5 MB')
      return
    }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', profile.id)
      if (updateError) throw updateError

      toast.success('Profiilikuva päivitetty')
      router.refresh()
    } catch {
      toast.error('Kuvan lataus epäonnistui')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  if (!profile) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Profiilia ei löytynyt
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                )}
                <AvatarFallback className="text-lg">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              >
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              {profile.naapurusto && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.naapurusto}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Bio - clickable to edit */}
          <button
            onClick={() => { setBioText(profile.bio || ''); setEditingBio(true) }}
            className="mt-3 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-dashed border-muted-foreground/30 pb-1"
          >
            {profile.bio || 'Klikkaa lisätäksesi bio...'}
          </button>

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
              <p className="font-semibold">
                {formatResponseRate(profile.response_rate)}
              </p>
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

      {/* Saved posts */}
      {savedPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5 text-amber-500" />
            Tallennetut ({savedPosts.length})
          </h3>
          <div className="space-y-1.5">
            {(savedPosts as { id: string; type: string; title: string; created_at: string }[]).map((p) => {
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

      {/* Own posts */}
      <div>
        <h3 className="text-sm font-semibold mb-2">
          Omat ilmoitukset ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground rounded-lg bg-muted/50">
            <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Ei ilmoituksia vielä</p>
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

      {/* Rental bookings */}
      {rentals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-amber-500" />
            Lainaukset ({rentals.length})
          </h3>
          <div className="space-y-2">
            {rentals.map((r) => {
              const isLender = r.lender_id === profile.id
              const otherUser = isLender ? r.borrower : r.lender
              const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
                pending: { label: 'Odottaa', icon: Clock, className: 'text-amber-600 bg-amber-50' },
                confirmed: { label: 'Vahvistettu', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
                paid: { label: 'Maksettu', icon: CheckCircle, className: 'text-blue-600 bg-blue-50' },
                completed: { label: 'Valmis', icon: CheckCircle, className: 'text-muted-foreground bg-muted' },
                cancelled: { label: 'Peruttu', icon: XCircle, className: 'text-red-600 bg-red-50' },
              }
              const status = statusConfig[r.status] ?? statusConfig.pending

              return (
                <Card key={r.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate flex-1">
                        {r.post?.title ?? 'Poistettu ilmoitus'}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] ml-2 ${status.className}`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{isLender ? 'Lainaaja' : 'Lainaajalta'}:</span>
                      <Link href={`/profile/${otherUser?.id}`} className="font-medium hover:underline">
                        {otherUser?.name}
                      </Link>
                      <span>·</span>
                      <span>{r.days} pv</span>
                      <span>·</span>
                      <span className="font-medium text-foreground">{formatPrice(r.total_fee)}</span>
                    </div>
                    {isLender && r.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('rental_bookings')
                              .update({ status: 'confirmed' })
                              .eq('id', r.id)
                            if (error) toast.error('Toiminto epäonnistui')
                            else { toast.success('Varaus vahvistettu'); router.refresh() }
                          }}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Vahvista
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs text-destructive"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('rental_bookings')
                              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                              .eq('id', r.id)
                            if (error) toast.error('Toiminto epäonnistui')
                            else { toast.success('Varaus peruttu'); router.refresh() }
                          }}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Hylkää
                        </Button>
                      </div>
                    )}
                    {isLender && r.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 h-7 text-xs"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('rental_bookings')
                            .update({ status: 'completed', completed_at: new Date().toISOString() })
                            .eq('id', r.id)
                          if (error) toast.error('Toiminto epäonnistui')
                          else { toast.success('Lainaus merkitty palautetuksi'); router.refresh() }
                        }}
                      >
                        Merkitse palautetuksi
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {profile.is_admin && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4 text-blue-500" />
              Hallintapaneeli
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Kirjaudu ulos
        </Button>
      </div>

      {/* Bio edit dialog */}
      <Dialog open={editingBio} onOpenChange={setEditingBio}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Muokkaa biota</DialogTitle>
          </DialogHeader>
          <Textarea
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Kerro itsestäsi..."
          />
          <p className="text-xs text-muted-foreground text-right">{bioText.length}/500</p>
          <Button onClick={handleBioSave} disabled={bioSaving} className="w-full">
            {bioSaving ? 'Tallennetaan...' : 'Tallenna'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
