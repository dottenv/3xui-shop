import { BackButton } from '../ui'

const history = [
  { type: 'payment', label: 'Пополнение баланса', detail: '+500 ₽', date: '28 мая 2026', time: '14:23', color: 'text-green-400', status: 'completed' },
  { type: 'payment', label: 'Оплата подписки — Оптимальный', detail: '-999 ₽', date: '28 мая 2026', time: '14:20', color: 'text-red-400', status: 'completed' },
  { type: 'server', label: 'Подключение к серверу', detail: 'Netherlands', date: '27 мая 2026', time: '09:15', status: 'completed' },
  { type: 'server', label: 'Подключение к серверу', detail: 'Germany', date: '26 мая 2026', time: '18:42', status: 'completed' },
  { type: 'payment', label: 'Пополнение баланса', detail: '+1 000 ₽', date: '25 мая 2026', time: '11:00', color: 'text-green-400', status: 'completed' },
  { type: 'server', label: 'Отключение от сервера', detail: 'Singapore', date: '24 мая 2026', time: '22:30', status: 'completed' },
  { type: 'payment', label: 'Пополнение баланса', detail: '+250 ₽', date: '20 мая 2026', time: '16:05', color: 'text-green-400', status: 'completed' },
  { type: 'server', label: 'Подключение к серверу', detail: 'UK', date: '18 мая 2026', time: '07:50', status: 'completed' },
]

export default function History() {
  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">История</h1>
        <p className="text-muted text-sm mt-1">Все операции и действия</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Всё', 'Платежи', 'Подключения'].map((f, i) => (
          <button key={i} className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${i === 0 ? 'bg-primary text-white' : 'bg-surface border border-border text-muted hover:border-primary'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl divide-y divide-border/50">
        {history.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'payment' ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                <svg className={`w-4 h-4 ${item.type === 'payment' ? 'text-green-400' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {item.type === 'payment'
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm truncate">{item.label}</p>
                <p className="text-xs text-muted mt-0.5">{item.date} в {item.time}</p>
              </div>
            </div>
            <span className={`text-xs font-medium ml-3 shrink-0 ${item.color || 'text-muted'}`}>{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
