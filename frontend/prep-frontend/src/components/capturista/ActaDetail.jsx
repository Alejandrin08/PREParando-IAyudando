import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { actasApi } from '../../services/api'
import ActaViewer from './ActaViewer'
import StatusBadge from '../shared/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { fieldLabels, validationLabels, partyIcons, fieldOrder } from '../../utils/labels'

const isTotalField = n => n.startsWith('total_') || n === 'lista_nominal' || n === 'boletas_sobrantes'
const isIdentityField = n => ['entidad', 'municipio', 'seccion'].includes(n)
const ALL_REJECTION = { Contabilizada: [], NoContabilizada: [] }

function Toast({ message, type, onDone }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 2800)
    const t2 = setTimeout(onDone, 3300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  const C = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '✓' },
    error: { bg: '#fff1f2', border: '#fca5a5', text: '#b91c1c', icon: '✗' },
    info: { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9', icon: 'ℹ' },
  }[type] ?? { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9', icon: 'ℹ' }

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      transition: 'opacity 0.4s, transform 0.4s',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
      minWidth: 260, maxWidth: 380,
    }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.border, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{C.icon}</span>
      <p style={{ fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>{message}</p>
    </div>
  )
}
function useToast() {
  const [t, setT] = useState(null)
  return {
    show: (message, type = 'success') => setT({ message, type, key: Date.now() }),
    node: t ? <Toast key={t.key} message={t.message} type={t.type} onDone={() => setT(null)} /> : null,
  }
}

const REJECTION_OPTIONS = {
  Contabilizada: [
    { value: 'Ilegible', label: 'Ilegible', description: 'La cantidad de votos en algún campo del Acta PREP no puede leerse, tanto en letra como en número.' },
    { value: 'SinDato', label: 'Sin Dato', description: 'La cantidad de votos no fue asentada en el Acta PREP ni en letra ni en número en algún campo del Acta PREP.' },
  ],
  NoContabilizada: [
    { value: 'ExcedeLN', label: 'Excede Lista Nominal', description: 'La suma de todos los votos en el Acta PREP excede el número de ciudadanas y ciudadanos en la Lista Nominal de Electores de la casilla, incluido el número de votos emitidos por los representantes de los Partidos Políticos.' },
    { value: 'SinActa', label: 'Sin Acta', description: 'El Acta PREP no llegó junto con el paquete electoral al Centro de Acopio y Transmisión de Datos (CATD), por alguna de las siguientes causas:\n1. Sin Acta por paquete no entregado.\n2. Sin Acta por casilla no instalada.\n3. Sin Acta por paquete entregado sin sobre.' },
    { value: 'TodosIlegibles', label: 'Todos los campos ilegibles o sin dato', description: 'Todos los campos del Acta PREP correspondientes al número de votos, son ilegibles o no contienen dato alguno, tanto en letra como en número.' },
  ],
}
const PARTIAL_OPTIONS = [
  { value: 'CamposIlegibles', label: 'Campos parcialmente ilegibles', description: 'Algunos campos no pudieron ser identificados con certeza.' },
  { value: 'DatosParciales', label: 'Datos parciales visibles', description: 'El acta tiene información suficiente para contabilizarse, aunque algunos campos están incompletos.' },
]
const ALL_FLAT = [...REJECTION_OPTIONS.Contabilizada, ...REJECTION_OPTIONS.NoContabilizada]

function Modal({ onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
          width: '100%', maxWidth: 780,
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ReasonColumn({ title, accentColor, accentBg, categoryKey, selectedCategory, selectedReason, onCategory, onSelect, options, description }) {
  const isActive = selectedCategory === categoryKey
  return (
    <div style={{ flex: 1 }}>
      <button type="button" onClick={() => onCategory(categoryKey)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: isActive ? accentColor : 'var(--border)', flexShrink: 0, transition: 'background 0.15s' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? accentColor : 'var(--text-muted)', transition: 'color 0.15s' }}>{title}</span>
      </button>
      {description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{description}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(opt => {
          const checked = isActive && selectedReason === opt.value
          return (
            <button key={opt.value} type="button"
              onClick={() => onSelect(categoryKey, opt.value)}
              style={{
                display: 'flex', gap: 10, cursor: 'pointer', padding: '10px 12px', textAlign: 'left', width: '100%',
                borderRadius: 8, border: `1px solid ${checked ? accentColor : 'var(--border)'}`,
                background: checked ? accentBg : 'transparent', transition: 'all 0.15s',
              }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `2px solid ${checked ? accentColor : 'var(--border)'}`,
                background: checked ? accentColor : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}>
                {checked && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{opt.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{opt.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MotiveModal({ mode, selection, onSelection, onConfirm, onClose, actionLoading }) {
  const [category, setCategory] = useState(selection?.category ?? '')
  const [reason, setReason] = useState(selection?.reason ?? '')

  const handleSelect = (cat, r) => { setCategory(cat); setReason(r); onSelection({ category: cat, reason: r }) }
  const handleCatOnly = cat => { setCategory(cat); setReason(''); onSelection(null) }

  const isReject = mode === 'reject'
  const canSubmit = isReject ? (!!category && !!reason) : !!reason

  const title = isReject ? 'Rechazar totalmente' : 'Motivo de contabilización parcial'
  const submitLabel = isReject
    ? (reason ? `Confirmar: ${ALL_FLAT.find(o => o.value === reason)?.label}` : 'Selecciona un motivo')
    : (reason ? `Confirmar contabilización parcial` : 'Selecciona un motivo')
  const submitColor = isReject ? '#b91c1c' : '#15803d'

  return (
    <Modal onClose={onClose}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{isReject ? '⚠️' : '📋'}</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {isReject
                ? 'Indica el motivo oficial para el registro del sistema PREP'
                : 'Indica el motivo por el cual se contabiliza con campos incompletos'}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', lineHeight: 1 }}>
          ✕
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {isReject ? (
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
            <ReasonColumn
              title="No Contabilizadas" accentColor="#be185d" accentBg="#fce7f3"
              categoryKey="NoContabilizada"
              selectedCategory={category} selectedReason={reason}
              onCategory={handleCatOnly} onSelect={handleSelect}
              options={REJECTION_OPTIONS.NoContabilizada}
              description={null}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Los campos marcados como <strong style={{ color: '#b45309' }}>ILEGIBLE</strong> quedarán registrados como no identificados.
            </p>
            {PARTIAL_OPTIONS.map(opt => {
              const checked = reason === opt.value
              return (
                <button key={opt.value} type="button"
                  onClick={() => { setReason(opt.value); onSelection({ category: 'Parcial', reason: opt.value }) }}
                  style={{
                    display: 'flex', gap: 10, cursor: 'pointer', padding: '12px 14px', textAlign: 'left', width: '100%',
                    borderRadius: 8, border: `1px solid ${checked ? '#16a34a' : '#86efac'}`,
                    background: checked ? '#dcfce7' : 'transparent', transition: 'all 0.15s',
                  }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: `2px solid ${checked ? '#16a34a' : '#86efac'}`, background: checked ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {checked && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 2 }}>{opt.label}</p>
                    <p style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={!canSubmit || actionLoading}
          style={{
            padding: '9px 22px', borderRadius: 8, border: 'none',
            background: canSubmit ? submitColor : 'var(--surface-2)',
            color: canSubmit ? 'white' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
          }}>
          {actionLoading ? 'Procesando...' : submitLabel}
        </button>
      </div>
    </Modal>
  )
}

function ConfirmContabilizarModal({ acta, localEdits, onConfirm, onClose, actionLoading }) {
  const fieldLabelsMap = fieldLabels ?? {}

  // Build change summary
  const ilegibles = []
  const sinDatos = []
  const modificados = []

  acta.fields.forEach(f => {
    const local = localEdits[f.name]
    const original = f.value
    if (local !== undefined) {
      if (local === 'ILEGIBLE') ilegibles.push(f.name)
      else if (local === 'SIN_DATO') sinDatos.push(f.name)
      else modificados.push({ name: f.name, from: original, to: local })
    } else if (original === 'ILEGIBLE') {
      ilegibles.push(f.name)
    }
  })

  const labelOf = n => fieldLabelsMap[n] ?? n

  return (
    <Modal onClose={onClose}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Confirmar contabilización</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Revisa los cambios antes de contabilizar el acta</p>
          </div>
        </div>
        <button type="button" onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ilegibles.length === 0 && sinDatos.length === 0 && modificados.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No hay cambios registrados. El acta se contabilizará con los valores originales.</p>
        )}

        {ilegibles.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Campos marcados como ILEGIBLE ({ilegibles.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ilegibles.map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fcd34d' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', fontFamily: 'DM Mono, monospace' }}>ILEGIBLE</span>
                  <span style={{ fontSize: 12, color: '#92400e', flex: 1 }}>{labelOf(n)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sinDatos.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Campos marcados como SIN DATO ({sinDatos.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sinDatos.map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#ede9fe', borderRadius: 6, border: '1px solid #c4b5fd' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', fontFamily: 'DM Mono, monospace' }}>SIN DATO</span>
                  <span style={{ fontSize: 12, color: '#4c1d95', flex: 1 }}>{labelOf(n)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {modificados.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Campos modificados ({modificados.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {modificados.map(({ name, from, to }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#e0f2fe', borderRadius: 6, border: '1px solid #7dd3fc' }}>
                  <span style={{ fontSize: 12, color: '#0c4a6e', flex: 1 }}>{labelOf(name)}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>{from ?? '—'}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>→</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 700, color: '#0891b2' }}>{to}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={actionLoading}
          style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#15803d', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
          {actionLoading ? 'Procesando...' : 'Confirmar y contabilizar'}
        </button>
      </div>
    </Modal>
  )
}

function FieldRow({ field, localValue, isSelected, isEditing, editValue, canEdit, onSelect, onEdit, onEditChange, onLocalSave, onCancel }) {
  const label = fieldLabels[field.name] ?? field.name
  const icon = partyIcons[field.name]
  const isRef = !!field._referenceOnly
  const displayVal = isRef ? field.value : (localValue !== undefined ? localValue : field.value)
  const isIlegible = displayVal === 'ILEGIBLE'
  const isSinDato = displayVal === 'SIN_DATO'
  const isEdited = !isRef && localValue !== undefined && localValue !== field.value
  const confPct = (field.confidence * 100).toFixed(0)

  const confidenceColor =
    field.confidenceLevel === 'Low' ? '#b91c1c' :
      field.confidenceLevel === 'Medium' ? '#b45309' : '#15803d'

  const rowBg =
    isEdited ? '#fefce8' :
      field.confidenceLevel === 'Low' ? '#fff1f2' :
        field.confidenceLevel === 'Medium' ? '#fffbeb' : 'transparent'

  // Reference-only row (lista_nominal from validation): no interaction
  if (isRef) {
    return (
      <div
        data-field={field.name}
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--border)', cursor: 'default' }}
        className="pl-3 pr-4 py-2.5 flex items-center gap-3"
      >
        <div className="w-6 h-6 shrink-0 flex items-center justify-center">
          <div style={{ background: 'var(--border)', border: '1px solid var(--border)' }} className="w-6 h-6 rounded-full" />
        </div>
        <span style={{ color: 'var(--text-muted)', flex: 1, fontSize: 12 }}>{label}</span>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 9, fontWeight: 700, color: '#6d28d9', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.04em' }}>
            REF
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', minWidth: '2.5rem', textAlign: 'right', fontSize: 12, fontWeight: 500 }}>
            {displayVal ?? '—'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      data-field={field.name}
      onClick={onSelect}
      className="hover:bg-[var(--surface-2)] transition-colors group"
      style={{
        background: rowBg,
        cursor: 'pointer',
        borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'border-color 0.15s',
        paddingLeft: 13, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
      }}
    >
      {/* Top row: icon + label + value/controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Icon / selection indicator */}
        <div style={{ width: 24, height: 24, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isSelected && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
            }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>
            </div>
          )}
          <div style={{ opacity: isSelected ? 0 : 1, transition: 'opacity 0.15s' }}>
            {icon
              ? <img src={icon} alt={label} style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
              : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
            }
          </div>
        </div>

        {/* Label */}
        <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text)', flex: 1, fontSize: 12, fontWeight: isSelected ? 700 : 400, minWidth: 0 }}>
          {label}
        </span>

        {/* Value + confidence (only when NOT editing) */}
        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isEdited && (
              <span style={{ fontSize: 8, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 3, padding: '1px 4px' }}>
                ED.
              </span>
            )}
            <span style={{
              fontFamily: 'DM Mono, monospace',
              color: isIlegible ? '#b45309' : isSinDato ? '#6d28d9' : 'var(--text)',
              minWidth: '2.5rem', textAlign: 'right',
              fontSize: (isIlegible || isSinDato) ? 9 : 12,
              fontWeight: (isIlegible || isSinDato) ? 700 : 500,
            }}>
              {isSinDato ? 'SIN DATO' : (displayVal ?? <span style={{ color: 'var(--text-muted)' }}>—</span>)}
            </span>
            <span style={{ fontFamily: 'DM Mono, monospace', color: confidenceColor, fontSize: 10, minWidth: '2rem', textAlign: 'right' }}>
              {confPct}%
            </span>
            {canEdit && (
              <button type="button"
                onClick={e => { e.stopPropagation(); onEdit() }}
                style={{ color: 'var(--accent)', fontSize: 11, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                className="font-medium opacity-0 group-hover:opacity-100 hover:underline">
                Corregir
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editing controls — full-width second row */}
      {isEditing && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8, paddingLeft: 34 }}
        >
          <input
            type="text"
            value={editValue === 'ILEGIBLE' || editValue === 'SIN_DATO' ? '' : editValue}
            onChange={e => onEditChange(e.target.value)}
            placeholder="Número"
            style={{
              border: '1px solid var(--accent)', color: 'var(--text)', background: 'var(--surface)',
              width: 80, fontSize: 12, borderRadius: 5, padding: '4px 8px', textAlign: 'right',
            }}
            autoFocus
          />
          <button type="button" onClick={() => onEditChange('ILEGIBLE')}
            style={{
              border: `1px solid ${editValue === 'ILEGIBLE' ? '#b45309' : 'var(--border)'}`,
              background: editValue === 'ILEGIBLE' ? '#fffbeb' : 'var(--surface)',
              color: editValue === 'ILEGIBLE' ? '#b45309' : 'var(--text-muted)',
              fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            ILEGIBLE
          </button>
          <button type="button" onClick={() => onEditChange('SIN_DATO')}
            style={{
              border: `1px solid ${editValue === 'SIN_DATO' ? '#6d28d9' : 'var(--border)'}`,
              background: editValue === 'SIN_DATO' ? '#ede9fe' : 'var(--surface)',
              color: editValue === 'SIN_DATO' ? '#6d28d9' : 'var(--text-muted)',
              fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            SIN DATO
          </button>
          <button type="button" onClick={onLocalSave}
            style={{ background: 'var(--accent)', color: 'white', fontSize: 11, padding: '4px 12px', borderRadius: 5, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
            Guardar
          </button>
          <button type="button" onClick={onCancel}
            style={{ color: 'var(--text-muted)', fontSize: 13, padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// Collapsible panel — controlled: open + onToggle from parent (accordion behaviour)
function CollapsiblePanel({ title, open, onToggle, children, badge }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2 style={{ color: 'var(--text)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            {title}
          </h2>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--border)', borderRadius: 4, padding: '1px 6px' }}>
              {badge}
            </span>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FieldSection({ title, fields, localEdits, selectedField, editingField, editValue, canEdit, onSelect, onEdit, onEditChange, onLocalSave, onCancel, open, onToggle }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (!open || !selectedField || !listRef.current) return
    const el = listRef.current.querySelector(`[data-field="${selectedField}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedField, open])

  return (
    <CollapsiblePanel title={title} open={open} onToggle={onToggle} badge={`${fields.length}`}>
      <div ref={listRef} className="divide-y divide-[var(--border)]">
        {fields.map(field => (
          <FieldRow
            key={field.name}
            field={field}
            localValue={localEdits[field.name]}
            isSelected={selectedField === field.name}
            isEditing={editingField === field.name}
            editValue={editValue}
            canEdit={canEdit}
            onSelect={() => onSelect(field.name)}
            onEdit={() => onEdit(field.name, localEdits[field.name] ?? field.value)}
            onEditChange={onEditChange}
            onLocalSave={() => onLocalSave(field.name)}
            onCancel={onCancel}
          />
        ))}
      </div>
    </CollapsiblePanel>
  )
}

export default function ActaDetail({ mode = 'capturista' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { show: showToast, node: toastNode } = useToast()

  const [acta, setActa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedField, setSelectedField] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [localEdits, setLocalEdits] = useState({})

  const [modal, setModal] = useState(null)
  const [modalSel, setModalSel] = useState(null)

  // Accordion: 'validaciones' | 'resultados' | 'totales' — only one open at a time
  // Default: validaciones open
  const [openPanel, setOpenPanel] = useState('validaciones')
  const togglePanel = (key) => setOpenPanel(prev => prev === key ? null : key)

  const isVerificador = mode === 'verificador'
  const backPath = isVerificador ? '/verificador' : '/queue'
  const email = user?.email ?? 'unknown'

  const canEdit = isVerificador
    ? acta?.status === 'RejectedByCapturista'
    : false

  const canAct = isVerificador
    ? acta?.status === 'RejectedByCapturista'
    : acta?.status !== 'Approved' && acta?.status !== 'Rejected' && acta?.status !== 'RejectedByCapturista'

  const fetchActa = async () => {
    try {
      const res = await actasApi.getActa(id)
      setActa(res.data)
      setLocalEdits({})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchActa() }, [id])

  const handleLocalSave = (fieldName) => {
    if (editValue === '') return
    setLocalEdits(prev => ({ ...prev, [fieldName]: editValue }))
    setEditingField(null)
    setEditValue('')
  }

  const buildCorrections = () =>
    Object.entries(localEdits).map(([fieldName, newValue]) => ({ fieldName, newValue, correctedBy: email }))

  const flushCorrections = async () => {
    const corrections = buildCorrections()
    if (corrections.length === 0) return
    await Promise.all(corrections.map(c => actasApi.correctField(id, c)))
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await flushCorrections()
      await actasApi.approveActa(id, email)
      showToast('Acta aprobada correctamente', 'success')
      setTimeout(() => navigate(backPath), 1200)
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    try {
      setActionLoading(true)
      await actasApi.rejectActa(id, email)
      showToast('Acta enviada a cola de verificación', 'info')
      setTimeout(() => navigate(backPath), 1200)
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  const handleVerifyApprove = () => {
    // Always show the summary confirmation modal before contabilizing
    setModal('confirm')
  }

  const handleConfirmContabilizar = async () => {
    try {
      setActionLoading(true)
      await flushCorrections()
      await actasApi.verifyApprove(id, email, null)
      showToast('Acta contabilizada correctamente', 'success')
      setModal(null)
    } catch (e) {
      console.error(e)
      showToast('Error al contabilizar, regresando...', 'error')
      setModal(null)
    } finally {
      setActionLoading(false)
      setTimeout(() => navigate(backPath), 1200)  // ← siempre se ejecuta
    }
  }

  const handleOpenRejectModal = () => { setModalSel(null); setModal('reject') }

  const handleModalConfirm = async () => {
    if (!modalSel?.reason) { showToast('Selecciona un motivo', 'error'); return }
    try {
      setActionLoading(true)
      await actasApi.verifyReject(id, {
        verifiedBy: email,
        rejectionReason: modalSel.reason,
        rejectionCategory: modalSel.category,
      })
      showToast('Acta rechazada', 'error')
      setModal(null)
      setTimeout(() => navigate(backPath), 1200)
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  // Called when user clicks a field annotation on the image
  const handleFieldFromImage = (fieldName) => {
    setSelectedField(prev => prev === fieldName ? null : fieldName)
    // open whichever panel contains this field
    const isTotal = isTotalField(fieldName)
    const isIdent = isIdentityField(fieldName)
    if (!isTotal && !isIdent) setOpenPanel('resultados')
    else if (isTotal) setOpenPanel('totales')
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
    const ai = fieldOrder.indexOf(a.name), bi = fieldOrder.indexOf(b.name)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1; if (bi === -1) return -1
    return ai - bi
  })
  const voteFields = sortedFields.filter(f => !isIdentityField(f.name) && !isTotalField(f.name))
  // Extract lista_nominal reference value from validation detail
  // e.g. 'total_votos 200 is within lista_nominal 422' -> '422'
  const listaNominalRef = (() => {
    const v = acta.validations.find(v => v.detail && v.detail.toLowerCase().includes('lista_nominal'))
    if (!v) return null
    const m = v.detail.match(/lista_nominal\s+(\d+)/i)
    return m ? m[1] : null
  })()

  // For totalFields: replace lista_nominal value with the reference from validation,
  // and flag it as _referenceOnly (non-interactive)
  const totalFields = sortedFields
    .filter(f => isTotalField(f.name))
    .map(f =>
      f.name === 'lista_nominal' && listaNominalRef
        ? { ...f, value: listaNominalRef, _referenceOnly: true }
        : f
    )

  const editedCount = Object.keys(localEdits).length
  const ilegibleVals = [
    ...acta.fields.filter(f => f.value === 'ILEGIBLE' && localEdits[f.name] === undefined).map(f => f.name),
    ...Object.entries(localEdits).filter(([, v]) => v === 'ILEGIBLE').map(([k]) => k),
  ]
  const hasIlegible = ilegibleVals.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {toastNode}

      {modal === 'reject' && (
        <MotiveModal
          mode="reject"
          selection={modalSel}
          onSelection={setModalSel}
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
          actionLoading={actionLoading}
        />
      )}

      {modal === 'confirm' && acta && (
        <ConfirmContabilizarModal
          acta={acta}
          localEdits={localEdits}
          onConfirm={handleConfirmContabilizar}
          onClose={() => setModal(null)}
          actionLoading={actionLoading}
        />
      )}

      {/* ── HEADER (unchanged) ── */}
      <div style={{ flexShrink: 0, padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(backPath)}
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
              ← Volver
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 style={{ color: 'var(--text)' }} className="text-xl font-semibold">Acta #{acta.id}</h1>
                {isVerificador && (
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#7c3aed', background: '#ede9fe', borderRadius: 4, padding: '2px 8px' }}>
                    VERIFICADOR
                  </span>
                )}
                <StatusBadge value={acta.assignedQueue} />
                <StatusBadge value={acta.status} />
                {editedCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 4, padding: '2px 8px' }}>
                    {editedCount} CAMPO{editedCount > 1 ? 'S' : ''} EDITADO{editedCount > 1 ? 'S' : ''}
                  </span>
                )}
                {hasIlegible && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#9a3412', background: '#ffedd5', border: '1px solid #fdba74', borderRadius: 4, padding: '2px 8px' }}>
                    {ilegibleVals.length} ILEGIBLE{ilegibleVals.length > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">
                {acta.entity} · {acta.municipality} · Sección {acta.section}
              </p>
            </div>
          </div>

          {!isVerificador && canAct && (
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

          {isVerificador && canAct && (
            <div className="flex items-center gap-3">
              <button onClick={handleOpenRejectModal} disabled={actionLoading}
                style={{ border: '1px solid #fca5a5', color: '#b91c1c' }}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
                Rechazar totalmente
              </button>
              <button onClick={handleVerifyApprove} disabled={actionLoading}
                style={{ background: 'var(--accent)', color: 'white' }}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {hasIlegible ? '⚠ Contabilizar acta' : 'Contabilizar acta ✓'}
              </button>
            </div>
          )}
        </div>



        {isVerificador && (
          <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 10 }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <p style={{ color: '#5b21b6', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
              <strong>Acta en revisión de Verificador.</strong> Corrige los campos necesarios — los cambios
              se guardan localmente y se envían al backend solo al contabilizar o rechazar.
              {editedCount > 0 && <span style={{ color: '#b45309' }}> · {editedCount} campo{editedCount > 1 ? 's' : ''} pendiente{editedCount > 1 ? 's' : ''} de guardar.</span>}
            </p>
          </div>
        )}
      </div>

      {/* ── BODY: two-column layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>

        {/* LEFT: Acta image — takes all available space */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '16px 12px 16px 24px', minWidth: 0 }}>
          {acta.imageUrl ? (
            <div style={{ height: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <ActaViewer
                imageUrl={acta.imageUrl}
                fields={acta.fields.filter(f => f.name !== 'lista_nominal')}
                selectedField={selectedField}
                onFieldClick={handleFieldFromImage}
                suppressDefaults={selectedField !== null}   // ← esta línea
              />
            </div>
          ) : (
            <div style={{ height: '100%', borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin imagen disponible</p>
            </div>
          )}
        </div>

        {/* RIGHT: collapsible panels — fixed width, scrollable */}
        <div style={{
          width: isVerificador ? 420 : 320,
          flexShrink: 0,
          overflowY: 'auto',
          padding: '16px 24px 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>

          {/* Validaciones aritméticas */}
          <CollapsiblePanel
            title="Validaciones aritméticas"
            open={openPanel === 'validaciones'}
            onToggle={() => togglePanel('validaciones')}
          >
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {acta.validations.map((v, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: v.passed ? '#dcfce7' : '#fee2e2' }}>
                    <span style={{ color: v.passed ? '#15803d' : '#b91c1c', fontSize: 11, fontWeight: 700 }}>
                      {v.passed ? '✓' : '✗'}
                    </span>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text)', fontSize: 11, fontWeight: 600, margin: 0 }}>{validationLabels[v.ruleName] ?? v.ruleName}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1, lineHeight: 1.4 }}>{v.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsiblePanel>

          {/* Resultados */}
          <FieldSection
            title={`Resultados · ${(acta.globalConfidence * 100).toFixed(0)}% conf.`}
            fields={voteFields}
            localEdits={localEdits}
            selectedField={selectedField}
            editingField={editingField}
            editValue={editValue}
            canEdit={canEdit}
            open={openPanel === 'resultados'}
            onToggle={() => togglePanel('resultados')}
            onSelect={name => setSelectedField(selectedField === name ? null : name)}
            onEdit={(name, val) => { setEditingField(name); setEditValue(val ?? '') }}
            onEditChange={setEditValue}
            onLocalSave={handleLocalSave}
            onCancel={() => { setEditingField(null); setEditValue('') }}
          />

          {/* Totales y control */}
          <FieldSection
            title="Totales y control"
            fields={totalFields}
            localEdits={localEdits}
            selectedField={selectedField}
            editingField={editingField}
            editValue={editValue}
            canEdit={canEdit}
            open={openPanel === 'totales'}
            onToggle={() => togglePanel('totales')}
            onSelect={name => setSelectedField(selectedField === name ? null : name)}
            onEdit={(name, val) => { setEditingField(name); setEditValue(val ?? '') }}
            onEditChange={setEditValue}
            onLocalSave={handleLocalSave}
            onCancel={() => { setEditingField(null); setEditValue('') }}
          />
        </div>
      </div>
    </div>
  )
}