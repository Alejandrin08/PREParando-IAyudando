import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 uppercase">
            PREP · Sistema de Captura
          </span>
        </div>
        <div className="flex gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-mono tracking-wide transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/queue"
            className={({ isActive }) =>
              `text-sm font-mono tracking-wide transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            Cola de Actas
          </NavLink>
        </div>
      </div>
    </nav>
  )
}