import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import UploadModal from '../UploadModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { mode, toggleTheme, increaseFontSize, decreaseFontSize } = useTheme()
  const [showUpload, setShowUpload] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isVerificador = user?.role === 'Verificador'
  const isAdmin = user?.role === 'Admin'
  const isCapturista = user?.role === 'Capturista'

  const navLinks = [
    { to: '/dashboard', label: 'Tablero de control' },
    { to: '/queue', label: 'Cola de actas' },
  ]

  if (isAdmin || isVerificador) {
    navLinks.push({ to: '/verificador', label: 'Cola de verificación' })
  }

  if (isAdmin) {
    navLinks.push({ to: '/auditoria', label: 'Auditoría' })
  }

  return (
    <>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--accent)' }}
              className="w-6 h-6 rounded flex items-center justify-center">
              <span style={{ fontFamily: 'DM Mono, monospace' }} className="text-white text-xs font-bold">P</span>
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)' }} className="text-sm font-medium">
              PREP{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                · {isVerificador ? 'Verificación' : 'Captura'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                style={({ isActive }) => ({
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '0 1rem',
                  height: '3.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                })}>
                {label}
              </NavLink>
            ))}

            {isAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  marginLeft: '0.5rem',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                ↑ Subir actas
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex' }}>
              <button onClick={decreaseFontSize}
                style={{ color: 'var(--text-muted)', padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                A−
              </button>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <button onClick={increaseFontSize}
                style={{ color: 'var(--text-muted)', padding: '0.3rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                A+
              </button>
            </div>

            <button onClick={toggleTheme}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                padding: '0.3rem 0.625rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}>
              {mode === 'light' ? '◑' : '◐'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text)', fontSize: '0.775rem', fontWeight: 500, lineHeight: 1.2 }}>
                  {user?.fullName}
                </p>
                <p style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                  <span style={{
                    color: isVerificador ? '#7c3aed' : isAdmin ? '#b45309' : 'var(--text-muted)',
                    fontWeight: isVerificador || isAdmin ? 600 : 400,
                  }}>
                    {user?.role}
                  </span>
                </p>
              </div>
              <button onClick={handleLogout}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                  padding: '0.3rem 0.625rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}>
                Salir
              </button>
            </div>
          </div>

        </div>
      </nav>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  )
}