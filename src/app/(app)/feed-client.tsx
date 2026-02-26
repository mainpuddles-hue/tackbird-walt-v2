'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/post-card'
import { AdCard } from '@/components/ad-card'
import { FilterBar } from '@/components/filter-bar'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const observerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

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

      const { error } = await supabase.from('ad_impressions').insert({
        ad_id: adId,
        user_id: user.id,
        date: today,
      })
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
    <div className="space-y-3 p-4">
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* New posts banner */}
      {hasNewPosts && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshFeed}
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {'Uusia ilmoituksia \u2014 p\u00e4ivit\u00e4'}
        </Button>
      )}

      {filteredPosts.length === 0 && !loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">Ei ilmoituksia</p>
          <p className="text-sm mt-1">Kokeile eri suodatinta tai luo uusi ilmoitus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, index) => (
            <div key={post.id}>
              <PostCard post={post} />
              {/* Interleave ad after every 5th post */}
              {ads.length > 0 &&
                (index + 1) % 5 === 0 &&
                ads[Math.floor(index / 5) % ads.length] && (
                  <div className="mt-3">
                    <AdCard
                      ad={ads[Math.floor(index / 5) % ads.length]}
                      onImpression={handleAdImpression}
                      onClick={handleAdClick}
                    />
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasMore && filteredPosts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Kaikki ilmoitukset ladattu
        </p>
      )}
    </div>
  )
}
