'use client'

import { useState, useEffect } from 'react'
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
import { PasswordStrength, isPasswordValid } from '@/components/password-strength'
import { ArrowLeft, LogOut, Trash2, Download, Lock, Sun, Moon, Monitor, Crown, ShieldOff, Bookmark, Bell, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { ProUpgradeModal } from '@/components/pro-upgrade-modal'
import { AdDashboard } from '@/components/ad-dashboard'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useI18n } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { Profile } from '@/lib/types'
import Link from 'next/link'

interface SettingsClientProps {
  profile: Profile | null
}

export function SettingsClient({ profile }: SettingsClientProps) {
  const { t, locale, setLocale } = useI18n()
  const [saving, setSaving] = useState(false)
  const [visibility, setVisibility] = useState<string>(
    profile?.profile_visibility ?? 'neighbors'
  )
  const [language, setLanguage] = useState<string>(locale)
  const [notifications, setNotifications] = useState(
    profile?.notifications_enabled ?? true
  )
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [showBusinessForm, setShowBusinessForm] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessVatId, setBusinessVatId] = useState('')
  const [businessLoading, setBusinessLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePushNotifications(profile?.id ?? null)

  useEffect(() => {
    if (pushError) toast.error(pushError)
  }, [pushError])

  function handleLanguageChange(newLang: string) {
    setLanguage(newLang)
    setLocale(newLang as Locale)
  }

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
      toast.success(t('settings.settingsSaved'))
      router.refresh()
    } catch {
      toast.error(t('settings.settingsSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success(t('settings.logoutSuccess'))
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== t('settings.deleteConfirmWord')) return

    const firstConfirm = window.confirm(t('settings.deleteFirstConfirm'))
    if (!firstConfirm) return

    const secondConfirm = window.confirm(t('settings.deleteSecondConfirm'))
    if (!secondConfirm) return

    setDeleteLoading(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')

      await supabase.auth.signOut()
      toast.success(t('settings.accountDeleted'))
      router.push('/login')
    } catch {
      toast.error(t('settings.accountDeleteFailed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) {
      toast.error(t('settings.passwordTooShort'))
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success(t('settings.passwordChanged'))
      setShowPasswordDialog(false)
      setNewPassword('')
    } catch {
      toast.error(t('settings.passwordChangeFailed'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const [exportLoading, setExportLoading] = useState(false)

  async function handleExportData() {
    setExportLoading(true)
    toast.info(t('settings.exportLoading'))
    try {
      const res = await fetch('/api/auth/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tackbird-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('settings.dataDownloaded'))
    } catch {
      toast.error(t('settings.dataExportFailed'))
    } finally {
      setExportLoading(false)
    }
  }

  async function handleBusinessRegistration() {
    if (!businessName.trim()) {
      toast.error(t('settings.businessNameRequired'))
      return
    }
    if (!businessVatId.trim()) {
      toast.error(t('settings.businessVatRequired'))
      return
    }
    setBusinessLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_business: true,
          business_name: businessName.trim(),
          business_vat_id: businessVatId.trim(),
        })
        .eq('id', profile?.id)

      if (error) throw error
      toast.success(t('settings.businessRegistered'))
      setShowBusinessForm(false)
      router.refresh()
    } catch {
      toast.error(t('settings.businessRegisterFailed'))
    } finally {
      setBusinessLoading(false)
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
        <h2 className="text-lg font-semibold">{t('settings.title')}</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-6">
          {/* Profile visibility */}
          <div className="space-y-2">
            <Label>{t('settings.profileVisibility')}</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">{t('settings.visibilityEveryone')}</SelectItem>
                <SelectItem value="neighbors">{t('settings.visibilityNeighbors')}</SelectItem>
                <SelectItem value="hidden">{t('settings.visibilityHidden')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>{t('settings.language')}</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
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
            <Label htmlFor="notifications">{t('settings.notifications')}</Label>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          {/* Push notifications */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push-notifications">{t('settings.pushNotifications')}</Label>
              </div>
              {pushSupported ? (
                <Switch
                  id="push-notifications"
                  checked={pushSubscribed}
                  disabled={pushLoading}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      await pushSubscribe()
                    } else {
                      await pushUnsubscribe()
                    }
                  }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">{t('settings.pushNotSupported')}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {!pushSupported
                ? t('settings.pushNotSupportedDesc')
                : pushSubscribed
                  ? t('settings.pushEnabled')
                  : t('settings.pushDisabledDesc')}
            </p>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label>{t('settings.theme')}</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-1.5 h-3.5 w-3.5" />
                {t('settings.themeLight')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-1.5 h-3.5 w-3.5" />
                {t('settings.themeDark')}
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTheme('system')}
              >
                <Monitor className="mr-1.5 h-3.5 w-3.5" />
                {t('settings.themeAuto')}
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? t('common.saving') : t('settings.saveSettings')}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Pro subscription */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {profile?.is_pro ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Crown className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{t('settings.proSubscription')}</h3>
                  {profile.pro_expires_at && (
                    <p className="text-xs text-muted-foreground">
                      {t('settings.proValidUntil', {
                        date: new Date(profile.pro_expires_at).toLocaleDateString(
                          locale === 'fi' ? 'fi-FI' : locale === 'sv' ? 'sv-SE' : 'en-US'
                        ),
                      })}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast.info(t('settings.proCancelSoon'))}
              >
                {t('settings.proCancelSubscription')}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowProModal(true)}
            >
              <Crown className="mr-2 h-4 w-4 text-amber-500" />
              {t('settings.proUpgrade')}
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Business account */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t('settings.businessAccount')}</h3>
          </div>

          {profile?.is_business ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('settings.businessCompany')}</span>{' '}
                  {profile.business_name}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('settings.businessVat')}</span>{' '}
                  {profile.business_vat_id}
                </p>
              </div>
              <AdDashboard
                userId={profile.id}
                isPro={profile.is_pro ?? false}
              />
            </div>
          ) : showBusinessForm ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="business-name">{t('settings.businessName')}</Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t('settings.businessNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-vat">{t('settings.businessVatId')}</Label>
                <Input
                  id="business-vat"
                  value={businessVatId}
                  onChange={(e) => setBusinessVatId(e.target.value)}
                  placeholder={t('settings.businessVatIdPlaceholder')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBusinessForm(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBusinessRegistration}
                  disabled={businessLoading}
                >
                  {businessLoading ? t('settings.businessRegistering') : t('settings.businessRegister')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {t('settings.businessRegisterDesc')}
              </p>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowBusinessForm(true)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                {t('settings.businessRegister')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Security */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">{t('settings.security')}</h3>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowPasswordDialog(true)}
          >
            <Lock className="mr-2 h-4 w-4" />
            {t('settings.changePassword')}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <Link href="/settings/blocked">
              <ShieldOff className="mr-2 h-4 w-4" />
              {t('settings.blockedUsers')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Saved posts */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <Link href="/saved">
              <Bookmark className="mr-2 h-4 w-4" />
              {t('settings.savedPosts')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">{t('settings.dataAndPrivacy')}</h3>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportData}
            disabled={exportLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportLoading ? t('common.downloading') : t('settings.export')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('settings.exportDesc')}
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
          {t('settings.logout')}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('settings.deleteAccount')}
        </Button>
      </div>

      {/* Password change dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.changePassword')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.newPassword')}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.newPasswordPlaceholder')}
                minLength={8}
              />
              <PasswordStrength password={newPassword} />
            </div>
            <Button
              className="w-full"
              onClick={handlePasswordChange}
              disabled={passwordLoading || !isPasswordValid(newPassword)}
            >
              {passwordLoading ? t('settings.changingPassword') : t('settings.changePassword')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.deleteAccount')}</DialogTitle>
            <DialogDescription>
              {t('settings.deleteConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.deleteConfirmLabel')}</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={t('settings.deleteConfirmPlaceholder')}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== t('settings.deleteConfirmWord') || deleteLoading}
            >
              {deleteLoading ? t('common.deleting') : t('settings.deletePermanently')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProUpgradeModal open={showProModal} onOpenChange={setShowProModal} />
    </div>
  )
}
