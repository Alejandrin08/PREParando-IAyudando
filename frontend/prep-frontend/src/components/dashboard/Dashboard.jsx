import { useEffect, useState } from 'react'
import { actasApi } from '../../services/api'

const Stat = ({ label, value, accent }) => (
  <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-4xl font-mono font-bold ${accent ?? 'text-zinc-100'}`}>{value}</p>
  </div>
)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
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
    fetch()
    const interval = setInterval(fetch, 10000) 
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="font-mono text-zinc-500 animate-pulse">Cargando...</span>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl font-bold tracking-tight">Estado del proceso</h1>
        <span className="text-xs font-mono text-zinc-500">
          Actualizado: {new Date(data?.lastUpdated).toLocaleTimeString('es-MX')}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total actas" value={data?.totalActas} />
        <Stat label="Pendientes" value={data?.pending} accent="text-yellow-400" />
        <Stat label="Aprobadas" value={data?.approved} accent="text-emerald-400" />
        <Stat label="Rechazadas" value={data?.rejected} accent="text-red-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Cola alta" value={data?.highQueue} accent="text-red-400" />
        <Stat label="Cola estándar" value={data?.standardQueue} />
        <Stat label="Errores aritméticos" value={data?.withArithmeticErrors} accent="text-orange-400" />
        <Stat label="Confianza baja" value={data?.withLowConfidence} accent="text-yellow-400" />
      </div>

      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Distribución por estado</p>
        <div className="space-y-3">
          {[
            { label: 'Pendientes', value: data?.pending, total: data?.totalActas, color: 'bg-yellow-400' },
            { label: 'En revisión', value: data?.inReview, total: data?.totalActas, color: 'bg-blue-400' },
            { label: 'Aprobadas', value: data?.approved, total: data?.totalActas, color: 'bg-emerald-400' },
            { label: 'Rechazadas', value: data?.rejected, total: data?.totalActas, color: 'bg-red-400' },
          ].map(({ label, value, total, color }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-xs font-mono text-zinc-400 w-24">{label}</span>
              <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${color} transition-all duration-500`}
                  style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-400 w-8 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}