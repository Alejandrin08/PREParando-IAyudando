import { useState, useCallback } from 'react'
import { publicApi } from '../services/api'
import StatusChip from '../components/StatusChip'
import PartyBar from '../components/PartyBar'
import { fieldLabels, partyColors, partyIcons } from '../utils/labels'

const PARTIES = [
  { value: '', label: 'Cualquier partido ganador' },
  { value: 'votos_pan', label: 'PAN' },
  { value: 'votos_pri', label: 'PRI' },
  { value: 'votos_morena', label: 'Morena' },
  { value: 'votos_prd', label: 'PRD' },
  { value: 'votos_mc', label: 'Movimiento Ciudadano' },
  { value: 'votos_pt', label: 'PT' },
  { value: 'votos_pvem', label: 'PVEM' },
]

const STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'Approved', label: 'Confirmadas' },
  { value: 'InReview', label: 'En verificación (Incidencias)' },
  { value: 'Pending', label: 'En proceso de captura' }
]

export default function Resultados() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('') 
  const [filters, setFilters] = useState({ entity: '', municipality: '', section: '', party: '', status: '' })
  const [selected, setSelected] = useState(null)
  
  const [visibleCount, setVisibleCount] = useState(12) 

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    const hasAtLeastOneFilter = Object.values(filters).some(val => val.trim() !== '');
    if (!hasAtLeastOneFilter) {
      setError('Por favor, ingresa al menos un criterio de búsqueda (Estado, Sección, Partido, etc.) para consultar las actas.');
      return;
    }
    
    setError(''); 
    setLoading(true);
    setHasSearched(true);
    setVisibleCount(12);

    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const res = await publicApi.getResults(params)
      setResults(res.data)
    } catch (e) {
      console.error(e)
      setError('Hubo un error al consultar el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false)
    }
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const visibleResults = results.slice(0, visibleCount)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

      <div className="border-b border-[var(--border)] pb-6">
        <h1 style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '2rem', fontWeight: 300 }}>
          Búsqueda de Actas por Casilla
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Consulta los resultados específicos filtrando por ubicación o partido aventajado.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
        className="flex flex-col gap-4">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <input 
            value={filters.entity} onChange={e => setFilter('entity', e.target.value)}
            placeholder="Estado (Ej. Veracruz)" 
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-all"
          />
          <input 
            value={filters.municipality} onChange={e => setFilter('municipality', e.target.value)}
            placeholder="Municipio" 
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-all"
          />
          <input 
            value={filters.section} onChange={e => setFilter('section', e.target.value)}
            placeholder="Núm. de Sección" 
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-all"
          />
          <select value={filters.party} onChange={e => setFilter('party', e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] outline-none">
            {PARTIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] outline-none">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)] mt-2">
          <button 
            type="submit"
            disabled={loading}
            className="bg-[var(--text)] text-[var(--surface)] px-8 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Consultando...' : '🔍 Buscar Actas'}
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
          <span className="text-[var(--text-muted)] font-medium">Buscando en la base de datos...</span>
        </div>
      ) : !hasSearched ? (
        <div className="text-center py-20 px-6 border border-[var(--border)] rounded-2xl bg-[var(--surface-2)] bg-opacity-50">
          <span className="text-6xl block mb-4 opacity-80">🔎</span>
          <h3 className="text-xl font-serif text-[var(--text)] mb-2">Comienza tu consulta</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Utiliza los filtros de arriba para buscar actas de escrutinio específicas. La consulta general a nivel nacional requiere aplicar al menos un filtro geográfico o político.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 px-6 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
          <span className="text-4xl block mb-3 opacity-60">📄</span>
          <h3 className="text-lg font-medium text-[var(--text)] mb-1">No se encontraron actas</h3>
          <p className="text-[var(--text-muted)]">Modifica tus filtros de búsqueda e inténtalo nuevamente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <p className="text-[var(--text)] font-medium">
              Se encontraron <span className="font-bold text-[var(--accent)]">{results.length}</span> casillas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleResults.map(r => (
              <CasillaCard key={r.id} result={r} isSelected={selected === r.id} onSelect={() => setSelected(selected === r.id ? null : r.id)} />
            ))}
          </div>

          {visibleCount < results.length && (
            <div className="flex justify-center pt-8 pb-4">
              <button 
                onClick={() => setVisibleCount(v => v + 12)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-8 py-3 rounded-full text-sm font-semibold hover:bg-[var(--surface-2)] hover:shadow-sm transition-all"
              >
                Cargar más casillas ({results.length - visibleCount} restantes) ↓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CasillaCard({ result, isSelected, onSelect }) {
  const [tab, setTab] = useState('datos')
  const totalVotes = result.partyResults?.reduce((s, p) => s + (p.votes ?? 0), 0) ?? 0
  const winner = result.partyResults?.[0]
  const winnerColor = winner ? (partyColors[winner.fieldName] ?? '#888') : 'var(--border)'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: isSelected ? '0 0 0 3px var(--accent-light)' : 'none'
      }}
    >
      <div style={{ height: '4px', background: result.status === 'Approved' ? winnerColor : 'var(--border)' }} />

      <div style={{ padding: '1rem' }}>
        <div className="flex items-start justify-between gap-2 mb-3 cursor-pointer" onClick={onSelect}>
          <div>
            <p style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '0.95rem', fontWeight: 500 }}>
              {result.municipality || result.entity}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {result.entity} · Sección {result.section}
            </p>
          </div>
          <StatusChip status={result.status} />
        </div>

        {result.status !== 'Approved' ? (
          <div style={{
            background: 'var(--surface-2)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <p style={{ color: 'var(--text-2)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {result.publicStatusDetail}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.875rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
              {[
                { key: 'datos', label: 'Resultados' },
                { key: 'acta', label: 'Ver acta' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.775rem',
                    fontWeight: 500,
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                    borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    marginBottom: '-1px'
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'datos' ? (
              <div>
                <PartyBar results={result.partyResults} totalVotes={totalVotes} />
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}
                  className="grid grid-cols-2 gap-2">
                  {result.controlFields?.map(f => (
                    <div key={f.fieldName}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {fieldLabels[f.fieldName] ?? f.fieldName}
                      </p>
                      <p style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)', fontSize: '0.875rem', fontWeight: 600 }}>
                        {f.value?.toLocaleString('es-MX') ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                {result.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt="Acta de escrutinio"
                    style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                  />
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                    Imagen en proceso de digitalización
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.75rem' }}>
          {result.approvedAt
            ? `Confirmada el ${new Date(result.approvedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
            : `Recibida el ${new Date(result.ingestedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
          }
        </p>
      </div>
    </div>
  )
}