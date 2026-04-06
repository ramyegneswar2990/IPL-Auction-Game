import React, { useMemo } from 'react'
import Button from '../ui/Button.jsx'
import { formatLakhs } from '../../lib/utils.js'

const increments = [
  { label: '+10L', value: 10 },
  { label: '+20L', value: 20 },
  { label: '+50L', value: 50 },
  { label: '+1Cr', value: 100 },
  { label: '+2Cr', value: 200 },
]

export default function BidPanel({
  purse = 0,
  currentBid = 0,
  isHighestBidder = false,
  onBid,
  onPass,
  disabled = false,
}) {
  const afford = useMemo(() => {
    const max = Number(purse || 0)
    const cur = Number(currentBid || 0)
    return new Set(increments.filter((i) => cur + i.value <= max).map((i) => i.value))
  }, [purse, currentBid])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="display text-4xl">PLACE BID</div>
        <div className="text-right">
          <div className="text-xl text-foreground/60">Purse</div>
          <div className="display text-4xl text-accent">₹{formatLakhs(purse)}</div>
        </div>
      </div>

      {isHighestBidder ? (
        <div className="mt-3 rounded-xl border border-sold/30 bg-sold/10 px-3 py-2 text-sm text-sold">
          You are the highest bidder!
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {increments.map((inc) => (
          <Button
            key={inc.value}
            size="lg"
            className="display text-3xl h-12"
            disabled={disabled || isHighestBidder || !afford.has(inc.value)}
            onClick={() => onBid?.(inc.value)}
          >
            {inc.label}
          </Button>
        ))}
        <Button
          size="lg"
          variant="destructive"
          className="display text-3xl h-12 col-span-1"
          disabled={disabled}
          onClick={() => onPass?.()}
        >
          PASS
        </Button>
      </div>
    </div>
  )
}

