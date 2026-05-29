import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const sections = [
  {
    to: '/settings/personal',
    label: 'Личные данные',
    desc: 'Имя, фамилия, email',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
  {
    to: '/settings/security',
    label: 'Безопасность',
    desc: 'Смена пароля',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  {
    to: '/settings/language',
    label: 'Язык',
    desc: 'Русский',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 9.749 11.99 11.99 0 0112 21 11.99 11.99 0 013 9.749c0-1.31.21-2.571.598-3.751h.152',
  },
  {
    to: '/settings/theme',
    label: 'Тема',
    desc: 'Тёмная',
    icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  },
]

export default function Settings() {
  const { user, logout } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {(user?.email?.[0] || '?').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{user?.first_name || user?.email?.split('@')[0] || 'Пользователь'}</p>
          <p className="text-sm text-muted truncate">{user?.email}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
        {sections.map((s, i) => (
          <Link key={i} to={s.to} className="flex items-center gap-4 px-5 py-4 hover:bg-bg/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{s.label}</p>
              <p className="text-xs text-muted mt-0.5">{s.desc}</p>
            </div>
            <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <button onClick={logout} className="w-full bg-transparent border border-red-500/30 text-red-400 rounded-xl py-3.5 text-sm font-medium hover:bg-red-500/10 transition-colors">
        Выйти из аккаунта
      </button>

      <p className="text-center text-xs text-muted">CWIM VPN v1.0.0</p>
    </div>
  )
}
