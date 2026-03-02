'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Crown, ImageIcon, Heart, TrendingUp, BadgeCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatTimeAgo, formatPrice } from '@/lib/format'
import { useTheme } from 'next-themes'
import type { Post, PostType } from '@/lib/types'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [saved, setSaved] = useState(post.is_saved ?? false)
  const { resolvedTheme } = useTheme()
  const category = CATEGORIES[post.type as PostType]
  const isPro = post.is_pro_listing
  const user = post.user
  const isDark = resolvedTheme === 'dark'

  return (
    <Link href={`/post/${post.id}`}>
      <div
        className={cn(
          'rounded-2xl border-0 bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
          isPro && 'ring-1 ring-amber-400/40'
        )}
        style={isPro ? {
          backgroundColor: isDark ? 'rgba(217,165,50,0.06)' : 'rgba(217,165,50,0.04)',
        } : undefined}
      >
        {/* Image */}
        {post.image_url ? (
          <div className="relative aspect-[4/3] bg-muted">
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

            {/* Image count badge */}
            {post.images && post.images.length > 0 && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                <ImageIcon className="h-3 w-3" />
                {post.images.length + 1}
              </span>
            )}

            {/* Heart / bookmark button */}
            <button
              className={cn(
                'absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-150 hover:bg-white hover:scale-110',
                saved && 'bg-white'
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSaved(!saved)
              }}
              aria-label={saved ? 'Poista tallennus' : 'Tallenna'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors duration-150',
                  saved
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600'
                )}
              />
            </button>

            {/* Price overlay for lainaa */}
            {post.type === 'lainaa' && post.daily_fee != null && (
              <div className="absolute bottom-2 right-2 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(post.daily_fee)}
                </span>
                <span className="text-xs text-muted-foreground"> / pv</span>
              </div>
            )}

            {/* Pro badge on image */}
            {isPro && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-sm px-2 py-0.5 shadow-sm">
                <Crown className="h-3 w-3 text-white" />
                <span className="text-[10px] font-semibold text-white">PRO</span>
              </div>
            )}
          </div>
        ) : (
          /* No image — show a compact muted placeholder area */
          <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />

            {/* Heart button even without image */}
            <button
              className={cn(
                'absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-150 hover:bg-white hover:scale-110',
                saved && 'bg-white'
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSaved(!saved)
              }}
              aria-label={saved ? 'Poista tallennus' : 'Tallenna'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors duration-150',
                  saved
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600'
                )}
              />
            </button>

            {/* Price overlay for lainaa even without image */}
            {post.type === 'lainaa' && post.daily_fee != null && (
              <div className="absolute bottom-2 right-2 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(post.daily_fee)}
                </span>
                <span className="text-xs text-muted-foreground"> / pv</span>
              </div>
            )}

            {/* Pro badge */}
            {isPro && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-sm px-2 py-0.5 shadow-sm">
                <Crown className="h-3 w-3 text-white" />
                <span className="text-[10px] font-semibold text-white">PRO</span>
              </div>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="p-3.5">
          {/* Category badge + Pro indicators */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `${category?.color}26`,
                color: category?.color,
              }}
            >
              {category?.label}
            </span>

            {isPro && (
              <>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <TrendingUp className="h-2.5 w-2.5" /> Nostettu
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <BadgeCheck className="h-2.5 w-2.5" /> Vahvistettu
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 mb-1.5">
            {post.title}
          </h3>

          {/* Location */}
          {post.location && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{post.location}</span>
            </div>
          )}

          {/* Price row for lainaa (non-image fallback inline) */}
          {post.type === 'lainaa' && post.daily_fee != null && !post.image_url && (
            <div className="text-sm font-semibold text-foreground mb-3">
              {formatPrice(post.daily_fee)}
              <span className="text-xs font-normal text-muted-foreground"> / pv</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/50 pt-2.5">
            {/* User row */}
            <div className="flex items-center gap-2">
              <Avatar
                className="h-6 w-6 cursor-pointer"
                onClick={(e: React.MouseEvent) => {
                  if (user?.id) {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = `/profile/${user.id}`
                  }
                }}
              >
                {user?.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                )}
                <AvatarFallback className="text-[10px]">
                  {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-xs text-muted-foreground truncate hover:underline cursor-pointer"
                onClick={(e) => {
                  if (user?.id) {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = `/profile/${user.id}`
                  }
                }}
              >
                {user?.name ?? 'Kayttaja'}
              </span>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(post.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
