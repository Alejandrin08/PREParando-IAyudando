import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { mode, toggleTheme, increaseFontSize, decreaseFontSize } = useTheme()

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div style={{ background: 'var(--accent)' }}
            className="w-7 h-7 rounded flex items-center justify-center">
            <span style={{ fontFamily: 'DM Mono, monospace' }}
              className="text-white text-xs font-bold">P</span>
          </div>
          <div>
            <span style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)' }}
              className="text-base font-semibold">PREP</span>
            <span style={{ color: 'var(--text-muted)' }} className="text-sm ml-2">
              Resultados Electorales Preliminares
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { to: '/', label: 'Inicio' },
            { to: '/resultados', label: 'Resultados' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} end
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
        </nav>

        <div className="flex items-center gap-2">
          <div style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
            className="flex items-center rounded-lg overflow-hidden">
            <button onClick={decreaseFontSize}
              style={{ color: 'var(--text-muted)', padding: '0.375rem 0.625rem' }}
              className="hover:bg-[var(--border)] transition-colors text-sm font-bold"
              title="Reducir texto">A−</button>
            <div style={{ width: '1px', background: 'var(--border)', height: '1.5rem' }} />
            <button onClick={increaseFontSize}
              style={{ color: 'var(--text-muted)', padding: '0.375rem 0.625rem' }}
              className="hover:bg-[var(--border)] transition-colors text-sm font-bold"
              title="Aumentar texto">A+</button>
          </div>

          <button onClick={toggleTheme}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            className="hover:bg-[var(--border)] transition-colors"
            title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
            {mode === 'light' ? '◑ Oscuro' : '◐ Claro'}
          </button>
        </div>
      </div>
    </header>
  )
}