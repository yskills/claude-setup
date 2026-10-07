// One interface, two implementations: the game never imports steamworks.js directly.
export interface Platform {
  name: 'web' | 'steam'
  unlock(achievement: string): void
  save(slot: string, data: string): Promise<void>
  load(slot: string): Promise<string | null>
}

export const web: Platform = {
  name: 'web',
  unlock: () => {},
  save: async (slot, data) => localStorage.setItem(`save:${slot}`, data),
  load: async (slot) => localStorage.getItem(`save:${slot}`),
}

// steam.ts calls window.steam.* exposed by electron/preload.mjs (contextBridge) and falls back to
// `web` when window.steam is missing, so the same build runs in a browser and inside Steam.
export function pick(): Platform {
  const bridge = (globalThis as { steam?: Platform }).steam
  return bridge ?? web
}
