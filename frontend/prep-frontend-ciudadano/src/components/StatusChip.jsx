import { statusConfig } from '../utils/labels'

export default function StatusChip({ status }) {
  const cfg = statusConfig[status] ?? { label: status, color: '#888', bg: '#f1f5f9', border: '#cbd5e1', dot: '#888' }
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '0.2rem 0.625rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}