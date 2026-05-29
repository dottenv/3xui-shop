import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useConfig } from '../ConfigContext'
import { apiJson } from '../api'
import { Spinner, BackButton } from '../ui'

export default function SettingsPersonal() {
  const { t } = useConfig()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      await apiJson('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      })
      setMsg('Сохранено')
      setTimeout(() => window.history.back(), 1200)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton>{t('app.common.back')}</BackButton>

      <h1 className="text-xl font-bold">{t('app.pages.settings.personal')}</h1>

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg border ${msg === 'Сохранено' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {msg}
          </div>
        )}

        <div>
          <label className="text-sm text-muted mb-1 block">{t('app.pages.settings.personal')}</label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
            placeholder="Не указано" />
        </div>

        <div>
          <label className="text-sm text-muted mb-1 block">Фамилия</label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
            placeholder="Не указано" />
        </div>

        <div>
          <label className="text-sm text-muted mb-1 block">Email</label>
          <input type="email" value={email} disabled
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white/50 text-sm outline-none cursor-not-allowed" />
          <p className="text-[10px] text-muted mt-1">Смена email временно недоступна</p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Spinner />}
          {saving ? t('app.common.loading') : t('app.common.save')}
        </button>
      </form>
    </div>
  )
}
