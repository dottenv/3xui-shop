import { Spin } from 'antd'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Orders from './pages/Orders'
import Admins from './pages/Admins'

function Guard({ children }) {
  const { admin, loading, hasAdmins } = useAuth()

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  )

  // hasAdmins = null means still loading
  if (hasAdmins === null) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  )

  // No admin + hasAdmins=false -> registration
  // No admin + hasAdmins=true  -> login
  if (!admin) return <AuthPage />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Guard>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="orders" element={<Orders />} />
              <Route path="admins" element={<Admins />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Guard>
      </AuthProvider>
    </BrowserRouter>
  )
}
