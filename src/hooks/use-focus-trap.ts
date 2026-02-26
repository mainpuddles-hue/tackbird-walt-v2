'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Traps keyboard focus within a container element.
 * Useful for custom modals/overlays that don't use shadcn Dialog (which has built-in focus trap).
 *
 * - Tab from last focusable element wraps to first
 * - Shift+Tab from first focusable element wraps to last
 * - Restores focus to previously focused element on deactivate
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    // Store the currently focused element to restore later
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    function getFocusableElements(): HTMLElement[] {
      if (!container) return []
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
      )
    }

    // Focus the first focusable element in the container
    const focusables = getFocusableElements()
    if (focusables.length > 0) {
      focusables[0].focus()
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const elements = getFocusableElements()
      if (elements.length === 0) return

      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus to the previously focused element
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus()
      }
      previouslyFocusedRef.current = null
    }
  }, [isActive, containerRef])
}
