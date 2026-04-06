import React, { useEffect, useMemo } from 'react'
import { cn } from '../../lib/utils.js'
import { playSound } from '../../services/sfx.js'

export default function Timer({ value = 10, max = 10 }) {
  const danger = value <= 3

  useEffect(() => {
    if (danger && value > 0) playSound('tick')
  }, [danger, value])

  const { r, c, dash, offset } = useMemo(() => {
    const radius = 42
    const circ = 2 * Math.PI * radius
    const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
    return { r: radius, c: circ, dash: circ, offset: circ * (1 - pct) }
  }, [value, max])

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', danger && 'animate-shake')}>
      <svg width="140" height="140" viewBox="0 0 100 100" className="drop-shadow">
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke={danger ? 'hsl(var(--ring-danger))' : 'hsl(var(--ring-safe))'}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className={cn('transition-all duration-300', danger ? 'animate-pulseSoft' : 'animate-glow')}
        />
        <text
          x="50"
          y="56"
          textAnchor="middle"
          className="fill-foreground display"
          style={{ fontSize: 32 }}
        >
          {value}
        </text>
      </svg>
      <div className="display text-lg tracking-[0.2em] text-foreground/60">SECONDS</div>
    </div>
  )
}

