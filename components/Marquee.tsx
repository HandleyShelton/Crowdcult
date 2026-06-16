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
  // One self-contained group: each item is followed by a separator, so two
  // groups placed back-to-back tile seamlessly (…itemN ✦ item1 ✦…). Spacing
  // comes from padding, not text whitespace (which HTML would collapse).
  const Group = (
    <div className="flex items-center flex-shrink-0">
      {items.map((text, i) => (
        <span key={i} className="flex items-center">
          <span className={`px-6 text-xs font-mono uppercase tracking-[0.25em] whitespace-nowrap ${color}`}>
            {text}
          </span>
          <span className={`text-xs ${color} opacity-40`}>{separator}</span>
        </span>
      ))}
    </div>
  )

  return (
    <div
      className={`overflow-hidden border-y border-line bg-surface/40 py-1.5 ${className}`}
      aria-hidden
    >
      <div
        className={`marquee-inner ${reverse ? 'reverse' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {Group}
        {Group}
      </div>
    </div>
  )
}
