'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Settings, Star, MapPin, LogOut } from 'lucide-react'
import { BADGES } from '@/lib/constants'
import { formatResponseRate } from '@/lib/format'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

interface ProfileClientProps {
  profile: Profile | null
  badges: { badge_type: string }[]
  avgRating: number | null
  reviewCount: number
}

export function ProfileClient({
  profile,
  badges,
  avgRating,
  reviewCount,
}: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Kirjauduttu ulos')
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
            <Avatar className="h-16 w-16">
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
              )}
              <AvatarFallback className="text-lg">
                {profile.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              {profile.naapurusto && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.naapurusto}
                </p>
              )}
              {profile.bio && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

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
              <p className="font-semibold">
                {avgRating ? avgRating.toFixed(1) : '-'}
              </p>
              <p className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                Arvio
              </p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="font-semibold">{reviewCount}</p>
              <p className="text-xs text-muted-foreground">Arvostelut</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="font-semibold">
                {formatResponseRate(profile.response_rate)}
              </p>
              <p className="text-xs text-muted-foreground">Vastausaste</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Asetukset
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Kirjaudu ulos
        </Button>
      </div>
    </div>
  )
}
