import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { actasApi } from '../../services/api'
import ActaViewer from './ActaViewer'
import StatusBadge from '../shared/StatusBadge'
import { fieldLabels, validationLabels, partyIcons, fieldOrder } from '../../utils/labels'

const isTotalField = name =>
  name.startsWith('total_') || name === 'lista_nominal' || name === 'boletas_sobrantes'

const isIdentityField = name =>
  ['entidad', 'municipio', 'seccion'].includes(name)

export default function ActaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [acta, setActa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedField, setSelectedField] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const capturista = 'capturista_01'

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

  const handleCorrect = async () => {
    if (!editingField) return
    try {
      setActionLoading(true)
      await actasApi.correctField(id, {
        fieldName: editingField,
        newValue: editValue,
        correctedBy: capturista
      })
      setEditingField(null)
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
      <span style={{ color: 'var(--text-muted)' }} className="text-sm animate-pulse">Cargando acta...</span>
    </div>
  )

  if (!acta) return (
    <div className="flex items-center justify-center h-64">
      <span style={{ color: 'var(--text-muted)' }} className="text-sm">Acta no encontrada</span>
    </div>
  )

  const sortedFields = [...acta.fields].sort((a, b) => {
    const ai = fieldOrder.indexOf(a.name)
    const bi = fieldOrder.indexOf(b.name)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const voteFields = sortedFields.filter(f =>
    !isIdentityField(f.name) && !isTotalField(f.name)
  )
  const totalFields = sortedFields.filter(f => isTotalField(f.name))

  const canEdit = acta.status !== 'Approved' && acta.status !== 'Rejected'

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/queue')}
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            className="text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
            ← Volver
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ color: 'var(--text)' }} className="text-xl font-semibold">
                Acta #{acta.id}
              </h1>
              <StatusBadge value={acta.assignedQueue} />
              <StatusBadge value={acta.status} />
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">
              {acta.entity} · {acta.municipality} · Sección {acta.section}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button onClick={handleReject} disabled={actionLoading}
              style={{ border: '1px solid #fca5a5', color: '#b91c1c' }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
              Rechazar acta
            </button>
            <button onClick={handleApprove} disabled={actionLoading}
              style={{ background: 'var(--accent)', color: 'white' }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              Aprobar acta
            </button>
          </div>
        )}
      </div>

      {acta.alerts?.length > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047' }}
          className="rounded-xl px-5 py-4">
          <p style={{ color: '#854d0e' }} className="text-xs font-semibold uppercase tracking-widest mb-2">
            Alertas del sistema
          </p>
          <ul className="space-y-1">
            {acta.alerts.map((alert, i) => (
              <li key={i} style={{ color: '#92400e' }} className="text-sm">· {alert}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {acta.imageUrl && (
          <div className="lg:sticky lg:top-20">
            <ActaViewer
              imageUrl={acta.imageUrl}
              fields={acta.fields}
              selectedField={selectedField}
            />
          </div>
        )}

        <div className="space-y-5">

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            className="rounded-xl overflow-hidden">
            <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
              className="px-5 py-3">
              <h2 style={{ color: 'var(--text)' }} className="text-sm font-semibold">
                Validaciones aritméticas
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {acta.validations.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: v.passed ? '#dcfce7' : '#fee2e2' }}>
                    <span style={{ color: v.passed ? '#15803d' : '#b91c1c' }} className="text-xs font-bold">
                      {v.passed ? '✓' : '✗'}
                    </span>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text)' }} className="text-sm">
                      {validationLabels[v.ruleName] ?? v.ruleName}
                    </p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">{v.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            className="rounded-xl overflow-hidden">
            <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
              className="px-5 py-3 flex items-center justify-between">
              <h2 style={{ color: 'var(--text)' }} className="text-sm font-semibold">Resultados de votación</h2>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }} className="text-xs">
                Confianza global: {(acta.globalConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {voteFields.map(field => (
                <FieldRow
                  key={field.name}
                  field={field}
                  isSelected={selectedField === field.name}
                  isEditing={editingField === field.name}
                  editValue={editValue}
                  canEdit={canEdit}
                  onSelect={() => setSelectedField(
                    selectedField === field.name ? null : field.name
                  )}
                  onEdit={() => {
                    setEditingField(field.name)
                    setEditValue(field.value ?? '')
                  }}
                  onEditChange={setEditValue}
                  onSave={handleCorrect}
                  onCancel={() => setEditingField(null)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </div>

          {/* Totales y control */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            className="rounded-xl overflow-hidden">
            <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
              className="px-5 py-3">
              <h2 style={{ color: 'var(--text)' }} className="text-sm font-semibold">Totales y control</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {totalFields.map(field => (
                <FieldRow
                  key={field.name}
                  field={field}
                  isSelected={selectedField === field.name}
                  isEditing={editingField === field.name}
                  editValue={editValue}
                  canEdit={canEdit}
                  onSelect={() => setSelectedField(
                    selectedField === field.name ? null : field.name
                  )}
                  onEdit={() => {
                    setEditingField(field.name)
                    setEditValue(field.value ?? '')
                  }}
                  onEditChange={setEditValue}
                  onSave={handleCorrect}
                  onCancel={() => setEditingField(null)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function FieldRow({
  field, isSelected, isEditing, editValue, canEdit,
  onSelect, onEdit, onEditChange, onSave, onCancel, actionLoading
}) {
  const label = fieldLabels[field.name] ?? field.name
  const icon = partyIcons[field.name]
  const confPct = (field.confidence * 100).toFixed(0)

  const confidenceColor =
    field.confidenceLevel === 'Low' ? '#b91c1c' :
    field.confidenceLevel === 'Medium' ? '#b45309' : '#15803d'

  const rowBg =
    isSelected ? '#f0fdf4' :
    field.confidenceLevel === 'Low' ? '#fff1f2' :
    field.confidenceLevel === 'Medium' ? '#fffbeb' : 'transparent'

  return (
    <div
      onClick={onSelect}
      style={{ background: rowBg, cursor: 'pointer' }}
      className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors">

      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {icon ? (
          <img src={icon} alt={label} className="w-7 h-7 object-contain"
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            className="w-7 h-7 rounded-full" />
        )}
      </div>

      <span style={{ color: 'var(--text)' }} className="text-sm flex-1">{label}</span>

      {isEditing ? (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editValue}
            onChange={e => onEditChange(e.target.value)}
            style={{ border: '1px solid var(--accent)', color: 'var(--text)', background: 'var(--surface)' }}
            className="w-20 px-2 py-1 rounded text-sm text-right focus:outline-none"
            autoFocus
          />
          <button onClick={onSave} disabled={actionLoading}
            style={{ background: 'var(--accent)', color: 'white' }}
            className="px-3 py-1 rounded text-xs font-medium disabled:opacity-50">
            Guardar
          </button>
          <button onClick={onCancel}
            style={{ color: 'var(--text-muted)' }}
            className="px-2 py-1 text-xs">
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)', minWidth: '3rem', textAlign: 'right' }}
            className="text-sm font-medium">
            {field.value ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', color: confidenceColor, fontSize: '11px', minWidth: '2.5rem', textAlign: 'right' }}>
            {confPct}%
          </span>
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              style={{ color: 'var(--accent)' }}
              className="text-xs font-medium opacity-0 group-hover:opacity-100 hover:underline w-12 text-right">
              Corregir
            </button>
          )}
        </div>
      )}
    </div>
  )
}