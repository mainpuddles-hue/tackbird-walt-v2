'use client'

import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/constants'
import type { PostType } from '@/lib/types'

interface FilterBarProps {
  activeFilter: PostType | null
  onFilterChange: (type: PostType | null) => void
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onFilterChange(null)}
        className={cn(
          'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
          !activeFilter
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        Kaikki
      </button>
      {(Object.entries(CATEGORIES) as [PostType, (typeof CATEGORIES)[PostType]][]).map(
        ([type, cat]) => (
          <button
            key={type}
            onClick={() =>
              onFilterChange(activeFilter === type ? null : type)
            }
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeFilter === type
                ? 'text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            style={
              activeFilter === type
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.label}
          </button>
        )
      )}
    </div>
  )
}
