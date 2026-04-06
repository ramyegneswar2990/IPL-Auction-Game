import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  connected: false,
  connecting: false,

  roomCode: null,
  hostTeamId: null,
  status: 'lobby', // lobby | active | sold | ended

  teams: [],
  currentTeamId: null,

  currentPlayer: null,
  currentBid: 0,
  currentBidderId: null,
  currentBidderName: null,
  timer: 10,

  bidHistory: [],

  soldPlayers: [],
  leaderboard: [],

  lastEvent: null,
  saleOutcome: null, // sold | unsold | null
  error: null,
}

function upsertTeam(teams, incoming) {
  const idx = teams.findIndex((t) => t.id === incoming.id)
  if (idx >= 0) teams[idx] = { ...teams[idx], ...incoming }
  else teams.push(incoming)
  return teams
}

function applyRoomState(state, payload) {
  state.roomCode = payload.roomCode ?? state.roomCode
  state.hostTeamId = payload.hostTeamId ?? state.hostTeamId
  state.status = (payload.status || 'LOBBY').toLowerCase()
  state.teams =
    (payload.teams || []).map((t) => ({
      id: t.id,
      name: t.name,
      purse: t.purse,
      isHost: !!t.host,
      passed: !!t.passed,
      squad: state.teams.find((x) => x.id === t.id)?.squad || [],
    })) ?? []

  state.currentPlayer = payload.currentPlayer || null
  state.currentBid = payload.currentBid ?? 0
  state.currentBidderId = payload.currentBidderId ?? null
  state.currentBidderName = payload.currentBidderName ?? null
  state.timer = payload.timerSeconds ?? state.timer
}

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    setConnecting(state, action) {
      state.connecting = !!action.payload
    },
    setConnected(state, action) {
      state.connected = !!action.payload
      state.connecting = false
    },
    setCurrentTeamId(state, action) {
      state.currentTeamId = action.payload || null
    },
    resetAuction() {
      return { ...initialState }
    },
    wsEvent(state, action) {
      const msg = action.payload || {}
      state.lastEvent = msg.type || null
      state.error = null

      switch (msg.type) {
        case 'ROOM_CREATED':
          applyRoomState(state, msg.payload || {})
          // For creator, backend sends ROOM_CREATED directly with hostTeamId.
          // Auto-select host team so start auction works immediately.
          if (!state.currentTeamId && (msg.payload?.hostTeamId || state.hostTeamId)) {
            state.currentTeamId = msg.payload?.hostTeamId || state.hostTeamId
          }
          break
        case 'USER_JOINED':
        case 'ROOM_STATE': {
          applyRoomState(state, msg.payload || {})
          break
        }
        case 'AUCTION_STARTED':
        case 'NEW_PLAYER':
        case 'NEXT_PLAYER': {
          applyRoomState(state, msg.payload || {})
          state.status = 'active'
          state.saleOutcome = null
          break
        }
        case 'BID_PLACED': {
          const p = msg.payload || {}
          // backend uses currentBid + timerSeconds in BidUpdateResponse
          const amount = p.currentBid ?? p.newBid
          state.currentBid = amount ?? state.currentBid
          state.currentBidderId = p.teamId ?? state.currentBidderId
          state.currentBidderName = p.teamName ?? state.currentBidderName
          state.timer = p.timerSeconds ?? p.timer ?? 10
          state.bidHistory.unshift({
            teamId: p.teamId,
            teamName: p.teamName,
            amount: amount,
            at: Date.now(),
          })
          break
        }
        case 'TIMER_UPDATE': {
          const p = msg.payload || {}
          state.timer = p.timerSeconds ?? p.timer ?? state.timer
          break
        }
        case 'PLAYER_SOLD': {
          state.status = 'sold'
          state.saleOutcome = 'sold'
          const p = msg.payload || {}
          if (p.player) {
            state.soldPlayers.unshift({
              player: p.player,
              teamId: p.teamId,
              teamName: p.teamName,
              soldPrice: p.soldPrice ?? p.price,
            })
            const winner = state.teams.find((t) => t.id === p.teamId)
            if (winner) {
              winner.squad = winner.squad || []
              winner.squad.unshift({ player: p.player, soldPrice: p.soldPrice ?? p.price })
            }
          }
          break
        }
        case 'PLAYER_UNSOLD': {
          state.status = 'sold'
          state.saleOutcome = 'unsold'
          break
        }
        case 'AUCTION_ENDED': {
          state.status = 'ended'
          state.leaderboard = msg.payload?.entries || msg.payload?.leaderboard || []
          break
        }
        case 'ROOM_CLOSED': {
          return { ...initialState }
        }
        case 'ERROR': {
          state.error = msg.payload?.message || 'Error'
          break
        }
        default:
          break
      }
    },
  },
})

export const { setConnecting, setConnected, setCurrentTeamId, resetAuction, wsEvent } =
  auctionSlice.actions

export default auctionSlice.reducer

