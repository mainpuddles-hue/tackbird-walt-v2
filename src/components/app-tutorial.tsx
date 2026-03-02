'use client'

import { useState, useCallback } from 'react'
import { TackBirdLogo } from '@/components/tackbird-logo'
import { useI18n } from '@/lib/i18n'

interface AppTutorialProps {
  onComplete: () => void
}

interface Slide {
  id: string
  emoji?: string
  useLogo?: boolean
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  chips?: string[]
}

const slides: Slide[] = [
  {
    id: 'welcome',
    useLogo: true,
    titleKey: 'tutorial.welcomeTitle',
    titleFallback: 'Tervetuloa TackBirdiin!',
    descKey: 'tutorial.welcomeSubtitle',
    descFallback: 'Naapuruston jakamisalusta',
  },
  {
    id: 'share',
    emoji: '\u{1F91D}',
    titleKey: 'tutorial.shareTitle',
    titleFallback: 'Jaa, lainaa ja auta',
    descKey: 'tutorial.shareSubtitle',
    descFallback: 'Tarjoa tavaroita, palveluja ja apua naapureillesi',
    chips: ['\u{1F381} Ilmaista', '\u{1F527} Palveluja', '\u{1F4E6} Lainaa', '\u26A1 Nappaa'],
  },
  {
    id: 'events',
    emoji: '\u{1F389}',
    titleKey: 'tutorial.eventsTitle',
    titleFallback: 'Tapahtumat',
    descKey: 'tutorial.eventsSubtitle',
    descFallback: 'L\u00F6yd\u00E4 ja luo naapuruston tapahtumia',
  },
  {
    id: 'chat',
    emoji: '\u{1F4AC}',
    titleKey: 'tutorial.chatTitle',
    titleFallback: 'Viestit',
    descKey: 'tutorial.chatSubtitle',
    descFallback: 'Keskustele turvallisesti muiden k\u00E4ytt\u00E4jien kanssa',
  },
  {
    id: 'surprise',
    emoji: '\u{1F3B2}',
    titleKey: 'tutorial.surpriseTitle',
    titleFallback: 'Yll\u00E4tysp\u00E4iv\u00E4',
    descKey: 'tutorial.surpriseSubtitle',
    descFallback: 'Anna meid\u00E4n suunnitella t\u00E4ydellinen viikonloppusi Helsingiss\u00E4',
    chips: ['\u{1F950}', '\u{1F3AF}', '\u{1F37D}\uFE0F', '\u{1F3A8}', '\u{1F3AC}'],
  },
  {
    id: 'ready',
    emoji: '\u{1F680}',
    titleKey: 'tutorial.readyTitle',
    titleFallback: 'Olet valmis!',
    descKey: 'tutorial.readySubtitle',
    descFallback: 'Aloita tutkimalla naapurustoasi',
  },
]

const STORAGE_KEY = 'tackbird_tutorial_done'

export function AppTutorial({ onComplete }: AppTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideKey, setSlideKey] = useState(0)
  const { t } = useI18n()

  const isLastSlide = currentSlide === slides.length - 1

  const handleComplete = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // sessionStorage might not be available
    }
    onComplete()
  }, [onComplete])

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      handleComplete()
    } else {
      setCurrentSlide((prev) => prev + 1)
      setSlideKey((prev) => prev + 1)
    }
  }, [isLastSlide, handleComplete])

  const handleSkip = useCallback(() => {
    handleComplete()
  }, [handleComplete])

  const tWithFallback = (key: string, fallback: string): string => {
    const result = t(key)
    return result === key ? fallback : result
  }

  const slide = slides[currentSlide]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Skip button */}
      {!isLastSlide && (
        <div className="flex justify-end p-4">
          <button
            onClick={handleSkip}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tWithFallback('tutorial.skip', 'Ohita')}
          </button>
        </div>
      )}

      {/* Spacer when skip button is hidden */}
      {isLastSlide && <div className="h-14" />}

      {/* Slide content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8" key={slideKey}>
        <div className="animate-tutorial-slide flex w-full max-w-sm flex-col items-center text-center">
          {/* Icon / Logo */}
          <div className="animate-tutorial-icon mb-8">
            {slide.useLogo ? (
              <TackBirdLogo size={80} className="text-primary" />
            ) : (
              <span className="text-7xl leading-none">{slide.emoji}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-3 text-2xl font-bold text-foreground">
            {tWithFallback(slide.titleKey, slide.titleFallback)}
          </h1>

          {/* Description */}
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            {tWithFallback(slide.descKey, slide.descFallback)}
          </p>

          {/* Chips */}
          {slide.chips && slide.chips.length > 0 && (
            <div className="animate-tutorial-chips flex flex-wrap justify-center gap-2">
              {slide.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: dots + button */}
      <div className="flex flex-col items-center gap-6 px-8 pb-12">
        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <span
              key={index}
              className={
                index === currentSlide
                  ? 'h-2 w-6 rounded-full bg-primary transition-all duration-300'
                  : 'h-2 w-2 rounded-full bg-muted-foreground/30 transition-all duration-300'
              }
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <button
          onClick={handleNext}
          className="w-full max-w-sm rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        >
          {isLastSlide
            ? tWithFallback('tutorial.getStarted', 'Aloita')
            : tWithFallback('tutorial.next', 'Seuraava')}
        </button>
      </div>
    </div>
  )
}
