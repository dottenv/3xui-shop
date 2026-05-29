import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useConfig } from '../ConfigContext'
import { PasswordInput, Spinner } from '../ui'

export default function Login() {
  const { user, login } = useAuth()
  const { t } = useConfig()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">CWIM</h1>
          <p className="text-muted text-sm mt-1">{t('app.pages.login.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="text-sm text-muted mb-1 block">{t('app.pages.login.email_label')}</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <PasswordInput
            id="login-password"
            label={t('app.pages.login.password_label')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button
            type="submit" disabled={busy}
            className="w-full bg-primary text-white rounded-lg py-3 font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Spinner />}
            {busy ? t('app.common.loading') : t('app.pages.login.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          {t('app.pages.login.no_account')}{' '}
          <Link to="/register" className="text-primary hover:underline">{t('app.pages.login.register_link')}</Link>
        </p>
      </div>
    </div>
  )
}
