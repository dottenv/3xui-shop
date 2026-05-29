import { useState } from 'react'
import { BackButton } from '../ui'
import { isGlass, setGlass } from '../theme'

export default function SettingsTheme() {
  const [enabled, setEnabled] = useState(isGlass)

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setGlass(next)
  }

  return (
    <div className="space-y-6">
      <BackButton />

      <h1 className="text-xl font-bold">Тема оформления</h1>
      <p className="text-sm text-muted -mt-4">Тёмная тема — по умолчанию. Liquid Glass придаёт глубину и свечение.</p>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`bg-surface border rounded-2xl p-5 text-center space-y-3 transition-all ${
          !enabled ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-border'
        }`}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-bg">
            <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Dark</p>
          {!enabled && <p className="text-[10px] text-primary font-medium">Активно</p>}
        </div>

        <div className={`border rounded-2xl p-5 text-center space-y-3 transition-all ${
          enabled ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-border'
        }`}
          style={enabled ? { background: 'rgba(30,41,59,0.45)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(147,51,234,0.2))' }}>
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Liquid Glass</p>
          {enabled && <p className="text-[10px] text-primary font-medium">Активно</p>}
        </div>
      </div>

      {/* Toggle */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">Liquid Glass</p>
            <p className="text-xs text-muted mt-0.5">Стеклянные панели с размытием</p>
          </div>
        </div>
        <button onClick={toggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-border'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  )
}
