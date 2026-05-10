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
    setLoading(true)
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
    <div className="max-w-screen-xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-semibold">Cola de actas</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            {actas.length} acta{actas.length !== 1 ? 's' : ''} con los filtros actuales
          </p>
        </div>
        <div className="flex gap-3">
          {[
            {
              value: filter.queue,
              onChange: v => setFilter(f => ({ ...f, queue: v })),
              options: [
                { value: '', label: 'Toda la cola' },
                { value: 'High', label: 'Alta prioridad' },
                { value: 'Standard', label: 'Estándar' },
              ]
            },
            {
              value: filter.status,
              onChange: v => setFilter(f => ({ ...f, status: v })),
              options: [
                { value: '', label: 'Todos los estados' },
                { value: 'Pending', label: 'Pendiente' },
                { value: 'InReview', label: 'En revisión' },
                { value: 'Approved', label: 'Aprobada' },
                { value: 'Rejected', label: 'Rechazada' },
              ]
            }
          ].map((sel, i) => (
            <select key={i} value={sel.value}
              onChange={e => sel.onChange(e.target.value)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
              className="text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
              {sel.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span style={{ color: 'var(--text-muted)' }} className="text-sm animate-pulse">Cargando...</span>
        </div>
      ) : actas.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl p-16 text-center">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">No hay actas con estos filtros</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                {['#', 'Entidad', 'Municipio', 'Sección', 'Cola', 'Estado', 'Confianza', 'Aritmética', ''].map(h => (
                  <th key={h} style={{ color: 'var(--text-muted)' }}
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actas.map((acta, i) => (
                <tr key={acta.id}
                  onClick={() => navigate(`/actas/${acta.id}`)}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  className="hover:bg-[var(--surface-2)] transition-colors cursor-pointer">
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}
                    className="px-5 py-3.5 text-sm">{acta.id}</td>
                  <td style={{ color: 'var(--text)' }} className="px-5 py-3.5 text-sm font-medium">
                    {acta.entity || '—'}
                  </td>
                  <td style={{ color: 'var(--text)' }} className="px-5 py-3.5 text-sm">
                    {acta.municipality || '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}
                    className="px-5 py-3.5 text-sm">{acta.section || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge value={acta.assignedQueue} /></td>
                  <td className="px-5 py-3.5"><StatusBadge value={acta.status} /></td>
                  <td style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)' }}
                    className="px-5 py-3.5 text-sm">
                    {(acta.globalConfidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-5 py-3.5">
                    {acta.arithmeticValidationOk
                      ? <span style={{ color: '#15803d' }} className="text-sm font-medium">✓ OK</span>
                      : <span style={{ color: '#b91c1c' }} className="text-sm font-medium">✗ Error</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <span style={{ color: 'var(--accent)' }} className="text-sm font-medium">
                      Revisar →
                    </span>
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