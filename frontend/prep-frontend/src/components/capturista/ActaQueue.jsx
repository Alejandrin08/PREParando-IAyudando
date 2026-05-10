import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { actasApi } from '../../services/api'
import StatusBadge from '../shared/StatusBadge'

export default function ActaQueue() {
  const [actas, setActas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ queue: '', status: 'Pending' })
  const navigate = useNavigate()

  const fetchQueue = async () => {
    try {
      const params = {}
      if (filter.queue) params.queue = filter.queue
      if (filter.status) params.status = filter.status
      const res = await actasApi.getQueue(params)
      setActas(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [filter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl font-bold tracking-tight">Cola de actas</h1>
        <div className="flex gap-3">
          <select
            value={filter.queue}
            onChange={e => setFilter(f => ({ ...f, queue: e.target.value }))}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Toda la cola</option>
            <option value="High">Alta prioridad</option>
            <option value="Standard">Estándar</option>
          </select>
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todos los estados</option>
            <option value="Pending">Pendiente</option>
            <option value="InReview">En revisión</option>
            <option value="Approved">Aprobada</option>
            <option value="Rejected">Rechazada</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="font-mono text-zinc-500 animate-pulse">Cargando cola...</span>
        </div>
      ) : actas.length === 0 ? (
        <div className="border border-zinc-800 rounded-lg p-12 text-center">
          <p className="font-mono text-zinc-500">No hay actas con estos filtros</p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                {['ID', 'Entidad', 'Municipio', 'Sección', 'Cola', 'Estado', 'Confianza', 'Aritmética', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actas.map((acta, i) => (
                <tr
                  key={acta.id}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                    i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/30'
                  }`}
                  onClick={() => navigate(`/actas/${acta.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">#{acta.id}</td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-200">{acta.entity || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-200">{acta.municipality || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-400">{acta.section || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={acta.assignedQueue} /></td>
                  <td className="px-4 py-3"><StatusBadge value={acta.status} /></td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-300">
                    {(acta.globalConfidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    {acta.arithmeticValidationOk
                      ? <span className="text-emerald-400 font-mono text-xs">✓ OK</span>
                      : <span className="text-red-400 font-mono text-xs">✗ Error</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-zinc-500">Ver →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}