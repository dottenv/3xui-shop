import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTheme, setTheme } from '../theme'

const themes = [
  { id: 'dark', label: 'Тёмная', icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' },
  { id: 'light', label: 'Светлая', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
]

export default function SettingsTheme() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(getTheme)

  function select(id) {
    setCurrent(id)
    setTheme(id)
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Настройки
      </button>

      <h1 className="text-xl font-bold">Тема</h1>
      <p className="text-sm text-muted -mt-4">Выберите оформление приложения</p>

      <div className="grid grid-cols-2 gap-3">
        {themes.map((t) => (
          <button key={t.id} onClick={() => select(t.id)}
            className={`bg-surface border rounded-2xl p-5 text-center space-y-3 transition-all ${
              current === t.id ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-border hover:border-primary/50'
            }`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              t.id === 'dark' ? 'bg-bg text-yellow-400' : 'bg-yellow-100 text-yellow-600'
            }`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
            </div>
            <p className="text-sm font-medium">{t.label}</p>
            {current === t.id && <p className="text-[10px] text-primary font-medium">Активно</p>}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">Автоматически</p>
            <p className="text-xs text-muted mt-0.5">Скоро — будет следовать системной теме</p>
          </div>
        </div>
      </div>
    </div>
  )
}
