import React, { useMemo } from 'react'
import { Home } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Link, Navigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Leaderboard from '../components/auction/Leaderboard.jsx'
import SquadPanel from '../components/auction/SquadPanel.jsx'

export default function Results() {
  const { leaderboard, teams, roomCode } = useSelector((s) => s.auction)

  const teamsById = useMemo(() => {
    const m = {}
    for (const t of teams) m[t.id] = t
    return m
  }, [teams])

  if (!roomCode) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen subtle-grid">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="results-banner-bg rounded-3xl border border-foreground/10 p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="display text-6xl text-accent price-glow">RESULTS</div>
              <div className="mt-2 text-foreground/70">
                Room <span className="text-foreground">{roomCode}</span>
              </div>
            </div>
            <Link to="/">
              <Button size="xl" variant="outline" className="display">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <Leaderboard entries={leaderboard} teamsById={teamsById} />
          <div className="h-[760px]">
            <SquadPanel teams={teams} />
          </div>
        </div>
      </div>
    </div>
  )
}

