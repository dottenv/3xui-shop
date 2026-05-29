import { useEffect, useState } from 'react'
import { apiCached } from '../api'
import { CardSkeleton } from '../ui'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [sub, setSub] = useState(null)
  const [subLoading, setSubLoading] = useState(true)

  useEffect(() => {
    apiCached('/user/subscription').then(setSub).catch(() => {}).finally(() => setSubLoading(false))
  }, [])

  const isPremium = sub?.is_active

  return (
    <div className="space-y-4">

      {/* Subscription */}
      {subLoading ? <CardSkeleton /> : (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Подписка</h2>
            {isPremium && <span className="text-xs text-green-400 font-medium">Активна</span>}
          </div>
          {isPremium ? (
            <div className="space-y-2">
              <p className="text-lg font-bold">Оптимальный</p>
              <div className="flex items-center gap-4 text-sm text-muted">
                <span>Сервер #{sub.server_id || '—'}</span>
                <span>ID: {sub.vpn_id ? sub.vpn_id.slice(0, 8) + '…' : '—'}</span>
              </div>
              <div className="w-full bg-bg rounded-full h-2 mt-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }} />
              </div>
              <p className="text-xs text-muted">18 дней осталось</p>
            </div>
          ) : (
            <div>
              <p className="text-muted text-sm">Нет активной подписки</p>
          <Link to="/pricing" className="block w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium text-center hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
              Выбрать тариф
            </Link>
            </div>
          )}
        </div>
      )}

      {/* Balance */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Баланс</p>
          <p className="text-2xl font-bold mt-0.5">0 ₽</p>
        </div>
        <button className="bg-bg border border-border text-sm font-medium px-5 py-2.5 rounded-xl hover:border-primary transition-colors">
          Пополнить
        </button>
      </div>

      {/* Servers */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Серверы</h2>
          <Link to="/servers" className="text-xs text-primary font-medium">Все →</Link>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Netherlands', flag: '🇳🇱', ping: 45, load: 62, online: true },
            { name: 'Germany', flag: '🇩🇪', ping: 52, load: 78, online: true },
            { name: 'Singapore', flag: '🇸🇬', ping: 120, load: 34, online: true },
            { name: 'USA East', flag: '🇺🇸', ping: 98, load: 55, online: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-bg rounded-xl px-4 py-3 text-sm">
              <span className="text-lg">{s.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.online ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                  <span>{s.ping} ms</span>
                  <span>Загрузка {s.load}%</span>
                </div>
              </div>
              <div className="w-16 bg-bg border border-border rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${s.load > 70 ? 'bg-yellow-400' : s.load > 40 ? 'bg-green-400' : 'bg-green-500'}`} style={{ width: `${s.load}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Быстрые действия</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: '/pricing', label: 'Тарифы', icon: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 15a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 15a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { to: '/support', label: 'Поддержка', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
            { to: '/guides', label: 'Инструкции', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { to: '/referrals', label: 'Рефералы', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          ].map((item, i) => (
            <Link to={item.to} key={i} className="flex flex-col items-center gap-2 bg-bg border border-border rounded-xl py-3.5 hover:border-primary transition-colors">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[10px] text-muted font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">История</h2>
          <Link to="/history" className="text-xs text-primary font-medium">Все →</Link>
        </div>
        <div className="space-y-0 divide-y divide-border/50">
          {[
            { type: 'payment', label: 'Пополнение баланса', detail: '+500 ₽', date: '28 мая', color: 'text-green-400' },
            { type: 'payment', label: 'Оплата подписки', detail: '-499 ₽', date: '28 мая', color: 'text-red-400' },
            { type: 'server', label: 'Подключение к серверу', detail: 'Netherlands', date: '27 мая' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.label}</p>
                <p className="text-xs text-muted mt-0.5">{item.date}</p>
              </div>
              <span className={`text-xs font-medium ml-3 ${item.color || 'text-muted'}`}>{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
