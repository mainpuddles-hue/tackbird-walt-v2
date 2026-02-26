'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ArrowLeft, LogOut, Trash2, Download, Lock, Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Kirjauduttu ulos')
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'POISTA') return
    setDeleteLoading(true)
    try {
      // Delete profile data (RLS cascade should handle related data)
      await supabase.from('profiles').delete().eq('id', profile?.id)
      await supabase.auth.signOut()
      toast.success('Tili poistettu')
      router.push('/login')
    } catch {
      toast.error('Tilin poisto epäonnistui')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error('Salasanan pitää olla vähintään 8 merkkiä')
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Salasana vaihdettu')
      setShowPasswordDialog(false)
      setNewPassword('')
    } catch {
      toast.error('Salasanan vaihto epäonnistui')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleExportData() {
    toast.info('Kerätään tietoja...')
    try {
      const userId = profile?.id
      const [posts, messages, reviews, savedPosts] = await Promise.all([
        supabase.from('posts').select('*').eq('user_id', userId),
        supabase.from('messages').select('*').eq('sender_id', userId),
        supabase.from('reviews').select('*').or(`reviewer_id.eq.${userId},reviewed_id.eq.${userId}`),
        supabase.from('saved_posts').select('*').eq('user_id', userId),
      ])

      const data = {
        profile,
        posts: posts.data,
        messages: messages.data,
        reviews: reviews.data,
        savedPosts: savedPosts.data,
        exported_at: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tackbird-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Tiedot ladattu')
    } catch {
      toast.error('Tietojen vienti epäonnistui')
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

          {/* Theme */}
          <div className="space-y-2">
            <Label>Ulkoasu</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-1.5 h-3.5 w-3.5" />
                Vaalea
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-1.5 h-3.5 w-3.5" />
                Tumma
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTheme('system')}
              >
                <Monitor className="mr-1.5 h-3.5 w-3.5" />
                Auto
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? 'Tallennetaan...' : 'Tallenna asetukset'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Security */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Turvallisuus</h3>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowPasswordDialog(true)}
          >
            <Lock className="mr-2 h-4 w-4" />
            Vaihda salasana
          </Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Tiedot ja yksityisyys</h3>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Lataa omat tiedot (GDPR)
          </Button>
          <p className="text-xs text-muted-foreground">
            Lataa kaikki tietosi JSON-muodossa.
          </p>
        </CardContent>
      </Card>

      {/* Logout & Delete */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Kirjaudu ulos
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Poista tili
        </Button>
      </div>

      {/* Password change dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vaihda salasana</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Uusi salasana</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Vähintään 8 merkkiä"
                minLength={8}
              />
            </div>
            <Button
              className="w-full"
              onClick={handlePasswordChange}
              disabled={passwordLoading || newPassword.length < 8}
            >
              {passwordLoading ? 'Vaihdetaan...' : 'Vaihda salasana'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Poista tili</DialogTitle>
            <DialogDescription>
              Tämä toiminto on peruuttamaton. Kaikki tietosi poistetaan pysyvästi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kirjoita POISTA vahvistaaksesi</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="POISTA"
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'POISTA' || deleteLoading}
            >
              {deleteLoading ? 'Poistetaan...' : 'Poista tili pysyvästi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
