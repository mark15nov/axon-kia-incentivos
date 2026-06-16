import { Icon } from './components/icons.jsx'
import { Pill } from './components/ui.jsx'
import { incentivos, consolidadoIncentivos, ESTATUS_INCENTIVO, periodoActivo } from './data/incentivos.js'
import { fmtMXN } from './data/mockData.js'

export default function Dashboard({ onOpen }) {
  const c = consolidadoIncentivos()

  return (
    <div className="min-h-screen bg-kia-bg text-kia-black">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-10 bg-kia-black text-white">
        <div className="max-w-[1240px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-extrabold tracking-tight">KIA</span>
            <span className="h-5 w-px bg-white/25" />
            <span className="text-sm font-medium text-white/70">Centro de Incentivos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Icon.Clock width={15} height={15} className="text-kia-red-soft" />
            <span className="font-semibold text-white">{periodoActivo}</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-8 py-8 space-y-8">
        {/* ---------- Consolidado (hero band) ---------- */}
        <section className="rounded-3xl bg-kia-black text-white px-8 py-7 shadow-pop relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-kia-red/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-kia-red-soft mb-2">Consolidado de la cartera</div>
                <h1 className="text-3xl font-bold leading-tight">Incentivos a la red de concesionarios</h1>
                <p className="text-sm text-white/60 mt-2 max-w-xl">12 programas activos en el periodo, trazados de SAP al pago a tesorería.</p>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-white/45">Presupuesto total</div>
                <div className="text-4xl font-extrabold tabular mt-1">{fmtMXN(c.presupuesto)}</div>
              </div>
            </div>

            {/* progress */}
            <div className="mt-7">
              <div className="flex items-center justify-between text-xs text-white/55 mb-2">
                <span>Ejecutado <span className="font-bold text-white tabular">{fmtMXN(c.ejecutado)}</span></span>
                <span>{Math.round(c.pctEjecutado)}% liquidado · pendiente <span className="font-bold text-white tabular">{fmtMXN(c.pendiente)}</span></span>
              </div>
              <div className="h-2.5 rounded-full bg-white/12 overflow-hidden">
                <div className="h-full rounded-full bg-kia-red-soft transition-all duration-700" style={{ width: `${c.pctEjecutado}%` }} />
              </div>
            </div>

            {/* mini stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
              <HeroStat label="Programas" value={c.total} sub={`${c.activos} activos`} />
              <HeroStat label="En revisión" value={c.enRevision} sub="Requieren atención" />
              <HeroStat label="Dealers" value={c.dealers} sub="En la red" />
              <HeroStat label="Aclaraciones" value={c.aclaraciones} sub="Casos abiertos" alert />
            </div>
          </div>
        </section>

        {/* ---------- Grid de incentivos ---------- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Icon.Layers width={18} height={18} /> Programas de incentivo</h2>
            <span className="text-xs text-kia-gray">{c.total} programas</span>
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

function HeroStat({ label, value, sub, alert }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className={`text-2xl font-bold tabular mt-0.5 ${alert && value > 0 ? 'text-kia-red-soft' : 'text-white'}`}>{value}</div>
      <div className="text-[11px] text-white/40 mt-0.5">{sub}</div>
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
      className={`group text-left bg-white rounded-2xl border shadow-card p-5 transition-all hover:shadow-pop hover:-translate-y-0.5 ${
        inc.flujo ? 'border-kia-red/40 ring-1 ring-kia-red/10' : 'border-kia-line hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`h-11 w-11 rounded-xl grid place-items-center ${inc.flujo ? 'bg-kia-red text-white' : 'bg-slate-100 text-kia-black'}`}>
          <I width={20} height={20} />
        </span>
        <Pill tone={est.tone}>{est.label}</Pill>
      </div>

      <div className="flex items-center gap-2">
        <h3 className="font-bold leading-tight">{inc.nombre}</h3>
        {inc.flujo && <span className="text-[10px] font-bold uppercase tracking-wide text-kia-red bg-red-50 rounded px-1.5 py-0.5">Flujo activo</span>}
      </div>
      <p className="text-xs text-kia-gray mt-1.5 leading-snug line-clamp-2 min-h-[2rem]">{inc.desc}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-kia-gray">{Math.round(pct)}% ejecutado</span>
          <span className="tabular font-semibold">{fmtMXN(inc.presupuesto)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${inc.flujo ? 'bg-kia-red' : 'bg-kia-black'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-kia-gray">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Icon.Database width={13} height={13} /> {inc.fuente}</span>
        </span>
        <span className="flex items-center gap-2">
          {inc.aclaraciones > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold"><Icon.Alert width={13} height={13} /> {inc.aclaraciones}</span>
          )}
          <span className="flex items-center gap-1 font-semibold text-kia-black group-hover:text-kia-red transition-colors">
            Abrir <Icon.Arrow width={13} height={13} />
          </span>
        </span>
      </div>
    </button>
  )
}
