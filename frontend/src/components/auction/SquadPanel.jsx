import React from 'react'
import { formatLakhs } from '../../lib/utils.js'

export default function SquadPanel({ teams = [] }) {
  return (
    <div className="card p-4 h-full overflow-hidden flex flex-col">
      <div className="display text-xl mb-3">Squads</div>
      <div className="flex-1 overflow-auto space-y-3 pr-1">
        {teams.map((t) => (
          <div key={t.id} className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{t.name}</div>
              <div className="display text-lg text-accent">{formatLakhs(t.purse)}</div>
            </div>
            <div className="mt-2 space-y-1">
              {(t.squad || []).length === 0 ? (
                <div className="text-sm italic text-foreground/55">No players yet</div>
              ) : (
                (t.squad || []).map((s, idx) => (
                  <div
                    key={`${s.player?.id || idx}-${idx}`}
                    className="flex items-center justify-between text-sm rounded-xl border border-foreground/10 bg-card/60 px-2.5 py-1.5"
                  >
                    <div className="truncate pr-2">{s.player?.name}</div>
                    <div className="display text-base text-primary">
                      {formatLakhs(s.soldPrice)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

