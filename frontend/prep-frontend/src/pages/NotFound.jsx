import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <p style={{ fontFamily: 'DM Mono, monospace', color: 'var(--accent)', fontSize: '4rem', fontWeight: 700, lineHeight: 1 }}>
        404
      </p>
      <h1 style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '1.5rem', fontWeight: 300 }}>
        Página no encontrada
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '320px' }}>
        La dirección que buscas no existe o no tienes permiso para acceder.
      </p>
      <Link to="/dashboard"
        style={{
          background: 'var(--accent)',
          color: 'white',
          padding: '0.625rem 1.25rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          textDecoration: 'none',
          marginTop: '0.5rem'
        }}>
        Volver al inicio
      </Link>
    </div>
  )
}