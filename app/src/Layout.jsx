import { NavLink, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Preloader } from './ui'

const tabs = [
  { to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export default function Layout({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Preloader />

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-border px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">CWIM</span>
        <Link
          to="/profile"
          className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold hover:bg-primary/30 transition-colors"
        >
          {(user?.email?.[0] || '?').toUpperCase()}
        </Link>
      </header>

      <main className="flex-1 px-4 pb-24 pt-5 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around h-16">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className="relative flex items-center justify-center w-12 h-12"
            >
              {({ isActive }) => (
                <>
                  <svg
                    className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-muted'}`}
                    fill={isActive ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={isActive ? 0 : 1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                  {isActive && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
