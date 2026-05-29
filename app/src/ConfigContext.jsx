import { createContext, useContext, useState, useEffect } from 'react'
import { apiJson, getTokens } from './api'

const ConfigContext = createContext(null)

const STORAGE_KEY = 'app_lang'

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null)
  const [plans, setPlans] = useState(null)
  const [lang, setLangState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'ru')
  const [langs, setLangs] = useState(['ru'])

  function setLang(l) {
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }

  useEffect(() => {
    apiJson(`/public/langs`).then(setLangs).catch(() => {})
  }, [])

  useEffect(() => {
    apiJson(`/public/config?lang=${lang}`).then(setConfig).catch(() => {})
    apiJson(`/public/plans?lang=${lang}`).then(setPlans).catch(() => {})
  }, [lang])

  const loading = config === null || plans === null

  function t(path, fallback) {
    if (!config) return fallback || path
    const keys = path.split('.')
    let val = config
    for (const k of keys) {
      if (val == null) return fallback || keys[keys.length - 1]
      val = val[k]
    }
    return val ?? fallback ?? keys[keys.length - 1]
  }

  return (
    <ConfigContext.Provider value={{ config, plans, lang, langs, setLang, t, loading }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}
