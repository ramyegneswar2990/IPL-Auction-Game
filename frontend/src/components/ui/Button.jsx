import React from 'react'
import { cn } from '../../lib/utils.js'

export default function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    default:
      'bg-primary text-background hover:brightness-110 shadow-glow',
    outline:
      'bg-transparent border border-foreground/15 text-foreground hover:bg-foreground/5',
    ghost: 'bg-transparent text-foreground hover:bg-foreground/5',
    destructive:
      'bg-destructive text-white hover:brightness-110',
    card:
      'bg-card text-foreground border border-foreground/10 hover:border-foreground/20',
  }

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
    xl: 'h-14 px-6 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}

