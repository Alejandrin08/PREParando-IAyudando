const config = {
  Pending:  { label: 'Pendiente',   classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  InReview: { label: 'En revisión', classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  Approved: { label: 'Aprobada',    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  Rejected: { label: 'Rechazada',   classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
  High:     { label: 'Alta',        classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
  Standard: { label: 'Estándar',    classes: 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20' },
  Low:      { label: 'Baja',        classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
  Medium:   { label: 'Media',       classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  High_conf:{ label: 'Alta',        classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
}

export default function StatusBadge({ value, type = 'status' }) {
  const key = type === 'confidence' && value === 'High' ? 'High_conf' : value
  const { label, classes } = config[key] ?? { label: value, classes: 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono ${classes}`}>
      {label}
    </span>
  )
}