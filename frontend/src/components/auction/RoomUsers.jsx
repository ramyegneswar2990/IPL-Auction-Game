import React from 'react'
import { Users } from 'lucide-react'
import Badge from '../ui/Badge.jsx'

export default function RoomUsers({ roomCode, teams = [] }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-foreground/70" />
          <div className="display text-xl">Room</div>
        </div>
        <div className="display text-2xl text-primary">{roomCode || '—'}</div>
      </div>

      <div className="mt-4 space-y-2">
        {teams.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2"
          >
            <div className="font-semibold">{t.name}</div>
            <div className="flex items-center gap-2">
              {t.isHost ? <Badge variant="primary">HOST</Badge> : <Badge>PLAYER</Badge>}
              {t.passed ? <Badge variant="destructive">PASSED</Badge> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

