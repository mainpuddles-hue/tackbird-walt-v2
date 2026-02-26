'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Megaphone, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AdCardProps {
  ad: {
    id: string
    title: string
    description: string
    image_url: string | null
    link_url: string | null
    cta_text: string
  }
  onImpression?: (adId: string) => void
  onClick?: (adId: string) => void
}

export function AdCard({ ad, onImpression, onClick }: AdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const impressionTracked = useRef(false)

  // IntersectionObserver for impression tracking
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !impressionTracked.current) {
          impressionTracked.current = true
          onImpression?.(ad.id)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ad.id, onImpression])

  function handleClick() {
    onClick?.(ad.id)
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div ref={cardRef}>
      <Card className="overflow-hidden border rounded-lg">
        <CardContent className="p-0">
          {/* MAINOS label — required by Finnish advertising law */}
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
            <Megaphone className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mainos
            </span>
          </div>

          {/* Ad image */}
          {ad.image_url && (
            <div className="relative h-40 w-full overflow-hidden">
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-cover"
                sizes="(max-width: 448px) 100vw, 448px"
              />
            </div>
          )}

          {/* Content */}
          <div className="px-4 py-3 space-y-1.5">
            <h3 className="font-medium leading-snug">{ad.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {ad.description}
            </p>

            {/* CTA button */}
            {(ad.link_url || ad.cta_text) && (
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClick}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {ad.cta_text || 'Lue lisää'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
