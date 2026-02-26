'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { CATEGORIES } from '@/lib/constants'
import type { PostType } from '@/lib/types'
import type { MapPost } from './map-client'
import Link from 'next/link'

import 'leaflet/dist/leaflet.css'

// Fix default marker icon for bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Category icon cache
const iconCache = new Map<string, L.DivIcon>()

function createCategoryIcon(color: string, label: string) {
  const key = `${color}-${label}`
  if (iconCache.has(key)) return iconCache.get(key)!
  const icon = L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${label.charAt(0)}</div>`,
  })
  iconCache.set(key, icon)
  return icon
}

const userIcon = L.divIcon({
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
})

// Component to fly to user position when it changes
function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap()
  const prevPosition = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (
      position &&
      (prevPosition.current === null ||
        prevPosition.current[0] !== position[0] ||
        prevPosition.current[1] !== position[1])
    ) {
      map.flyTo(position, 15, { duration: 1.2 })
      prevPosition.current = position
    }
  }, [position, map])

  return null
}

interface MapInnerProps {
  posts: MapPost[]
  userPosition: [number, number] | null
}

export default function MapInner({ posts, userPosition }: MapInnerProps) {
  const defaultCenter: [number, number] = [60.1699, 24.9384]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToUser position={userPosition} />

      {/* User position marker */}
      {userPosition && <Marker position={userPosition} icon={userIcon} />}

      {/* Post markers */}
      {posts.map((post) => {
        const cat = CATEGORIES[post.type as PostType]
        if (!cat) return null
        const icon = createCategoryIcon(cat.color, cat.label)

        return (
          <Marker
            key={post.id}
            position={[post.latitude, post.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1.5 text-sm">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.label}
                </span>
                <p className="font-semibold leading-tight">{post.title}</p>
                {post.user && (
                  <p className="text-xs text-muted-foreground">
                    {post.user.name}
                    {post.user.naapurusto && ` \u00b7 ${post.user.naapurusto}`}
                  </p>
                )}
                {post.location && (
                  <p className="text-xs text-muted-foreground">{post.location}</p>
                )}
                {post.daily_fee != null && post.daily_fee > 0 && (
                  <p className="text-xs font-medium">{post.daily_fee.toFixed(2)} &euro;/pv</p>
                )}
                <Link
                  href={`/post/${post.id}`}
                  className="inline-block mt-1 text-xs font-medium text-primary hover:underline"
                >
                  Katso ilmoitus &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
