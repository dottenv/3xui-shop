const BASE = '/api'
const CACHE_PREFIX = 'api_cache_'

function getTokens() {
  try { return JSON.parse(localStorage.getItem('tokens') || '{}') }
  catch { return {} }
}

function setTokens(t) {
  localStorage.setItem('tokens', JSON.stringify(t))
}

function clearTokens() {
  localStorage.removeItem('tokens')
}

export { getTokens, setTokens, clearTokens }

// --- Simple TTL cache ---
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() > entry.exp) { localStorage.removeItem(CACHE_PREFIX + key); return null }
    return entry.data
  } catch { return null }
}

function cacheSet(key, data, ttlMs) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, exp: Date.now() + ttlMs }))
  } catch {}
}

function cacheClear() {
  Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).forEach(k => localStorage.removeItem(k))
}

export { cacheGet, cacheSet, cacheClear }

// --- API ---
export async function api(path, options = {}) {
  const tokens = getTokens()
  const headers = { ...options.headers }
  if (tokens.access_token) headers['Authorization'] = `Bearer ${tokens.access_token}`
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'

  let res = await fetch(BASE + path, { ...options, headers })

  if (res.status === 401 && tokens.refresh_token) {
    const refreshRes = await fetch(BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    })
    if (refreshRes.ok) {
      const data = await refreshRes.json()
      setTokens(data)
      headers['Authorization'] = `Bearer ${data.access_token}`
      res = await fetch(BASE + path, { ...options, headers })
    } else {
      clearTokens(); cacheClear()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  return res
}

export async function apiJson(path, options = {}) {
  const res = await api(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

// Cached variant: tries cache first, falls back to fetch, caches result
export async function apiCached(path, options = {}, ttlMs = 300_000) {
  const cached = cacheGet(path)
  if (cached) return cached
  const data = await apiJson(path, options)
  cacheSet(path, data, ttlMs)
  return data
}
