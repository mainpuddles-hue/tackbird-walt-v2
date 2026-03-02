'use client'

import Link from 'next/link'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/post-card'
import type { Post } from '@/lib/types'

interface SavedClientProps {
  posts: Post[]
}

export function SavedClient({ posts }: SavedClientProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Tallennetut</h2>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <span className="text-6xl mb-4">🔖</span>
          <h3 className="text-lg font-semibold text-foreground">Ei tallennettuja</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">Tallenna kiinnostavia ilmoituksia sydän-kuvakkeesta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
