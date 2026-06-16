// Componentes base reutilizables (estilo enterprise KIA)

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-kia-line shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ kicker, title, desc, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        {kicker && (
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-kia-red mb-1.5">{kicker}</div>
        )}
        <h2 className="text-xl font-bold text-kia-black leading-tight">{title}</h2>
        {desc && <p className="text-sm text-kia-gray mt-1.5 max-w-2xl leading-relaxed">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export function Kpi({ label, value, sub, accent }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-kia-gray">{label}</div>
      <div className={`text-2xl font-bold mt-1 tabular ${accent ? 'text-kia-red' : 'text-kia-black'}`}>{value}</div>
      {sub && <div className="text-xs text-kia-gray mt-0.5">{sub}</div>}
    </Card>
  )
}

export function Pill({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-kia-red',
    blue: 'bg-sky-50 text-sky-700',
    ink: 'bg-kia-black text-white'
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Button({ children, variant = 'primary', onClick, disabled, className = '' }) {
  const styles = {
    primary: 'bg-kia-black text-white hover:bg-[#0c2433] disabled:opacity-40',
    danger: 'bg-kia-red text-white hover:bg-[#a01224] disabled:opacity-40',
    ghost: 'bg-white text-kia-black border border-kia-line hover:bg-slate-50 disabled:opacity-40',
    soft: 'bg-slate-100 text-kia-black hover:bg-slate-200 disabled:opacity-40'
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function ProgressBar({ value, tone = 'ink' }) {
  const colors = { ink: 'bg-kia-black', red: 'bg-kia-red', green: 'bg-emerald-500' }
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colors[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
