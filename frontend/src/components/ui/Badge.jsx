import React from 'react'
import { cn } from '../../lib/utils.js'

export default function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-foreground/10 text-foreground',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    sold: 'bg-sold/15 text-sold border border-sold/30',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

