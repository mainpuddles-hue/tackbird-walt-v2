'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShieldOff, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface BlockedUser {
  blocked_id: string
  blocked: {
    id: string
    name: string
    avatar_url: string | null
    naapurusto: string | null
  } | null
}

interface BlockedClientProps {
  blockedUsers: BlockedUser[]
}

export function BlockedClient({ blockedUsers }: BlockedClientProps) {
  const [unblocking, setUnblocking] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleUnblock(blockedId: string) {
    setUnblocking(blockedId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kirjaudu sisään')
        return
      }

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId)

      if (error) throw error

      toast.success('Esto poistettu')
      router.refresh()
    } catch {
      toast.error('Eston poisto epäonnistui')
    } finally {
      setUnblocking(null)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Estetyt käyttäjät</h2>
      </div>

      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <ShieldOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Ei estettyjä käyttäjiä</p>
            <p className="text-xs text-muted-foreground mt-1">
              Voit estää käyttäjiä heidän profiilisivultaan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blockedUsers.map((item) => {
            const profile = item.blocked
            if (!profile) return null

            return (
              <Card key={item.blocked_id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{profile.name}</p>
                    {profile.naapurusto && (
                      <p className="text-xs text-muted-foreground">{profile.naapurusto}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(profile.id)}
                    disabled={unblocking === profile.id}
                  >
                    {unblocking === profile.id ? 'Poistetaan...' : 'Poista esto'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
