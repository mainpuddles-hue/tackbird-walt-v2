'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageLightboxProps {
  src: string
  alt?: string
  images?: string[]
  initialIndex?: number
  onClose: () => void
}

export function ImageLightbox({ src, alt, images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false)
  const [index, setIndex] = useState(initialIndex)

  const allImages = images && images.length > 0 ? images : [src]
  const currentSrc = allImages[index]
  const hasMultiple = allImages.length > 1

  const goNext = useCallback(() => {
    setZoomed(false)
    setIndex((i) => (i + 1) % allImages.length)
  }, [allImages.length])

  const goPrev = useCallback(() => {
    setZoomed(false)
    setIndex((i) => (i - 1 + allImages.length) % allImages.length)
  }, [allImages.length])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasMultiple) goNext()
      if (e.key === 'ArrowLeft' && hasMultiple) goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, hasMultiple, goNext, goPrev])

  if (!currentSrc) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Sulje"
        className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
      >
        <X className="size-5 text-white" />
      </button>

      {/* Zoom button */}
      <button
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed) }}
        aria-label={zoomed ? 'Loitonna' : 'Lähennä'}
        className="absolute top-4 right-16 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
      >
        {zoomed ? <ZoomOut className="size-5 text-white" /> : <ZoomIn className="size-5 text-white" />}
      </button>

      {/* Previous arrow */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          aria-label="Edellinen kuva"
          className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
        >
          <ChevronLeft className="size-6 text-white" />
        </button>
      )}

      {/* Next arrow */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          aria-label="Seuraava kuva"
          className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
        >
          <ChevronRight className="size-6 text-white" />
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt ?? ''}
        onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed) }}
        className="transition-all duration-300"
        style={{
          maxWidth: zoomed ? '100%' : '92%',
          maxHeight: zoomed ? '100%' : '85dvh',
          objectFit: 'contain',
          borderRadius: zoomed ? 0 : 8,
          cursor: zoomed ? 'zoom-out' : 'zoom-in',
        }}
      />

      {/* Dots indicator */}
      {hasMultiple && (
        <div className="absolute bottom-6 flex gap-2">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); setZoomed(false) }}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
              aria-label={`Kuva ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
