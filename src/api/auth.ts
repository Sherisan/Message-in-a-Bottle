import { API_BASE, GAME_ID } from './base'

// Production: Games-API launches the game as /?token=<jwt>.
// Dev/staging: the API's GET /api/dev-token mints a random player for this game.
let cached: string | null = null

export async function getToken(): Promise<string> {
  if (cached) return cached
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl) return (cached = fromUrl)

  const res = await fetch(`${API_BASE}/api/dev-token?gameId=${GAME_ID}`)
  if (!res.ok) throw new Error('No session token. Launch the game from the lobby, or run the API in Development mode.')
  cached = ((await res.json()) as { token: string }).token
  return cached
}
