import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Preloader } from './ui'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Preloader />
  if (!user) return <Navigate to="/login" replace />
  return children
}
