import { useSyncExternalStore } from 'react'
import { fetchPromos, type PromoOutcome, type PromoState } from './promoApi'

/**
 * Promotions for this game: the live promotions with the player's progress, their free cards, and notices to show.
 * Optional — if the API has no promotions (or can't be reached) the game simply shows none.
 */
export interface Notice {
  id: number
  icon: string
  title: string
  text: string
  tone: 'win' | 'info'
}

interface PromoStoreState {
  promos: PromoState | null
  panelOpen: boolean
  notices: Notice[]
}

const SEEN_KEY = 'promo:seen-awards'

export const ICONS: Record<string, string> = {
  FreeBet: '🎟️', Rain: '🌧️', MultiplierLeaderboard: '🏆', MultiplierRace: '🏁', Cashback: '💸', StreakMission: '🔥',
  MysteryPrize: '🎁', BuyXGetFree: '🎫', CollectionMission: '✨', LuckyNumber: '🍀', BoostedPayout: '⚡',
  HandBonus: '🃏', HandJackpot: '💰', RoundDrop: '🎯', CommunityJackpot: '💰',
}

class PromoStore {
  private state: PromoStoreState = { promos: null, panelOpen: false, notices: [] }
  private listeners = new Set<() => void>()
  private seen = new Set<string>(readSeen())
  private firstLoad = true
  private nextId = 1
  private timer: number | null = null

  get = () => this.state
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private set(patch: Partial<PromoStoreState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }

  /** Loads promotions now and every 30 seconds (leaderboards and offers change with other players). */
  start() {
    if (this.timer != null) return
    void this.refresh()
    this.timer = window.setInterval(() => void this.refresh(), 30_000)
  }

  async refresh() {
    try {
      const promos = await fetchPromos()
      // Awards that arrived on their own (cashback, leaderboard prizes, rain, free cards from the operator) get a notice.
      // Ones from a play are shown with the play. On the first load everything already there counts as seen.
      for (const a of promos.recentAwards) {
        if (this.seen.has(a.awardId)) continue
        this.seen.add(a.awardId)
        if (this.firstLoad || a.roundId) continue
        this.notify({
          icon: a.kind === 'FreeBet' ? '🎟️' : '💰',
          title: a.promotion ?? 'Promotion',
          text: a.kind === 'FreeBet' ? `You got a free card worth ${a.amount.toFixed(2)}!` : `+${a.amount.toFixed(2)} — ${a.reason}`,
          tone: 'win',
        })
      }
      this.firstLoad = false
      writeSeen(this.seen)
      this.set({ promos })
    } catch {
      /* promotions are optional */
    }
  }

  /** Shows what a play earned (call when the card is fully revealed, so nothing is spoiled). */
  showOutcomes(outcomes: PromoOutcome[] | undefined, money: (n: number) => string) {
    for (const o of outcomes ?? []) {
      const icon = ICONS[o.type] ?? '🎁'
      if (o.kind === 'Cash') this.notify({ icon, title: o.promotion, text: `${o.message} +${money(o.amount)}`, tone: 'win' })
      else if (o.kind === 'FreeBet') this.notify({ icon, title: o.promotion, text: `${o.message} Free card worth ${money(o.amount)}.`, tone: 'win' })
      else if (o.type === 'CollectionMission' && o.progress?.isNew) this.notify({ icon, title: o.promotion, text: o.message, tone: 'info' })
    }
    void this.refresh()
  }

  private notify(n: Omit<Notice, 'id'>) {
    const notice = { ...n, id: this.nextId++ }
    this.set({ notices: [...this.state.notices.slice(-3), notice] })
    window.setTimeout(() => this.dismiss(notice.id), 6000)
  }

  dismiss = (id: number) => this.set({ notices: this.state.notices.filter((n) => n.id !== id) })
  openPanel = (panelOpen: boolean) => this.set({ panelOpen })

  /** Free cards the player can use at this price. */
  freeCardsAt(price: number) {
    return (this.state.promos?.freeBets ?? []).filter((f) => f.amount === price)
  }
}

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function writeSeen(seen: Set<string>) {
  // The API lists a week of awards at most — keep the last 200 ids.
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)))
}

export const promos = new PromoStore()

export function usePromos<T>(select: (s: PromoStoreState) => T): T {
  return useSyncExternalStore(promos.subscribe, () => select(promos.get()))
}

/** Cash a play earned from promotions — already in the server's balance. */
export const promoCash = (outcomes: PromoOutcome[] | undefined) =>
  (outcomes ?? []).filter((o) => o.kind === 'Cash').reduce((s, o) => s + o.amount, 0)
