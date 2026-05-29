const servers = [
  { name: 'Netherlands', flag: '🇳🇱', city: 'Amsterdam', ping: 45, load: 62, online: true, clients: 124, max: 200, ip: 'ams-01.cwim.ru' },
  { name: 'Germany', flag: '🇩🇪', city: 'Frankfurt', ping: 52, load: 78, online: true, clients: 156, max: 200, ip: 'fra-01.cwim.ru' },
  { name: 'Singapore', flag: '🇸🇬', city: 'Singapore', ping: 120, load: 34, online: true, clients: 68, max: 200, ip: 'sin-01.cwim.ru' },
  { name: 'USA East', flag: '🇺🇸', city: 'New York', ping: 98, load: 55, online: false, clients: 110, max: 200, ip: 'nyc-01.cwim.ru' },
  { name: 'USA West', flag: '🇺🇸', city: 'Los Angeles', ping: 115, load: 41, online: true, clients: 82, max: 200, ip: 'lax-01.cwim.ru' },
  { name: 'Japan', flag: '🇯🇵', city: 'Tokyo', ping: 165, load: 28, online: true, clients: 56, max: 200, ip: 'tky-01.cwim.ru' },
  { name: 'UK', flag: '🇬🇧', city: 'London', ping: 58, load: 49, online: true, clients: 98, max: 200, ip: 'lon-01.cwim.ru' },
  { name: 'Switzerland', flag: '🇨🇭', city: 'Zurich', ping: 62, load: 23, online: true, clients: 46, max: 200, ip: 'zrh-01.cwim.ru' },
]

export default function Servers() {
  const online = servers.filter(s => s.online)
  const offline = servers.filter(s => !s.online)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Серверы</h1>
        <p className="text-muted text-sm mt-1">{online.length} доступно · {offline.length} на обслуживании</p>
      </div>

      <div className="space-y-2">
        {servers.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
            <span className="text-2xl">{s.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{s.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.online ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <p className="text-xs text-muted mt-0.5">{s.city} · {s.ip}</p>
              <div className="flex items-center gap-3 text-xs text-muted mt-1.5">
                <span>{s.ping} ms</span>
                <span>{s.clients}/{s.max} клиентов</span>
                <span>Загрузка {s.load}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="w-12 bg-bg border border-border rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${s.load > 70 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${s.load}%` }} />
              </div>
              <button disabled={!s.online} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${s.online ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-border/30 text-muted cursor-not-allowed'}`}>
                {s.online ? 'Подключиться' : 'Offline'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
