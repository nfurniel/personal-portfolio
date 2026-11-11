import { createContext, useContext } from 'react'

/*
 * What apps (and the terminal) can ask the system to do:
 *   open(appId, params?, { focus?, from? })  close(key)  closeAll()
 *   isOpen(key)  shutdown()  toggleFullscreen()  compact
 * `from` is the element a window should grow out of (an icon).
 */
export const OSContext = createContext(null)

export function useOS() {
  return useContext(OSContext)
}

// One window per app, except projects: one per project file.
export function windowKey(app, params = {}) {
  return params.id ? `${app}:${params.id}` : app
}
