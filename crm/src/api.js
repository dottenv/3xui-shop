import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const tokens = getTokens()
      if (tokens.refresh_token) {
        try {
          const { data } = await axios.post('/api/admin/refresh', { refresh_token: tokens.refresh_token })
          setTokens(data)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          clearTokens()
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

function getTokens() {
  try { return JSON.parse(localStorage.getItem('admin_tokens') || '{}') } catch { return {} }
}

function setTokens(t) {
  localStorage.setItem('admin_tokens', JSON.stringify(t))
}

function clearTokens() {
  localStorage.removeItem('admin_tokens')
}

export { getTokens, setTokens, clearTokens }
export default api

export async function apiJson(url, options = {}) {
  const method = options.method || 'GET'
  const config = { method, url, data: options.body ? JSON.parse(options.body) : undefined }
  const res = await api(config)
  return res.data
}
