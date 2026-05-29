import { createContext, useContext, useState, useEffect } from 'react'

const MaintenanceContext = createContext(null)

export function MaintenanceProvider({ children }) {
  const [maintenance, setMaintenance] = useState(null)

  useEffect(() => {
    fetch('/api/public/maintenance')
      .then(r => r.json())
      .then(d => setMaintenance(d.app))
      .catch(() => setMaintenance(false))
  }, [])

  return (
    <MaintenanceContext.Provider value={{ maintenance }}>
      {children}
    </MaintenanceContext.Provider>
  )
}

export function useMaintenance() {
  return useContext(MaintenanceContext)
}
