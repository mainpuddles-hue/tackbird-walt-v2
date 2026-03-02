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
    <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
      <button
        onClick={() => onFilterChange(null)}
        className={cn(
          'shrink-0 inline-flex items-center gap-1.5 transition-all duration-200',
          !activeFilter
            ? 'bg-primary text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-md'
            : 'bg-card text-foreground border border-border rounded-full px-5 py-2.5 text-sm font-normal hover:bg-primary/10'
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
                'shrink-0 inline-flex items-center gap-1.5 transition-all duration-200',
                activeFilter === type
                  ? 'text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-md'
                  : 'bg-card text-foreground border border-border rounded-full px-5 py-2.5 text-sm font-normal hover:bg-primary/10'
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
