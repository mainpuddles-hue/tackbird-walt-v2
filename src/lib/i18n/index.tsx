'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import fi from './fi.json'
import en from './en.json'
import sv from './sv.json'

export type Locale = 'fi' | 'en' | 'sv'

type TranslationMap = Record<string, string | Record<string, unknown>>

const translations: Record<Locale, TranslationMap> = { fi, en, sv }

const STORAGE_KEY = 'tackbird-locale'

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    return params[key] != null ? String(params[key]) : `{${key}}`
  })
}

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fi')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && translations[stored]) {
      setLocaleState(stored)
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const currentLocale = mounted ? locale : 'fi'
      const value = getNestedValue(translations[currentLocale], key)
      if (value != null) return interpolate(value, params)
      // Fallback to Finnish
      if (currentLocale !== 'fi') {
        const fallback = getNestedValue(translations.fi, key)
        if (fallback != null) return interpolate(fallback, params)
      }
      return key
    },
    [locale, mounted]
  )

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
