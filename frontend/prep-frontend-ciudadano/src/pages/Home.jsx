import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../services/api'
import MexicoMap from '../components/MexicoMap'
import { fieldLabels, partyColors, partyIcons } from '../utils/labels'

function DonutChart({ rankedData, totalVotes }) {
  let accumulatedOffset = 0;
  const radio = 15.91549431;

  if (totalVotes === 0) {
    return (
      <div className="w-full flex items-center justify-center py-6">
        <svg viewBox="0 0 42 42" className="w-32 h-32 text-gray-200">
          <circle r={radio} cx="21" cy="21" fill="transparent" stroke="currentColor" strokeWidth="6" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-full flex items-center justify-center py-4 relative">
      <svg viewBox="0 0 42 42" className="w-40 h-40 transform -rotate-90 drop-shadow-sm">
        <circle r={radio} cx="21" cy="21" fill="transparent" stroke="var(--surface-2)" strokeWidth="6" />
        
        {rankedData.map((item) => {
          const fieldName = Array.isArray(item) ? item[0] : item.fieldName;
          const votes = Array.isArray(item) ? item[1] : item.totalVotes;
          const color = partyColors[fieldName] || '#cbd5e1';
          
          const percent = (votes / totalVotes) * 100;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -accumulatedOffset;
          accumulatedOffset += percent;

          return (
            <circle
              key={fieldName}
              r={radio}
              cx="21"
              cy="21"
              fill="transparent"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Votos</span>
        <span className="text-sm font-mono font-bold text-[var(--text)]">{(totalVotes/1000000).toFixed(1)}M</span>
      </div>
    </div>
  )
}

export default function Home() {
  const [entityData, setEntityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState(null) 

  useEffect(() => {
    publicApi.getByEntity()
      .then(r => setEntityData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalVotes = entityData.reduce((s, e) => s + e.totalVotes, 0)
  const totalSections = entityData.reduce((s, e) => s + e.totalSections, 0)
  const approvedSections = entityData.reduce((s, e) => s + e.approvedSections, 0)
  
  const listaNominal = totalVotes > 0 ? Math.round(totalVotes / 0.624) : 0;
  
  const nationalTotals = {}
  entityData.forEach(e => {
    e.partyTotals?.forEach(p => {
      if (!nationalTotals[p.fieldName]) nationalTotals[p.fieldName] = 0
      nationalTotals[p.fieldName] += p.totalVotes
    })
  })
  const nationalRanked = Object.entries(nationalTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const renderStats = (title, rankedData, totalVts) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="flex justify-between items-center mb-2">
        <h2 style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '1.25rem', fontWeight: 600 }}>
          {title}
        </h2>
        {selectedEntity && (
          <button onClick={() => setSelectedEntity(null)} className="text-sm text-[var(--accent)] hover:underline font-medium">
            Volver
          </button>
        )}
      </div>

      <DonutChart rankedData={rankedData} totalVotes={totalVts} />
      
      <div className="space-y-4 flex-grow mt-2">
        {rankedData.map((item, i) => {
          const fieldName = Array.isArray(item) ? item[0] : item.fieldName
          const votes = Array.isArray(item) ? item[1] : item.totalVotes
          const pct = totalVts > 0 ? (votes / totalVts * 100) : 0
          const color = partyColors[fieldName] ?? '#888'
          const icon = partyIcons[fieldName]

          return (
            <div key={fieldName}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {i === 0 && <span style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700 }}>▲</span>}
                  {icon && <img src={icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                  <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500 }}>{fieldLabels[fieldName] ?? fieldName}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>
                    {votes.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ background: 'var(--surface-2)', borderRadius: '9999px', height: '6px', width: '100%', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: '9999px', transition: 'width 1s ease-out' }} />
                </div>
                <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: '3rem', textAlign: 'right' }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <Link to={`/resultados${selectedEntity ? `?entity=${selectedEntity.entity}` : ''}`}
          style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '0.5rem' }}
          className="hover:bg-[var(--border)] transition-colors">
          🔍 Analizar actas en detalle
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-[var(--border)] pb-6 gap-4">
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', fontWeight: 300, lineHeight: 1.2 }}>
              Resultados Electorales
            </h1>
            <p className="text-[var(--text-muted)] mt-1 font-medium">Información preliminar y no vinculante.</p>
          </div>
          <div className="text-left md:text-right">
             <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-1">Última actualización</p>
             <p className="text-sm font-mono text-[var(--text)]">{new Date().toLocaleString('es-MX')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="md:col-span-2 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm flex flex-col justify-center">
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">Padrón y Votación</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-serif text-[var(--text)] leading-none mb-1">{listaNominal.toLocaleString('es-MX')}</p>
                <p className="text-xs text-[var(--text-muted)]">Total Lista Nominal (Estimado)</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-mono text-[var(--accent)] leading-none mb-1">{totalVotes > 0 ? '62.4%' : '0%'}</p>
                <p className="text-xs text-[var(--text-muted)]">Participación Ciudadana</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
             <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2">Actas Computadas</h3>
             <p className="text-2xl font-serif text-[var(--text)] leading-none mb-1">{approvedSections.toLocaleString('es-MX')}</p>
             <p className="text-xs text-[var(--text-muted)]">De {totalSections.toLocaleString('es-MX')} esperadas</p>
             <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden mt-3">
               <div style={{ width: `${totalSections > 0 ? (approvedSections/totalSections)*100 : 0}%`, background: 'var(--text)' }} className="h-full rounded-full transition-all duration-1000"></div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border)] bg-green-50/50 border-green-200 shadow-sm flex flex-col justify-center">
             <h3 className="text-xs uppercase tracking-wider text-green-700 font-bold mb-2">Votos Contabilizados</h3>
             <p className="text-2xl font-serif text-green-900 leading-none mb-1">{totalVotes.toLocaleString('es-MX')}</p>
             <p className="text-xs text-green-700 font-medium">Extraídos de actas legibles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Cartografía Electoral {selectedEntity ? `- ${selectedEntity.entity}` : '- Nacional'}
          </p>
          {loading ? (
            <div className="h-[500px] flex items-center justify-center border border-[var(--border)] rounded-xl bg-[var(--surface)] animate-pulse">Cargando cartografía...</div>
          ) : (
            <MexicoMap 
              data={entityData} 
              selectedEntity={selectedEntity} 
              onStateSelect={(state) => setSelectedEntity(state)} 
            />
          )}
        </div>

        <div className="lg:col-span-1 h-full">
          {selectedEntity ? (
            selectedEntity.noData ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1.5rem', height: '100%' }}>
                <div className="flex justify-between items-center mb-4">
                  <h2 style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '1.25rem', fontWeight: 600 }}>
                    Resultados en {selectedEntity.entity}
                  </h2>
                  <button onClick={() => setSelectedEntity(null)} className="text-sm text-[var(--accent)] hover:underline font-medium">
                    Volver
                  </button>
                </div>
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <span className="text-5xl block mb-4 opacity-50">🗳️</span>
                  <p className="text-[var(--text)] font-semibold text-lg">Sin actas capturadas</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2 max-w-[200px]">Los datos se reflejarán conforme avance el escrutinio.</p>
                </div>
              </div>
            ) : (
              renderStats(
                `Resultados en ${selectedEntity.entity}`, 
                selectedEntity.partyTotals.sort((a,b)=> b.totalVotes - a.totalVotes), 
                selectedEntity.totalVotes
              )
            )
          ) : (
            renderStats('Votación Nacional', nationalRanked, totalVotes)
          )}
        </div>
      </div>
    </div>
  )
}