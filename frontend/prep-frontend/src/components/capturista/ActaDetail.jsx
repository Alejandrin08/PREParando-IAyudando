import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { actasApi } from '../../services/api'
import StatusBadge from '../shared/StatusBadge'
import ActaViewer from './ActaViewer'

export default function ActaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [acta, setActa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const capturista = 'capturista_01' 
  const [selectedField, setSelectedField] = useState(null)

  const fetchActa = async () => {
    try {
      const res = await actasApi.getActa(id)
      setActa(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchActa() }, [id])

  const handleCorrect = async (fieldName, newValue) => {
    try {
      setActionLoading(true)
      await actasApi.correctField(id, { fieldName, newValue, correctedBy: capturista })
      setEditing(e => ({ ...e, [fieldName]: false }))
      fetchActa()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await actasApi.approveActa(id, capturista)
      navigate('/queue')
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setActionLoading(true)
      await actasApi.rejectActa(id, capturista)
      navigate('/queue')
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="font-mono text-zinc-500 animate-pulse">Cargando acta...</span>
    </div>
  )

  if (!acta) return (
    <div className="text-center py-12">
      <p className="font-mono text-zinc-500">Acta no encontrada</p>
    </div>
  )

  const voteFields = acta.fields.filter(f =>
    f.name.startsWith('votos_') || f.name.startsWith('total_') ||
    f.name.startsWith('boletas_') || f.name.startsWith('lista_')
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/queue')}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-2 block"
          >
            ← Volver a la cola
          </button>
          <h1 className="font-mono text-xl font-bold">
            Acta #{acta.id}
          </h1>
          <p className="font-mono text-sm text-zinc-500 mt-1">
            {acta.entity} · {acta.municipality} · Sección {acta.section}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={acta.assignedQueue} />
          <StatusBadge value={acta.status} />
        </div>
      </div>

      {acta.alerts?.length > 0 && (
        <div className="border border-yellow-400/20 bg-yellow-400/5 rounded-lg p-4 space-y-1">
          <p className="text-xs font-mono text-yellow-400 uppercase tracking-widest mb-2">Alertas del sistema</p>
          {acta.alerts.map((alert, i) => (
            <p key={i} className="text-sm font-mono text-yellow-300">· {alert}</p>
          ))}
        </div>
      )}

      {acta.imageUrl && (
        <ActaViewer
          imageUrl={acta.imageUrl}
          fields={acta.fields}
          selectedField={selectedField}
        />
      )}

      <div className="border border-zinc-800 rounded-lg p-5 bg-zinc-900">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Validaciones aritméticas</p>
        <div className="space-y-2">
          {acta.validations.map((v, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className={`font-mono text-sm mt-0.5 ${v.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {v.passed ? '✓' : '✗'}
              </span>
              <div>
                <p className="font-mono text-xs text-zinc-400">{v.ruleName}</p>
                <p className="font-mono text-xs text-zinc-600">{v.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Campos extraídos · Confianza global: {(acta.globalConfidence * 100).toFixed(0)}%
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              {['Campo', 'Valor extraído', 'Confianza', 'Nivel', 'Acción'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-mono text-zinc-600 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {voteFields.map((field, i) => (
              <tr
                key={field.name}
                onClick={() => setSelectedField(
                  selectedField === field.name ? null : field.name
                )}
                className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
                  selectedField === field.name ? 'bg-emerald-950/30' :
                  field.confidenceLevel === 'Low' ? 'bg-red-950/20' :
                  field.confidenceLevel === 'Medium' ? 'bg-yellow-950/20' :
                  i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/20'
                } hover:bg-zinc-800/40`}
              >
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{field.name}</td>
                <td className="px-4 py-2.5">
                  {editing[field.name] ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={field.value}
                        id={`edit-${field.name}`}
                        className="bg-zinc-800 border border-emerald-500 rounded px-2 py-1 text-sm font-mono text-zinc-100 w-24 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const val = document.getElementById(`edit-${field.name}`).value
                          handleCorrect(field.name, val)
                        }}
                        className="text-xs font-mono text-emerald-400 hover:text-emerald-300"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditing(e => ({ ...e, [field.name]: false }))}
                        className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono text-sm text-zinc-200">
                      {field.value ?? <span className="text-zinc-600">—</span>}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-sm text-zinc-400">
                  {(field.confidence * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge value={field.confidenceLevel} type="confidence" />
                </td>
                <td className="px-4 py-2.5">
                  {!editing[field.name] && acta.status !== 'Approved' && acta.status !== 'Rejected' && (
                    <button
                      onClick={() => setEditing(e => ({ ...e, [field.name]: true }))}
                      className="text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors"
                    >
                      Corregir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {acta.status !== 'Approved' && acta.status !== 'Rejected' && (
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="px-5 py-2 border border-red-500/30 text-red-400 font-mono text-sm rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            Rechazar acta
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-5 py-2 bg-emerald-500 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            Aprobar acta
          </button>
        </div>
      )}
    </div>
  )
}