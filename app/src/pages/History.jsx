import { useEffect, useState } from 'react'
import { apiCached } from '../api'
import { BackButton } from '../ui'
import { useConfig } from '../ConfigContext'

export default function History() {
  const { t } = useConfig()
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    apiCached('/payment/history').then(setHistory).catch(() => {})
  }, [])

  const filtered = filter === 'all' ? history : filter === 'payments' ? history.filter(h => h.amount > 0) : history

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">{t('app.pages.history.title')}</h1>
        <p className="text-muted text-sm mt-1">{t('app.pages.history.subtitle')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: t('app.pages.history.all') },
          { key: 'payments', label: t('app.pages.history.payments') },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === f.key ? 'bg-primary text-white' : 'bg-surface border border-border text-muted hover:border-primary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl divide-y divide-border/50">
        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-8">{t('app.common.empty')}</p>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.status === 'completed' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <svg className={`w-4 h-4 ${item.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm truncate">
                  {item.status === 'completed' ? t('app.common.payment') : t('app.common.pending')}
                  {item.payment_gateway !== 'mock' ? ` (${item.payment_gateway})` : ''}
                </p>
                <p className="text-xs text-muted mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={`text-xs font-medium ml-3 shrink-0 ${item.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
              {item.status === 'completed' ? `+${item.amount} ${item.currency}` : t('app.common.pending')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
