import { cn } from '@/lib/utils'

interface TackBirdLogoProps {
  size?: number
  color?: string
  className?: string
}

export function TackBirdLogo({
  size = 32,
  color = 'currentColor',
  className,
}: TackBirdLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {/* Body — sleek swallow shape */}
      <path
        d="M10 38 C10 38 18 28 34 26 C48 24 54 28 56 30 L52 34 C52 34 44 28 34 30 C24 32 16 38 16 38 Z"
        fill={color}
      />
      {/* Wing — swept back */}
      <path
        d="M26 32 C26 32 20 20 6 14 C14 20 22 30 22 30 Z"
        fill={color}
        opacity="0.65"
      />
      {/* Tail feathers — forked */}
      <path
        d="M10 38 C10 38 2 36 0 28 C4 33 8 35 8 35 Z"
        fill={color}
        opacity="0.5"
      />
      <path
        d="M12 40 C12 40 4 42 0 48 C6 44 10 40 10 40 Z"
        fill={color}
        opacity="0.4"
      />
      {/* Head */}
      <circle cx="52" cy="28" r="6.5" fill={color} />
      {/* Eye */}
      <circle cx="54" cy="27" r="1.8" fill="white" />
      <circle cx="54.3" cy="26.8" r="0.7" fill={color} />
      {/* Beak */}
      <path
        d="M57 28 L64 25.5 L58 31 Z"
        fill={color}
        opacity="0.85"
      />
    </svg>
  )
}
