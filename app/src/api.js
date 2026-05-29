const BASE = '/api'

function getTokens() {
  try {
    return JSON.parse(localStorage.getItem('tokens') || '{}')
  } catch {
    return {}
  }
}

function setTokens(t) {
  localStorage.setItem('tokens', JSON.stringify(t))
}

function clearTokens() {
  localStorage.removeItem('tokens')
}

export { getTokens, setTokens, clearTokens }

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
      clearTokens()
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
