import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando...</span>
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (roles && !roles.includes(user.role))
    return <Navigate to="/sin-acceso" replace />

  return children
}