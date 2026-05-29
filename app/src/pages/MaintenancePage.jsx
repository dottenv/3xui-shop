import { useConfig } from '../ConfigContext'

export default function MaintenancePage() {
  const { t } = useConfig()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-[72px] h-[72px] mx-auto mb-6 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{t('app.pages.maintenance.title') || 'Ведутся технические работы'}</h1>
        <p className="text-muted text-sm leading-relaxed">{t('app.pages.maintenance.subtitle') || 'Приложение временно недоступно. Мы проводим плановое обслуживание. Пожалуйста, зайдите позже.'}</p>
        <div className="inline-flex items-center gap-2 mt-7 px-5 py-2.5 bg-surface border border-primary/10 rounded-full text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          {t('app.pages.maintenance.status') || 'Ведутся работы · Функции могут работать некорректно'}
        </div>
      </div>
    </div>
  )
}
