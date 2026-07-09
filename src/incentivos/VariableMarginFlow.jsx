import { Icon } from '../components/icons.jsx'
import { fmtMXN, PERIODO } from '../data/mockData.js'

// ============================================================
//  VARIABLE MARGIN · Incentivos adicionales
//  Página de detalle en tema oscuro, alineada al diseño del
//  dashboard (fondo #0A0F14, tarjetas #111820, acento rojo KIA).
//  Data mock para la maqueta.
// ============================================================

// Conceptos que componen el margen variable del periodo.
// La suma de `ejecutado` = 300,000 y de `meta` = 765,000 (cuadra con la card).
const CONCEPTOS = [
  { nombre: 'Bono por Volumen', desc: 'Cumplimiento del objetivo de unidades del mes', meta: 220000, ejecutado: 132000, dealers: 6 },
  { nombre: 'Bono de Mezcla (Mix)', desc: 'Penetración de modelos premium sobre el total facturado', meta: 165000, ejecutado: 61000, dealers: 5 },
  { nombre: 'Aceleración Retail', desc: 'Ventas retail por encima de flotilla en el periodo', meta: 140000, ejecutado: 58000, dealers: 4 },
  { nombre: 'Antigüedad de Inventario', desc: 'Colocación de unidades con +90 días en patio', meta: 130000, ejecutado: 32000, dealers: 6 },
  { nombre: 'Penetración de Financiamiento', desc: 'Unidades con crédito KIA Finance contratado', meta: 110000, ejecutado: 17000, dealers: 5 }
]

// Desglose por dealer. asignado = 765,000 · ejecutado = 300,000.
const DEALERS = [
  { dealer: 'KIA Polanco', zona: 'Centro', asignado: 165000, ejecutado: 78000, estatus: 'ok' },
  { dealer: 'KIA Monterrey Valle', zona: 'Norte', asignado: 148000, ejecutado: 66000, estatus: 'ok' },
  { dealer: 'KIA Guadalajara Sur', zona: 'Occidente', asignado: 132000, ejecutado: 51000, estatus: 'aclaracion' },
  { dealer: 'KIA Puebla Angelópolis', zona: 'Centro', asignado: 118000, ejecutado: 42000, estatus: 'aclaracion' },
  { dealer: 'KIA Querétaro', zona: 'Bajío', asignado: 108000, ejecutado: 38000, estatus: 'aclaracion' },
  { dealer: 'KIA Mérida', zona: 'Sureste', asignado: 94000, ejecutado: 25000, estatus: 'aclaracion' }
]

const ACLARACIONES = [
  { dealer: 'KIA Guadalajara Sur', concepto: 'Bono por Volumen', detalle: '3 VIN sin soporte de entrega en el periodo.' },
  { dealer: 'KIA Puebla Angelópolis', concepto: 'Bono de Mezcla', detalle: 'Mezcla premium no coincide con el reporte SAP.' },
  { dealer: 'KIA Querétaro', concepto: 'Antigüedad de Inventario', detalle: '2 unidades en disputa por fecha de ingreso a patio.' },
  { dealer: 'KIA Mérida', concepto: 'Penetración de Financiamiento', detalle: 'Falta comprobante de contrato KIA Finance.' }
]

export default function VariableMarginFlow({ incentivo, onBack }) {
  const inc = incentivo || {}
  const presupuesto = inc.presupuesto ?? 765000
  const ejecutado = inc.ejecutado ?? 300000
  const pendiente = presupuesto - ejecutado
  const pct = presupuesto ? Math.round((ejecutado / presupuesto) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0A0F14] text-slate-100">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-10 bg-[#0A0F14] border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white transition-colors"
            >
              <Icon.Chevron width={14} height={14} className="rotate-180" /> Centro de incentivos
            </button>
            <span className="h-5 w-px bg-white/15" />
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-extrabold tracking-tight text-white">KIA</span>
              <span className="h-5 w-px bg-white/20" />
              <span className="text-sm font-medium text-white/60">Incentivos</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Icon.Clock width={15} height={15} className="text-kia-red-soft" />
            <span className="font-semibold text-white">{PERIODO}</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto px-8 py-8 space-y-8 animate-fade-up">
        {/* ---------- Hero ---------- */}
        <section className="bg-[#111820] border border-white/10 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <span className="h-14 w-14 shrink-0 grid place-items-center bg-kia-red text-white">
                <Icon.Cash width={26} height={26} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-white leading-tight">Variable Margin</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-kia-red-soft bg-kia-red/15 px-1.5 py-0.5">Flujo activo</span>
                </div>
                <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                  Incentivos adicionales por desempeño del dealer sobre el margen variable del periodo.
                  Se liquida al cierre contra SAP y el soporte cargado por cada concesionario.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Icon.Database width={13} height={13} /> {inc.fuente || 'SAP · Dealers'}</span>
                  <span className="flex items-center gap-1.5"><Icon.Users width={13} height={13} /> {DEALERS.length} dealers</span>
                </div>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400">
              Activo
            </span>
          </div>

          {/* Progreso general */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">{pct}% ejecutado</span>
              <span className="tabular font-semibold text-slate-100">
                {fmtMXN(ejecutado)} <span className="text-slate-500">/ {fmtMXN(presupuesto)}</span>
              </span>
            </div>
            <div className="h-2 bg-white/10 overflow-hidden">
              <div className="h-full bg-kia-red" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        {/* ---------- KPIs ---------- */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Presupuesto" value={fmtMXN(presupuesto)} />
          <Kpi label="Ejecutado" value={fmtMXN(ejecutado)} accent />
          <Kpi label="Pendiente" value={fmtMXN(pendiente)} />
          <Kpi label="Aclaraciones abiertas" value={String(ACLARACIONES.length)} warn />
        </section>

        {/* ---------- Conceptos ---------- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Icon.Layers width={18} height={18} /> Conceptos de margen variable
            </h2>
            <span className="text-xs text-slate-400">{CONCEPTOS.length} conceptos</span>
          </div>

          <div className="space-y-3">
            {CONCEPTOS.map((c) => {
              const p = c.meta ? Math.round((c.ejecutado / c.meta) * 100) : 0
              return (
                <div key={c.nombre} className="bg-[#111820] border border-white/10 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">{c.nombre}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">{c.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="tabular font-semibold text-slate-100">{fmtMXN(c.ejecutado)}</div>
                      <div className="text-xs text-slate-500">meta {fmtMXN(c.meta)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                      <div className="h-full bg-kia-red" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs tabular text-slate-400 w-16 text-right">{p}% · {c.dealers}D</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ---------- Desglose por dealer ---------- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Icon.Users width={18} height={18} /> Desglose por dealer
            </h2>
            <span className="text-xs text-slate-400">{DEALERS.length} concesionarios</span>
          </div>

          <div className="bg-[#111820] border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-white/10">
                  <th className="font-medium px-5 py-3">Dealer</th>
                  <th className="font-medium px-5 py-3">Zona</th>
                  <th className="font-medium px-5 py-3 text-right">Asignado</th>
                  <th className="font-medium px-5 py-3 text-right">Ejecutado</th>
                  <th className="font-medium px-5 py-3 text-right">Avance</th>
                  <th className="font-medium px-5 py-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {DEALERS.map((d) => {
                  const p = d.asignado ? Math.round((d.ejecutado / d.asignado) * 100) : 0
                  return (
                    <tr key={d.dealer} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-100">{d.dealer}</td>
                      <td className="px-5 py-3 text-slate-400">{d.zona}</td>
                      <td className="px-5 py-3 text-right tabular text-slate-300">{fmtMXN(d.asignado)}</td>
                      <td className="px-5 py-3 text-right tabular text-slate-100 font-semibold">{fmtMXN(d.ejecutado)}</td>
                      <td className="px-5 py-3 text-right tabular text-slate-400">{p}%</td>
                      <td className="px-5 py-3 text-right">
                        {d.estatus === 'aclaracion' ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-xs">
                            <Icon.Alert width={13} height={13} /> Aclaración
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                            <Icon.Check width={13} height={13} /> Al día
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- Aclaraciones ---------- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Icon.Alert width={18} height={18} className="text-amber-400" /> Aclaraciones abiertas
            </h2>
            <span className="text-xs text-amber-400 font-semibold">{ACLARACIONES.length} pendientes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACLARACIONES.map((a, i) => (
              <div key={i} className="bg-[#111820] border border-amber-400/20 p-5">
                <div className="flex items-start gap-3">
                  <span className="h-8 w-8 shrink-0 grid place-items-center bg-amber-400/15 text-amber-400">
                    <Icon.Alert width={16} height={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100">{a.dealer}</span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-amber-400 bg-amber-400/10 px-1.5 py-0.5">{a.concepto}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-snug">{a.detalle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Kpi({ label, value, accent, warn }) {
  return (
    <div className="bg-[#111820] border border-white/10 p-4">
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 tabular ${accent ? 'text-kia-red-soft' : warn ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
