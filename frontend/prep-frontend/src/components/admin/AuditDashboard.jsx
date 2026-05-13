import { useEffect, useState, useRef } from 'react'
import { actasApi } from '../../services/api'

const fmt = (n) => (n ?? 0).toLocaleString('es-MX')
const pct = (a, b) => (b === 0 ? '0' : ((a / b) * 100).toFixed(1))
const fmtDate = (d) => d ? new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_LABELS = {
  Pending:              'Pendiente',
  InReview:             'En revisión',
  Approved:             'Aprobada',
  Rejected:             'Rechazada',
  RejectedByCapturista: 'En verificación',
}
const STATUS_COLOR = {
  Pending:              '#6366f1',
  InReview:             '#f59e0b',
  Approved:             '#10b981',
  Rejected:             '#ef4444',
  RejectedByCapturista: '#8b5cf6',
}
const REJECTION_LABELS = {
  Ilegible:       'Ilegible',
  SinDato:        'Sin Dato',
  ExcedeLN:       'Excede Lista Nominal',
  SinActa:        'Sin Acta',
  TodosIlegibles: 'Todos ilegibles o sin dato',
  CamposIlegibles:'Campos parcialmente ilegibles',
  DatosParciales: 'Datos parciales visibles',
}

function KpiCard({ label, value, sub, color = 'var(--accent)', icon }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{fmt(value)}</p>
          {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 22, opacity: 0.5 }}>{icon}</span>}
      </div>
    </div>
  )
}

function ProgressBar({ label, value, total, color }) {
  const p = total === 0 ? 0 : (value / total) * 100
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
          {fmt(value)} <span style={{ opacity: 0.5 }}>({pct(value, total)}%)</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function Section({ title, icon, children, id }) {
  return (
    <div id={id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>{title}</h2>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

function AuditTable({ cols, rows, emptyMsg = 'Sin datos' }) {
  if (!rows?.length) return <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>{emptyMsg}</p>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {cols.map(c => (
              <th key={c.key} style={{ padding: '8px 12px', textAlign: c.right ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: '9px 12px', color: 'var(--text)', textAlign: c.right ? 'right' : 'left', fontFamily: c.mono ? 'DM Mono, monospace' : undefined, whiteSpace: c.wrap ? undefined : 'nowrap' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AuditDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState({ entity: '', status: '', dateFrom: '', dateTo: '' })
  const printRef = useRef()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dashRes, allRes] = await Promise.all([
        actasApi.getDashboard(),
        actasApi.getQueue({ status: '' }), 
      ])
      setData({ dashboard: dashRes.data, actas: allRes.data })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handlePrint = () => {
    const style = document.createElement('style')
    style.id = '__audit_print'
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #audit-print-root, #audit-print-root * { visibility: visible !important; }
        #audit-print-root { position: absolute; inset: 0; padding: 24px; }
        .no-print { display: none !important; }
        @page { margin: 1.5cm; size: A4; }
      }
    `
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById('__audit_print')?.remove(), 1000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }} className="animate-pulse">Cargando datos de auditoría...</span>
    </div>
  )

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Error al cargar datos</span>
    </div>
  )

  const { dashboard, actas } = data
  const total = dashboard.totalActas || 0

  const filtered = actas.filter(a => {
    if (filter.entity && !a.entity?.toLowerCase().includes(filter.entity.toLowerCase())) return false
    if (filter.status && a.status !== filter.status) return false
    if (filter.dateFrom && new Date(a.ingestedAt) < new Date(filter.dateFrom)) return false
    if (filter.dateTo   && new Date(a.ingestedAt) > new Date(filter.dateTo + 'T23:59:59')) return false
    return true
  })

  const byEntity = Object.values(
    filtered.reduce((acc, a) => {
      const key = a.entity || 'Sin entidad'
      if (!acc[key]) acc[key] = { entity: key, total: 0, approved: 0, rejected: 0, pending: 0, errors: 0 }
      acc[key].total++
      if (a.status === 'Approved') acc[key].approved++
      else if (a.status === 'Rejected') acc[key].rejected++
      else acc[key].pending++
      if (!a.arithmeticValidationOk) acc[key].errors++
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const byUser = Object.values(
    filtered
      .filter(a => a.approvedBy)
      .reduce((acc, a) => {
        const key = a.approvedBy
        if (!acc[key]) acc[key] = { user: key, approved: 0, rejected: 0, lastAction: null }
        if (a.status === 'Approved') acc[key].approved++
        else if (a.status === 'Rejected') acc[key].rejected++
        if (!acc[key].lastAction || new Date(a.approvedAt) > new Date(acc[key].lastAction))
          acc[key].lastAction = a.approvedAt
        return acc
      }, {})
  ).sort((a, b) => (b.approved + b.rejected) - (a.approved + a.rejected))

  const withRejection = filtered.filter(a => a.rejectionReason)

  const withErrors = filtered.filter(a => !a.arithmeticValidationOk)

  const lowConf = filtered.filter(a => a.confidenceLevel === 'Low')

  const byDay = Object.entries(
    filtered.reduce((acc, a) => {
      const day = new Date(a.ingestedAt).toISOString().slice(0, 10)
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b)).slice(-20)

  const maxDay = Math.max(...byDay.map(([, v]) => v), 1)

  const approvalRate = pct(dashboard.approved, total)
  const rejectionRate = pct(dashboard.rejected, total)
  const errorRate = pct(dashboard.withArithmeticErrors, total)

  const reportDate = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">

      <div className="flex items-start justify-between flex-wrap gap-4 no-print">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Auditoría del sistema</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Reporte generado el {reportDate} · {fmt(total)} actas en el sistema
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            ↻ Actualizar
          </button>
          <button onClick={handlePrint}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⬇ Exportar PDF
          </button>
        </div>
      </div>

      <div id="audit-print-root" ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'none' }} className="print-only">
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Reporte de Auditoría PREP</h1>
          <p style={{ fontSize: 12, color: '#666' }}>Generado: {reportDate}</p>
          <hr style={{ margin: '10px 0' }} />
        </div>

        <div className="no-print" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Filtros</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input placeholder="Entidad / municipio"
              value={filter.entity}
              onChange={e => setFilter(f => ({ ...f, entity: e.target.value }))}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, width: 200 }} />
            <select value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input type="date" value={filter.dateFrom}
              onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }} />
            <input type="date" value={filter.dateTo}
              onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }} />
            {(filter.entity || filter.status || filter.dateFrom || filter.dateTo) && (
              <button onClick={() => setFilter({ entity: '', status: '', dateFrom: '', dateTo: '' })}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                ✕ Limpiar
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Mostrando <strong style={{ color: 'var(--text)' }}>{fmt(filtered.length)}</strong> de {fmt(total)} actas
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total actas" value={filtered.length} color="var(--accent)" sub={`de ${fmt(total)} en sistema`} />
          <KpiCard label="Aprobadas" value={filtered.filter(a => a.status === 'Approved').length} color="#10b981" sub={`${pct(filtered.filter(a => a.status === 'Approved').length, filtered.length)}% del filtro`} />
          <KpiCard label="Rechazadas" value={filtered.filter(a => a.status === 'Rejected').length} color="#ef4444" sub={`${pct(filtered.filter(a => a.status === 'Rejected').length, filtered.length)}% del filtro`} />
          <KpiCard label="Errores aritméticos" value={filtered.filter(a => !a.arithmeticValidationOk).length} color="#f59e0b" sub={`${pct(filtered.filter(a => !a.arithmeticValidationOk).length, filtered.length)}% del filtro`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Pendientes" value={filtered.filter(a => a.status === 'Pending').length} color="#6366f1" />
          <KpiCard label="En revisión" value={filtered.filter(a => a.status === 'InReview' || a.status === 'RejectedByCapturista').length} color="#8b5cf6" />
          <KpiCard label="Confianza baja" value={filtered.filter(a => a.confidenceLevel === 'Low').length} color="#ec4899" sub="Requieren atención" />
          <KpiCard label="Cola alta prioridad" value={filtered.filter(a => a.assignedQueue === 'High').length} color="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          <Section title="Distribución por estado" >
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = filtered.filter(a => a.status === status).length
              return (
                <ProgressBar key={status} label={label} value={count} total={filtered.length} color={STATUS_COLOR[status]} />
              )
            })}
          </Section>

          <Section title="Últimos registros">
            {byDay.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin datos en el período seleccionado</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {byDay.map(([day, count]) => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', width: 90, flexShrink: 0 }}>{fmtDateShort(day)}</span>
                      <div style={{ flex: 1, height: 16, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / maxDay) * 100}%`, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 6, transition: 'width 0.5s ease' }}>
                          {count >= 2 && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>{count}</span>}
                        </div>
                      </div>
                      {count < 2 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', width: 20 }}>{count}</span>}
                    </div>
                  ))}
                </div>
              )
            }
          </Section>
        </div>

        <Section title="Resumen por entidad / municipio">
          <AuditTable
            cols={[
              { key: 'entity', label: 'Entidad' },
              { key: 'total',    label: 'Total',    right: true, mono: true },
              { key: 'approved', label: 'Aprobadas', right: true, mono: true, render: v => <span style={{ color: '#10b981', fontWeight: 600 }}>{fmt(v)}</span> },
              { key: 'rejected', label: 'Rechazadas', right: true, mono: true, render: v => <span style={{ color: v > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: v > 0 ? 600 : 400 }}>{fmt(v)}</span> },
              { key: 'pending',  label: 'Pendientes', right: true, mono: true },
              { key: 'errors',   label: 'Err. aritmético', right: true, mono: true, render: v => v > 0 ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{fmt(v)}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span> },
              { key: 'total',    label: 'Tasa aprobación', right: true, render: (v, row) => `${pct(row.approved, row.total)}%` },
            ]}
            rows={byEntity}
            emptyMsg="Sin actas con los filtros actuales"
          />
        </Section>

        <Section title="Actividad por usuario">
          <AuditTable
            cols={[
              { key: 'user',       label: 'Usuario / correo' },
              { key: 'approved',   label: 'Aprobadas',  right: true, mono: true, render: v => <span style={{ color: '#10b981', fontWeight: 600 }}>{fmt(v)}</span> },
              { key: 'rejected',   label: 'Rechazadas', right: true, mono: true, render: v => v > 0 ? <span style={{ color: '#ef4444', fontWeight: 600 }}>{fmt(v)}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span> },
              { key: 'lastAction', label: 'Última acción', render: v => fmtDate(v) },
            ]}
            rows={byUser}
            emptyMsg="Ninguna acta ha sido procesada aún"
          />
        </Section>

        <Section title="Actas rechazadas con motivo registrado">
          <AuditTable
            cols={[
              { key: 'id',          label: '#', mono: true },
              { key: 'entity',      label: 'Entidad' },
              { key: 'municipality',label: 'Municipio' },
              { key: 'section',     label: 'Sección', mono: true },
              { key: 'rejectionCategory', label: 'Categoría', render: v => v === 'Contabilizada' ? <span style={{ color: '#0891b2', fontWeight: 600 }}>Contabilizada</span> : v === 'NoContabilizada' ? <span style={{ color: '#be185d', fontWeight: 600 }}>No Contabilizada</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
              { key: 'rejectionReason', label: 'Motivo', render: v => REJECTION_LABELS[v] ?? v ?? '—' },
              { key: 'approvedBy',  label: 'Procesada por' },
              { key: 'approvedAt',  label: 'Fecha', render: v => fmtDate(v) },
            ]}
            rows={withRejection}
            emptyMsg="No hay actas rechazadas con motivo registrado"
          />
        </Section>

        <Section title="Actas con errores aritméticos">
          <AuditTable
            cols={[
              { key: 'id',           label: '#', mono: true },
              { key: 'entity',       label: 'Entidad' },
              { key: 'municipality', label: 'Municipio' },
              { key: 'section',      label: 'Sección', mono: true },
              { key: 'status',       label: 'Estado', render: v => <span style={{ color: STATUS_COLOR[v], fontWeight: 600 }}>{STATUS_LABELS[v] ?? v}</span> },
              { key: 'globalConfidence', label: 'Confianza', mono: true, right: true, render: v => `${((v ?? 0) * 100).toFixed(0)}%` },
              { key: 'assignedQueue',    label: 'Cola', render: v => v === 'High' ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Alta</span> : <span style={{ color: 'var(--text-muted)' }}>Estándar</span> },
              { key: 'ingestedAt',   label: 'Ingresada', render: v => fmtDateShort(v) },
            ]}
            rows={withErrors}
            emptyMsg="No hay actas con errores aritméticos"
          />
        </Section>

        <Section title="Actas con confianza baja de la IA">
          <AuditTable
            cols={[
              { key: 'id',           label: '#', mono: true },
              { key: 'entity',       label: 'Entidad' },
              { key: 'municipality', label: 'Municipio' },
              { key: 'section',      label: 'Sección', mono: true },
              { key: 'globalConfidence', label: 'Confianza global', mono: true, right: true, render: v => <span style={{ color: '#ef4444', fontWeight: 700 }}>{((v ?? 0) * 100).toFixed(1)}%</span> },
              { key: 'status', label: 'Estado', render: v => <span style={{ color: STATUS_COLOR[v] ?? 'var(--text-muted)', fontWeight: 600 }}>{STATUS_LABELS[v] ?? v}</span> },
              { key: 'approvedBy', label: 'Procesada por' },
            ]}
            rows={lowConf}
            emptyMsg="No hay actas con confianza baja"
          />
        </Section>

        <Section title="Trazabilidad completa de actas (filtradas)">
          <AuditTable
            cols={[
              { key: 'id',           label: '#', mono: true },
              { key: 'entity',       label: 'Entidad' },
              { key: 'municipality', label: 'Municipio' },
              { key: 'section',      label: 'Sección', mono: true },
              { key: 'status', label: 'Estado', render: v => <span style={{ color: STATUS_COLOR[v] ?? 'var(--text-muted)', fontWeight: 600 }}>{STATUS_LABELS[v] ?? v}</span> },
              { key: 'assignedQueue', label: 'Cola', render: v => v === 'High' ? <span style={{ color: '#ef4444', fontWeight: 700 }}>Alta</span> : 'Estándar' },
              { key: 'globalConfidence', label: 'IA %', mono: true, right: true, render: v => `${((v ?? 0) * 100).toFixed(0)}%` },
              { key: 'arithmeticValidationOk', label: 'Aritmética', render: v => v ? <span style={{ color: '#10b981' }}>✓ OK</span> : <span style={{ color: '#ef4444' }}>✗ Error</span> },
              { key: 'ingestedAt',  label: 'Ingresada',   render: v => fmtDateShort(v) },
              { key: 'approvedBy',  label: 'Procesada por' },
              { key: 'approvedAt',  label: 'Procesada el', render: v => fmtDate(v) },
            ]}
            rows={filtered}
            emptyMsg="Sin actas con los filtros actuales"
          />
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Sistema PREP · Reporte de auditoría generado el {reportDate}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            {fmt(filtered.length)} actas analizadas
          </p>
        </div>

      </div>
    </div>
  )
}