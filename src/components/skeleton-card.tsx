'use client'

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 w-20 bg-muted rounded-full" />
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <div className="h-6 w-6 bg-muted rounded-full" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonEvent() {
  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden animate-pulse p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-muted rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-muted rounded-full" />
        <div className="h-8 w-20 bg-muted rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonMessage() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-12 w-12 bg-muted rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
      <div className="h-3 w-10 bg-muted rounded" />
    </div>
  )
}
