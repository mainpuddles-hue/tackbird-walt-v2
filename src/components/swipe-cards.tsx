'use client'

import { useState, useRef, useCallback } from 'react'
import { MapPin, Clock, X, Check } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/lib/format'
import type { Post, PostType } from '@/lib/types'

interface SwipeCardsProps {
  posts: Post[]
  onSwipeLeft?: (post: Post) => void
  onSwipeRight?: (post: Post) => void
}

const SWIPE_THRESHOLD = 100
const MAX_ROTATION = 15

export function SwipeCards({ posts, onSwipeLeft, onSwipeRight }: SwipeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [deltaX, setDeltaX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const isVerticalScrollRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const remainingPosts = posts.slice(currentIndex)
  const visiblePosts = remainingPosts.slice(0, 3)

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      const post = posts[currentIndex]
      if (!post) return

      setIsAnimatingOut(true)
      setExitDirection(direction)

      setTimeout(() => {
        if (direction === 'left') {
          onSwipeLeft?.(post)
        } else {
          onSwipeRight?.(post)
        }
        setCurrentIndex((prev) => prev + 1)
        setDeltaX(0)
        setIsAnimatingOut(false)
        setExitDirection(null)
      }, 300)
    },
    [currentIndex, posts, onSwipeLeft, onSwipeRight]
  )

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    startXRef.current = clientX
    startYRef.current = clientY
    isDraggingRef.current = true
    isVerticalScrollRef.current = false
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return

    const dx = clientX - startXRef.current
    const dy = clientY - startYRef.current

    // Determine scroll direction on first significant move
    if (!isVerticalScrollRef.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      isVerticalScrollRef.current = true
      isDraggingRef.current = false
      setIsDragging(false)
      setDeltaX(0)
      return
    }

    if (!isVerticalScrollRef.current) {
      setDeltaX(dx)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current && !isDragging) return

    isDraggingRef.current = false
    setIsDragging(false)

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      handleSwipeComplete(deltaX > 0 ? 'right' : 'left')
    } else {
      setDeltaX(0)
    }
  }, [deltaX, isDragging, handleSwipeComplete])

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimatingOut) return
      const touch = e.touches[0]
      handleDragStart(touch.clientX, touch.clientY)
    },
    [isAnimatingOut, handleDragStart]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleDragMove(touch.clientX, touch.clientY)
    },
    [handleDragMove]
  )

  const onTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isAnimatingOut) return
      e.preventDefault()
      handleDragStart(e.clientX, e.clientY)
    },
    [isAnimatingOut, handleDragStart]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      handleDragMove(e.clientX, e.clientY)
    },
    [isDragging, handleDragMove]
  )

  const onMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  const onMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd()
    }
  }, [isDragging, handleDragEnd])

  if (visiblePosts.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 text-muted-foreground">
        <span className="text-5xl">{'\u{1F389}'}</span>
        <p className="text-sm font-medium">Kaikki ilmoitukset k\u00E4yty l\u00E4pi!</p>
      </div>
    )
  }

  // Calculate swipe indicator opacity based on deltaX
  const swipeProgress = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1)
  const showLeftIndicator = deltaX < -20
  const showRightIndicator = deltaX > 20

  return (
    <div
      className="relative mx-auto h-[420px] w-full max-w-sm select-none"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {visiblePosts.map((post, stackIndex) => {
        const isTopCard = stackIndex === 0
        const category = CATEGORIES[post.type as PostType]

        // Stack offset and scale
        const baseScale = 1 - stackIndex * 0.04
        const baseTranslateY = stackIndex * 8

        // Top card drag transforms
        let transform: string
        let transition: string
        let zIndex: number
        let opacity: number

        if (isTopCard) {
          zIndex = 30
          opacity = 1

          if (isAnimatingOut && exitDirection) {
            const exitX = exitDirection === 'left' ? -400 : 400
            const exitRotation = exitDirection === 'left' ? -20 : 20
            transform = `translateX(${exitX}px) translateY(${baseTranslateY}px) rotate(${exitRotation}deg) scale(${baseScale})`
            transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease'
            opacity = 0
          } else if (isDragging || deltaX !== 0) {
            const rotation = (deltaX / 300) * MAX_ROTATION
            transform = `translateX(${deltaX}px) translateY(${baseTranslateY}px) rotate(${rotation}deg) scale(${baseScale})`
            transition = 'none'
          } else {
            transform = `translateX(0) translateY(${baseTranslateY}px) rotate(0deg) scale(${baseScale})`
            transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)'
          }
        } else {
          zIndex = 30 - stackIndex * 10
          opacity = 1 - stackIndex * 0.15
          transform = `translateX(0) translateY(${baseTranslateY}px) rotate(0deg) scale(${baseScale})`
          transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease'
        }

        return (
          <div
            key={post.id}
            ref={isTopCard ? cardRef : undefined}
            className={cn(
              'absolute inset-0 overflow-hidden rounded-2xl bg-card shadow-lg',
              isTopCard && 'cursor-grab',
              isTopCard && isDragging && 'cursor-grabbing'
            )}
            style={{
              transform,
              transition,
              zIndex,
              opacity,
              willChange: isTopCard ? 'transform' : undefined,
            }}
            onTouchStart={isTopCard ? onTouchStart : undefined}
            onTouchMove={isTopCard ? onTouchMove : undefined}
            onTouchEnd={isTopCard ? onTouchEnd : undefined}
            onMouseDown={isTopCard ? onMouseDown : undefined}
          >
            {/* Swipe indicators (top card only) */}
            {isTopCard && showRightIndicator && (
              <div
                className="absolute left-4 top-4 z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-green-500 bg-green-500/20"
                style={{ opacity: swipeProgress }}
              >
                <Check className="h-8 w-8 text-green-500" strokeWidth={3} />
              </div>
            )}
            {isTopCard && showLeftIndicator && (
              <div
                className="absolute right-4 top-4 z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/20"
                style={{ opacity: swipeProgress }}
              >
                <X className="h-8 w-8 text-red-500" strokeWidth={3} />
              </div>
            )}

            {/* Card content */}
            <div className="flex h-full flex-col p-6">
              {/* Category pill */}
              <div className="mb-4 flex items-start justify-between">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${category?.color ?? '#888'}20`,
                    color: category?.color ?? '#888',
                  }}
                >
                  {category?.label ?? post.type}
                </span>
              </div>

              {/* Emoji / category icon area */}
              <div className="mb-6 flex flex-1 items-center justify-center">
                <span className="text-6xl leading-none">
                  {post.type === 'ilmaista' && '❤️'}
                  {post.type === 'tarvitsen' && '🙏'}
                  {post.type === 'tarjoan' && '🎁'}
                  {post.type === 'lainaa' && '📖'}
                  {post.type === 'tapahtuma' && '🎉'}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-2 text-xl font-bold leading-tight text-foreground">
                {post.title}
              </h3>

              {/* Description */}
              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {post.description}
              </p>

              {/* Footer: location + time */}
              <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                {post.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {post.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: category?.color ?? '#888' }}
            />
          </div>
        )
      })}
    </div>
  )
}
