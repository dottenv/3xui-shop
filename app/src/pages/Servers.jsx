import { useEffect, useState } from 'react'
import { apiJson } from '../api'
import { BackButton } from '../ui'
import { useConfig } from '../ConfigContext'
import { Link, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'preferred_vpn_app'
const DEFAULT_APP = 'hiddify'
function getPreferredApp() { return localStorage.getItem(STORAGE_KEY) || DEFAULT_APP }
function setPreferredApp(app) { localStorage.setItem(STORAGE_KEY, app) }

export default function Servers() {
  const { t } = useConfig()
  const navigate = useNavigate()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState([])
  const [showAppPicker, setShowAppPicker] = useState(false)
  const [preferredApp, setPreferredAppState] = useState(getPreferredApp)
  const [hasSub, setHasSub] = useState(false)

  useEffect(() => {
    apiJson('/user/servers').then(setServers).catch(() => {}).finally(() => setLoading(false))
    apiJson('/connection/apps').then(setApps).catch(() => {})
    apiJson('/user/subscription').then(d => setHasSub(!!d.is_active)).catch(() => {})
  }, [])

  function changeApp(app) {
    setPreferredApp(app)
    setPreferredAppState(app)
    setShowAppPicker(false)
  }

  async function connectVpn() {
    try {
      const data = await apiJson(`/connection?app=${preferredApp}`)
      window.location.href = data.deep_link
    } catch {
      navigate('/config')
    }
  }

  const online = servers.filter(s => s.is_online)
  const offline = servers.filter(s => !s.is_online)

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">{t('app.pages.servers.title')}</h1>
        <p className="text-muted text-sm mt-1">{online.length} {t('app.pages.servers.available')} · {offline.length} {t('app.pages.servers.maintenance')}</p>
      </div>

      {hasSub ? (
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-2.5">
          <span className="text-xs text-muted">Приложение</span>
          <div className="relative">
            <button onClick={() => setShowAppPicker(p => !p)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors">
              {apps.find(a => a.id === preferredApp)?.name || preferredApp}
              <svg className={`w-3 h-3 transition-transform ${showAppPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAppPicker && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-xl z-10 py-1 min-w-[140px]">
                {apps.map(a => (
                  <button key={a.id} onClick={() => changeApp(a.id)} className={`w-full text-left px-3 py-2 text-xs hover:bg-bg transition-colors flex items-center gap-2 ${a.id === preferredApp ? 'text-primary font-medium' : 'text-muted'}`}>
                    {a.name}
                    {a.id === preferredApp && (
                      <svg className="w-3.5 h-3.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-muted">Оформите подписку, чтобы подключиться к серверам</p>
          <Link to="/pricing" className="inline-block mt-2 text-xs font-medium text-primary hover:text-primary-dark transition-colors">
            Выбрать тариф →
          </Link>
        </div>
      )}

      {loading ? <p className="text-sm text-muted text-center py-8">{t('app.common.loading')}</p> : (
      <div className="space-y-2">
        {servers.map((s) => (
          <div key={s.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
            <span className="text-2xl">{s.flag || '🌐'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{s.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.is_online ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <p className="text-xs text-muted mt-0.5">{s.location || s.country || ''} · {s.host}</p>
              <div className="flex items-center gap-3 text-xs text-muted mt-1.5">
                <span>{s.clients}/{s.max_clients} {t('app.common.clients')}</span>
                <span>{t('app.common.load')} {s.load || 0}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="w-12 bg-bg border border-border rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${s.load > 70 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${s.load || 0}%` }} />
              </div>
              {hasSub ? (
                <button onClick={connectVpn} disabled={!s.is_online} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-center ${s.is_online ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-border/30 text-muted cursor-not-allowed'}`}>
                  {s.is_online ? t('app.pages.servers.connect') : t('app.pages.servers.offline')}
                </button>
              ) : (
                <span className="text-[10px] text-muted">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
