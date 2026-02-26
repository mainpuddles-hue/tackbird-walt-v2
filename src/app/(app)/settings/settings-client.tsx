'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

interface SettingsClientProps {
  profile: Profile | null
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const [saving, setSaving] = useState(false)
  const [visibility, setVisibility] = useState<string>(
    profile?.profile_visibility ?? 'neighbors'
  )
  const [language, setLanguage] = useState<string>(profile?.language ?? 'fi')
  const [notifications, setNotifications] = useState(
    profile?.notifications_enabled ?? true
  )
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_visibility: visibility,
          language,
          notifications_enabled: notifications,
        })
        .eq('id', profile?.id)

      if (error) throw error
      toast.success('Asetukset tallennettu')
      router.refresh()
    } catch {
      toast.error('Asetusten tallentaminen epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Asetukset</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-6">
          {/* Profile visibility */}
          <div className="space-y-2">
            <Label>Profiilin näkyvyys</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Kaikille</SelectItem>
                <SelectItem value="neighbors">Naapureille</SelectItem>
                <SelectItem value="hidden">Piilotettu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Kieli</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fi">Suomi</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sv">Svenska</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Ilmoitukset sovelluksessa</Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? 'Tallennetaan...' : 'Tallenna asetukset'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
