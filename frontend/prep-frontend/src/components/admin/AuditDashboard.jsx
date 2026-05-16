import { useEffect, useState, useRef } from 'react'
import { actasApi } from '../../services/api'

const fmt = (n) => (n ?? 0).toLocaleString('es-MX')
const pct = (a, b) => (b === 0 ? '0' : ((a / b) * 100).toFixed(1))
const fmtDate = (d) => d ? new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_LABELS = {
  Pending: 'Acta pendiente',
  InReview: 'Acta en revisión',
  Approved: 'Acta aprobada',
  Rejected: 'Acta rechazada',
  RejectedByCapturista: 'Acta en verificación',
}
const STATUS_COLOR = {
  Pending: '#6366f1',
  InReview: '#f59e0b',
  Approved: '#10b981',
  Rejected: '#ef4444',
  RejectedByCapturista: '#8b5cf6',
}

// Motivos exactos por categoría
const MOTIVOS_NO_CONT = {
  ExcedeLN: 'Excede lista nominal',
  TodosIlegibles: 'Todos los campos ilegibles o sin dato',
  SinActa: 'Sin acta',
}
const MOTIVOS_CONT = {
  Normal: 'Normal',
  SinDato: 'Sin dato',
  CamposIlegibles: 'Con datos ilegibles',
}

// Errores aritméticos exactos
const ERRORES_ARITMETICOS = {
  SumaVotos: 'Suma de votos vs. total declarado',
  TotalUrnas: 'Total de votos vs. conteo de urnas',
  PersonasVotos: 'Personas que votaron vs. votos en urnas',
  ExcedeNominal: 'Total de votos excede lista nominal',
}

// Niveles de confianza
const CONF_NIVEL = (v) => {
  if (v == null) return 'Sin dato'
  if (v > 0.85) return 'Alta'
  if (v > 0.60) return 'Media'
  return 'Baja'
}
const CONF_COLOR = { Alta: '#10b981', Media: '#f59e0b', Baja: '#ef4444' }

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', borderLeft: `4px solid ${color}` }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{fmt(value)}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</p>}
    </div>
  )
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
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

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', padding: '12px 20px' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02em' }}>{title}</h2>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

// ─── Audit Table ─────────────────────────────────────────────────────────────
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
                <td key={c.key} style={{ padding: '9px 12px', color: 'var(--text)', textAlign: c.right ? 'right' : 'left', fontFamily: c.mono ? 'DM Mono, monospace' : undefined, whiteSpace: 'nowrap' }}>
                  {c.render ? c.render(row[c.field ?? c.key], row) : (row[c.field ?? c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Stat chip ───────────────────────────────────────────────────────────────
function StatChip({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 100 }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

// ─── CHART 1: Rechazadas ─────────────────────────────────────────────────────
// Stacked horizontal bar: cada grupo (No Contabilizada / Contabilizada) muestra
// sus 3 motivos como segmentos de color. Siempre 6 filas fijas, escala con n.
const NO_CONT_COLORS = ['#c0392b', '#e74c3c', '#f1948a']
const CONT_COLORS = ['#0891b2', '#06b6d4', '#67e8f9']

function RechazadasChart({ rows }) {
  if (!rows.length) return <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Sin datos</p>

  // Conteos por categoría + motivo
  const noCont = Object.fromEntries(Object.keys(MOTIVOS_NO_CONT).map(k => [k, 0]))
  const cont = Object.fromEntries(Object.keys(MOTIVOS_CONT).map(k => [k, 0]))

  rows.forEach(r => {
    if (r.rejectionCategory === 'NoContabilizada' && noCont[r.rejectionReason] !== undefined)
      noCont[r.rejectionReason]++
    if (r.rejectionCategory === 'Contabilizada' && cont[r.rejectionReason] !== undefined)
      cont[r.rejectionReason]++
  })

  const totalNC = Object.values(noCont).reduce((a, b) => a + b, 0)
  const totalC = Object.values(cont).reduce((a, b) => a + b, 0)
  const grand = totalNC + totalC || 1

  const renderGroup = (label, counts, labels, colors, total) => {
    const entries = Object.entries(counts)
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
            {fmt(total)} · {pct(total, grand)}% del total
          </span>
        </div>
        {/* Stacked bar */}
        <div style={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-2)' }}>
          {entries.map(([key, count], i) => (
            <div key={key}
              style={{ width: `${pct(count, grand)}%`, background: colors[i], transition: 'width 0.5s ease', minWidth: count > 0 ? 2 : 0 }}
              title={`${labels[key]}: ${fmt(count)}`}
            />
          ))}
        </div>
        {/* Legend inline */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 6 }}>
          {entries.map(([key, count], i) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{labels[key]} <strong style={{ color: 'var(--text)' }}>{fmt(count)}</strong></span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderGroup('No contabilizadas', noCont, MOTIVOS_NO_CONT, NO_CONT_COLORS, totalNC)}
      {renderGroup('Contabilizadas', cont, MOTIVOS_CONT, CONT_COLORS, totalC)}
      {/* Proportional overview bar */}
      <div style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Proporción general</span>
        </div>
        <div style={{ display: 'flex', height: 20, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${pct(totalNC, grand)}%`, background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totalNC > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{pct(totalNC, grand)}%</span>}
          </div>
          <div style={{ width: `${pct(totalC, grand)}%`, background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totalC > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{pct(totalC, grand)}%</span>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#c0392b', fontWeight: 600 }}>No contabilizadas</span>
          <span style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>Contabilizadas</span>
        </div>
      </div>
    </div>
  )
}

// ─── CHART 2: Errores aritméticos ────────────────────────────────────────────
// 4 tipos fijos. Para cada uno: cuántas actas fallan (true) vs. pasan (false).
// Visualización: 4 filas con barra de fallo + chip de porcentaje.
function ErroresChart({ rows }) {
  if (!rows.length) return <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Sin datos</p>

  // Cada acta puede tener un objeto arithmeticErrors con los 4 tipos como boolean
  // Si no existe ese campo, usamos arithmeticValidationOk como fallback genérico
  const counts = Object.fromEntries(Object.keys(ERRORES_ARITMETICOS).map(k => [k, { fail: 0, pass: 0 }]))

  rows.forEach(r => {
    const errs = r.arithmeticErrors ?? {}
    Object.keys(ERRORES_ARITMETICOS).forEach(k => {
      if (errs[k] === true) counts[k].fail++
      else if (errs[k] === false) counts[k].pass++
      else {
        // fallback: si no hay detalle, marca todo como fallo si !arithmeticValidationOk
        if (!r.arithmeticValidationOk) counts[k].fail++
        else counts[k].pass++
      }
    })
  })

  const maxFail = Math.max(...Object.values(counts).map(c => c.fail), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(ERRORES_ARITMETICOS).map(([key, label], i) => {
        const { fail, pass } = counts[key]
        const total = fail + pass
        const failPct = total === 0 ? 0 : (fail / total) * 100
        const barW = (fail / maxFail) * 100
        return (
          <div key={key}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: failPct > 20 ? '#ef4444' : 'var(--text-muted)', fontWeight: failPct > 20 ? 700 : 400 }}>
                  {failPct.toFixed(1)}% fallan
                </span>
                <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
                  {fmt(fail)} / {fmt(total)}
                </span>
              </div>
            </div>
            {/* Barra bicolor: fallo (rojo) + ok (verde) */}
            <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-2)' }}>
              <div style={{ width: `${failPct}%`, background: '#ef4444', transition: 'width 0.5s ease' }} />
              <div style={{ width: `${100 - failPct}%`, background: '#10b981', opacity: 0.35, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Falla la validación</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', opacity: 0.5 }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pasa la validación</span>
        </div>
      </div>
    </div>
  )
}

// ─── CHART 3: Confianza — distribución en 3 niveles ──────────────────────────
// Histogram de 10 bins + donut resumen de Alta / Media / Baja.
// Escala con cualquier n de actas; siempre 10 columnas + 3 segmentos.
function ConfianzaChart({ rows }) {
  if (!rows.length) return <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Sin datos</p>

  // Conteo por nivel
  const nivel = { Alta: 0, Media: 0, Baja: 0 }
  rows.forEach(r => { nivel[CONF_NIVEL(r.globalConfidence)]++ })
  const total = rows.length
  const maxNiv = Math.max(...Object.values(nivel), 1)

  // Histogram bins (10 deciles de globalConfidence)
  const bins = Array.from({ length: 10 }, () => ({ Alta: 0, Media: 0, Baja: 0 }))
  rows.forEach(r => {
    const conf = r.globalConfidence ?? 0
    const bin = Math.min(Math.floor(conf * 10), 9)
    bins[bin][CONF_NIVEL(r.globalConfidence)]++
  })
  const maxBin = Math.max(...bins.map(b => b.Alta + b.Media + b.Baja), 1)

  // El nivel más frecuente
  const dominante = Object.entries(nivel).sort((a, b) => b[1] - a[1])[0]

  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>

      {/* Left: histograma */}
      <div style={{ flex: 2, minWidth: 200 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Distribución de confianza global (todas las actas)
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110 }}>
          {bins.map((bin, i) => {
            const t = bin.Alta + bin.Media + bin.Baja
            const totH = (t / maxBin) * 100
            return (
              <div key={i} title={`${i * 10}–${(i + 1) * 10}%: ${t} actas`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                {t > 0 && <span style={{ fontSize: 8, fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', marginBottom: 1 }}>{t}</span>}
                <div style={{ width: '100%', height: `${totH}%`, display: 'flex', flexDirection: 'column-reverse', borderRadius: '3px 3px 0 0', overflow: 'hidden' }}>
                  {/* apilado: Baja abajo, Media medio, Alta arriba */}
                  <div style={{ width: '100%', flex: bin.Baja, background: CONF_COLOR.Baja }} />
                  <div style={{ width: '100%', flex: bin.Media, background: CONF_COLOR.Media }} />
                  <div style={{ width: '100%', flex: bin.Alta, background: CONF_COLOR.Alta }} />
                </div>
              </div>
            )
          })}
        </div>
        {/* X axis */}
        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
          {bins.map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{i * 10}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: 1 }}>% confianza global del acta</p>

        {/* Umbral markers */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          {[['#ef4444', 'Baja  < 60%'], ['#f59e0b', 'Media 60–85%'], ['#10b981', 'Alta  > 85%']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: resumen por nivel */}
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
          Resumen por nivel
        </p>
        {Object.entries(nivel).map(([key, count]) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: key === dominante[0] ? 700 : 400 }}>{key}</span>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: CONF_COLOR[key], fontWeight: 700 }}>{fmt(count)}</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(count / maxNiv) * 100}%`, background: CONF_COLOR[key], borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{pct(count, total)}% del total</p>
          </div>
        ))}

        {/* Insight */}
        <div style={{ marginTop: 6, padding: '9px 12px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: `3px solid ${CONF_COLOR[dominante[0]]}` }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            El nivel predominante es <strong style={{ color: CONF_COLOR[dominante[0]] }}>{dominante[0]}</strong> con {fmt(dominante[1])} actas ({pct(dominante[1], total)}%).
          </p>
        </div>
      </div>

    </div>
  )
}

// ─── Drawer trigger ───────────────────────────────────────────────────────────
function DrawerTrigger({ open, onToggle, counts }) {
  return (
    <button onClick={onToggle} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '14px 20px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, opacity: 0.6 }}>⚠️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Revisión de actas problemáticas</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Rechazadas · Errores aritméticos · Confianza baja</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#fcebeb', color: '#a32d2d' }}>{fmt(counts.rejected)} rechazadas</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#faeeda', color: '#854f0b' }}>{fmt(counts.errors)} errores</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#fbeaf0', color: '#993556' }}>{fmt(counts.lowConf)} baja confianza</span>
        </div>
        <span style={{ fontSize: 16, color: 'var(--text-muted)', transition: 'transform 0.25s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </div>
    </button>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
const DRAWER_ITEMS = [
  { key: 'rejected', label: 'Rechazadas', countKey: 'rejected' },
  { key: 'errors', label: 'Errores aritmét.', countKey: 'errors' },
  { key: 'confianza', label: 'Confianza', countKey: 'lowConf' },
]

function Drawer({ open, withRejection, withErrors, lowConf, allFiltered }) {
  const [activeTab, setActiveTab] = useState('rejected')
  if (!open) return null

  const counts = { rejected: withRejection.length, errors: withErrors.length, lowConf: lowConf.length }

  const rejNC = withRejection.filter(r => r.rejectionCategory === 'NoContabilizada').length
  const rejC = withRejection.filter(r => r.rejectionCategory === 'Contabilizada').length

  const highQueue = withErrors.filter(r => r.assignedQueue === 'High').length
  const avgConf = withErrors.length
    ? (withErrors.reduce((s, r) => s + (r.globalConfidence ?? 0), 0) / withErrors.length * 100).toFixed(0)
    : '—'

  const nivelCounts = { Alta: 0, Media: 0, Baja: 0 }
  allFiltered.forEach(r => { nivelCounts[CONF_NIVEL(r.globalConfidence)]++ })

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', minHeight: 340 }}>

        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {DRAWER_ITEMS.map(item => {
            const active = activeTab === item.key
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text)',
                fontWeight: active ? 700 : 400, fontSize: 13, transition: 'background 0.12s',
              }}>
                <span>{item.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: 'DM Mono, monospace',
                  padding: '2px 7px', borderRadius: 99,
                  background: active ? 'rgba(255,255,255,0.2)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  border: active ? 'none' : '1px solid var(--border)',
                  minWidth: 28, textAlign: 'center',
                }}>
                  {fmt(counts[item.countKey])}
                </span>
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div style={{ flex: 1, minWidth: 0, padding: '20px 24px', overflowX: 'auto' }}>

          {activeTab === 'rejected' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatChip label="Total rechazadas" value={fmt(withRejection.length)} color="#a32d2d" sub="con motivo registrado" />
                <StatChip label="No contabilizadas" value={fmt(rejNC)} color="#c0392b" sub={`${pct(rejNC, withRejection.length)}%`} />
                <StatChip label="Contabilizadas" value={fmt(rejC)} color="#0891b2" sub={`${pct(rejC, withRejection.length)}%`} />
              </div>
              <RechazadasChart rows={withRejection} />
            </>
          )}

          {activeTab === 'errors' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatChip label="Total con error" value={fmt(withErrors.length)} color="#854f0b" sub="actas con al menos un error" />
                <StatChip label="Cola alta" value={fmt(highQueue)} sub={`${pct(highQueue, withErrors.length)}% del grupo`} />
                <StatChip label="Confianza prom." value={`${avgConf}%`} sub="dentro del grupo" />
              </div>
              <ErroresChart rows={withErrors} />
            </>
          )}

          {activeTab === 'confianza' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatChip label="Alta  (>85%)" value={fmt(nivelCounts.Alta)} color="#10b981" sub={`${pct(nivelCounts.Alta, allFiltered.length)}%`} />
                <StatChip label="Media (60–85%)" value={fmt(nivelCounts.Media)} color="#f59e0b" sub={`${pct(nivelCounts.Media, allFiltered.length)}%`} />
                <StatChip label="Baja  (<60%)" value={fmt(nivelCounts.Baja)} color="#ef4444" sub={`${pct(nivelCounts.Baja, allFiltered.length)}%`} />
              </div>
              <ConfianzaChart rows={allFiltered} />
            </>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AuditDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ entity: '', status: '', dateFrom: '', dateTo: '' })
  const [drawerOpen, setDrawerOpen] = useState(false)
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
    if (filter.dateTo && new Date(a.ingestedAt) > new Date(filter.dateTo + 'T23:59:59')) return false
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
  const lowConf = filtered.filter(a => (a.globalConfidence ?? 1) < 0.60)

  const reportDate = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">

      <div className="flex items-start justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Auditoría del sistema</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Reporte generado el {reportDate} · {fmt(total)} actas en el sistema</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            ↻ Actualizar
          </button>
          <button onClick={handlePrint} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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

        {/* Filtros */}
        <div className="no-print" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Filtros</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input placeholder="Entidad / municipio" value={filter.entity}
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

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Total actas" value={filtered.length} color="var(--accent)" sub={`de ${fmt(total)} en sistema`} />
          <KpiCard label="Actas aprobadas" value={filtered.filter(a => a.status === 'Approved').length} color="#10b981" sub={`${pct(filtered.filter(a => a.status === 'Approved').length, filtered.length)}% del filtro`} />
          <KpiCard label="Actas rechazadas" value={filtered.filter(a => a.status === 'Rejected').length} color="#ef4444" sub={`${pct(filtered.filter(a => a.status === 'Rejected').length, filtered.length)}% del filtro`} />
          <KpiCard label="Errores aritméticos" value={withErrors.length} color="#f59e0b" sub={`${pct(withErrors.length, filtered.length)}% del filtro`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard label="Actas pendientes" value={filtered.filter(a => a.status === 'Pending').length} color="#6366f1" />
          <KpiCard label="Actas en revisión" value={filtered.filter(a => a.status === 'InReview' || a.status === 'RejectedByCapturista').length} color="#8b5cf6" />
          <KpiCard label="Actas con confianza baja" value={lowConf.length} color="#ef4444" sub="< 60% de confianza" />
          <KpiCard label="Actas en cola alta prioridad" value={filtered.filter(a => a.assignedQueue === 'High').length} color="#ec4899" />
        </div>

        {/* Distribución + Usuarios */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Section title="Distribución por estado">
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const count = filtered.filter(a => a.status === status).length
              return <ProgressBar key={status} label={label} value={count} total={filtered.length} color={STATUS_COLOR[status]} />
            })}
          </Section>
          <Section title="Actividad por usuario">
            <AuditTable
              cols={[
                { key: 'user', label: 'Usuario' },
                { key: 'approved', label: 'Actas aprobadas', right: true, mono: true, render: v => <span style={{ color: '#10b981', fontWeight: 600 }}>{fmt(v)}</span> },
                { key: 'rejected', label: 'Actas rechazadas', right: true, mono: true, render: v => v > 0 ? <span style={{ color: '#ef4444', fontWeight: 600 }}>{fmt(v)}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span> },
                { key: 'lastAction', label: 'Última acción', render: v => fmtDate(v) },
              ]}
              rows={byUser}
              emptyMsg="Ninguna acta ha sido procesada aún"
            />
          </Section>
        </div>

        {/* Entidad */}
        <Section title="Resumen por entidad / municipio">
          <AuditTable
            cols={[
              { key: 'entity', label: 'Entidad' },
              { key: 'total_1', label: 'Total', field: 'total', right: true, mono: true },
              { key: 'approved', label: 'Actas aprobadas', right: true, mono: true, render: v => <span style={{ color: '#10b981', fontWeight: 600 }}>{fmt(v)}</span> },
              { key: 'rejected', label: 'Actas rechazadas', right: true, mono: true, render: v => <span style={{ color: v > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: v > 0 ? 600 : 400 }}>{fmt(v)}</span> },
              { key: 'pending', label: 'Actas pendientes', right: true, mono: true },
              { key: 'errors', label: 'Errores aritméticos', right: true, mono: true, render: v => v > 0 ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{fmt(v)}</span> : <span style={{ color: 'var(--text-muted)' }}>0</span> },
              { key: 'total_2', label: 'Tasa de aprobación', field: 'total', right: true, render: (v, row) => `${pct(row.approved, row.total)}%` },
            ]}
            rows={byEntity}
            emptyMsg="Sin actas con los filtros actuales"
          />
        </Section>

        {/* Drawer */}
        <DrawerTrigger
          open={drawerOpen}
          onToggle={() => setDrawerOpen(o => !o)}
          counts={{ rejected: withRejection.length, errors: withErrors.length, lowConf: lowConf.length }}
        />
        <Drawer
          open={drawerOpen}
          withRejection={withRejection}
          withErrors={withErrors}
          lowConf={lowConf}
          allFiltered={filtered}
        />

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sistema PREP · Reporte de auditoría generado el {reportDate}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{fmt(filtered.length)} actas analizadas</p>
        </div>

      </div>
    </div>
  )
}