'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/components/filter-bar'
import { toast } from 'sonner'
import type { PostType } from '@/lib/types'

const MapInner = dynamic(() => import('./map-inner'), { ssr: false })

export interface MapPost {
  id: string
  type: string
  title: string
  location: string | null
  latitude: number
  longitude: number
  image_url: string | null
  daily_fee: number | null
  user: { id: string; name: string; avatar_url: string | null; naapurusto: string | null } | null
}

interface MapClientProps {
  posts: MapPost[]
}

export function MapClient({ posts }: MapClientProps) {
  const [activeFilter, setActiveFilter] = useState<PostType | null>(null)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  const filteredPosts = activeFilter
    ? posts.filter((p) => p.type === activeFilter)
    : posts

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Selain ei tue paikannusta')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude])
        setGeoLoading(false)
        toast.success('Sijainti paikannettu')
      },
      () => {
        toast.error('Paikannus epäonnistui')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return (
    <div className="relative h-[calc(100dvh-3.5rem-4rem)]">
      {/* Back button */}
      <div className="absolute top-3 left-3 z-[1000]">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-full shadow-md bg-background/95 backdrop-blur"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Takaisin</span>
          </Link>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="absolute top-3 left-14 right-14 z-[1000]">
        <div className="rounded-xl bg-background/95 backdrop-blur shadow-md px-3 py-2">
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>
      </div>

      {/* Geolocation button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-full shadow-md bg-background/95 backdrop-blur"
          onClick={handleGeolocate}
          disabled={geoLoading}
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="sr-only">Paikanna</span>
        </Button>
      </div>

      {/* Map */}
      <MapInner posts={filteredPosts} userPosition={userPosition} />
    </div>
  )
}
