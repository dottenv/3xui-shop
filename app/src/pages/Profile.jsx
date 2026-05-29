import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { apiJson } from '../api'

export default function Profile() {
  const { user, logout } = useAuth()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setFirstName(user?.first_name || '')
    setLastName(user?.last_name || '')
  }, [user])

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
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Профиль</h1>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
            {(user?.email?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user?.email}</p>
            <p className="text-muted text-sm">Активен с {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold">Редактировать профиль</h2>

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg border ${msg === 'Сохранено' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {msg}
          </div>
        )}

        <div>
          <label className="text-sm text-muted mb-1 block">Имя</label>
          <input
            type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
            placeholder="Не указано"
          />
        </div>

        <div>
          <label className="text-sm text-muted mb-1 block">Фамилия</label>
          <input
            type="text" value={lastName} onChange={e => setLastName(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors"
            placeholder="Не указано"
          />
        </div>

        <button
          type="submit" disabled={saving}
          className="w-full bg-primary text-white rounded-lg py-3 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>

      <button
        onClick={logout}
        className="w-full bg-transparent border border-red-500/30 text-red-400 rounded-lg py-3 text-sm font-medium hover:bg-red-500/10 transition-colors"
      >
        Выйти из аккаунта
      </button>
    </div>
  )
}
