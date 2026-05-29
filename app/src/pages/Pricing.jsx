import { Link } from 'react-router-dom'

const plans = [
  { name: 'Старт', price: 499, devices: 1, speed: 'до 100 Мбит/с', period: '30 дней', features: ['1 устройство', 'Все протоколы', 'Доступ к 4 серверам', 'Поддержка 24/7'], popular: false },
  { name: 'Оптимальный', price: 999, devices: 3, speed: 'до 300 Мбит/с', period: '30 дней', features: ['3 устройства', 'Все протоколы', 'Доступ ко всем серверам', 'Приоритетная поддержка', 'Без логов'], popular: true },
  { name: 'Максимум', price: 1999, devices: 10, speed: 'до 1 Гбит/с', period: '30 дней', features: ['10 устройств', 'Все протоколы', 'Доступ ко всем серверам', 'Выделенный сервер', 'Приоритетная поддержка', 'Без логов', 'Stealth-режим'], popular: false },
]

export default function Pricing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Тарифы</h1>
        <p className="text-muted text-sm mt-1">Выберите подходящий план</p>
      </div>

      <div className="space-y-4">
        {plans.map((p, i) => (
          <div key={i} className={`relative bg-surface border rounded-2xl p-5 space-y-4 ${p.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
            {p.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                Популярное
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{p.name}</h3>
              <span className="text-xs text-muted">{p.period}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{p.price}</span>
              <span className="text-muted text-sm">₽</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{p.devices} устройства</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{p.speed}</span>
            </div>
            <ul className="space-y-2">
              {p.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
              Купить — {p.price} ₽
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm text-muted">Есть вопросы по тарифам?</p>
        <Link to="/support" className="text-sm text-primary font-medium hover:underline">Связаться с поддержкой</Link>
      </div>
    </div>
  )
}
