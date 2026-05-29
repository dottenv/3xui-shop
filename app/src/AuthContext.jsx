import { createContext, useContext, useState, useEffect } from 'react'
import { apiJson, getTokens, setTokens, clearTokens, cacheClear } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tokens = getTokens()
    if (tokens.access_token) {
      apiJson('/auth/me')
        .then(setUser)
        .catch(() => { clearTokens(); cacheClear(); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const data = await apiJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setTokens(data)
    const me = await apiJson('/auth/me')
    setUser(me)
  }

  async function register(email, password) {
    const data = await apiJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setTokens(data)
    const me = await apiJson('/auth/me')
    setUser(me)
  }

  function logout() {
    clearTokens(); cacheClear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
