import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from './Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Pricing from './pages/Pricing'
import Servers from './pages/Servers'
import History from './pages/History'
import Support from './pages/Support'
import Guides from './pages/Guides'
import Referrals from './pages/Referrals'

const P = (Page) => <ProtectedRoute><Layout><Page /></Layout></ProtectedRoute>

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={P(Dashboard)} />
          <Route path="/profile" element={P(Profile)} />
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
