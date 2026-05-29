import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { useConfig } from './ConfigContext'
import { useMaintenance } from './MaintenanceContext'
import { Preloader } from './ui'
import ProtectedRoute from './ProtectedRoute'
import Layout from './Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import SettingsPersonal from './pages/SettingsPersonal'
import SettingsSecurity from './pages/SettingsSecurity'
import SettingsLanguage from './pages/SettingsLanguage'
import SettingsTheme from './pages/SettingsTheme'
import Pricing from './pages/Pricing'
import Servers from './pages/Servers'
import History from './pages/History'
import Support from './pages/Support'
import Guides from './pages/Guides'
import Referrals from './pages/Referrals'
import MaintenancePage from './pages/MaintenancePage'

const P = (Page) => <ProtectedRoute><Layout><Page /></Layout></ProtectedRoute>

export default function App() {
  const { showMaintenance } = useMaintenance()
  const { loading: configLoading } = useConfig()

  if (showMaintenance === null || configLoading) return <Preloader />

  if (showMaintenance) return <MaintenancePage />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={P(Dashboard)} />
          <Route path="/settings" element={P(Settings)} />
          <Route path="/settings/personal" element={P(SettingsPersonal)} />
          <Route path="/settings/security" element={P(SettingsSecurity)} />
          <Route path="/settings/language" element={P(SettingsLanguage)} />
          <Route path="/settings/theme" element={P(SettingsTheme)} />
          <Route path="/profile" element={<Navigate to="/settings" replace />} />
          <Route path="/pricing" element={P(Pricing)} />
          <Route path="/servers" element={P(Servers)} />
          <Route path="/history" element={P(History)} />
          <Route path="/support" element={P(Support)} />
          <Route path="/guides" element={P(Guides)} />
          <Route path="/referrals" element={P(Referrals)} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
