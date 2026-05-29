import { NavLink, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

const tabs = [
  { to: '/', label: 'Главная', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/profile', label: 'Профиль', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export default function Layout({ children }) {
  const { user } = useAuth()

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
        <div className="flex justify-around h-14">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
