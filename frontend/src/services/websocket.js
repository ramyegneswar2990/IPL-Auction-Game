import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8086'

class WebSocketService {
  client = null
  subscription = null
  directSub = null
  isActivating = false

  connect({ onRoomMessage, onDirectMessage, onConnect, onDisconnect }) {
    if (this.client && (this.client.active || this.client.connected || this.isActivating)) {
      return
    }

    this.isActivating = true
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.isActivating = false
        this.directSub = this.client.subscribe('/user/queue/events', (message) => {
          try {
            onDirectMessage?.(JSON.parse(message.body))
          } catch {
            // ignore
          }
        })
        onConnect?.()
      },
      onDisconnect: () => {
        this.isActivating = false
        onDisconnect?.()
      },
      onStompError: () => {
        this.isActivating = false
        // will reconnect automatically
      },
    })

    this.client.activate()
  }

  subscribe(roomCode, onMessage) {
    if (!this.client || !this.client.connected) return false
    this.subscription?.unsubscribe()
    this.subscription = this.client.subscribe(`/topic/room.${roomCode}`, (message) => {
      onMessage?.(JSON.parse(message.body))
    })
    return true
  }

  isConnected() {
    return !!(this.client && this.client.connected)
  }

  send(destination, body) {
    if (!this.client || !this.client.connected) return
    this.client.publish({ destination, body: JSON.stringify(body) })
  }

  disconnect() {
    this.isActivating = false
    this.subscription?.unsubscribe?.()
    this.directSub?.unsubscribe?.()
    this.subscription = null
    this.directSub = null
    this.client?.deactivate?.()
    this.client = null
  }
}

export const wsService = new WebSocketService()

