const THEME_KEY = 'cwim_theme'

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' }
}

export function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
  document.documentElement.setAttribute('data-theme', theme)
}

export function applyTheme() {
  const theme = getTheme()
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}
