'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Pause, Play, Eye, MousePointer, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/format'
import { CreateAdModal } from '@/components/create-ad-modal'
import type { Advertisement } from '@/lib/types'

interface AdDashboardProps {
  userId: string
  isPro: boolean
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Aktiivinen'
    case 'paused':
      return 'Keskeytetty'
    case 'completed':
      return 'Päättynyt'
    case 'pending':
      return 'Odottaa'
    case 'cancelled':
      return 'Peruutettu'
    case 'draft':
      return 'Luonnos'
    default:
      return status
  }
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'paused':
      return 'secondary'
    case 'pending':
      return 'outline'
    case 'completed':
    case 'cancelled':
      return 'secondary'
    default:
      return 'outline'
  }
}

function statusClassName(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    case 'paused':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    case 'completed':
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    case 'pending':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    default:
      return ''
  }
}

export function AdDashboard({ userId, isPro }: AdDashboardProps) {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const supabase = createClient()

  const fetchAds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('advertiser_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAds(data ?? [])
    } catch {
      toast.error('Mainosten lataaminen epäonnistui')
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  async function toggleStatus(ad: Advertisement) {
    const newStatus = ad.status === 'active' ? 'paused' : 'active'
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ status: newStatus })
        .eq('id', ad.id)
        .eq('advertiser_id', userId)

      if (error) throw error

      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, status: newStatus } : a))
      )
      toast.success(
        newStatus === 'paused' ? 'Kampanja keskeytetty' : 'Kampanja jatkettu'
      )
    } catch {
      toast.error('Tilan muuttaminen epäonnistui')
    }
  }

  function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'numeric',
    })
    const end = new Date(endDate).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
    return `${start} – ${end}`
  }

  function computeCtr(impressions: number, clicks: number): string {
    if (impressions === 0) return '0,0 %'
    return ((clicks / impressions) * 100).toLocaleString('fi-FI', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + ' %'
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Ladataan mainoksia...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mainoskampanjat</h3>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Megaphone className="mr-1.5 h-3.5 w-3.5" />
          Luo kampanja
        </Button>
      </div>

      {ads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <Megaphone className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ei mainoskampanjoita
            </p>
            <p className="text-xs text-muted-foreground">
              Luo ensimmäinen kampanjasi ja tavoita naapurit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium truncate">{ad.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDateRange(ad.start_date, ad.end_date)}
                    </div>
                  </div>
                  <Badge
                    variant={statusVariant(ad.status)}
                    className={statusClassName(ad.status)}
                  >
                    {statusLabel(ad.status)}
                  </Badge>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Eye className="h-3 w-3" />
                      <span className="text-[10px] uppercase tracking-wide">
                        Näytöt
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {ad.impressions.toLocaleString('fi-FI')}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <MousePointer className="h-3 w-3" />
                      <span className="text-[10px] uppercase tracking-wide">
                        Klikkaukset
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {ad.clicks.toLocaleString('fi-FI')}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <span className="text-[10px] uppercase tracking-wide">
                        CTR
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {computeCtr(ad.impressions, ad.clicks)}
                    </p>
                  </div>
                </div>

                {/* Cost + action */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Hinta: {formatPrice(ad.total_cost)}
                  </span>
                  {(ad.status === 'active' || ad.status === 'paused') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(ad)}
                    >
                      {ad.status === 'active' ? (
                        <>
                          <Pause className="mr-1 h-3 w-3" />
                          Keskeytä
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Jatka
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAdModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) fetchAds()
        }}
        isPro={isPro}
        advertiserId={userId}
      />
    </div>
  )
}
