interface MarqueeProps {
  items: string[]
  reverse?: boolean
  speed?: number
  className?: string
  /** tailwind text color class, e.g. "text-accent" */
  color?: string
  separator?: string
}

export default function Marquee({
  items,
  reverse = false,
  speed = 30,
  className = '',
  color = 'text-muted',
  separator = '✦',
}: MarqueeProps) {
  const line = items.join(`   ${separator}   `)

  return (
    <div className={`marquee-track overflow-hidden border-y border-line bg-surface/40 py-1.5 ${className}`}>
      <div
        className={`marquee-inner ${reverse ? 'reverse' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        <span className={`mx-6 text-xs font-mono uppercase tracking-[0.25em] select-none ${color}`}>
          {line}
          {`   ${separator}   `}
        </span>
        <span className={`mx-6 text-xs font-mono uppercase tracking-[0.25em] select-none ${color}`} aria-hidden>
          {line}
          {`   ${separator}   `}
        </span>
      </div>
    </div>
  )
}
