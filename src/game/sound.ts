export type SoundName =
  | 'click' | 'select' | 'tide' | 'splash' | 'open' | 'unroll' | 'reveal' | 'crab' | 'cage' | 'escape'
  | 'lose' | 'win' | 'bigwin' | 'jackpot' | 'alert'

class SoundEngine {
  private ctx: AudioContext | null = null
  enabled = true

  private audio(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined' || !('AudioContext' in window)) return null
    this.ctx ??= new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, slideTo?: number) {
    const ctx = this.audio()
    if (!ctx) return
    const t = ctx.currentTime + start
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private pluck(freq: number, start: number, gain = 0.1) {
    this.tone(freq, start, 0.18, 'triangle', gain, freq * 0.72)
    this.tone(freq * 2.01, start, 0.09, 'sine', gain * 0.25, freq * 1.4)
  }

  private noise(start: number, dur: number, freq: number, gain = 0.08, q = 1) {
    const ctx = this.audio()
    if (!ctx) return
    const t = ctx.currentTime + start
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq
    filter.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter).connect(g).connect(ctx.destination)
    src.start(t)
  }

  play(name: SoundName) {
    if (!this.enabled) return
    switch (name) {
      case 'click': this.tone(520, 0, 0.06, 'triangle', 0.06); break
      // A bright, low-volume sea-glass chime confirms the player's bottle choice.
      case 'select': this.pluck(660, 0, 0.08); this.pluck(990, 0.06, 0.055); break
      case 'tide': this.noise(0, 1.1, 500, 0.12, 0.4); this.noise(0.3, 0.9, 900, 0.06, 0.5); break
      case 'splash': this.noise(0, 0.25, 1400, 0.09, 0.7); break
      // Cork pop, glass resonance and a tiny sandy fizz make the opening feel tactile.
      case 'open':
        this.tone(210, 0, 0.16, 'triangle', 0.09, 125)
        this.tone(880, 0.015, 0.22, 'sine', 0.1, 560)
        this.noise(0.01, 0.2, 2400, 0.045, 1.7)
        break
      case 'unroll': this.noise(0, 0.45, 3000, 0.05, 0.6); break
      case 'reveal': this.tone(1200, 0, 0.05, 'triangle', 0.04); break
      // Two quick claw taps with a dry sand scrape, repeated by Scene while the crab crosses.
      case 'crab':
        [0, 0.13, 0.27, 0.4, 0.54].forEach((start, i) => {
          this.tone(i % 2 ? 720 : 580, start, 0.045, 'square', 0.025, 380)
          this.noise(start + 0.015, 0.07, 1800, 0.018, 2)
        })
        break
      case 'cage':
        this.tone(180, 0, 0.16, 'triangle', 0.08, 90)
        this.tone(720, 0.04, 0.12, 'square', 0.035, 420)
        this.noise(0.08, 0.18, 1500, 0.03, 2)
        break
      case 'escape':
        this.tone(520, 0, 0.13, 'triangle', 0.06, 260)
        this.noise(0.04, 0.16, 2100, 0.025, 1.8)
        break
      case 'lose': this.tone(330, 0, 0.18, 'triangle', 0.06, 220); break
      case 'win': [523, 659, 784].forEach((f, i) => this.tone(f, i * 0.09, 0.3, 'triangle', 0.09)); break
      case 'bigwin': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.1, 0.45, 'triangle', 0.1)); break
      case 'jackpot':
        [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, i * 0.12, 0.5, 'square', 0.05))
        this.tone(1568, 1.0, 1.2, 'triangle', 0.1)
        break
      case 'alert': this.tone(330, 0, 0.15, 'square', 0.05); this.tone(247, 0.16, 0.2, 'square', 0.05); break
    }
  }
}

export const sound = new SoundEngine()
