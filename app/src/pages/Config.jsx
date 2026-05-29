import { useState, useEffect } from 'react'
import { apiCached } from '../api'
import { BackButton } from '../ui'
import { useConfig } from '../ConfigContext'

export default function Config() {
  const { t } = useConfig()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    apiCached('/user/subscription/config').then(setConfig).catch((err) => {
      setError(err.message)
    }).finally(() => setLoading(false))
  }, [])

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(link.slice(0, 20))
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(link.slice(0, 20))
      setTimeout(() => setCopied(null), 2000)
    }
  }

  function downloadAll() {
    if (!config?.links?.length) return
    const text = config.links.map(l => l.link).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cwim-config.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton />
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted">{t('app.common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !config?.links?.length) {
    return (
      <div className="space-y-6">
        <BackButton />
        <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-muted text-sm">{error || t('app.pages.config.no_subscription')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-xl font-bold">{t('app.pages.config.title')}</h1>
        <p className="text-muted text-sm mt-1">{config.server_name} · {config.protocol.toUpperCase()} · {config.host}:{config.port}</p>
      </div>

      {config.links.map((item, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">{item.protocol.toUpperCase()} {t('app.pages.config.config')}</span>
            <span className="text-[10px] text-muted bg-bg px-2 py-1 rounded-full">{item.protocol}</span>
          </div>
          <div className="px-5 pb-5">
            <div className="bg-bg border border-border rounded-xl p-4 text-xs font-mono text-muted break-all select-all leading-relaxed">
              {item.link}
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-2">
            <button
              onClick={() => copyLink(item.link)}
              className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {copied === item.link.slice(0, 20) ? t('app.pages.config.copied') : t('app.pages.config.copy')}
            </button>
          </div>
        </div>
      ))}

      {config.links.length > 1 && (
        <button onClick={downloadAll} className="w-full bg-surface border border-border rounded-xl py-3 text-sm font-medium text-muted hover:border-primary transition-colors">
          {t('app.pages.config.download_all')}
        </button>
      )}

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-sm">{t('app.pages.config.how_title')}</h3>
        <ol className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>{t('app.pages.config.step1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span>{t('app.pages.config.step2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>{t('app.pages.config.step3')}</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
