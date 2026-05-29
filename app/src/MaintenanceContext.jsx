import { createContext, useContext, useState, useEffect } from 'react'

const MaintenanceContext = createContext(null)

export function MaintenanceProvider({ children }) {
  const [showMaintenance, setShowMaintenance] = useState(null)

  useEffect(() => {
    fetch('/api/public/maintenance')
      .then(r => r.json())
      .then(d => setShowMaintenance(d.app && !d.can_bypass))
      .catch(() => setShowMaintenance(false))
  }, [])

  return (
    <MaintenanceContext.Provider value={{ showMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  )
}

export function useMaintenance() {
  return useContext(MaintenanceContext)
}
