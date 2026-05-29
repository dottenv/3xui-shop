import { createContext, useContext, useState, useEffect } from 'react'
import api, { getTokens, setTokens, clearTokens } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAdmins, setHasAdmins] = useState(null) // null = loading, true/false

  useEffect(() => {
    // check if any admin exists
    api.get('/admin/check').then(({ data }) => {
      setHasAdmins(data.has_admins)
      if (data.has_admins) {
        const tokens = getTokens()
        if (tokens.access_token) {
          return api.get('/admin/me').then(({ data }) => setAdmin(data)).catch(() => clearTokens())
        }
      }
    }).finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/admin/login', { email, password })
    setTokens(data)
    const { data: me } = await api.get('/admin/me')
    setAdmin(me)
    return me
  }

  async function register(email, password) {
    const { data } = await api.post('/admin/register', { email, password })
    setTokens(data)
    setHasAdmins(true)
    const { data: me } = await api.get('/admin/me')
    setAdmin(me)
    return me
  }

  function logout() {
    clearTokens()
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, hasAdmins, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
