import { BackButton } from '../ui'
import { useConfig } from '../ConfigContext'

const guides = [
  {
    platform: 'iOS', icon: 'M12 21.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    steps: [
      'Скачайте приложение Outline из App Store',
      'Откройте приложение и нажмите "+"',
      'Скопируйте ключ доступа из личного кабинета',
      'Вставьте ключ и подключитесь',
    ],
    color: 'text-zinc-400', bg: 'bg-zinc-500/10',
  },
  {
    platform: 'Android', icon: 'M5 5h14v14H5V5zm2 2v10h10V7H7z',
    steps: [
      'Скачайте приложение v2rayNG из Google Play',
      'Откройте приложение, нажмите "+" → "Импорт из буфера"',
      'Скопируйте ключ доступа из личного кабинета',
      'Нажмите на сервер и подключитесь',
    ],
    color: 'text-green-400', bg: 'bg-green-500/10',
  },
  {
    platform: 'Windows', icon: 'M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z',
    steps: [
      'Скачайте клиент v2rayN с официального сайта',
      'Распакуйте архив и запустите v2rayN.exe',
      'Скопируйте ключ доступа → ПКМ по трею → "Импорт"',
      'Выберите сервер и нажмите Enter',
    ],
    color: 'text-blue-400', bg: 'bg-blue-500/10',
  },
  {
    platform: 'macOS', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    steps: [
      'Скачайте клиент ClashX или WireGuard для macOS',
      'Установите приложение и откройте его',
      'Импортируйте конфигурацию из личного кабинета',
      'Включите прокси через меню в строке состояния',
    ],
    color: 'text-gray-400', bg: 'bg-gray-500/10',
  },
]

export default function Guides() {
  const { t } = useConfig()

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">{t('app.pages.guides.title')}</h1>
        <p className="text-muted text-sm mt-1">{t('app.pages.guides.subtitle')}</p>
      </div>

      {guides.map((g, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${g.bg} flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${g.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={g.icon} />
              </svg>
            </div>
            <h3 className="font-bold">{g.platform}</h3>
          </div>
          <ol className="space-y-3 ml-1">
            {g.steps.map((step, j) => (
              <li key={j} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {j + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}

      <div className="bg-surface border border-border rounded-2xl p-5 text-center">
        <p className="text-sm text-muted">{t('app.common.empty')}</p>
        <a href="https://t.me/cwim_support" className="text-sm text-primary font-medium hover:underline mt-1 inline-block">{t('app.pages.support.telegram')}</a>
      </div>
    </div>
  )
}
