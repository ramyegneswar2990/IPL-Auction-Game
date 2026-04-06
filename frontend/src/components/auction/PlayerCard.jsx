import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import Badge from '../ui/Badge.jsx'
import { cn, formatLakhs } from '../../lib/utils.js'
import { getPlayerImageUrl, getTeamTheme } from '../../data/teamThemes.js'

function roleVariant(role) {
  if (role === 'Batsman') return 'primary'
  if (role === 'Bowler') return 'sold'
  if (role === 'All-Rounder') return 'accent'
  if (role === 'Wicket-Keeper') return 'default'
  return 'default'
}

export default function PlayerCard({
  player,
  currentBid,
  bidderName,
  sold = false,
  saleOutcome = null,
}) {
  const initials = useMemo(() => {
    if (!player?.name) return '?'
    const parts = player.name.split(' ').filter(Boolean)
    return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')
  }, [player?.name])
  const playerImage = useMemo(() => getPlayerImageUrl(player), [player])
  const bidderTheme = useMemo(() => getTeamTheme(bidderName), [bidderName])

  if (!player) {
    return (
      <div className="card p-6">
        <div className="text-foreground/60">Waiting for player…</div>
      </div>
    )
  }

  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'card relative overflow-hidden p-8 border-primary/20 shadow-glow',
        sold && 'ring-2 ring-sold shadow-glowGreen',
      )}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("${playerImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'saturate(1.1) blur(0.5px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${bidderTheme.secondary}33 0%, rgba(6,10,24,0.92) 62%)`,
        }}
      />

      <div className="text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-muted grid place-items-center border border-primary/60 overflow-hidden relative">
          <div className="display text-5xl text-primary absolute inset-0 grid place-items-center">
            {initials.toUpperCase()}
          </div>
          <img
            src={playerImage}
            alt={player.name}
            className="h-full w-full object-cover relative z-10"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="display text-6xl mt-5 leading-none">{player.name}</div>
        <div className="mt-3 flex justify-center">
          <Badge variant={roleVariant(player.role)} className="text-base px-4 py-1.5">
            {player.role}
          </Badge>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-8 text-foreground/65 text-2xl">
        <div>{player.nationality}</div>
        <div>⭐ {player.rating}</div>
        <div>Base: ₹{formatLakhs(player.basePrice)}</div>
      </div>

      <div className="mt-8 text-center">
        <div className="display text-2xl text-foreground/60">CURRENT BID</div>
        <div className="display text-8xl leading-none text-primary price-glow mt-1">
          ₹{formatLakhs(currentBid)}
        </div>
        <div className="text-4xl mt-1" style={{ color: bidderTheme.primary }}>
          {bidderName ? `by ${bidderName}` : 'No bids yet'}
        </div>
      </div>

      {sold ? (
        <div
          className={cn(
            'absolute inset-0 backdrop-blur-[1px] z-20',
            saleOutcome === 'unsold' ? 'bg-destructive/12' : 'bg-sold/12',
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center -translate-y-8">
            <div
              className={cn(
                'display px-8 py-3 rounded-full border text-7xl leading-none shadow-2xl',
                saleOutcome === 'unsold'
                  ? 'text-destructive border-destructive/60 bg-destructive/20'
                  : 'text-sold border-sold/60 bg-sold/20',
              )}
              style={{
                textShadow:
                  saleOutcome === 'unsold'
                    ? '0 0 18px rgba(239,68,68,0.55)'
                    : '0 0 18px rgba(34,197,94,0.55)',
              }}
            >
              {saleOutcome === 'unsold' ? 'UNSOLD' : 'SOLD!'}
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}

