import { BackButton } from '../ui'

const languages = [
  { code: 'ru', label: 'Русский', native: 'Русский', flag: '🇷🇺', available: true },
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', available: false },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪', available: false },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', available: false },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳', available: false },
]

export default function SettingsLanguage() {
  const current = 'ru'

  return (
    <div className="space-y-6">
      <BackButton />

      <h1 className="text-xl font-bold">Язык</h1>
      <p className="text-sm text-muted -mt-4">Выберите язык интерфейса</p>

      <div className="bg-surface border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
        {languages.map((lang, i) => (
          <button key={i} disabled={!lang.available}
            className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${lang.available ? 'hover:bg-bg/50 cursor-pointer' : 'opacity-40 cursor-not-allowed'} ${current === lang.code ? 'bg-primary/5' : ''}`}>
            <span className="text-xl">{lang.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{lang.native}</p>
              <p className="text-xs text-muted">{lang.label}</p>
            </div>
            {current === lang.code && (
              <svg className="w-5 h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            {!lang.available && <span className="text-[10px] text-muted shrink-0">Скоро</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
