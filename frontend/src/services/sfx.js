let ctx

function audio() {
  if (ctx) return ctx
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  ctx = new AudioContext()
  return ctx
}

function beep({ freq = 440, durationMs = 70, gain = 0.05, type = 'sine' } = {}) {
  const c = audio()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})

  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.value = gain
  o.connect(g)
  g.connect(c.destination)

  const now = c.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)

  o.start(now)
  o.stop(now + durationMs / 1000)
}

export function playSound(kind) {
  switch (kind) {
    case 'bid':
      beep({ freq: 880, durationMs: 60, gain: 0.06, type: 'triangle' })
      break
    case 'tick':
      beep({ freq: 1200, durationMs: 35, gain: 0.03, type: 'square' })
      break
    case 'sold':
      beep({ freq: 220, durationMs: 120, gain: 0.08, type: 'sawtooth' })
      setTimeout(() => beep({ freq: 140, durationMs: 120, gain: 0.06, type: 'sawtooth' }), 70)
      break
    default:
      break
  }
}

