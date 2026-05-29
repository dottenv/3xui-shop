import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Preloader } from './ui'
import { applyTheme } from './theme'
import { useEffect } from 'react'

export default function Layout({ children }) {
  const { user, loading } = useAuth()

  useEffect(() => { applyTheme() }, [])

  if (loading) return <Preloader />

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col transition-colors">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg tracking-tight hover:text-primary transition-colors">CWIM</Link>
        <Link
          to="/settings"
          className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold hover:bg-primary/30 transition-colors"
        >
          {(user?.email?.[0] || '?').toUpperCase()}
        </Link>
      </header>

      <main className="flex-1 px-4 pb-6 pt-5 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
