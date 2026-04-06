import React from 'react'
import { cn } from '../../lib/utils.js'

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl bg-card border border-foreground/10 px-4 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-primary/50',
        className,
      )}
      {...props}
    />
  )
}

