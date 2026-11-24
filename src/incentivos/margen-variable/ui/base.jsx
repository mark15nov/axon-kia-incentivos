// ============================================================
//  Componentes base de Margen Variable
//  Misma interfaz que components/ui.jsx (Card, Pill, Button,
//  SectionTitle) con el estilo propio del módulo: radios chicos
//  (6 px paneles · 4 px controles), bordes finos y sombra mínima.
//  No afecta a los demás programas.
// ============================================================

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-md border border-kia-line shadow-[0_1px_2px_rgba(5,20,31,0.04)] ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ kicker, title, desc, right }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-5 pb-4 border-b border-kia-line">
      <div>
        {kicker && <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-kia-red mb-1">{kicker}</div>}
        <h2 className="text-[22px] font-bold text-kia-black leading-tight tracking-[-0.01em]">{title}</h2>
        {desc && <p className="text-sm text-kia-gray mt-1.5 max-w-2xl leading-relaxed">{desc}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

const TONOS_PILL = {
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-kia-red border-red-200',
  blue: 'bg-sky-50 text-sky-800 border-sky-200',
  ink: 'bg-kia-black text-white border-kia-black'
}

export function Pill({ children, tone = 'gray' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold border ${TONOS_PILL[tone]}`}>
      {children}
    </span>
  )
}

const ESTILOS_BOTON = {
  primary: 'bg-kia-black text-white border-kia-black hover:bg-[#0c2433]',
  danger: 'bg-kia-red text-white border-kia-red hover:bg-[#a01224]',
  ghost: 'bg-white text-kia-black border-kia-line hover:border-kia-black/30 hover:bg-slate-50',
  soft: 'bg-slate-100 text-kia-black border-transparent hover:bg-slate-200'
}

export function Button({ children, variant = 'primary', onClick, disabled, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded border px-4 py-2 text-sm font-semibold transition-colors active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-kia-red/30 disabled:opacity-40 disabled:cursor-not-allowed ${ESTILOS_BOTON[variant]} ${className}`}>
      {children}
    </button>
  )
}
