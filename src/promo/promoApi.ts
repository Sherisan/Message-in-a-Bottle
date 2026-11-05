import { API_BASE } from '../api/base'
import { getToken } from '../api/auth'

// Promotions from the game API (GET api/promotions/state). A play's own promo results come back with the play
// (PlayResult.promos); this state is for the promo panel, free cards and awards that arrive on their own
// (cashback, leaderboard prizes, rain, free cards given by the operator).

export type PromoType =
  | 'FreeBet' | 'Rain' | 'MultiplierLeaderboard' | 'MultiplierRace' | 'Cashback' | 'StreakMission'
  | 'MysteryPrize' | 'BuyXGetFree' | 'CollectionMission'
  | 'RoundDrop' | 'CommunityJackpot' | 'LuckyNumber' | 'BoostedPayout' | 'HandBonus' | 'HandJackpot'

/** What one play earned from a promotion. Progress outcomes carry buy-X / collection / streak progress. */
export interface PromoOutcome {
  promotionId: number
  promotion: string
  type: PromoType
  kind: 'Cash' | 'FreeBet' | 'Progress'
  amount: number
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progress?: any
}

export interface PublicPromo {
  promotionId: number
  name: string
  type: PromoType
  terms: string
  minStake: number
  endsAt: string | null
  // Shape depends on type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any
}

export interface FreeCard {
  awardId: string
  amount: number
  expiresAt: string | null
  promotion: string | null
}

export interface RecentAward {
  awardId: string
  kind: 'Cash' | 'FreeBet'
  amount: number
  reason: string
  createdAt: string
  gameId: string
  /** Set when the award came from a play — those are shown with the play itself. */
  roundId: string | null
  promotion: string | null
}

export interface PromoState {
  serverTime: string
  promotions: PublicPromo[]
  freeBets: FreeCard[]
  recentAwards: RecentAward[]
}

export async function fetchPromos(): Promise<PromoState> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/promotions/state`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Promotions unavailable (${res.status})`)
  return (await res.json()) as PromoState
}
