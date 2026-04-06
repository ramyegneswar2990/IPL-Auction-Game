import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gavel, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { setCurrentTeamId } from '../store/auctionSlice.js'
import { IPL_TEAMS } from '../data/teams.js'

export default function Home() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ws = useWebSocket()
  const { connected, connecting, error, roomCode } = useSelector((s) => s.auction)

  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [waitingForRoom, setWaitingForRoom] = useState(false)
  const [step, setStep] = useState('menu') // menu | create | join

  const canCreate = createName.trim().length >= 2
  const canJoin = joinCode.trim().length >= 4 && joinName.trim().length >= 2

  useEffect(() => {
    if (waitingForRoom && roomCode) {
      setWaitingForRoom(false)
      navigate('/auction')
    }
  }, [waitingForRoom, roomCode, navigate])

  useEffect(() => {
    if (waitingForRoom && error) {
      setWaitingForRoom(false)
    }
  }, [waitingForRoom, error])

  const statusChip = useMemo(() => {
    if (connected) return <Badge variant="sold">CONNECTED</Badge>
    if (connecting) return <Badge variant="accent">CONNECTING</Badge>
    return <Badge variant="destructive">OFFLINE</Badge>
  }, [connected, connecting])

  return (
    <div className="min-h-screen bg-background relative stage-hero-bg overflow-hidden">
      <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
        <Badge
          variant="primary"
          className="mx-auto text-base px-7 py-2 rounded-full border border-primary/40 bg-background/70"
        >
          ⚡ Live Auction Simulator
        </Badge>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-6"
        >
          <h1 className="display text-[72px] leading-none text-foreground price-glow">IPL AUCTION</h1>
          <p className="mt-6 text-3xl text-foreground/70 max-w-3xl mx-auto">
            Create a room, invite your friends, and bid on cricket&apos;s biggest stars.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {statusChip}
            {error ? <span className="text-sm text-destructive self-center">{error}</span> : null}
          </div>
        </motion.div>

        {step === 'menu' ? (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <button
              className="card p-8 hover:border-primary/40 transition text-left"
              onClick={() => setStep('create')}
            >
              <Gavel className="h-10 w-10 text-primary mb-7" />
              <div className="display text-5xl">CREATE ROOM</div>
              <div className="mt-2 text-foreground/60 text-2xl">Host an auction as admin</div>
            </button>
            <button
              className="card p-8 hover:border-accent/40 transition text-left"
              onClick={() => setStep('join')}
            >
              <Users className="h-10 w-10 text-accent mb-7" />
              <div className="display text-5xl">JOIN ROOM</div>
              <div className="mt-2 text-foreground/60 text-2xl">Enter as a team owner</div>
            </button>
          </div>
        ) : null}

        {step === 'create' ? (
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="display text-5xl">CREATE YOUR ROOM</div>
            <div className="mt-7">
              <select
                className="h-16 w-full rounded-2xl border border-primary/80 bg-card px-4 text-3xl text-center text-foreground outline-none"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              >
                <option value="">Select Team</option>
                {IPL_TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Button
                size="xl"
                variant="card"
                className="display text-4xl h-14"
                onClick={() => setStep('menu')}
              >
                Back
              </Button>
              <Button
                size="xl"
                className="display text-4xl h-14"
                disabled={!connected || !canCreate || waitingForRoom}
                onClick={() => {
                  ws.createRoom(createName.trim())
                  dispatch(setCurrentTeamId(null))
                  setWaitingForRoom(true)
                }}
              >
                {waitingForRoom ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'join' ? (
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="display text-5xl">JOIN ROOM</div>
            <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                className="h-16 text-3xl rounded-2xl border-primary/60 text-center"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
              />
              <select
                className="h-16 w-full rounded-2xl border border-primary/60 bg-card px-4 text-3xl text-center text-foreground outline-none"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
              >
                <option value="">Select Team</option>
                {IPL_TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Button
                size="xl"
                variant="card"
                className="display text-4xl h-14"
                onClick={() => setStep('menu')}
              >
                Back
              </Button>
              <Button
                size="xl"
                className="display text-4xl h-14"
                disabled={!connected || !canJoin || waitingForRoom}
                onClick={() => {
                  localStorage.setItem('auctionPreferredTeamName', joinName.trim())
                  ws.joinRoom(joinCode.trim(), joinName.trim())
                  dispatch(setCurrentTeamId(null))
                  setWaitingForRoom(true)
                }}
              >
                {waitingForRoom ? 'Joining…' : 'Join'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

