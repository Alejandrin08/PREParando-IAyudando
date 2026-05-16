import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { actasApi } from '../../services/api'
import StatusBadge from '../shared/StatusBadge'

export default function VerificadorQueue() {
  const [actas, setActas] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await actasApi.getVerificadorQueue({})
      setActas(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQueue() }, [])

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ color: 'var(--text)' }} className="text-2xl font-semibold">
              Cola de Verificación
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#7c3aed',
                background: '#ede9fe',
                borderRadius: 4,
                padding: '2px 8px',
              }}
            >
              VERIFICADOR
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {actas.length} acta{actas.length !== 1 ? 's' : ''} rechazadas por capturista pendientes de verificación
          </p>
        </div>
        <button
          onClick={fetchQueue}
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
          className="text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
        >
          ↻ Actualizar
        </button>
      </div>

      <div
        style={{
          background: '#f5f3ff',
          border: '1px solid #c4b5fd',
          borderRadius: 12,
          padding: '12px 20px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 18 }}>🔍</span>
        <p style={{ color: '#5b21b6', fontSize: 13 }}>
          Estas actas fueron rechazadas por el capturista. Como Verificador, puedes corregir 
          campos erróneos de la IA y decidir si el acta es <strong>contabilizable</strong> o 
          debe <strong>rechazarse definitivamente</strong> con un motivo oficial.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span style={{ color: 'var(--text-muted)' }} className="text-sm animate-pulse">Cargando...</span>
        </div>
      ) : actas.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl p-16 text-center">
          <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
          <p style={{ color: 'var(--text)' }} className="text-sm font-medium mb-1">
            Sin actas pendientes
          </p>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs">
            No hay actas rechazadas por capturista esperando verificación
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                {['#', 'Entidad', 'Municipio', 'Sección', 'Estado', 'Confianza', 'Aritmética', 'Ingresada', ''].map(h => (
                  <th key={h} style={{ color: 'var(--text-muted)' }}
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actas.map((acta) => (
                <tr key={acta.id}
                  onClick={() => navigate(`/verificador/actas/${acta.id}`)}
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
                  <td className="px-5 py-4"><StatusBadge value={acta.status} /></td>
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
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}
                    className="px-5 py-3.5 text-xs">
                    {new Date(acta.ingestedAt).toLocaleDateString('es-MX', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span style={{ color: '#7c3aed' }} className="text-sm font-medium">
                      Verificar →
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