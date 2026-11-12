// Keep a sprite's state, but stop waking its timer while the tab is hidden.
export function visibleInterval(tick, delay) {
  let id = 0
  const sync = () => {
    clearInterval(id)
    id = document.hidden ? 0 : setInterval(tick, delay)
  }
  document.addEventListener('visibilitychange', sync)
  sync()
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', sync)
  }
}
