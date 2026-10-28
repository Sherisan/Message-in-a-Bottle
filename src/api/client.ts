import { API_BASE } from './base'
import { getToken } from './auth'

// ── Wire types (camelCase JSON from the game API's PlayController) ─────────

/** The "Bottles" card: the picked bottle always holds `prize`; `others` are the four bottles not picked. */
export interface BottlesCard {
  /** Prize as a multiple of the stake. 0 = an empty bottle. */
  prize: number
  prizeAmount: number
  others: number[]
  win: number
}

export interface PlayResult {
  roundId: string
  stake: number
  win: number
  multiplier: number
  balance: number | null
  proof: { serverSeedHash: string; clientSeed: string | null; nonce: number }
  /** The win is settled but the wallet credit hasn't confirmed yet — it will be retried server-side. */
  winPending: boolean
  card: BottlesCard
}

export interface GameInfo {
  gameId: string
  name: string
  minBet: number
  maxBet: number
  maxWin: number
  rtp: number
  currency: string
  stakes: number[] | null
  prizeTable: { multiplier: number; chance: number }[]
  fairness: { currentServerSeedHash: string; previousServerSeed: { serverSeed: string; serverSeedHash: string; revealedAt: string } | null }
}

/** A refusal from the server (bad stake, insufficient funds, …). */
export class GameError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message)
  }
}

/** The request never got an answer — the outcome of a play is unknown until the balance is re-read. */
export class ConnectionError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ConnectionError('Connection lost.')
  }
  if (res.status === 429) throw new GameError('Too many requests — slow down a little.', 'RATE_LIMITED', 429)
  if (res.status === 401) throw new GameError('Your session has expired. Reopen the game from the lobby.', 'SESSION_EXPIRED', 401)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new GameError(body?.error ?? `Request failed (${res.status})`, body?.code ?? 'ERROR', res.status)
  return body as T
}

export const api = {
  info: () => call<GameInfo>('/api/play/info'),
  balance: () => call<{ balance: number; currency: string }>('/api/wallet/balance'),
  /** Sends the tide: the server debits the stake, draws the prize, credits any win and returns the bottles. */
  play: (stake: number) => call<PlayResult>('/api/play', { method: 'POST', body: JSON.stringify({ stake }) }),
}
