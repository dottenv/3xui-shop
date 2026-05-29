import { useEffect, useState } from 'react'
import { apiCached } from '../api'
import { BackButton } from '../ui'
import { useConfig } from '../ConfigContext'

export default function Servers() {
  const { t } = useConfig()
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiCached('/user/servers').then(setServers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const online = servers.filter(s => s.is_online)
  const offline = servers.filter(s => !s.is_online)

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">{t('app.pages.servers.title')}</h1>
        <p className="text-muted text-sm mt-1">{online.length} {t('app.pages.servers.available')} · {offline.length} {t('app.pages.servers.maintenance')}</p>
      </div>

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
              <button disabled={!s.is_online} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${s.is_online ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-border/30 text-muted cursor-not-allowed'}`}>
                {s.is_online ? t('app.pages.servers.connect') : t('app.pages.servers.offline')}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
