// Dev: relative URLs go through the Vite proxy. Production: VITE_API_BASE (.env.production).
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? ''

/** Must match the "Games" entry in the game API config. */
export const GAME_ID = 'message-in-a-bottle'
