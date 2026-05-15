import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/shared/Navbar'
import Dashboard from './components/dashboard/Dashboard'
import ActaQueue from './components/capturista/ActaQueue'
import ActaDetail from './components/capturista/ActaDetail'
import VerificadorQueue from './components/verificador/VerificadorQueue'
import AuditDashboard from './components/admin/AuditDashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      {children}
    </div>
  )
}

function SmartRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'Verificador') return <Navigate to="/verificador" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={
              <ProtectedRoute roles={['Admin', 'Capturista', 'Verificador']}>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/queue" element={
              <ProtectedRoute roles={['Admin', 'Capturista', 'Verificador']}>
                <AppLayout><ActaQueue /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/actas/:id" element={
              <ProtectedRoute roles={['Admin', 'Capturista', 'Verificador']}>
                <AppLayout><ActaDetail mode="capturista" /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/verificador" element={
              <ProtectedRoute roles={['Admin', 'Verificador']}>
                <AppLayout><VerificadorQueue /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/verificador/actas/:id" element={
              <ProtectedRoute roles={['Admin', 'Verificador']}>
                <AppLayout><ActaDetail mode="verificador" /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/auditoria" element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout><AuditDashboard /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/" element={<SmartRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}