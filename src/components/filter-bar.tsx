'use client'

import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/constants'
import { HandHelping, Gift, Heart, BookOpen, CalendarDays, LayoutGrid } from 'lucide-react'
import type { PostType } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  HandHelping,
  Gift,
  Heart,
  BookOpen,
  CalendarDays,
}

interface FilterBarProps {
  activeFilter: PostType | null
  onFilterChange: (type: PostType | null) => void
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide">
      <button
        onClick={() => onFilterChange(null)}
        className={cn(
          'shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm',
          !activeFilter
            ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Kaikki
      </button>
      {(Object.entries(CATEGORIES) as [PostType, (typeof CATEGORIES)[PostType]][]).map(
        ([type, cat]) => {
          const Icon = ICON_MAP[cat.icon]
          return (
            <button
              key={type}
              onClick={() =>
                onFilterChange(activeFilter === type ? null : type)
              }
              className={cn(
                'shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm',
                activeFilter === type
                  ? 'text-white shadow-md scale-[1.02]'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              style={
                activeFilter === type
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {Icon && <Icon className="h-4 w-4" />}
              {cat.label}
            </button>
          )
        }
      )}
    </div>
  )
}
