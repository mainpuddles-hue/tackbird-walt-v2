'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimerBadgeProps {
  expiresAt: string
}

export function TimerBadge({ expiresAt }: TimerBadgeProps) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setLabel('Vanhentunut')
        return
      }
      const hrs = Math.floor(diff / 36e5)
      const mins = Math.floor((diff % 36e5) / 60000)
      setLabel(
        String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ' jäljellä'
      )
    }
    update()
    const i = setInterval(update, 60000)
    return () => clearInterval(i)
  }, [expiresAt])

  if (!expiresAt) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
      <Clock className="size-3" strokeWidth={2.2} />
      {label}
    </span>
  )
}
