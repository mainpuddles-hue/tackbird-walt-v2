'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/post-card'
import { AdCard } from '@/components/ad-card'
import { FilterBar } from '@/components/filter-bar'
import { SwipeCards } from '@/components/swipe-cards'
import { SkeletonList } from '@/components/skeleton-card'
import { Loader2, RefreshCw, Layers, CreditCard, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import type { Post, PostType } from '@/lib/types'

interface AdData {
  id: string
  title: string
  description: string
  image_url: string | null
  link_url: string | null
  cta_text: string
}

interface FeedClientProps {
  initialPosts: Post[]
}

const PAGE_SIZE = 20

export function FeedClient({ initialPosts }: FeedClientProps) {
  const [activeFilter, setActiveFilter] = useState<PostType | null>(null)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [ads, setAds] = useState<AdData[]>([])
  const [swipeMode, setSwipeMode] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useI18n()
  // Fetch active ads
  useEffect(() => {
    async function fetchAds() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('advertisements')
        .select('id, title, description, image_url, link_url, cta_text')
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)
        .limit(5)
      if (data) setAds(data)
    }
    fetchAds()
  }, [supabase])

  const handleAdImpression = useCallback(
    async (adId: string) => {
      const today = new Date().toISOString().split('T')[0]
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('ad_impressions').upsert(
        { ad_id: adId, user_id: user.id, impression_date: today },
        { onConflict: 'ad_id,user_id,impression_date', ignoreDuplicates: true }
      )
      // Only increment if insertion succeeded (not a duplicate)
      if (!error) {
        const { data: adData } = await supabase
          .from('advertisements')
          .select('impressions')
          .eq('id', adId)
          .single()
        if (adData) {
          await supabase
            .from('advertisements')
            .update({ impressions: adData.impressions + 1 })
            .eq('id', adId)
        }
      }
    },
    [supabase]
  )

  const handleAdClick = useCallback(
    async (adId: string) => {
      const { data } = await supabase
        .from('advertisements')
        .select('clicks')
        .eq('id', adId)
        .single()
      if (data) {
        await supabase
          .from('advertisements')
          .update({ clicks: data.clicks + 1 })
          .eq('id', adId)
      }
    },
    [supabase]
  )

  const filteredPosts = activeFilter
    ? posts.filter((p) => p.type === activeFilter)
    : posts

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto, is_pro, is_hub),
          images:post_images(id, image_url, sort_order)
        `)
        .eq('is_active', true)
        .order('is_pro_listing', { ascending: false })
        .order('created_at', { ascending: false })
        .range(posts.length, posts.length + PAGE_SIZE - 1)

      if (activeFilter) {
        query = query.eq('type', activeFilter)
      }

      const { data } = await query
      if (data && data.length > 0) {
        setPosts((prev) => [...prev, ...data])
        if (data.length < PAGE_SIZE) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, posts.length, activeFilter, supabase])

  // Supabase Realtime subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('feed-new-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const newPost = payload.new as Post
          if (newPost.is_active) {
            setHasNewPosts(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  function handleRefreshFeed() {
    setHasNewPosts(false)
    router.refresh()
  }

  // Reset when filter changes
  useEffect(() => {
    // Turn off swipe mode if switching away from ilmaista
    if (activeFilter !== 'ilmaista') {
      setSwipeMode(false)
    }
    if (activeFilter) {
      // Fetch filtered posts from scratch
      setLoading(true)
      const fetchFiltered = async () => {
        const { data } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto, is_pro, is_hub),
            images:post_images(id, image_url, sort_order)
          `)
          .eq('is_active', true)
          .eq('type', activeFilter)
          .order('is_pro_listing', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE)
        setPosts(data ?? [])
        setHasMore((data?.length ?? 0) >= PAGE_SIZE)
        setLoading(false)
      }
      fetchFiltered()
    } else {
      // Reset to initial
      setPosts(initialPosts)
      setHasMore(initialPosts.length >= PAGE_SIZE)
    }
  }, [activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync with server-provided data when initialPosts change (e.g. after router.refresh())
  useEffect(() => {
    if (!activeFilter) {
      setPosts(initialPosts)
      setHasMore(initialPosts.length >= PAGE_SIZE)
    }
  }, [initialPosts]) // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div className="min-h-screen space-y-3 p-4">
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Hero banner */}
      {!activeFilter && filteredPosts.length > 0 && (
        <div className="rounded-2xl bg-primary p-5 text-white mb-4">
          <p className="text-[11px] text-white/60 font-medium uppercase tracking-wider mb-1">Naapuruston jakamisalusta</p>
          <h2 className="text-lg font-bold mb-1">Naapurin apu ei ole koskaan ollut lähempänä</h2>
          <p className="text-sm text-white/80 mb-3">Jaa, lainaa ja auta — kaikki alkaa yhdestä ilmoituksesta.</p>
          <Link href="/create" className="inline-flex items-center gap-1.5 rounded-full bg-white text-primary px-4 py-2 text-sm font-medium hover:bg-white/90 transition-colors">
            Luo ilmoitus <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Swipe mode toggle (shown for ilmaista filter) */}
      {activeFilter === 'ilmaista' && filteredPosts.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSwipeMode(!swipeMode)}
            className="gap-1.5"
          >
            {swipeMode ? (
              <>
                <Layers className="h-3.5 w-3.5" />
                Lista
              </>
            ) : (
              <>
                <CreditCard className="h-3.5 w-3.5" />
                Swipe
              </>
            )}
          </Button>
        </div>
      )}

      {/* New posts banner */}
      {hasNewPosts && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshFeed}
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('feed.newPosts')}
        </Button>
      )}

      {/* SwipeCards mode */}
      {swipeMode && activeFilter === 'ilmaista' && filteredPosts.length > 0 ? (
        <div className="pb-20">
          <SwipeCards
            posts={filteredPosts}
            onSwipeRight={(post) => {
              router.push(`/post/${post.id}`)
            }}
          />
        </div>
      ) : filteredPosts.length === 0 && loading ? (
        <SkeletonList count={4} />
      ) : filteredPosts.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <span className="text-6xl mb-4">📦</span>
          <h3 className="text-lg font-semibold text-foreground">{t('feed.noPosts')}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t('feed.noPostsHint')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Uusimmat ilmoitukset</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <div className={`animate-card-in ${index < 10 ? `stagger-${index + 1}` : ''}`}>
                  <PostCard post={post} />
                </div>
                {/* Interleave ad after every 5th post — spans both columns */}
                {ads.length > 0 &&
                  (index + 1) % 5 === 0 &&
                  ads[Math.floor(index / 5) % ads.length] && (
                    <div className="col-span-2">
                      <AdCard
                        ad={ads[Math.floor(index / 5) % ads.length]}
                        onImpression={handleAdImpression}
                        onClick={handleAdClick}
                      />
                    </div>
                  )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />
      {loading && filteredPosts.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasMore && filteredPosts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          {t('feed.allLoaded')}
        </p>
      )}
    </div>
  )
}
