import { fieldLabels, partyColors, partyIcons } from '../utils/labels'

export default function PartyBar({ results, totalVotes }) {
  if (!results?.length) return null

  const top = [...results]
    .filter(r => r.votes > 0)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 8)

  return (
    <div className="space-y-2.5">
      {top.map((r, i) => {
        const pct = totalVotes > 0 ? ((r.votes ?? 0) / totalVotes * 100) : 0
        const color = partyColors[r.fieldName] ?? '#888'
        const icon = partyIcons[r.fieldName]
        const label = fieldLabels[r.fieldName] ?? r.fieldName

        return (
          <div key={r.fieldName}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {i === 0 && (
                  <span style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700 }}>
                    ▲1°
                  </span>
                )}
                {icon && (
                  <img src={icon} alt={label} style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                    onError={e => e.target.style.display = 'none'} />
                )}
                <span style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {(r.votes ?? 0).toLocaleString('es-MX')}
                </span>
                <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: '3rem', textAlign: 'right' }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: '9999px', height: '6px' }}>
              <div style={{
                width: `${pct}%`,
                background: color,
                height: '6px',
                borderRadius: '9999px',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}