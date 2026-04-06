import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setConnected, setConnecting, wsEvent } from '../store/auctionSlice.js'
import { wsService } from '../services/websocket.js'
import { playSound } from '../services/sfx.js'

export function useWebSocket() {
  const dispatch = useDispatch()
  const roomCode = useSelector((s) => s.auction.roomCode)
  const connected = useSelector((s) => s.auction.connected)

  const stable = useRef({ dispatch })
  stable.current.dispatch = dispatch

  const api = useMemo(() => {
    return {
      connect() {
        dispatch(setConnecting(true))
        wsService.connect({
          onDirectMessage: (msg) => {
            stable.current.dispatch(wsEvent(msg))
            if (msg?.type === 'ROOM_CREATED' || msg?.type === 'ROOM_STATE') {
              const code = msg?.payload?.roomCode
              if (code && wsService.isConnected()) {
                wsService.subscribe(code, (m) => stable.current.dispatch(wsEvent(m)))
              }
            }
          },
          onConnect: () => dispatch(setConnected(true)),
          onDisconnect: () => dispatch(setConnected(false)),
        })
      },
      disconnect() {
        wsService.disconnect()
        dispatch(setConnected(false))
      },
      createRoom(teamName) {
        wsService.send('/app/room.create', { teamName })
      },
      joinRoom(roomCode, teamName, teamId) {
        wsService.send('/app/room.join', { roomCode, teamName, teamId })
      },
      addBot(roomCode, teamName) {
        wsService.send('/app/room.addBot', { roomCode, teamName })
      },
      startAuction(roomCode) {
        wsService.send('/app/auction.start', { roomCode })
      },
      forceResults(roomCode) {
        wsService.send('/app/auction.results', { roomCode })
      },
      bid({ roomCode, teamId, amount }) {
        wsService.send('/app/auction.bid', { roomCode, teamId, amount })
        playSound('bid')
      },
      pass({ roomCode, teamId }) {
        wsService.send('/app/auction.pass', { roomCode, teamId })
      },
      leave({ roomCode, teamId }) {
        wsService.send('/app/room.leave', { roomCode, teamId })
      },
      requestState({ roomCode, teamId }) {
        wsService.send('/app/room.state', { roomCode, teamId })
      },
      subscribe(code) {
        wsService.subscribe(code, (m) => dispatch(wsEvent(m)))
      },
    }
  }, [dispatch])

  useEffect(() => {
    api.connect()
    // Keep one persistent WS session across route changes.
    // Disconnect is handled explicitly only when needed.
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (roomCode && connected && wsService.isConnected()) {
      wsService.subscribe(roomCode, (m) => dispatch(wsEvent(m)))
    }
  }, [roomCode, connected, dispatch])

  return api
}

