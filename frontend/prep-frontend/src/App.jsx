import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/shared/Navbar'
import Dashboard from './components/dashboard/Dashboard'
import ActaQueue from './components/capturista/ActaQueue'
import ActaDetail from './components/capturista/ActaDetail'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { useEffect } from 'react'
import { applyTheme } from './context/ThemeContext'

function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['Admin', 'Capturista']}>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/queue" element={
              <ProtectedRoute roles={['Admin', 'Capturista']}>
                <AppLayout><ActaQueue /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/actas/:id" element={
              <ProtectedRoute roles={['Admin', 'Capturista']}>
                <AppLayout><ActaDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}