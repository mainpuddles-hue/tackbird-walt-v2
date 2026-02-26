interface PushpinProps {
  color?: string
  size?: number
}

export function Pushpin({ color = '#c94040', size = 18 }: PushpinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="9" r="5" fill={color} />
      <circle cx="12" cy="9" r="3" fill="white" fillOpacity="0.3" />
      <line x1="12" y1="14" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
