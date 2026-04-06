import React from 'react'
import { formatLakhs } from '../../lib/utils.js'

export default function BidHistory({ bids = [] }) {
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="display text-xl mb-3">Bid History</div>
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {bids.length === 0 ? (
          <div className="text-foreground/60 text-sm">No bids yet.</div>
        ) : (
          bids.map((b, idx) => (
            <div
              key={`${b.teamId}-${b.at}-${idx}`}
              className={
                idx === 0
                  ? 'rounded-xl border border-primary/30 bg-primary/10 px-3 py-2'
                  : 'rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2'
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{b.teamName || b.teamId}</div>
                <div className={idx === 0 ? 'display text-xl text-primary' : 'display text-lg'}>
                  {formatLakhs(b.amount)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

