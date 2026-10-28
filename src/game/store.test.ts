import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameInfo, PlayResult } from '../api/client'
import { bottleValues, prizeArt, winTier } from './rules'
import { GameStore } from './store'

const info: GameInfo = {
  gameId: 'message-in-a-bottle', name: 'Message in a Bottle', minBet: 2, maxBet: 20, maxWin: 10000, rtp: 0.95,
  currency: 'ZAR', stakes: [2, 5, 10, 20], prizeTable: [{ multiplier: 5, chance: 0.024 }],
  fairness: { currentServerSeedHash: 'abc', previousServerSeed: null },
}

function result(prize: number, stake = 2, balance = 100): PlayResult {
  return {
    roundId: `r${Math.random()}`, stake, win: stake * prize, multiplier: prize, balance,
    proof: { serverSeedHash: 'abc', clientSeed: null, nonce: 1 }, winPending: false,
    card: { prize, prizeAmount: stake * prize, others: [0, 1, 2, 3], win: stake * prize },
  }
}

function fakeApi(results: PlayResult[], balance = 100) {
  return {
    info: vi.fn(async () => info),
    balance: vi.fn(async () => ({ balance, currency: 'ZAR' })),
    play: vi.fn(async () => results.shift()!),
  }
}

async function settle(store: GameStore, phase = 'complete') {
  for (let i = 0; i < 200 && store.get().phase !== phase; i++) await new Promise((r) => setTimeout(r, 0))
}

describe('rules', () => {
  it('puts the prize in the picked bottle and the others around it in order', () => {
    expect(bottleValues(25, [0, 1, 2, 3], 0)).toEqual([25, 0, 1, 2, 3])
    expect(bottleValues(25, [0, 1, 2, 3], 2)).toEqual([0, 1, 25, 2, 3])
    expect(bottleValues(25, [0, 1, 2, 3], 4)).toEqual([0, 1, 2, 3, 25])
  })

  it('maps prizes to art and banners', () => {
    expect(prizeArt(0)).toBe('loss')
    expect(prizeArt(3)).toBe('plain')
    expect(prizeArt(10)).toBe('silver')
    expect(prizeArt(25)).toBe('gold')
    expect(prizeArt(100)).toBe('map')
    expect(prizeArt(500)).toBe('chest')
    expect(winTier(10)).toBeNull()
    expect(winTier(25)).toBe('big')
    expect(winTier(100)).toBe('mega')
    expect(winTier(500)).toBe('treasure')
  })
})

describe('GameStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('plays a round: send, pick, reveal — the win lands only after the bottle opens', async () => {
    const api = fakeApi([result(5, 2, 108)])
    const store = new GameStore(api)
    store.setSpeed(0)
    await store.init()
    expect(store.get().stake).toBe(2)

    void store.send()
    await settle(store, 'picking')
    expect(api.play).toHaveBeenCalledWith(2)
    expect(store.shownBalance).toBe(98) // 108 includes the R10 win, not shown yet

    void store.pick(3)
    await settle(store)
    expect(store.values?.[3]).toBe(5)
    expect(store.shownBalance).toBe(108)
    expect(store.get().history[0].win).toBe(10)
  })

  it('refuses to send when the balance is below the stake', async () => {
    const store = new GameStore(fakeApi([], 1))
    store.setSpeed(0)
    await store.init()
    expect(await store.send()).toBe(false)
    expect(store.get().message).toEqual({ kind: 'insufficient' })
  })

  it('auto-play quick-picks every round and stops after the count', async () => {
    const api = fakeApi([result(0), result(2), result(0)])
    const store = new GameStore(api)
    store.setSpeed(0)
    await store.init()
    store.startAuto(3)
    for (let i = 0; i < 400 && (store.get().autoRemaining > 0 || store.get().phase !== 'complete'); i++)
      await new Promise((r) => setTimeout(r, 0))
    expect(api.play).toHaveBeenCalledTimes(3)
    expect(store.get().autoRemaining).toBe(0)
    expect(store.get().history).toHaveLength(3)
  })

  it('brings back a paid, unopened round after a reload', async () => {
    sessionStorage.setItem('bottles:round', JSON.stringify({ result: result(10), picked: null }))
    const store = new GameStore(fakeApi([]))
    store.setSpeed(0)
    await store.init()
    expect(store.get().phase).toBe('picking')
    expect(store.get().result?.card.prize).toBe(10)
  })
})
