import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConfig } from '../ConfigContext'
import { apiJson } from '../api'
import { BackButton, Spinner } from '../ui'

export default function Pricing() {
  const { t, plans, lang } = useConfig()
  const navigate = useNavigate()
  const [buying, setBuying] = useState(null)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState(0)
  const [topUpAmount, setTopUpAmount] = useState(0)
  const [topUpping, setTopUpping] = useState(false)

  useEffect(() => {
    apiJson('/user/balance').then(d => setBalance(d.balance)).catch(() => {})
  }, [])

  if (!plans) return null

  async function handleTopUp() {
    setTopUpping(true)
    try {
      const r = await apiJson('/payment/top-up', {
        method: 'POST',
        body: JSON.stringify({ amount: topUpAmount, payment_gateway: 'mock' }),
      })
      setBalance(r.balance)
      setTopUpAmount(0)
    } catch (err) { setError(err.message) } finally { setTopUpping(false) }
  }

  async function handleBuy(planId) {
    setBuying(planId)
    setError('')
    try {
      await apiJson('/payment/create', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, payment_gateway: 'mock' }),
      })
      navigate('/config')
    } catch (err) {
      setError(err.message)
      apiJson('/user/balance').then(d => setBalance(d.balance)).catch(() => {})
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('app.pages.pricing.title')}</h1>
          <p className="text-muted text-sm mt-1">{t('app.pages.pricing.subtitle')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Баланс</p>
          <p className="text-lg font-bold">{balance} ₽</p>
        </div>
      </div>

      {/* Top-up row */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
        <input type="number" min={1} placeholder="Сумма пополнения"
          value={topUpAmount || ''}
          onChange={e => setTopUpAmount(Number(e.target.value) || 0)}
          className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors" />
        <button onClick={handleTopUp} disabled={topUpAmount <= 0 || topUpping}
          className="bg-primary text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0">
          {topUpping ? <Spinner /> : 'Пополнить'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {plans.plans?.map((p) => {
          const canAfford = balance >= p.price
          return (
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
              disabled={buying === p.id || !canAfford}
              className={`w-full rounded-xl py-3.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${canAfford ? 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20' : 'bg-border/50 text-muted cursor-not-allowed'}`}
            >
              {buying === p.id && <Spinner />}
              {buying === p.id ? t('app.common.processing') : (canAfford ? (t('app.pages.pricing.buy') + ' — ' + p.price + ' ' + p.currency) : 'Недостаточно средств')}
            </button>
          </div>
        )})}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm text-muted">{t('app.pages.pricing.questions')}</p>
        <Link to="/support" className="text-sm text-primary font-medium hover:underline">{t('app.pages.pricing.contact_support')}</Link>
      </div>
    </div>
  )
}
