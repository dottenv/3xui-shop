import { useState } from 'react'
import { apiJson } from '../api'
import { Spinner, PasswordInput, BackButton } from '../ui'

export default function SettingsSecurity() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg('')
    if (password !== confirm) { setMsg('Пароли не совпадают'); return }
    if (password.length < 6) { setMsg('Пароль минимум 6 символов'); return }
    setSaving(true)
    try {
      await apiJson('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: password }),
      })
      setMsg('Пароль изменён')
      setCurrent(''); setPassword(''); setConfirm('')
      setTimeout(() => window.history.back(), 1200)
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />

      <h1 className="text-xl font-bold">Безопасность</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg border ${msg === 'Пароль изменён' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {msg}
          </div>
        )}

        <PasswordInput id="current-pw" label="Текущий пароль" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" />
        <PasswordInput id="new-pw" label="Новый пароль" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов" />
        <PasswordInput id="confirm-pw" label="Подтвердите пароль" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />

        <button type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Spinner />}
          {saving ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </form>
    </div>
  )
}
