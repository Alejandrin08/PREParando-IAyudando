import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { actasApi } from '../../services/api'
import ActaViewer from './ActaViewer'
import StatusBadge from '../shared/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { fieldLabels, validationLabels, partyIcons, fieldOrder } from '../../utils/labels'

const isTotalField    = n => n.startsWith('total_') || n === 'lista_nominal' || n === 'boletas_sobrantes'
const isIdentityField = n => ['entidad', 'municipio', 'seccion'].includes(n)
const ALL_REJECTION   = { Contabilizada: [], NoContabilizada: [] } 

function Toast({ message, type, onDone }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 2800)
    const t2 = setTimeout(onDone, 3300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  const C = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '✓' },
    error:   { bg: '#fff1f2', border: '#fca5a5', text: '#b91c1c', icon: '✗' },
    info:    { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9', icon: 'ℹ' },
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
    { value: 'Ilegible',  label: 'Ilegible',  description: 'La cantidad de votos en algún campo del Acta PREP no puede leerse, tanto en letra como en número.' },
    { value: 'SinDato',   label: 'Sin Dato',   description: 'La cantidad de votos no fue asentada en el Acta PREP ni en letra ni en número en algún campo del Acta PREP.' },
  ],
  NoContabilizada: [
    { value: 'ExcedeLN',        label: 'Excede Lista Nominal',              description: 'La suma de todos los votos en el Acta PREP excede el número de ciudadanas y ciudadanos en la Lista Nominal de Electores de la casilla, incluido el número de votos emitidos por los representantes de los Partidos Políticos.' },
    { value: 'SinActa',         label: 'Sin Acta',                          description: 'El Acta PREP no llegó junto con el paquete electoral al Centro de Acopio y Transmisión de Datos (CATD), por alguna de las siguientes causas:\n1. Sin Acta por paquete no entregado.\n2. Sin Acta por casilla no instalada.\n3. Sin Acta por paquete entregado sin sobre.' },
    { value: 'TodosIlegibles',  label: 'Todos los campos ilegibles o sin dato', description: 'Todos los campos del Acta PREP correspondientes al número de votos, son ilegibles o no contienen dato alguno, tanto en letra como en número.' },
  ],
}
const PARTIAL_OPTIONS = [
  { value: 'CamposIlegibles', label: 'Campos parcialmente ilegibles', description: 'Algunos campos no pudieron ser identificados con certeza.' },
  { value: 'DatosParciales',  label: 'Datos parciales visibles',      description: 'El acta tiene información suficiente para contabilizarse, aunque algunos campos están incompletos.' },
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
  const [reason,   setReason]   = useState(selection?.reason   ?? '')

  const handleSelect = (cat, r) => { setCategory(cat); setReason(r); onSelection({ category: cat, reason: r }) }
  const handleCatOnly = cat    => { setCategory(cat); setReason(''); onSelection(null) }

  const isReject  = mode === 'reject'
  const canSubmit = isReject ? (!!category && !!reason) : !!reason

  const title      = isReject ? 'Aceptar con errores / Rechazar' : 'Motivo de contabilización parcial'
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
            <ReasonColumn
              title="Contabilizadas" accentColor="#0891b2" accentBg="#e0f2fe"
              categoryKey="Contabilizada"
              selectedCategory={category} selectedReason={reason}
              onCategory={handleCatOnly} onSelect={handleSelect}
              options={REJECTION_OPTIONS.Contabilizada}
              description="Actas con inconsistencias pero con información para contabilizarlas:"
            />
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

function FieldRow({ field, localValue, isSelected, isEditing, editValue, canEdit, onSelect, onEdit, onEditChange, onLocalSave, onCancel }) {
  const label      = fieldLabels[field.name] ?? field.name
  const icon       = partyIcons[field.name]
  const displayVal = localValue !== undefined ? localValue : field.value
  const isIlegible = displayVal === 'ILEGIBLE'
  const isEdited   = localValue !== undefined && localValue !== field.value
  const confPct    = (field.confidence * 100).toFixed(0)

  const confidenceColor =
    field.confidenceLevel === 'Low'    ? '#b91c1c' :
    field.confidenceLevel === 'Medium' ? '#b45309' : '#15803d'

  const rowBg =
    isSelected                        ? '#f0fdf4' :
    isEdited                          ? '#fefce8' :   
    field.confidenceLevel === 'Low'   ? '#fff1f2' :
    field.confidenceLevel === 'Medium'? '#fffbeb' : 'transparent'

  return (
    <div onClick={onSelect} style={{ background: rowBg, cursor: 'pointer' }}
      className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors group">

      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {icon
          ? <img src={icon} alt={label} className="w-7 h-7 object-contain" onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="w-7 h-7 rounded-full" />
        }
      </div>

      <span style={{ color: 'var(--text)', flex: 1 }} className="text-sm">{label}</span>

      {isEditing ? (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editValue === 'ILEGIBLE' ? '' : editValue}
            onChange={e => onEditChange(e.target.value)}
            placeholder="Número"
            style={{ border: '1px solid var(--accent)', color: 'var(--text)', background: 'var(--surface)', width: 72 }}
            className="px-2 py-1 rounded text-sm text-right focus:outline-none"
            autoFocus
          />
          <button type="button" onClick={() => onEditChange('ILEGIBLE')}
            style={{
              border: `1px solid ${editValue === 'ILEGIBLE' ? '#b45309' : 'var(--border)'}`,
              background: editValue === 'ILEGIBLE' ? '#fffbeb' : 'var(--surface)',
              color: editValue === 'ILEGIBLE' ? '#b45309' : 'var(--text-muted)',
              fontSize: 10, fontWeight: 700, padding: '4px 7px', borderRadius: 6, cursor: 'pointer',
            }}>
            ILEGIBLE
          </button>
          <button type="button" onClick={onLocalSave}
            style={{ background: 'var(--accent)', color: 'white' }}
            className="px-3 py-1 rounded text-xs font-medium">
            Confirmar
          </button>
          <button type="button" onClick={onCancel} style={{ color: 'var(--text-muted)' }} className="px-2 py-1 text-xs">
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {isEdited && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 3, padding: '1px 5px' }}>
              EDITADO
            </span>
          )}
          <span style={{
            fontFamily: 'DM Mono, monospace',
            color: isIlegible ? '#b45309' : 'var(--text)',
            minWidth: '3rem', textAlign: 'right',
            fontSize: isIlegible ? 10 : undefined,
            fontWeight: isIlegible ? 700 : 500,
          }} className="text-sm">
            {displayVal ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', color: confidenceColor, fontSize: 11, minWidth: '2.5rem', textAlign: 'right' }}>
            {confPct}%
          </span>
          {canEdit && (
            <button type="button"
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

function FieldSection({ title, fields, localEdits, selectedField, editingField, editValue, canEdit, onSelect, onEdit, onEditChange, onLocalSave, onCancel }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="rounded-xl overflow-hidden">
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }} className="px-4 py-2.5">
        <h2 style={{ color: 'var(--text)' }} className="text-xs font-semibold uppercase tracking-widest">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--border)]">
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
    </div>
  )
}

export default function ActaDetail({ mode = 'capturista' }) {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { show: showToast, node: toastNode } = useToast()

  const [acta,          setActa]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [selectedField, setSelectedField] = useState(null)
  const [editingField,  setEditingField]  = useState(null)
  const [editValue,     setEditValue]     = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [localEdits, setLocalEdits] = useState({})

  const [modal, setModal] = useState(null)
  const [modalSel, setModalSel] = useState(null)

  const isVerificador = mode === 'verificador'
  const backPath      = isVerificador ? '/verificador' : '/queue'
  const email         = user?.email ?? 'unknown'

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

  const handleVerifyApprove = async () => {
    const hasIlegible = Object.values(localEdits).includes('ILEGIBLE') ||
      acta.fields.some(f => f.value === 'ILEGIBLE' && localEdits[f.name] === undefined)
    if (hasIlegible) {
      setModalSel(null)
      setModal('partial')
      return
    }
    try {
      setActionLoading(true)
      await flushCorrections()
      await actasApi.verifyApprove(id, email, null)
      showToast('Acta contabilizada correctamente', 'success')
      setTimeout(() => navigate(backPath), 1200)
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  const handleOpenRejectModal = () => { setModalSel(null); setModal('reject') }

  const handleModalConfirm = async () => {
    if (!modalSel?.reason) { showToast('Selecciona un motivo', 'error'); return }
    try {
      setActionLoading(true)
      if (modal === 'reject') {
        await actasApi.verifyReject(id, {
          verifiedBy: email,
          rejectionReason: modalSel.reason,
          rejectionCategory: modalSel.category,
        })
        showToast('Acta registrada con errores / rechazada', 'error')
      } else {
        await flushCorrections()
        await actasApi.verifyApprove(id, email, modalSel.reason)
        showToast('Acta contabilizada con campos ilegibles registrados', 'success')
      }
      setModal(null)
      setTimeout(() => navigate(backPath), 1200)
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
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
  const voteFields  = sortedFields.filter(f => !isIdentityField(f.name) && !isTotalField(f.name))
  const totalFields = sortedFields.filter(f => isTotalField(f.name))

  const editedCount  = Object.keys(localEdits).length
  const ilegibleVals = [
    ...acta.fields.filter(f => f.value === 'ILEGIBLE' && localEdits[f.name] === undefined).map(f => f.name),
    ...Object.entries(localEdits).filter(([, v]) => v === 'ILEGIBLE').map(([k]) => k),
  ]
  const hasIlegible  = ilegibleVals.length > 0

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
      {toastNode}

      {modal && (
        <MotiveModal
          mode={modal}
          selection={modalSel}
          onSelection={setModalSel}
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
          actionLoading={actionLoading}
        />
      )}

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
              Aceptar con errores / Rechazar
            </button>
            <button onClick={handleVerifyApprove} disabled={actionLoading}
              style={{ background: 'var(--accent)', color: 'white' }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {hasIlegible ? '⚠ Contabilizar con ilegibles' : 'Contabilizar acta ✓'}
            </button>
          </div>
        )}
      </div>

      {isVerificador && (
        <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 15 }}>🔍</span>
          <p style={{ color: '#5b21b6', fontSize: 12, lineHeight: 1.5 }}>
            <strong>Acta en revisión de Verificador.</strong> Corrige los campos necesarios — los cambios
            se guardan localmente y se envían al backend solo al contabilizar o rechazar.
            {editedCount > 0 && <span style={{ color: '#b45309' }}> · {editedCount} campo{editedCount > 1 ? 's' : ''} pendiente{editedCount > 1 ? 's' : ''} de guardar.</span>}
          </p>
        </div>
      )}

      {acta.imageUrl && (
        <ActaViewer imageUrl={acta.imageUrl} fields={acta.fields} selectedField={selectedField} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} className="rounded-xl overflow-hidden">
          <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }} className="px-4 py-2.5">
            <h2 style={{ color: 'var(--text)' }} className="text-xs font-semibold uppercase tracking-widest">Validaciones aritméticas</h2>
          </div>
          <div className="px-4 py-3 space-y-3">
            {acta.validations.map((v, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: v.passed ? '#dcfce7' : '#fee2e2' }}>
                  <span style={{ color: v.passed ? '#15803d' : '#b91c1c' }} className="text-xs font-bold">
                    {v.passed ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <p style={{ color: 'var(--text)' }} className="text-xs font-medium">{validationLabels[v.ruleName] ?? v.ruleName}</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5 leading-snug">{v.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <FieldSection
          title={`Resultados · ${(acta.globalConfidence * 100).toFixed(0)}% confianza`}
          fields={voteFields}
          localEdits={localEdits}
          selectedField={selectedField}
          editingField={editingField}
          editValue={editValue}
          canEdit={canEdit}
          onSelect={name => setSelectedField(selectedField === name ? null : name)}
          onEdit={(name, val) => { setEditingField(name); setEditValue(val ?? '') }}
          onEditChange={setEditValue}
          onLocalSave={handleLocalSave}
          onCancel={() => { setEditingField(null); setEditValue('') }}
        />

        <FieldSection
          title="Totales y control"
          fields={totalFields}
          localEdits={localEdits}
          selectedField={selectedField}
          editingField={editingField}
          editValue={editValue}
          canEdit={canEdit}
          onSelect={name => setSelectedField(selectedField === name ? null : name)}
          onEdit={(name, val) => { setEditingField(name); setEditValue(val ?? '') }}
          onEditChange={setEditValue}
          onLocalSave={handleLocalSave}
          onCancel={() => { setEditingField(null); setEditValue('') }}
        />
      </div>
    </div>
  )
}