/** What comes out of a bottle, by prize (as a multiple of the stake). */
export type PrizeArt = 'loss' | 'plain' | 'silver' | 'gold' | 'map' | 'chest'

export function prizeArt(multiplier: number): PrizeArt {
  if (multiplier <= 0) return 'loss'
  if (multiplier >= 500) return 'chest'
  if (multiplier >= 100) return 'map'
  if (multiplier >= 25) return 'gold'
  if (multiplier >= 5) return 'silver'
  return 'plain'
}

/** Celebration banner for the picked bottle, if the prize earns one. */
export type WinTier = 'big' | 'mega' | 'treasure'

export function winTier(multiplier: number): WinTier | null {
  if (multiplier >= 500) return 'treasure'
  if (multiplier >= 100) return 'mega'
  if (multiplier >= 25) return 'big'
  return null
}

export const LOSS_ITEMS = ['crab', 'seaweed', 'sand'] as const
export type LossItem = (typeof LOSS_ITEMS)[number]

/** Which harmless item an empty bottle shows — stable per round and bottle so a reload looks the same. */
export function lossItem(roundId: string, bottle: number): LossItem {
  let h = bottle * 31
  for (const ch of roundId) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return LOSS_ITEMS[h % LOSS_ITEMS.length]
}

/**
 * The five bottle contents in screen order: the picked bottle holds the prize, the other four
 * hold the server's `others` in the order it sent them.
 */
export function bottleValues(prize: number, others: number[], picked: number, count = 5): number[] {
  const values: number[] = []
  let o = 0
  for (let i = 0; i < count; i++) values.push(i === picked ? prize : (others[o++] ?? 0))
  return values
}
