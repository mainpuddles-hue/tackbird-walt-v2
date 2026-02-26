'use client'

import { useState } from 'react'
import { PostCard } from '@/components/post-card'
import { FilterBar } from '@/components/filter-bar'
import type { Post, PostType } from '@/lib/types'

interface FeedClientProps {
  initialPosts: Post[]
}

export function FeedClient({ initialPosts }: FeedClientProps) {
  const [activeFilter, setActiveFilter] = useState<PostType | null>(null)

  const filteredPosts = activeFilter
    ? initialPosts.filter((p) => p.type === activeFilter)
    : initialPosts

  return (
    <div className="space-y-3 p-4">
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">Ei ilmoituksia</p>
          <p className="text-sm mt-1">Kokeile eri suodatinta tai luo uusi ilmoitus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
