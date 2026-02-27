'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-24 right-4 z-40 h-11 w-11 rounded-full bg-[var(--color-foreground)] border-none transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      aria-label="Takaisin ylös"
    >
      <ArrowUp className="h-5 w-5 text-[var(--color-card)]" strokeWidth={1.5} />
    </Button>
  )
}
