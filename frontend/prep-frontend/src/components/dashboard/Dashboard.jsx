import { useEffect, useState } from 'react'
import { actasApi } from '../../services/api'

const Stat = ({ label, value, accent, sublabel }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    className="rounded-xl p-5">
    <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium uppercase tracking-widest mb-3">
      {label}
    </p>
    <p style={{ color: accent ?? 'var(--text)', fontFamily: 'DM Mono, monospace' }}
      className="text-3xl font-medium">
      {value ?? 0}
    </p>
    {sublabel && (
      <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">{sublabel}</p>
    )}
  </div>
)

const Bar = ({ label, value, total, color }) => {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-4">
      <span style={{ color: 'var(--text-muted)' }} className="text-sm w-28 shrink-0">{label}</span>
      <div style={{ background: 'var(--surface-2)' }} className="flex-1 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}
        className="text-sm w-8 text-right">
        {value ?? 0}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await actasApi.getDashboard()
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}
        className="text-sm animate-pulse">Cargando...</span>
    </div>
  )

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text)' }} className="text-2xl font-semibold">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Estado del proceso de captura en tiempo real
          </p>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: 'DM Mono, monospace' }}
          className="text-xs px-3 py-1.5 rounded-full text-[var(--text-muted)]">
          Actualizado {new Date(data?.lastUpdated).toLocaleTimeString('es-MX')}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total actas" value={data?.totalActas} sublabel="recibidas" />
        <Stat label="Pendientes" value={data?.pending} accent="#b45309" sublabel="por revisar" />
        <Stat label="Aprobadas" value={data?.approved} accent="#15803d" sublabel="validadas" />
        <Stat label="Rechazadas" value={data?.rejected} accent="#b91c1c" sublabel="con problemas" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl p-6 space-y-4">
          <h2 style={{ color: 'var(--text)' }} className="text-sm font-semibold uppercase tracking-widest">
            Estado del proceso
          </h2>
          <div className="space-y-3">
            <Bar label="Pendientes" value={data?.pending} total={data?.totalActas} color="#d97706" />
            <Bar label="En revisión" value={data?.inReview} total={data?.totalActas} color="#2563eb" />
            <Bar label="Aprobadas" value={data?.approved} total={data?.totalActas} color="#16a34a" />
            <Bar label="Rechazadas" value={data?.rejected} total={data?.totalActas} color="#dc2626" />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          className="rounded-xl p-6 space-y-4">
          <h2 style={{ color: 'var(--text)' }} className="text-sm font-semibold uppercase tracking-widest">
            Alertas del sistema
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }} className="text-sm">Cola alta prioridad</span>
              <span style={{ fontFamily: 'DM Mono, monospace', color: '#b91c1c' }}
                className="text-lg font-medium">{data?.highQueue ?? 0}</span>
            </div>
            <div style={{ background: 'var(--border)' }} className="h-px" />
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }} className="text-sm">Errores aritméticos</span>
              <span style={{ fontFamily: 'DM Mono, monospace', color: '#b45309' }}
                className="text-lg font-medium">{data?.withArithmeticErrors ?? 0}</span>
            </div>
            <div style={{ background: 'var(--border)' }} className="h-px" />
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }} className="text-sm">Confianza baja</span>
              <span style={{ fontFamily: 'DM Mono, monospace', color: '#b45309' }}
                className="text-lg font-medium">{data?.withLowConfidence ?? 0}</span>
            </div>
            <div style={{ background: 'var(--border)' }} className="h-px" />
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }} className="text-sm">Cola estándar</span>
              <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)' }}
                className="text-lg font-medium">{data?.standardQueue ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}