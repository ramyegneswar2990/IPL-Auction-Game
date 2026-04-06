import { twMerge } from 'tailwind-merge'

export function cn(...classes) {
  return twMerge(classes.filter(Boolean).join(' '))
}

export function formatLakhs(amountLakhs) {
  const n = Number(amountLakhs || 0)
  if (n < 100) return `${n}L`
  const cr = n / 100
  const rounded = cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)
  return `${rounded}Cr`
}

