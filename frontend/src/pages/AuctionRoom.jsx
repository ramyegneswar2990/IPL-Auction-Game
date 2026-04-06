import React, { useEffect, useMemo } from 'react'
import { Bot, DoorOpen, Play, Trophy } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import PlayerCard from '../components/auction/PlayerCard.jsx'
import Timer from '../components/auction/Timer.jsx'
import BidPanel from '../components/auction/BidPanel.jsx'
import BidHistory from '../components/auction/BidHistory.jsx'
import RoomUsers from '../components/auction/RoomUsers.jsx'
import SquadPanel from '../components/auction/SquadPanel.jsx'
import { setCurrentTeamId } from '../store/auctionSlice.js'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { playSound } from '../services/sfx.js'
import { IPL_TEAMS } from '../data/teams.js'
import { getPlayerImageUrl } from '../data/teamThemes.js'

function randomBotName(existingTeams) {
  const existing = new Set((existingTeams || []).map((t) => (t.name || '').toUpperCase()))
  const remaining = IPL_TEAMS.filter((t) => !existing.has(t))
  if (remaining.length === 0) return null
  return remaining[Math.floor(Math.random() * remaining.length)]
}

export default function AuctionRoom() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ws = useWebSocket()

  const {
    connected,
    roomCode,
    status,
    teams,
    currentTeamId,
    currentPlayer,
    currentBid,
    currentBidderId,
    currentBidderName,
    timer,
    bidHistory,
    leaderboard,
    saleOutcome,
  } = useSelector((s) => s.auction)

  useEffect(() => {
    if (!roomCode) return
    // pick current team by matching last joined name is not available;
    // the backend returns teamId only in join response via /user queue payload.
    // For now, let user pick if missing.
  }, [roomCode])

  useEffect(() => {
    if (currentTeamId || teams.length === 0) return
    const preferred = (localStorage.getItem('auctionPreferredTeamName') || '').trim().toUpperCase()
    if (!preferred) return
    const matched = teams.find((t) => (t.name || '').trim().toUpperCase() === preferred)
    if (matched) {
      dispatch(setCurrentTeamId(matched.id))
      localStorage.setItem('auctionTeamId', matched.id)
      localStorage.removeItem('auctionPreferredTeamName')
    }
  }, [currentTeamId, teams, dispatch])

  useEffect(() => {
    if (status === 'ended') {
      playSound('sold')
    }
  }, [status])

  const me = useMemo(() => teams.find((t) => t.id === currentTeamId) || null, [teams, currentTeamId])
  const host = useMemo(() => teams.find((t) => t.isHost) || null, [teams])
  const isHost = !!(me && me.isHost)
  const isHighest = !!(currentTeamId && currentBidderId && currentTeamId === currentBidderId)
  const canStart = isHost && teams.length >= 2 && status === 'lobby'
  const remainingTeamsCount = useMemo(() => {
    const used = new Set((teams || []).map((t) => (t.name || '').toUpperCase()))
    return IPL_TEAMS.filter((t) => !used.has(t)).length
  }, [teams])
  const canAddBot = isHost && status === 'lobby' && connected && remainingTeamsCount > 0

  const showPickTeam = roomCode && !currentTeamId && teams.length > 0

  useEffect(() => {
    if (!roomCode) navigate('/')
  }, [roomCode, navigate])

  useEffect(() => {
    if (status === 'ended' && leaderboard?.length) navigate('/results')
  }, [status, leaderboard, navigate])

  if (!roomCode) return null

  const auctionBgImage =
    status === 'active' || status === 'sold' ? getPlayerImageUrl(currentPlayer) : null

  return (
    <div
      className="min-h-screen bg-background"
      style={
        auctionBgImage
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(4,8,20,0.72) 0%, rgba(5,8,20,0.9) 58%), url("${auctionBgImage}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      <div className="max-w-[1280px] mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="display text-6xl">IPL AUCTION</div>
            <div className="text-foreground/50 text-2xl">
              {status === 'lobby' ? 'Waiting to start...' : `Status: ${status}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              className="display h-12 px-5 text-2xl rounded-2xl"
              onClick={() => {
                if (currentTeamId) ws.leave({ roomCode, teamId: currentTeamId })
                navigate('/')
              }}
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Leave
            </Button>
            {isHost ? (
              <Button
                variant="outline"
                className="display h-12 px-5 text-2xl rounded-2xl border-accent/60 text-accent"
                onClick={() => ws.forceResults(roomCode)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                RESULTS
              </Button>
            ) : null}
          </div>
        </div>

        {status === 'sold' ? (
          <div
            className={
              saleOutcome === 'unsold'
                ? 'mt-4 rounded-2xl border border-destructive/40 bg-destructive/15 p-3 text-center'
                : 'mt-4 rounded-2xl border border-sold/40 bg-sold/15 p-3 text-center'
            }
          >
            <div className={saleOutcome === 'unsold' ? 'display text-4xl text-destructive' : 'display text-4xl text-sold'}>
              {saleOutcome === 'unsold' ? 'UNSOLD' : 'SOLD'}
            </div>
          </div>
        ) : null}

        {showPickTeam ? (
          <div className="card p-5 mt-6">
            <div className="display text-2xl">Select your team</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {teams.map((t) => (
                <Button
                  key={t.id}
                  variant="card"
                  size="lg"
                  className="justify-between"
                  onClick={() => dispatch(setCurrentTeamId(t.id))}
                >
                  <span className="font-semibold">{t.name}</span>
                  {t.isHost ? <Badge variant="primary">HOST</Badge> : <Badge>PLAYER</Badge>}
                </Button>
              ))}
            </div>
            <div className="mt-3 text-sm text-foreground/60">
              Tip: after you join, store your `teamId` locally and reconnect using it.
            </div>
          </div>
        ) : null}

        {status === 'lobby' ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-6">
            <div className="card p-6">
              <div className="display text-4xl text-primary">ROOM: {roomCode}</div>

              <div className="mt-6 space-y-2">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2"
                  >
                    <div className="font-semibold">{t.name}</div>
                    <div className="flex items-center gap-2">
                      {t.isHost ? <Badge variant="primary">HOST</Badge> : <Badge>PLAYER</Badge>}
                      {currentTeamId === t.id ? <Badge variant="accent">YOU</Badge> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card p-7 text-center">
                <div className="display text-6xl">ROOM READY</div>
                <div className="mt-3 text-2xl text-foreground/65">Share this code with friends:</div>
                <div className="display text-7xl tracking-[0.22em] text-primary mt-2">{roomCode}</div>
                <div className="mt-4 text-foreground/60 text-xl">
                  {teams.length} team(s) joined • Need at least 2 to start
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="xl"
                  variant="card"
                  className="display text-3xl h-14"
                  disabled={!canAddBot}
                  onClick={() => {
                    const botName = randomBotName(teams)
                    if (botName) ws.addBot(roomCode, botName)
                  }}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Add Bot
                </Button>
                <Button
                  size="xl"
                  className="display text-3xl h-14 !text-white"
                  disabled={!canStart}
                  onClick={() => ws.startAuction(roomCode)}
                >
                  <Play className="h-5 w-5 mr-2" />
                  START AUCTION
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {status === 'active' || status === 'sold' ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            <div className="space-y-6">
              <PlayerCard
                player={currentPlayer}
                currentBid={currentBid}
                bidderName={currentBidderName}
                sold={status === 'sold'}
                saleOutcome={saleOutcome}
              />

              <BidPanel
                purse={me?.purse ?? 0}
                currentBid={currentBid}
                isHighestBidder={isHighest}
                disabled={!currentTeamId || status !== 'active'}
                onBid={(inc) => ws.bid({ roomCode, teamId: currentTeamId, amount: inc })}
                onPass={() => ws.pass({ roomCode, teamId: currentTeamId })}
              />

              <div className="h-[320px]">
                <BidHistory bids={bidHistory} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-4 flex justify-center">
                <Timer value={timer} max={10} />
              </div>
              <RoomUsers roomCode={roomCode} teams={teams} />
              <div className="h-[520px]">
                <SquadPanel teams={teams} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

