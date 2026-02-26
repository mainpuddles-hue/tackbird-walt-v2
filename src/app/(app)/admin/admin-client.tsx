'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Users,
  FileText,
  Flag,
  Megaphone,
  Shield,
  Crown,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  Package,
  Eye,
  EyeOff,
  Pause,
  Play,
  ArrowRightLeft,
  MapPin,
} from 'lucide-react'
import { formatTimeAgo, formatPrice } from '@/lib/format'
import { CATEGORIES } from '@/lib/constants'
import type { PostType } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

// ─── Interfaces ─────────────────────────────────────────────

interface AdminStats {
  users: number
  posts: number
  pendingReports: number
  activeAds: number
  totalRentals: number
}

interface Report {
  id: string
  reporter_id: string
  user_id: string | null
  post_id: string | null
  reason: string
  status: string
  created_at: string
  reporter?: { id: string; name: string; avatar_url: string | null }
  reported_user?: { id: string; name: string; avatar_url: string | null }
}

interface AdminUser {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  naapurusto: string
  is_pro: boolean
  is_admin: boolean
  created_at: string
}

interface AdminPost {
  id: string
  title: string
  type: PostType
  is_active: boolean
  is_pro_listing: boolean
  created_at: string
  user?: { id: string; name: string; avatar_url: string | null; naapurusto: string }
}

interface AdminAd {
  id: string
  title: string
  status: string
  impressions: number
  clicks: number
  daily_rate: number
  total_cost: number
  start_date: string
  end_date: string
  created_at: string
  advertiser?: { id: string; name: string; avatar_url: string | null }
}

interface AdminRental {
  id: string
  status: string
  total_fee: number
  platform_commission: number
  days: number
  daily_fee: number
  start_date: string
  end_date: string
  created_at: string
  post?: { id: string; title: string }
  lender?: { id: string; name: string; avatar_url: string | null }
  borrower?: { id: string; name: string; avatar_url: string | null }
}

export interface AdminClientProps {
  stats: AdminStats
  reports: Report[]
  users: AdminUser[]
  posts: AdminPost[]
  ads: AdminAd[]
  rentals: AdminRental[]
}

// ─── Status helpers ─────────────────────────────────────────

const AD_STATUS_LABELS: Record<string, string> = {
  draft: 'Luonnos',
  pending: 'Odottaa',
  active: 'Aktiivinen',
  paused: 'Tauolla',
  completed: 'Päättynyt',
  cancelled: 'Peruutettu',
}

const AD_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  pending: 'bg-blue-100 text-blue-700',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-700',
  draft: 'bg-muted text-muted-foreground',
}

const RENTAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Odottaa',
  confirmed: 'Vahvistettu',
  paid: 'Maksettu',
  completed: 'Valmis',
  cancelled: 'Peruutettu',
  disputed: 'Kiistetty',
  refunded: 'Hyvitetty',
}

const RENTAL_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-muted text-muted-foreground',
  disputed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
}

// ─── Main Component ─────────────────────────────────────────

export function AdminClient({
  stats,
  reports,
  users: initialUsers,
  posts: initialPosts,
  ads: initialAds,
  rentals: initialRentals,
}: AdminClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [postList, setPostList] = useState(initialPosts)
  const [adList, setAdList] = useState(initialAds)
  const [rentalList, setRentalList] = useState(initialRentals)
  const [searchQuery, setSearchQuery] = useState('')
  const [reportList, setReportList] = useState(reports)
  const supabase = createClient()

  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  // ─── User handlers ──────────────────────────────────────

  async function handleToggleAdmin(userId: string, currentlyAdmin: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentlyAdmin })
      .eq('id', userId)
    if (error) {
      toast.error('Toiminto epäonnistui')
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentlyAdmin } : u))
      )
      toast.success(currentlyAdmin ? 'Admin-oikeus poistettu' : 'Admin-oikeus myönnetty')
    }
  }

  async function handleTogglePro(userId: string, currentlyPro: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_pro: !currentlyPro,
        pro_expires_at: !currentlyPro
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .eq('id', userId)
    if (error) {
      toast.error('Toiminto epäonnistui')
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_pro: !currentlyPro } : u))
      )
      toast.success(currentlyPro ? 'Pro poistettu' : 'Pro myönnetty (30 pv)')
    }
  }

  async function handleBanUser(userId: string, userName: string) {
    const confirmed = window.confirm(
      `Haluatko varmasti estää käyttäjän ${userName}? Tämä poistaa kaikki käyttäjän ilmoitukset käytöstä.`
    )
    if (!confirmed) return

    const { error } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('user_id', userId)
    if (error) {
      toast.error('Esto epäonnistui')
    } else {
      setPostList((prev) =>
        prev.map((p) => (p.user?.id === userId ? { ...p, is_active: false } : p))
      )
      toast.success(`Käyttäjän ${userName} kaikki ilmoitukset poistettu käytöstä`)
    }
  }

  // ─── Report handlers ────────────────────────────────────

  async function handleReportAction(reportId: string, action: 'resolved' | 'dismissed') {
    const { error } = await supabase
      .from('reports')
      .update({ status: action })
      .eq('id', reportId)
    if (error) {
      toast.error('Toiminto epäonnistui')
    } else {
      setReportList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      )
      toast.success(action === 'resolved' ? 'Raportti käsitelty' : 'Raportti hylätty')
    }
  }

  async function handleDeactivatePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', postId)
    if (error) {
      toast.error('Postauksen poisto epäonnistui')
    } else {
      setPostList((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_active: false } : p))
      )
      toast.success('Postaus poistettu käytöstä')
    }
  }

  // ─── Post handlers ──────────────────────────────────────

  async function handleTogglePostActive(postId: string, currentlyActive: boolean) {
    const { error } = await supabase
      .from('posts')
      .update({ is_active: !currentlyActive })
      .eq('id', postId)
    if (error) {
      toast.error('Toiminto epäonnistui')
    } else {
      setPostList((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_active: !currentlyActive } : p))
      )
      toast.success(currentlyActive ? 'Ilmoitus poistettu käytöstä' : 'Ilmoitus palautettu')
    }
  }

  // ─── Ad handlers ────────────────────────────────────────

  async function handleToggleAdStatus(adId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    const { error } = await supabase
      .from('advertisements')
      .update({ status: newStatus })
      .eq('id', adId)
    if (error) {
      toast.error('Toiminto epäonnistui')
    } else {
      setAdList((prev) =>
        prev.map((a) => (a.id === adId ? { ...a, status: newStatus } : a))
      )
      toast.success(newStatus === 'paused' ? 'Mainos tauotettu' : 'Mainos aktivoitu')
    }
  }

  // ─── Rental handlers ───────────────────────────────────

  async function handleUpdateRentalStatus(rentalId: string, newStatus: string) {
    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'confirmed') {
      updateData.paid_at = new Date().toISOString()
    } else if (newStatus === 'refunded') {
      updateData.cancelled_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('rental_bookings')
      .update(updateData)
      .eq('id', rentalId)
    if (error) {
      toast.error('Toiminto epäonnistui')
    } else {
      setRentalList((prev) =>
        prev.map((r) => (r.id === rentalId ? { ...r, status: newStatus } : r))
      )
      toast.success(`Varauksen tila päivitetty: ${RENTAL_STATUS_LABELS[newStatus] || newStatus}`)
    }
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Hallintapaneeli</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.users}</p>
              <p className="text-xs text-muted-foreground">Käyttäjät</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.posts}</p>
              <p className="text-xs text-muted-foreground">Ilmoitukset</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Flag className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.pendingReports}</p>
              <p className="text-xs text-muted-foreground">Raportit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.activeAds}</p>
              <p className="text-xs text-muted-foreground">Mainokset</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalRentals}</p>
              <p className="text-xs text-muted-foreground">Lainaukset</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="reports">
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Raportit</span>
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Käyttäjät</span>
          </TabsTrigger>
          <TabsTrigger value="posts">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Ilmoitukset</span>
          </TabsTrigger>
          <TabsTrigger value="ads">
            <Megaphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Mainokset</span>
          </TabsTrigger>
          <TabsTrigger value="rentals">
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1">Lainaukset</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Reports tab ─────────────────────────────────── */}
        <TabsContent value="reports" className="space-y-2 mt-3">
          {reportList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Flag className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Ei raportteja</p>
            </div>
          ) : (
            reportList.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      {report.reporter?.avatar_url && (
                        <AvatarImage src={report.reporter.avatar_url} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {report.reporter?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      <span className="font-medium">{report.reporter?.name}</span>
                      {' ilmiantoi '}
                      <span className="font-medium">{report.reported_user?.name}</span>
                    </span>
                    <Badge
                      variant="secondary"
                      className={`ml-auto text-[10px] ${
                        report.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : report.status === 'resolved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted'
                      }`}
                    >
                      {report.status === 'pending'
                        ? 'Odottaa'
                        : report.status === 'resolved'
                          ? 'Käsitelty'
                          : 'Hylätty'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {report.reason} · {formatTimeAgo(report.created_at)}
                  </p>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleReportAction(report.id, 'resolved')}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Käsittele
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleReportAction(report.id, 'dismissed')}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Hylkää
                      </Button>
                      {report.post_id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleDeactivatePost(report.post_id!)}
                        >
                          <Ban className="mr-1 h-3 w-3" />
                          Poista postaus
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ─── Users tab ───────────────────────────────────── */}
        <TabsContent value="users" className="space-y-3 mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hae käyttäjää..."
              className="pl-9"
            />
          </div>
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Ei tuloksia</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback className="text-xs">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{u.name}</span>
                        {u.is_pro && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        {u.is_admin && <Shield className="h-3.5 w-3.5 text-blue-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email} · {u.naapurusto} · {formatTimeAgo(u.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={u.is_admin ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      {u.is_admin ? 'Admin' : 'Ei admin'}
                    </Button>
                    <Button
                      variant={u.is_pro ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleTogglePro(u.id, u.is_pro)}
                    >
                      <Crown className="mr-1 h-3 w-3" />
                      {u.is_pro ? 'Pro' : 'Ei Pro'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleBanUser(u.id, u.name)}
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Estä
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ─── Posts tab ───────────────────────────────────── */}
        <TabsContent value="posts" className="space-y-2 mt-3">
          {postList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Ei ilmoituksia</p>
            </div>
          ) : (
            postList.map((post) => {
              const category = CATEGORIES[post.type]
              return (
                <Card key={post.id} className={!post.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-7 w-7 mt-0.5">
                        {post.user?.avatar_url && <AvatarImage src={post.user.avatar_url} />}
                        <AvatarFallback className="text-[10px]">
                          {post.user?.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium truncate">{post.title}</span>
                          {post.is_pro_listing && (
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                            style={{
                              backgroundColor: `${category?.color}15`,
                              color: category?.color,
                            }}
                          >
                            {category?.label || post.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {post.user?.name}
                          </span>
                          {post.user?.naapurusto && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {post.user.naapurusto}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(post.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={post.is_active ? 'outline' : 'default'}
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => handleTogglePostActive(post.id, post.is_active)}
                      >
                        {post.is_active ? (
                          <>
                            <EyeOff className="mr-1 h-3 w-3" />
                            Piilota
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 h-3 w-3" />
                            Palauta
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* ─── Ads tab ─────────────────────────────────────── */}
        <TabsContent value="ads" className="space-y-2 mt-3">
          {adList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Megaphone className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Ei mainoksia</p>
            </div>
          ) : (
            adList.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 mt-0.5">
                      {ad.advertiser?.avatar_url && (
                        <AvatarImage src={ad.advertiser.avatar_url} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {ad.advertiser?.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{ad.title}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${AD_STATUS_COLORS[ad.status] || 'bg-muted text-muted-foreground'}`}
                        >
                          {AD_STATUS_LABELS[ad.status] || ad.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ad.advertiser?.name} · {formatPrice(ad.total_cost)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{ad.impressions} näyttöä</span>
                        <span>{ad.clicks} klikkiä</span>
                        <span>
                          CTR{' '}
                          {ad.impressions > 0
                            ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                            : '0.0'}
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(ad.start_date).toLocaleDateString('fi-FI')} –{' '}
                        {new Date(ad.end_date).toLocaleDateString('fi-FI')}
                      </p>
                    </div>
                    {(ad.status === 'active' || ad.status === 'paused') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                      >
                        {ad.status === 'active' ? (
                          <>
                            <Pause className="mr-1 h-3 w-3" />
                            Tauko
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Aktivoi
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ─── Rentals tab ─────────────────────────────────── */}
        <TabsContent value="rentals" className="space-y-2 mt-3">
          {rentalList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Ei lainauksia</p>
            </div>
          ) : (
            rentalList.map((rental) => (
              <Card key={rental.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {rental.post?.title || 'Poistettu ilmoitus'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          {rental.lender?.avatar_url && (
                            <AvatarImage src={rental.lender.avatar_url} />
                          )}
                          <AvatarFallback className="text-[8px]">
                            {rental.lender?.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{rental.lender?.name}</span>
                        <ArrowRightLeft className="h-3 w-3" />
                        <Avatar className="h-4 w-4">
                          {rental.borrower?.avatar_url && (
                            <AvatarImage src={rental.borrower.avatar_url} />
                          )}
                          <AvatarFallback className="text-[8px]">
                            {rental.borrower?.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{rental.borrower?.name}</span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${RENTAL_STATUS_COLORS[rental.status] || 'bg-muted text-muted-foreground'}`}
                    >
                      {RENTAL_STATUS_LABELS[rental.status] || rental.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>{formatPrice(rental.total_fee)}</span>
                    <span>{rental.days} pv</span>
                    <span>Provisio: {formatPrice(rental.platform_commission)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(rental.start_date).toLocaleDateString('fi-FI')} –{' '}
                    {new Date(rental.end_date).toLocaleDateString('fi-FI')} ·{' '}
                    {formatTimeAgo(rental.created_at)}
                  </p>
                  {/* Admin actions based on current status */}
                  <div className="flex gap-2">
                    {rental.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUpdateRentalStatus(rental.id, 'confirmed')}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Vahvista
                      </Button>
                    )}
                    {rental.status === 'disputed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUpdateRentalStatus(rental.id, 'refunded')}
                      >
                        <ArrowRightLeft className="mr-1 h-3 w-3" />
                        Hyvitä
                      </Button>
                    )}
                    {(rental.status === 'pending' || rental.status === 'confirmed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-600"
                        onClick={() => handleUpdateRentalStatus(rental.id, 'cancelled')}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Peruuta
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
