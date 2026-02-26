'use client'

import { useEffect } from 'react'

export function useEscapeKey(onClose: () => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, isActive])
}
