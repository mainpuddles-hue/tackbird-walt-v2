'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, X } from 'lucide-react'
import { PostCard } from '@/components/post-card'
import { FilterBar } from '@/components/filter-bar'
import Link from 'next/link'
import type { Post, PostType } from '@/lib/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<PostType | null>(null)
  const [searched, setSearched] = useState(false)
  const supabase = createClient()

  const doSearch = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed && !activeFilter) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      let q = supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(id, name, avatar_url, naapurusto, is_pro)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(30)

      if (trimmed) {
        q = q.or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
      }
      if (activeFilter) {
        q = q.eq('type', activeFilter)
      }

      const { data } = await q
      setResults(data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, activeFilter, supabase])

  // Re-search when filter changes
  useEffect(() => {
    if (searched || activeFilter) {
      doSearch()
    }
  }, [activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch()
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hae ilmoituksia..."
              className="pl-9 pr-8"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setSearched(false)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            Hae
          </Button>
        </form>
      </div>

      {/* Filters */}
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Results */}
      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Haetaan...
        </div>
      ) : searched ? (
        results.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? 'tulos' : 'tulosta'}
              {activeFilter && ' (suodatettu)'}
            </p>
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <Search className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p className="text-lg font-medium">Ei tuloksia</p>
            <p className="text-sm mt-1">Kokeile eri hakusanoja tai suodattimia</p>
          </div>
        )
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <Search className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">Kirjoita hakusana ja paina Hae</p>
        </div>
      )}
    </div>
  )
}
