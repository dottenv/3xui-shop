import { useEffect, useState } from 'react'
import { apiJson } from '../api'
import { CardSkeleton } from '../ui'
import { Link } from 'react-router-dom'
import { useConfig } from '../ConfigContext'

const planLabels = {
  start: 'Старт',
  optimal: 'Оптимальный',
  maximum: 'Максимум',
}

const quickLinks = [
  { to: '/pricing', key: 'pricing', icon: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 15a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 15a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/support', key: 'support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/guides', key: 'guides', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { to: '/referrals', key: 'referrals', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
]

export default function Dashboard() {
  const { t } = useConfig()
  const [sub, setSub] = useState(null)
  const [subLoading, setSubLoading] = useState(true)
  const [servers, setServers] = useState([])
  const [history, setHistory] = useState([])

  const [balance, setBalance] = useState(0)

  async function load() {
    try { setSub(await apiJson('/user/subscription')) } catch {} finally { setSubLoading(false) }
    apiJson('/user/servers').then(setServers).catch(() => {})
    apiJson('/payment/history').then(setHistory).catch(() => {})
    apiJson('/user/balance').then(d => setBalance(d.balance)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const isPremium = sub?.is_active
  const d = (s) => t('app.pages.dashboard.' + s)

  return (
    <div className="space-y-4">

      {subLoading ? <CardSkeleton /> : (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{d('subscription')}</h2>
            {isPremium && <span className="text-xs text-green-400 font-medium">{d('active')}</span>}
          </div>
          {isPremium ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{planLabels[sub.plan_id] || sub.plan_id}</p>
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                    <span>{sub.server_name || `#${sub.server_id}`}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${sub.server_online ? 'bg-green-400' : 'bg-red-400'}`} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{sub.devices} устр.</p>
                  <p className="text-xs text-muted">{sub.days_left} дн.</p>
                </div>
              </div>
              <div className="w-full bg-bg rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: sub.usage_pct || '0%' }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{(sub.traffic_up + sub.traffic_down) > 0 ? ((sub.traffic_up + sub.traffic_down) / 1024 / 1024 / 1024).toFixed(1) + ' GB' : '0 GB'}</span>
                <span>{(sub.traffic_limit / 1024 / 1024 / 1024).toFixed(0) + ' GB'}</span>
              </div>
              <p className="text-xs text-muted">Истекает: {new Date(sub.expires_at).toLocaleDateString('ru-RU')}</p>
              <Link to="/config" className="block w-full bg-primary text-white rounded-xl py-3 text-sm font-medium text-center hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                Подключиться
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted text-sm">{d('no_subscription')}</p>
          <Link to="/pricing" className="block w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium text-center hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
              {d('choose_plan')}
            </Link>
            </div>
          )}
        </div>
      )}

      <Link to="/pricing" className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between hover:border-primary transition-colors">
        <div>
          <p className="text-sm text-muted">{d('balance')}</p>
          <p className="text-2xl font-bold mt-0.5">{balance} ₽</p>
        </div>
        <span className="bg-bg border border-border text-sm font-medium px-5 py-2.5 rounded-xl hover:border-primary transition-colors">
          Пополнить →
        </span>
      </Link>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{d('servers')}</h2>
          <Link to="/servers" className="text-xs text-primary font-medium">{d('all')} →</Link>
        </div>
        <div className="space-y-2">
          {servers.length === 0 && <p className="text-sm text-muted text-center py-4">{t('app.common.loading')}</p>}
          {servers.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-bg rounded-xl px-4 py-3 text-sm">
              <span className="text-lg">{s.flag || '🌐'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.is_online ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                  <span>{s.location || s.country || ''}</span>
                  <span>{t('app.common.load')} {s.load || 0}%</span>
                </div>
              </div>
              <div className="w-16 bg-bg border border-border rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${s.load > 70 ? 'bg-yellow-400' : s.load > 40 ? 'bg-green-400' : 'bg-green-500'}`} style={{ width: `${s.load || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{d('quick_actions')}</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickLinks.map((item, i) => (
            <Link to={item.to} key={i} className="flex flex-col items-center gap-2 bg-bg border border-border rounded-xl py-3.5 hover:border-primary transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[10px] text-muted font-medium">{item.key === 'pricing' ? t('app.pages.pricing.title') : t('app.pages.' + item.key + '.title')}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{d('history')}</h2>
          <Link to="/history" className="text-xs text-primary font-medium">{d('all')} →</Link>
        </div>
        <div className="space-y-0 divide-y divide-border/50">
          {history.length === 0 && <p className="text-sm text-muted text-center py-4">{t('app.common.empty')}</p>}
          {history.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.status === 'completed' ? t('app.common.payment') : t('app.common.pending')} — {item.amount} ₽</p>
                <p className="text-xs text-muted mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-medium ml-3 ${item.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{item.status === 'completed' ? `+${item.amount} ₽` : '...'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
