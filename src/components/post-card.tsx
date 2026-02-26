'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatTimeAgo, formatPrice } from '@/lib/format'
import type { Post, PostType } from '@/lib/types'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const category = CATEGORIES[post.type as PostType]
  const isPro = post.is_pro_listing
  const user = post.user

  return (
    <Link href={`/post/${post.id}`}>
      <Card
        className={cn(
          'overflow-hidden transition-shadow hover:shadow-md',
          isPro && 'ring-1 ring-amber-300'
        )}
        style={{
          borderTop: `3px solid ${category?.color ?? '#888'}`,
          backgroundColor: category?.bgLight ?? '#fff',
        }}
      >
        <CardContent className="p-4">
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
            </div>
          )}

          {/* Footer: price or location */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {post.daily_fee != null && (
              <span className="font-medium text-foreground">
                {formatPrice(post.daily_fee)} / pv
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.location}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
