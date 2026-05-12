import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { login } = useAuth()
  const { mode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form)
      login(res.data)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <button
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-muted)',
          padding: '0.375rem 0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.8rem',
          cursor: 'pointer'
        }}>
        {mode === 'light' ? '◑ Oscuro' : '◐ Claro'}
      </button>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'var(--accent)',
            borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <span style={{ fontFamily: 'DM Mono, monospace', color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>P</span>
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.375rem' }}>
            Sistema de Captura
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            PREP · Resultados Electorales
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '2rem'
        }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-2)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="usuario@prep.mx"
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text-2)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem'
              }}>
                <p style={{ color: '#b91c1c', fontSize: '0.8rem' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
                marginTop: '0.5rem'
              }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Acceso restringido a personal autorizado del PREP
        </p>
      </div>
    </div>
  )
}