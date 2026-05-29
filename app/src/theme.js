const GLASS_KEY = 'cwim_glass'

export function isGlass() {
  try { return localStorage.getItem(GLASS_KEY) === 'true' } catch { return false }
}

export function setGlass(enabled) {
  try { localStorage.setItem(GLASS_KEY, String(enabled)) } catch {}
  document.documentElement.classList.toggle('glass', enabled)
}

export function applyTheme() {
  const enabled = isGlass()
  document.documentElement.classList.toggle('glass', enabled)
  return enabled
}
