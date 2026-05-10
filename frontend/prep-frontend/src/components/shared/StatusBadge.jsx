const config = {
  Pending:   { label: 'Pendiente',      bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  InReview:  { label: 'En revisión',    bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  Approved:  { label: 'Aprobada',       bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Rejected:  { label: 'Rechazada',      bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  High:      { label: 'Alta prioridad', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Standard:  { label: 'Estándar',       bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  Low:       { label: 'Baja',           bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Medium:    { label: 'Media',          bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  High_conf: { label: 'Alta',           bg: '#dcfce7', text: '#166534', border: '#86efac' },
}

export default function StatusBadge({ value, type = 'status' }) {
  const key = type === 'confidence' && value === 'High' ? 'High_conf' : value
  const c = config[key] ?? { label: value, bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
      {c.label}
    </span>
  )
}