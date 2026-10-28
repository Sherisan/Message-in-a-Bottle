import { useSyncExternalStore } from 'react'
import { api as defaultApi, ConnectionError, GameError, type GameInfo, type PlayResult } from '../api/client'
import { bottleValues, winTier, type WinTier } from './rules'
import { sound, type SoundName } from './sound'

/**
 * Game flow:  ready → sending → landing → picking → opening → others → complete → (send again)
 * "Send the tide" is the purchase: the server debits the stake, draws the prize, credits any win and
 * returns the bottles in one call. Everything after that — picking a bottle, opening it, showing what
 * the others held — only reveals a result the server already settled.
 */
export type Phase = 'loading' | 'ready' | 'sending' | 'landing' | 'picking' | 'opening' | 'others' | 'complete' | 'fatal'

export type Message =
  | { kind: 'insufficient' }
  | { kind: 'connection' }
  | { kind: 'pending' }
  | { kind: 'error'; text: string }

export interface HistoryItem {
  roundId: string
  stake: number
  multiplier: number
  win: number
  at: number
}

export interface GameState {
  phase: Phase
  info: GameInfo | null
  stakes: number[]
  stake: number
  /** Wallet balance as the server last reported it — already includes the current play's win. */
  balance: number | null
  result: PlayResult | null
  picked: number | null
  /** How many of the four unpicked bottles have been opened so far. */
  othersShown: number
  message: Message | null
  banner: { tier: WinTier; win: number; multiple: number } | null
  autoRemaining: number
  history: HistoryItem[]
  soundOn: boolean
  helpOpen: boolean
  historyOpen: boolean
  autoMenuOpen: boolean
  fatal: string | null
}

export const BOTTLES = 5
export const AUTO_COUNTS = [10, 25, 50]
export const DELAYS = { landing: 1400, autoPick: 650, open: 1500, otherStep: 280, banner: 2600, autoNext: 1400 }

const SAVE_KEY = 'bottles:round'
const SETTINGS_KEY = 'bottles:settings'
const HISTORY_KEY = 'bottles:history'

type Api = typeof defaultApi

export class GameStore {
  private state: GameState
  private listeners = new Set<() => void>()
  private speed = 1
  private busy = false

  constructor(private readonly api: Api = defaultApi) {
    const settings = readJson<{ soundOn?: boolean; stake?: number }>(localStorage, SETTINGS_KEY) ?? {}
    sound.enabled = settings.soundOn ?? true
    this.state = {
      phase: 'loading', info: null, stakes: [], stake: settings.stake ?? 0, balance: null,
      result: null, picked: null, othersShown: 0, message: null, banner: null, autoRemaining: 0,
      history: readJson<HistoryItem[]>(sessionStorage, HISTORY_KEY) ?? [],
      soundOn: sound.enabled, helpOpen: false, historyOpen: false, autoMenuOpen: false, fatal: null,
    }
  }

  /** Tests run the flow without animation delays. */
  setSpeed(factor: number) { this.speed = factor }

  // ── store plumbing ────────────────────────────────────────────────────
  get = () => this.state
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  private set(patch: Partial<GameState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }
  private wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms * this.speed))
  private play(name: SoundName) { sound.play(name) }

  /** Balance to show: the current play's win only "lands" once the picked bottle has been opened. */
  get shownBalance(): number | null {
    const { balance, result, phase } = this.state
    if (balance == null) return null
    const pending = result && ['landing', 'picking', 'opening'].includes(phase) ? result.win : 0
    return round2(balance - pending)
  }

  /** The five bottle contents, once a bottle has been picked. */
  get values(): number[] | null {
    const { result, picked } = this.state
    return result && picked != null ? bottleValues(result.card.prize, result.card.others, picked, BOTTLES) : null
  }

  // ── setup ─────────────────────────────────────────────────────────────
  async init() {
    try {
      const [info, wallet] = await Promise.all([this.api.info(), this.api.balance()])
      const stakes = info.stakes?.length ? info.stakes : [info.minBet]
      const stake = stakes.includes(this.state.stake) ? this.state.stake : stakes[0]
      this.set({ info, stakes, stake, balance: wallet.balance, phase: 'ready' })
      this.restore()
    } catch (e) {
      this.set({ phase: 'fatal', fatal: e instanceof Error ? e.message : String(e) })
    }
  }

  /** A play sent before a reload is already paid — bring its bottles back so the player can still open one. */
  private restore() {
    const saved = readJson<{ result: PlayResult; picked: number | null }>(sessionStorage, SAVE_KEY)
    if (!saved?.result?.card) return
    if (saved.picked == null) {
      this.set({ result: saved.result, picked: null, othersShown: 0, phase: 'picking' })
    } else {
      this.set({ result: saved.result, picked: saved.picked, othersShown: BOTTLES - 1 })
      this.finish()
    }
  }

  private save() {
    const { result, picked } = this.state
    if (result) sessionStorage.setItem(SAVE_KEY, JSON.stringify({ result, picked }))
  }

  // ── controls ──────────────────────────────────────────────────────────
  canSend = () => ['ready', 'complete'].includes(this.state.phase) && !this.busy
  canChangeStake = () => this.canSend() && this.state.autoRemaining === 0

  setStake(stake: number) {
    if (!this.canChangeStake() || !this.state.stakes.includes(stake) || stake === this.state.stake) return
    this.play('click')
    this.set({ stake })
    this.saveSettings()
  }

  toggleSound() {
    sound.enabled = !sound.enabled
    this.set({ soundOn: sound.enabled })
    this.play('click')
    this.saveSettings()
  }

  private saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ soundOn: this.state.soundOn, stake: this.state.stake }))
  }

  openHelp = (open: boolean) => this.set({ helpOpen: open })
  openHistory = (open: boolean) => this.set({ historyOpen: open })
  openAutoMenu = (open: boolean) => this.set({ autoMenuOpen: open })
  dismissMessage = () => this.set({ message: null })
  dismissBanner = () => this.set({ banner: null })

  /** Starts auto-play: sends the tide and quick-picks for `rounds` plays, stopping on any problem. */
  startAuto(rounds: number) {
    if (!this.canSend()) return
    this.set({ autoRemaining: rounds, autoMenuOpen: false })
    void this.send()
  }

  stopAuto = () => this.set({ autoRemaining: 0 })

  /** Sends the tide: one server call that pays the stake and settles the round. */
  async send(): Promise<boolean> {
    if (!this.canSend()) return false
    const { stake } = this.state
    const shown = this.shownBalance
    if (shown != null && shown < stake) {
      this.play('alert')
      this.set({ message: { kind: 'insufficient' }, autoRemaining: 0 })
      return false
    }

    this.busy = true
    this.play('tide')
    this.set({ phase: 'sending', result: null, picked: null, othersShown: 0, banner: null, message: null })
    try {
      const result = await this.api.play(stake)
      this.set({ result, balance: result.balance ?? this.state.balance, phase: 'landing' })
      this.save()
    } catch (e) {
      this.busy = false
      await this.handleError(e)
      return false
    }

    await this.wait(DELAYS.landing)
    this.play('splash')
    this.busy = false
    this.set({ phase: 'picking' })
    if (this.state.autoRemaining > 0) {
      await this.wait(DELAYS.autoPick)
      this.quickPick()
    }
    return true
  }

  quickPick() {
    this.pick(Math.floor(Math.random() * BOTTLES))
  }

  /** Opens the chosen bottle (it holds the prize the server already drew), then the other four. */
  async pick(bottle: number) {
    const { phase, result } = this.state
    if (phase !== 'picking' || !result || bottle < 0 || bottle >= BOTTLES) return
    this.busy = true
    this.play('pop')
    this.set({ picked: bottle, phase: 'opening' })
    this.save()

    await this.wait(DELAYS.open * 0.35)
    this.play('unroll')
    await this.wait(DELAYS.open * 0.65)
    const { prize } = result.card
    this.play(prize <= 0 ? 'lose' : prize >= 500 ? 'jackpot' : prize >= 25 ? 'bigwin' : 'win')

    this.set({ phase: 'others' })
    for (let i = 1; i < BOTTLES; i++) {
      await this.wait(DELAYS.otherStep)
      this.play('reveal')
      this.set({ othersShown: i })
    }
    this.busy = false
    await this.finish()
  }

  private async finish() {
    const { result } = this.state
    if (!result) return
    const tier = winTier(result.card.prize)
    const entry: HistoryItem = { roundId: result.roundId, stake: result.stake, multiplier: result.card.prize, win: result.win, at: Date.now() }
    const history = [entry, ...this.state.history.filter((h) => h.roundId !== result.roundId)].slice(0, 30)
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    sessionStorage.removeItem(SAVE_KEY)
    this.set({
      phase: 'complete',
      history,
      banner: tier ? { tier, win: result.win, multiple: result.card.prize } : null,
      message: result.winPending ? { kind: 'pending' } : this.state.message,
    })

    if (this.state.autoRemaining > 0) {
      const left = this.state.autoRemaining - 1
      this.set({ autoRemaining: left })
      if (left > 0) {
        await this.wait(tier ? DELAYS.banner : DELAYS.autoNext)
        if (this.state.autoRemaining > 0) {
          this.set({ banner: null })
          void this.send()
        }
      }
    }
  }

  private async handleError(e: unknown) {
    this.set({ autoRemaining: 0 })
    if (e instanceof ConnectionError) {
      // The play may or may not have gone through — re-read the balance rather than guess.
      this.play('alert')
      this.set({ phase: 'ready', message: { kind: 'connection' } })
      try { this.set({ balance: (await this.api.balance()).balance }) } catch { /* stays as last known */ }
      return
    }
    if (e instanceof GameError && e.status === 401) {
      this.set({ phase: 'fatal', fatal: e.message })
      return
    }
    this.play('alert')
    const insufficient = e instanceof GameError && /INSUFFICIENT/i.test(e.code)
    this.set({ phase: 'ready', message: insufficient ? { kind: 'insufficient' } : { kind: 'error', text: e instanceof Error ? e.message : String(e) } })
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const store = new GameStore()

export function useGame(): GameState {
  return useSyncExternalStore(store.subscribe, store.get)
}
