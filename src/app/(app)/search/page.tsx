'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Search, X, MapPin, FileText, Users } from 'lucide-react'
import { PostCard } from '@/components/post-card'
import { FilterBar } from '@/components/filter-bar'
import Link from 'next/link'
import type { Post, PostType, Profile } from '@/lib/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [userResults, setUserResults] = useState<Pick<Profile, 'id' | 'name' | 'avatar_url' | 'naapurusto' | 'bio'>[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<PostType | null>(null)
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const supabase = createClient()

  const doSearch = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed && !activeFilter) {
      setResults([])
      setUserResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      // Search posts
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

      const { data: postData } = await q
      setResults(postData ?? [])

      // Search users
      if (trimmed) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, naapurusto, bio')
          .ilike('name', `%${trimmed}%`)
          .limit(20)
        setUserResults(userData ?? [])
      } else {
        setUserResults([])
      }
    } catch {
      setResults([])
      setUserResults([])
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
              placeholder="Hae ilmoituksia tai käyttäjiä..."
              className="pl-9 pr-8"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setUserResults([])
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Ilmoitukset ({results.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Käyttäjät ({userResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-3">
            {results.length > 0 ? (
              <div className="space-y-3">
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
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-3">
            {userResults.length > 0 ? (
              <div className="space-y-1">
                {userResults.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.id}`}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <Avatar className="h-10 w-10">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.name} />}
                      <AvatarFallback>
                        {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      {u.naapurusto && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {u.naapurusto}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Ei käyttäjiä haulle</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <Search className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">Kirjoita hakusana ja paina Hae</p>
        </div>
      )}
    </div>
  )
}
