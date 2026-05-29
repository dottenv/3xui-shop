import { useAuth } from '../AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Привет, {user?.first_name || user?.email?.split('@')[0] || 'Пользователь'}!</h1>
        <p className="text-muted text-sm mt-1">Добро пожаловать в CWIM VPN</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold">Статус подписки</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-muted">Нет активной подписки</span>
        </div>
        <a href="#" className="block w-full bg-primary text-white text-center rounded-lg py-3 text-sm font-medium hover:bg-primary-dark transition-colors">
          Купить подписку
        </a>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Тарифы', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { label: 'Инструкции', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { label: 'Поддержка', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
            { label: 'Продлить', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
          ].map((item, i) => (
            <button key={i} className="flex flex-col items-center gap-2 bg-bg border border-border rounded-xl py-4 px-3 hover:border-primary transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-xs text-muted">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
