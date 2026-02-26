'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { formatTimeAgo } from '@/lib/format'
import { toast } from 'sonner'
import Link from 'next/link'

interface AdminStats {
  users: number
  posts: number
  pendingReports: number
  activeAds: number
}

interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  reported_post_id: string | null
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

interface AdminClientProps {
  stats: AdminStats
  reports: Report[]
  users: AdminUser[]
}

export function AdminClient({ stats, reports, users: initialUsers }: AdminClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [reportList, setReportList] = useState(reports)
  const router = useRouter()
  const supabase = createClient()

  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

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
      toast.success('Postaus poistettu')
      router.refresh()
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
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="w-full">
          <TabsTrigger value="reports" className="flex-1">
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            Raportit
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Käyttäjät
          </TabsTrigger>
        </TabsList>

        {/* Reports tab */}
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
                      {report.reported_post_id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleDeactivatePost(report.reported_post_id!)}
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

        {/* Users tab */}
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
