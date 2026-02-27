'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Crown, ImageIcon, ChevronRight, BookOpen, CalendarCheck, Zap, TrendingUp, BadgeCheck, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatTimeAgo, formatPrice } from '@/lib/format'
import { useTheme } from 'next-themes'
import type { Post, PostType } from '@/lib/types'

const ctaConfig: Record<string, { label: string; icon: typeof ChevronRight }> = {
  tarvitsen: { label: 'Katso ilmoitus', icon: ChevronRight },
  tarjoan: { label: 'Katso ilmoitus', icon: ChevronRight },
  ilmaista: { label: 'Katso ilmoitus', icon: ChevronRight },
  tilannehuone: { label: 'Katso ilmoitus', icon: ChevronRight },
  lainaa: { label: 'Katso lainaehdot', icon: BookOpen },
  tapahtuma: { label: 'Katso tapahtuma', icon: CalendarCheck },
  nappaa: { label: 'Nappaa!', icon: Zap },
}

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const { resolvedTheme } = useTheme()
  const category = CATEGORIES[post.type as PostType]
  const isPro = post.is_pro_listing
  const user = post.user
  const isDark = resolvedTheme === 'dark'
  const cta = ctaConfig[post.type as string] ?? ctaConfig.tarvitsen

  return (
    <Link href={`/post/${post.id}`}>
      <Card
        className={cn(
          'relative overflow-hidden border border-[var(--color-border)] rounded-2xl transition-all duration-150 ease-in-out',
          'hover:border-[var(--color-muted-foreground)] hover:shadow-[0_1px_3px_rgba(26,26,46,0.04)]',
          isPro && 'ring-1 ring-amber-400/40'
        )}
        style={isPro ? {
          backgroundColor: isDark ? 'rgba(217,165,50,0.06)' : 'rgba(217,165,50,0.04)',
        } : undefined}
      >
        {/* Left accent bar — TackBird signature */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{ backgroundColor: category?.color ?? '#888' }}
        />

        <CardContent className="p-4 pl-5">
          {/* Header: avatar + name + time */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              {user?.avatar_url && (
                <AvatarImage src={user.avatar_url} alt={user.name} />
              )}
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="truncate text-sm font-medium hover:underline"
                  onClick={(e) => {
                    if (user?.id) {
                      e.preventDefault()
                      e.stopPropagation()
                      window.location.href = `/profile/${user.id}`
                    }
                  }}
                >
                  {user?.name ?? 'Käyttäjä'}
                </span>
                {isPro && <Crown className="h-3.5 w-3.5 text-amber-500" />}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {user?.naapurusto && (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>{user.naapurusto}</span>
                    <span>·</span>
                  </>
                )}
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(post.created_at)}</span>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px]"
              style={{
                backgroundColor: `${category?.color}15`,
                color: category?.color,
              }}
            >
              {category?.label}
            </Badge>
          </div>

          {/* Pro badges */}
          {isPro && (
            <div className="flex gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <TrendingUp className="h-3 w-3" /> Nostettu
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <BadgeCheck className="h-3 w-3" /> Vahvistettu taitaja
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold leading-snug mb-1">{post.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.description}
          </p>

          {/* Image */}
          {post.image_url && (
            <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-muted">
              {!imgLoaded && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
              )}
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImgLoaded(true)}
                sizes="(max-width: 448px) 100vw, 448px"
              />
              {post.images && post.images.length > 0 && (
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  <ImageIcon className="h-3 w-3" />
                  {post.images.length + 1}
                </span>
              )}
            </div>
          )}

          {/* Footer: price, location, lainaa badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            {post.daily_fee != null && (
              <span className="font-medium text-foreground">
                {formatPrice(post.daily_fee)} / pv
              </span>
            )}
            {post.type === 'lainaa' && post.daily_fee != null && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-3 w-3" /> Maksu sovelluksessa
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.location}
              </span>
            )}
          </div>

          {/* CTA button */}
          <div
            className="flex items-center justify-center gap-1.5 rounded py-2 text-xs font-medium transition-all duration-150 hover:opacity-80"
            style={{
              backgroundColor: `${category?.color}12`,
              color: category?.color,
            }}
          >
            <cta.icon className="h-3.5 w-3.5" />
            {cta.label}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
