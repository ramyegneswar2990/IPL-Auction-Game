import React from 'react'
import { Trophy } from 'lucide-react'
import { formatLakhs } from '../../lib/utils.js'

function medal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function Leaderboard({ entries = [], teamsById = {} }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        <div className="display text-2xl">Leaderboard</div>
      </div>

      <div className="mt-4 grid gap-3">
        {entries.map((e, idx) => {
          const rank = idx + 1
          const highlight = rank === 1
          const team = teamsById[e.teamId]
          const squadNames =
            team?.squad?.map((s) => s.player?.name).filter(Boolean).slice(0, 10) || []
          return (
            <div
              key={e.teamId || idx}
              className={
                highlight
                  ? 'rounded-2xl border border-accent/35 bg-accent/10 p-4'
                  : 'rounded-2xl border border-foreground/10 bg-foreground/5 p-4'
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="display text-2xl">{medal(rank)}</div>
                    <div className="display text-3xl">{e.teamName}</div>
                  </div>
                  <div className="mt-1 text-sm text-foreground/70">
                    Players: <span className="font-semibold">{e.playersCount}</span> · Squad rating:{' '}
                    <span className="font-semibold">{e.squadRating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground/60">Score</div>
                  <div className="display text-4xl text-primary price-glow">{e.score}</div>
                  <div className="text-xs text-foreground/60 mt-1">
                    Purse: <span className="text-foreground">{formatLakhs(e.remainingPurse)}</span>
                  </div>
                </div>
              </div>

              {squadNames.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {squadNames.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-foreground/10 bg-card px-3 py-1 text-xs text-foreground/80"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

