import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      className="px-8 py-0 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--accent)' }} className="w-6 h-6 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)' }}
              className="text-sm font-medium tracking-tight">
              PREP <span style={{ color: 'var(--text-muted)' }}>· Sistema de Captura</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/queue', label: 'Cola de actas' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-4 py-4 text-sm font-medium transition-colors border-b-2 ${isActive
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full">
          <div style={{ background: 'var(--accent)' }} className="w-5 h-5 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span style={{ fontFamily: 'DM Mono, monospace' }} className="text-xs text-[var(--text-muted)]">
            capturista_01
          </span>
        </div>
      </div>
    </nav>
  )
}