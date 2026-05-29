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

  return (
    <ConfigContext.Provider value={{ config, plans, lang, langs, setLang }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}
