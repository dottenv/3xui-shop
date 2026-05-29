import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConfig } from '../ConfigContext'
import { apiJson } from '../api'
import { BackButton, Spinner } from '../ui'

export default function Pricing() {
  const { t, plans, lang } = useConfig()
  const navigate = useNavigate()
  const [buying, setBuying] = useState(null)
  const [error, setError] = useState('')

  if (!plans) return null

  async function handleBuy(planId) {
    setBuying(planId)
    setError('')
    try {
      await apiJson('/payment/create', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, payment_gateway: 'mock' }),
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">{t('app.pages.pricing.title')}</h1>
        <p className="text-muted text-sm mt-1">{t('app.pages.pricing.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {plans.plans?.map((p) => (
          <div key={p.id} className={`relative bg-surface border rounded-2xl p-5 space-y-4 ${p.featured ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
            {p.featured && p.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                {p.badge}
              </span>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{p.name}</h3>
              <span className="text-xs text-muted">{p.period}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{p.price}</span>
              <span className="text-muted text-sm">{p.currency}</span>
            </div>
            <p className="text-sm text-muted">{p.desc}</p>
            <ul className="space-y-2">
              {p.features?.filter(f => f.enabled).map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f.label}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleBuy(p.id)}
              disabled={buying === p.id}
              className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buying === p.id && <Spinner />}
              {buying === p.id ? t('app.common.processing') : (t('app.pages.pricing.buy') + ' — ' + p.price + ' ' + p.currency)}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm text-muted">{t('app.pages.pricing.questions')}</p>
        <Link to="/support" className="text-sm text-primary font-medium hover:underline">{t('app.pages.pricing.contact_support')}</Link>
      </div>
    </div>
  )
}
