import { Icon } from './components/icons.jsx'
import kiaLogo from './assets/kia-logo.png'
import { Pill } from './components/ui.jsx'
import { incentivos, consolidadoIncentivos, ESTATUS_INCENTIVO, periodoActivo } from './data/incentivos.js'
import { fmtMXN } from './data/mockData.js'

export default function Dashboard({ onOpen }) {
  const c = consolidadoIncentivos()

  return (
    <div className="min-h-screen bg-[#0A0F14] text-slate-100">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-10 bg-[#0A0F14] border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={kiaLogo} alt="KIA" className="h-9 w-auto brightness-0 invert" />
            <span className="h-5 w-px bg-white/20" />
            <span className="text-sm font-medium text-white/60">Centro de Incentivos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Icon.Clock width={15} height={15} className="text-kia-red-soft" />
            <span className="font-semibold text-white">{periodoActivo}</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-8 py-8 space-y-8">
        {/* ---------- Grid de incentivos ---------- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white"><Icon.Layers width={18} height={18} /> Programas de incentivo</h2>
            <span className="text-xs text-slate-400">{c.total} programas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incentivos.map(inc => (
              <IncentivoCard key={inc.id} inc={inc} onOpen={onOpen} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function IncentivoCard({ inc, onOpen }) {
  const I = Icon[inc.icon] || Icon.Database
  const est = ESTATUS_INCENTIVO[inc.estatus]
  const pct = inc.presupuesto ? (inc.ejecutado / inc.presupuesto) * 100 : 0

  return (
    <button
      onClick={() => onOpen(inc.id)}
      className="group text-left bg-[#111820] border border-white/10 p-5 transition-all duration-200 hover:border-kia-red/50 hover:shadow-[0_0_20px_-2px_rgba(228,0,43,0.35)]"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`h-11 w-11 grid place-items-center ${inc.flujo ? 'bg-kia-red text-white' : 'bg-white/5 text-slate-300'}`}>
          <I width={20} height={20} />
        </span>
        <Pill tone={est.tone}>{est.label}</Pill>
      </div>

      <div className="flex items-center gap-2">
        <h3 className="font-bold leading-tight text-white">{inc.nombre}</h3>
        {inc.flujo && <span className="text-[10px] font-bold uppercase tracking-wide text-kia-red-soft bg-kia-red/15 px-1.5 py-0.5">Flujo activo</span>}
      </div>
      <p className="text-xs text-slate-400 mt-1.5 leading-snug line-clamp-2 min-h-[2rem]">{inc.desc}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">{Math.round(pct)}% ejecutado</span>
          <span className="tabular font-semibold text-slate-100">{fmtMXN(inc.presupuesto)}</span>
        </div>
        <div className="h-1.5 bg-white/10 overflow-hidden">
          <div className={`h-full ${inc.flujo ? 'bg-kia-red' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Icon.Database width={13} height={13} /> {inc.fuente}</span>
        </span>
        <span className="flex items-center gap-2">
          {inc.aclaraciones > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold"><Icon.Alert width={13} height={13} /> {inc.aclaraciones}</span>
          )}
          <span className="flex items-center gap-1 font-semibold text-slate-100 group-hover:text-kia-red-soft transition-colors">
            Abrir <Icon.Arrow width={13} height={13} />
          </span>
        </span>
      </div>
    </button>
  )
}
