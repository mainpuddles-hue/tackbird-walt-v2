'use client'

import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/constants'
import { HandHelping, Gift, Heart, Zap, BookOpen, CalendarDays, AlertTriangle, LayoutGrid } from 'lucide-react'
import type { PostType } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  HandHelping,
  Gift,
  Heart,
  Zap,
  BookOpen,
  CalendarDays,
  AlertTriangle,
}

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
          'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center',
          !activeFilter
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
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
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center',
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
              {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
              {cat.label}
            </button>
          )
        }
      )}
    </div>
  )
}
