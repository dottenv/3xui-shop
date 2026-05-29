import { useConfig } from '../ConfigContext'
import { BackButton } from '../ui'

const langMeta = {
  ru: { label: 'Русский', native: 'Русский', flag: '🇷🇺' },
  en: { label: 'English', native: 'English', flag: '🇬🇧' },
}

export default function SettingsLanguage() {
  const { lang, langs, setLang, t } = useConfig()
  const label = t('app.pages.settings.language')

  return (
    <div className="space-y-6">
      <BackButton>{t('app.common.back')}</BackButton>

      <h1 className="text-xl font-bold">{label}</h1>
      <p className="text-sm text-muted -mt-4">{lang === 'en' ? 'Choose interface language' : 'Выберите язык интерфейса'}</p>

      <div className="bg-surface border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
        {langs.map((code, i) => {
          const meta = langMeta[code] || { label: code, native: code, flag: '🌐' }
          return (
            <button key={i} onClick={() => setLang(code)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-bg/50 cursor-pointer ${lang === code ? 'bg-primary/5' : ''}`}>
              <span className="text-xl">{meta.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{meta.native}</p>
                <p className="text-xs text-muted">{meta.label}</p>
              </div>
              {lang === code && (
                <svg className="w-5 h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
