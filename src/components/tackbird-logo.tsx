import { cn } from '@/lib/utils'

interface TackBirdLogoProps {
  size?: number
  color?: string
  className?: string
  withText?: boolean
}

export function TackBirdLogo({
  size = 32,
  color = 'currentColor',
  className,
  withText = false,
}: TackBirdLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 shrink-0', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Minimal bird in flight — two clean arcs */}
        <path
          d="M4 28C4 28 10 16 20 14C30 12 36 18 36 18"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 22C8 22 14 12 22 12C30 12 34 16 34 16"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        {/* Pin dot — the "Tack" */}
        <circle cx="20" cy="14" r="2.5" fill={color} />
      </svg>
      {withText && (
        <span
          className="font-normal tracking-wide"
          style={{ fontSize: size * 0.75, color }}
        >
          TackBird
        </span>
      )}
    </span>
  )
}
