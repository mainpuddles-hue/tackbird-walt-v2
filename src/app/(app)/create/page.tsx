'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { PostType } from '@/lib/types'

export default function CreatePage() {
  const [type, setType] = useState<PostType>('tarvitsen')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [dailyFee, setDailyFee] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kirjaudu sisään luodaksesi ilmoituksen')
        return
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        type,
        title,
        description,
        location: location || null,
        daily_fee: dailyFee ? parseFloat(dailyFee) : null,
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Julkaistaan...' : 'Julkaise ilmoitus'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
