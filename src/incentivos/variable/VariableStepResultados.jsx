import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  vmResultados, vmResultadosResumen, vmResultadosPorVariable, vmResultadosPorZona,
  vmResultadosInsights, VM_ESTATUS, VM_ESTATUS_ORDEN, VM_RESULTADO_ESTADO, VM_ESTADO_ORDEN,
  VM_PERIODO, VM_FECHA_CORTE,
  VM_DIA_CORTE, VM_DIAS_PERIODO, VM_DIAS_RESTANTES, fmtMXN
} from '../../data/variableMargin.js'

// Paleta compartida por estatus de razón social y estado de variable.
const TONE = {
  green: { dot: 'bg-emerald-500', bar: '#10B981', text: 'text-emerald-700', soft: 'bg-emerald-50/60 border-emerald-200', on: 'ring-2 ring-emerald-500 border-emerald-300', chip: 'bg-emerald-50 text-emerald-700' },
  blue: { dot: 'bg-sky-500', bar: '#0EA5E9', text: 'text-sky-700', soft: 'bg-sky-50/60 border-sky-200', on: 'ring-2 ring-sky-500 border-sky-300', chip: 'bg-sky-50 text-sky-700' },
  amber: { dot: 'bg-amber-500', bar: '#F59E0B', text: 'text-amber-700', soft: 'bg-amber-50/60 border-amber-200', on: 'ring-2 ring-amber-500 border-amber-300', chip: 'bg-amber-50 text-amber-700' },
  red: { dot: 'bg-kia-red', bar: '#BB162B', text: 'text-kia-red', soft: 'bg-red-50/60 border-red-200', on: 'ring-2 ring-kia-red border-red-300', chip: 'bg-red-50 text-kia-red' }
}

const RITMO = {
  up: { arrow: '▲', label: 'Acelerando', cls: 'text-emerald-600' },
  flat: { arrow: '▬', label: 'Ritmo estable', cls: 'text-kia-gray' },
  down: { arrow: '▼', label: 'Desacelerando', cls: 'text-kia-red' }
}

const ORDENES = [
  { v: 'avance', label: 'Avance' },
  { v: 'unidades', label: 'Unidades' },
  { v: 'bolsa', label: 'Bolsa' }
]

// Qué porcentaje de su meta debería llevar cada quien al día del corte.
const PCT_TIEMPO = Math.round((VM_DIA_CORTE / VM_DIAS_PERIODO) * 100)

export default function VariableStepResultados() {
  const [filtro, setFiltro] = useState('all')
  const [query, setQuery] = useState('')
  const [orden, setOrden] = useState('avance')
  const [abierto, setAbierto] = useState(null)

  const r = vmResultadosResumen()
  const porVariable = useMemo(() => vmResultadosPorVariable(), [])
  const porZona = useMemo(() => vmResultadosPorZona(), [])
  const insights = useMemo(() => vmResultadosInsights(), [])

  const lista = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = vmResultados.filter(x =>
      (filtro === 'all' || x.estatus === filtro) &&
      (!q ||
        x.nombre.toLowerCase().includes(q) ||
        x.corto.toLowerCase().includes(q) ||
        x.rfc.toLowerCase().includes(q) ||
        x.zonas.some(z => z.toLowerCase().includes(q)) ||
        x.dealers.some(d => d.dealer.toLowerCase().includes(q)))
    )
    const cmp = {
      avance: (a, b) => b.pct - a.pct || b.acum - a.acum,
      unidades: (a, b) => b.acum - a.acum,
      bolsa: (a, b) => b.asegurado - a.asegurado || b.enJuego - a.enJuego
    }[orden]
    return [...out].sort(cmp)
  }, [filtro, query, orden])

  // Bolsa por estatus, para las tarjetas del semáforo.
  const bolsaPorEstatus = useMemo(() => {
    const acc = {}
    for (const k of VM_ESTATUS_ORDEN) {
      const del = vmResultados.filter(x => x.estatus === k)
      acc[k] = {
        asegurado: del.reduce((a, x) => a + x.asegurado, 0),
        enJuego: del.reduce((a, x) => a + x.enJuego, 0),
        perdido: del.reduce((a, x) => a + x.perdido, 0)
      }
    }
    return acc
  }, [])

  const pctTiempo = Math.round((VM_DIA_CORTE / VM_DIAS_PERIODO) * 100)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 2 · Resultados"
        title="Resultados del periodo en curso"
        desc={`Corte al ${VM_FECHA_CORTE}: cómo va cada razón social contra las variables de la oferta comercial. Quién ya tiene el incentivo asegurado, quién sigue pendiente y quién ya no llega, con la bolsa que está en juego en cada caso.`}
        right={<Pill tone="ink"><Icon.Clock width={14} height={14} /> Día {VM_DIA_CORTE} de {VM_DIAS_PERIODO}</Pill>}
      />

      {/* ---------- Franja del periodo + ritmo semanal ---------- */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-[260px] flex-1">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold flex items-center gap-2">
                <Icon.Clock width={16} height={16} className="text-kia-red" /> {VM_PERIODO} · {pctTiempo}% del periodo transcurrido
              </span>
              <span className="text-xs text-kia-gray tabular">quedan {VM_DIAS_RESTANTES} días</span>
            </div>
            <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-kia-black transition-all duration-700" style={{ width: `${pctTiempo}%` }} />
              {/* Marca del avance de unidades contra el tiempo */}
              <div className="absolute inset-y-0 w-0.5 bg-kia-red" style={{ left: `${Math.min(100, r.pct)}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-kia-gray">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-kia-black" /> tiempo {pctTiempo}%</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-kia-red" /> unidades {r.pct}% de la meta</span>
              <span className={`font-semibold ${r.indice >= 100 ? 'text-emerald-600' : 'text-kia-red'}`}>
                índice de ritmo {r.indice}
              </span>
            </div>
          </div>

          {/* Ritmo por tramo del periodo */}
          <div className="flex items-end gap-3">
            {r.tramos.map(t => {
              const max = Math.max(...r.tramos.map(x => x.ritmo))
              const h = max ? Math.round((t.ritmo / max) * 56) + 6 : 6
              const enCurso = t.label === 'S4'
              return (
                <div key={t.label} className="text-center">
                  <div className="h-[62px] flex items-end justify-center">
                    <div className={`w-9 rounded-t-md ${enCurso ? 'bg-kia-red/80' : 'bg-kia-black/80'}`} style={{ height: `${h}px` }} />
                  </div>
                  <div className="text-[10px] font-semibold mt-1">{t.label}</div>
                  <div className="text-[10px] text-kia-gray tabular">{t.ritmo} u/d</div>
                </div>
              )
            })}
            <div className="pl-2 border-l border-kia-line self-stretch flex flex-col justify-center">
              <div className="text-[11px] text-kia-gray">Ritmo del corte</div>
              <div className="text-lg font-bold tabular">{r.ritmoActual} <span className="text-xs font-medium text-kia-gray">u/día</span></div>
              <div className="text-[11px] text-kia-gray">requerido {r.ritmoRequerido} u/día</div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Unidades acumuladas" value={r.acum.toLocaleString('es-MX')} sub={`${r.pct}% de ${r.meta.toLocaleString('es-MX')} de meta`} accent />
        <Kpi label="Proyección al cierre" value={`${r.proy.toLocaleString('es-MX')} u`} sub={`${r.delta >= 0 ? '+' : ''}${r.delta} vs meta · ritmo ${r.ritmoActual} u/día`} />
        <Kpi label="Cumplen sin rescates" value={`${r.conteo.cumplida} / ${r.razones}`} sub={`${r.pendientes} pendientes · ${r.conteo.noAlcanza} fuera`} />
        <Kpi label="Bolsa asegurada" value={fmtMXN(r.asegurado)} sub={`${fmtMXN(r.enJuego)} en juego · ${fmtMXN(r.perdido)} caída`} />
      </div>

      {/* ---------- Lectura de KIA BRAIN ---------- */}
      <div className="rounded-2xl border border-kia-line overflow-hidden shadow-card">
        <div className="px-5 py-4 bg-gradient-to-r from-kia-black via-[#0c1c2b] to-kia-red text-white flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 rounded-xl bg-white/10 backdrop-blur grid place-items-center ring-1 ring-white/20">
            <Icon.Brain width={18} height={18} />
          </span>
          <div className="min-w-0">
            <div className="font-bold tracking-tight">KIA BRAIN · lectura del corte</div>
            <p className="text-[11px] text-white/70 leading-snug">Qué está pasando en la red al día {VM_DIA_CORTE} y dónde todavía se puede mover el resultado</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
          {insights.map((i, k) => {
            const I = Icon[i.icon] || Icon.Spark
            const t = TONE[i.tone] || TONE.blue
            return (
              <div key={k} className="flex items-start gap-3">
                <span className={`h-8 w-8 shrink-0 rounded-lg grid place-items-center ${i.tone === 'ink' ? 'bg-slate-100 text-kia-black' : t.chip}`}>
                  <I width={16} height={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug">{i.titulo}</div>
                  <p className="text-xs text-kia-gray mt-1 leading-relaxed">{i.detalle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------- Semáforo de estatus ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {VM_ESTATUS_ORDEN.map(k => {
          const e = VM_ESTATUS[k]
          const t = TONE[e.tone]
          const on = filtro === k
          const b = bolsaPorEstatus[k]
          return (
            <button key={k} onClick={() => { setFiltro(on ? 'all' : k); setAbierto(null) }}
              className={`text-left rounded-2xl border p-4 transition-all ${t.soft} ${on ? t.on : 'hover:border-slate-300'}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
                <span className="text-sm font-bold">{e.label}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-bold tabular ${t.text}`}>{r.conteo[k]}</span>
                <span className="text-xs text-kia-gray">de {r.razones} razones sociales</span>
              </div>
              <p className="text-[11px] text-kia-gray mt-1.5 leading-snug">{e.desc}</p>
              <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-[11px]">
                <span className="text-kia-gray">{e.criterio}</span>
                <span className={`font-bold tabular ${t.text}`}>
                  {k === 'noAlcanza' ? fmtMXN(b.perdido) : k === 'cumplida' ? fmtMXN(b.asegurado + b.enJuego) : fmtMXN(b.enJuego)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ---------- Tablero por razón social ---------- */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-bold flex items-center gap-2">
              <Icon.Users width={17} height={17} /> Resultado por razón social
              {filtro !== 'all' && <Pill tone={VM_ESTATUS[filtro].tone}>{VM_ESTATUS[filtro].label}</Pill>}
            </h3>
            <Pill tone="gray">{lista.length} de {vmResultados.length}</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon.Search width={16} height={16} /></span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por razón social, RFC, dealer o zona…"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-kia-line text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-kia-black text-sm">✕</button>
              )}
            </div>
            <div className="inline-flex rounded-xl border border-kia-line p-0.5 bg-slate-50">
              {ORDENES.map(o => (
                <button key={o.v} onClick={() => setOrden(o.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${orden === o.v ? 'bg-white text-kia-black shadow-sm' : 'text-kia-gray hover:text-kia-black'}`}>
                  {o.label}
                </button>
              ))}
            </div>
            {/* Cómo leer la barra de la fila */}
            <div className="flex items-center gap-2 text-[11px] text-kia-gray ml-auto">
              <span className="inline-block h-2.5 w-8 rounded-sm bg-slate-200 relative">
                <span className="absolute inset-y-0 left-0 w-5 rounded-sm bg-kia-black/70" />
                <span className="absolute inset-y-0 border-l-2 border-dashed border-kia-black/60" style={{ left: '80%' }} />
              </span>
              unidades vendidas vs meta · línea = ritmo esperado al día {VM_DIA_CORTE}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {lista.map(x => (
            <FilaResultado key={x.id} x={x} abierto={abierto === x.id} onToggle={() => setAbierto(abierto === x.id ? null : x.id)} />
          ))}
          {lista.length === 0 && (
            <div className="px-5 py-10 text-center text-kia-gray text-sm">
              Sin razones sociales{query ? ` para «${query}»` : ''}{filtro !== 'all' ? ` en «${VM_ESTATUS[filtro].label}»` : ''}.
            </div>
          )}
        </div>
      </Card>

      {/* ---------- Desempeño por variable de la oferta ---------- */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="font-bold flex items-center gap-2"><Icon.Sliders width={17} height={17} /> Desempeño por variable de la oferta</h3>
            <p className="text-xs text-kia-gray mt-0.5">
              Cómo responde la red a cada variable del paso 1. Las variables medidas ya cerraron su dato; las abiertas se definen con el periodo.
            </p>
          </div>
          <Pill tone="gray">{porVariable.length} variables · {fmtMXN(r.bolsa)}</Pill>
        </div>
        <div className="space-y-3">
          {porVariable.map(v => (
            <div key={v.id} className="rounded-xl border border-kia-line px-4 py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate">{v.nombre}</span>
                  <Pill tone={v.cierre === 'medida' ? 'ink' : 'gray'}>
                    {v.cierre === 'medida' ? 'Ya medida' : 'Abierta'}
                  </Pill>
                  <span className="text-[11px] text-kia-gray">meta {v.meta} · peso {v.peso}% · {fmtMXN(v.bolsa)}</span>
                </div>
                <div className="text-xs tabular text-kia-gray">
                  avance promedio <strong className={v.avancePromedio >= 100 ? 'text-emerald-600' : 'text-kia-black'}>{v.avancePromedio}%</strong>
                  <span className="mx-2 text-kia-line">|</span>
                  asegurado <strong className="text-kia-black">{fmtMXN(v.asegurado)}</strong>
                </div>
              </div>
              <div className="mt-2.5 flex h-3 rounded-full overflow-hidden bg-slate-100">
                {VM_ESTADO_ORDEN.map(k => {
                  const n = { cumplida: v.cumplidas, enRitmo: v.enRitmo, corta: v.cortas, perdida: v.perdidas }[k]
                  if (!n) return null
                  return (
                    <div key={k} title={`${n} · ${VM_RESULTADO_ESTADO[k].label}`}
                      className="h-full transition-all duration-700"
                      style={{ width: `${(n / vmResultados.length) * 100}%`, background: TONE[VM_RESULTADO_ESTADO[k].tone].bar }} />
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-kia-gray tabular">
                <span className="text-emerald-700 font-semibold">{v.cumplidas} cumplida{v.cumplidas === 1 ? '' : 's'}</span>
                {v.enRitmo > 0 && <span className="text-sky-700">{v.enRitmo} en ritmo</span>}
                {v.cortas > 0 && <span className="text-amber-700">{v.cortas} corta{v.cortas === 1 ? '' : 's'}</span>}
                {v.perdidas > 0 && <span className="text-kia-red">{v.perdidas} no cumplen</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---------- Corte por zona ---------- */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line flex items-center justify-between gap-3">
          <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Corte por zona comercial</h3>
          <Pill tone="gray">{porZona.length} zonas</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Zona</th>
                <th className="text-right font-semibold px-3 py-3">Razones</th>
                <th className="text-right font-semibold px-3 py-3">Unidades</th>
                <th className="text-right font-semibold px-3 py-3">Ritmo</th>
                <th className="text-left font-semibold px-5 py-3 w-56">Distribución</th>
              </tr>
            </thead>
            <tbody>
              {porZona.map(z => (
                <tr key={z.zona} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-semibold">{z.zona}</td>
                  <td className="px-3 py-3 text-right tabular text-kia-gray">{z.n}</td>
                  <td className="px-3 py-3 text-right tabular">
                    {z.acum.toLocaleString('es-MX')} <span className="text-kia-gray text-xs">/ {z.meta.toLocaleString('es-MX')}</span>
                    <span className={`ml-2 text-xs font-semibold ${z.pct >= 80 ? 'text-emerald-600' : 'text-kia-red'}`}>{z.pct}%</span>
                  </td>
                  <td className={`px-3 py-3 text-right tabular font-bold ${z.indice >= 100 ? 'text-emerald-700' : 'text-kia-red'}`}>{z.indice}</td>
                  <td className="px-5 py-3">
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                      {VM_ESTATUS_ORDEN.map(k => z[k] > 0 && (
                        <div key={k} title={`${z[k]} · ${VM_ESTATUS[k].label}`} className="h-full"
                          style={{ width: `${(z[k] / z.n) * 100}%`, background: TONE[VM_ESTATUS[k].tone].bar }} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm bg-sky-50 border border-sky-100 text-sky-900">
        <Icon.Clock width={18} height={18} className="mt-0.5 shrink-0 text-sky-600" />
        <p>
          Este corte es la evidencia con la que se sostiene el reporte a Finanzas del siguiente paso: {fmtMXN(r.asegurado)} ya devengados,
          {' '}{fmtMXN(r.enJuego)} todavía en juego en los {VM_DIAS_RESTANTES} días que quedan y {fmtMXN(r.perdido)} que no se van a ejercer.
          El cierre definitivo, con el pago contra VIN validados, se liquida en MONTHLY.
        </p>
      </div>
    </div>
  )
}

// --- Fila de razón social con su barra de score segmentada ---
function FilaResultado({ x, abierto, onToggle }) {
  const e = VM_ESTATUS[x.estatus]
  const t = TONE[e.tone]
  const rit = RITMO[x.ritmo]

  return (
    <div>
      <button onClick={onToggle}
        className={`w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/70 transition-colors ${abierto ? 'bg-slate-50/70' : ''}`}>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.dot}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon.Chevron width={13} height={13} className={`shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />
            <span className="font-semibold text-sm truncate">{x.nombre}</span>
            <span className="text-[11px] text-kia-gray shrink-0">{x.zona}</span>
          </div>
          <div className="text-[11px] text-kia-gray mt-0.5 tabular">
            {x.acum} de {x.meta} u ({x.pct}%) · {x.dealers.length} {x.dealers.length === 1 ? 'dealer' : 'dealers'} ·
            <span className={`ml-1 font-semibold ${rit.cls}`}>{rit.arrow} {rit.label.toLowerCase()}</span>
          </div>
        </div>

        {/* Unidades vendidas contra la meta, con la marca del ritmo que
            debería llevar al día del corte */}
        <div className="hidden md:block w-52 shrink-0">
          <div className="relative h-3.5 rounded-md overflow-hidden bg-slate-100">
            <div className="h-full rounded-md transition-all duration-700"
              style={{ width: `${Math.min(100, x.pct)}%`, background: t.bar }} />
            <div className="absolute inset-y-0 border-l-2 border-dashed border-kia-black/60" style={{ left: `${PCT_TIEMPO}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-kia-gray mt-1 tabular">
            <span>{x.pct}% de su meta</span>
            <span>ritmo esperado {PCT_TIEMPO}%</span>
          </div>
        </div>

        <div className="shrink-0 w-28 text-right">
          <div className={`text-lg font-bold tabular leading-none ${t.text}`}>{x.acum.toLocaleString('es-MX')} u</div>
          <div className="text-[10px] text-kia-gray mt-1 tabular">de {x.meta.toLocaleString('es-MX')} de meta</div>
          <div className="text-[10px] text-kia-gray tabular">{fmtMXN(x.asegurado)} asegurados</div>
        </div>
      </button>

      {abierto && (
        <div className="px-5 pb-5 bg-slate-50/70 animate-fade-up">
          <div className="rounded-xl bg-white border border-kia-line p-4">
            {/* Resumen de la razón social */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Pill tone={e.tone}>{e.label}</Pill>
              <Pill tone="gray">{x.rfc}</Pill>
              <span className="text-xs text-kia-gray">
                {x.acum} u vendidas de {x.meta} ({x.pct}%) · {x.cumplidas} variables cumplidas · {x.enRitmo} en ritmo · {x.cortas} cortas · {x.perdidas} no cumplen
              </span>
              <span className="ml-auto text-xs text-kia-gray tabular">
                asegurado <strong className="text-emerald-700">{fmtMXN(x.asegurado)}</strong> ·
                en juego <strong className="text-kia-black"> {fmtMXN(x.enJuego)}</strong> ·
                caída <strong className="text-kia-red"> {fmtMXN(x.perdido)}</strong>
              </span>
            </div>

            {/* Variables de la oferta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {x.variables.map(v => {
                const est = VM_RESULTADO_ESTADO[v.estado]
                const vt = TONE[est.tone]
                return (
                  <div key={v.id} className="rounded-lg border border-kia-line px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{v.nombre}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${vt.chip}`}>{est.corto}</span>
                    </div>
                    <div className="text-[11px] text-kia-gray mt-0.5 tabular">
                      meta {v.meta} · peso {v.peso}% · {fmtMXN(v.bolsaRS)}
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, v.avance)}%`, background: vt.bar }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-kia-gray mt-1 tabular">
                      <span>avance {v.avance}%</span>
                      {v.cierre === 'abierta' && <span>proyecta {v.proy}%</span>}
                    </div>
                    <p className="text-[11px] text-kia-gray mt-1.5 leading-snug">{v.nota}</p>
                  </div>
                )
              })}
            </div>

            {/* Puntos de venta */}
            <div className="mt-4 pt-3 border-t border-kia-line">
              <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-2">
                Avance de sus puntos de venta ({x.dealersCerrados} de {x.dealers.length} ya cerraron su meta)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {[...x.dealers].sort((a, b) => b.pct - a.pct).map(d => (
                  <div key={d.dealer} className="flex items-center gap-3 text-xs">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-semibold">{d.dealer}</span>
                      <span className="text-kia-gray"> · {d.zona}</span>
                    </span>
                    <span className="w-24 shrink-0"><ProgressBar value={d.pct} tone={d.pct >= 100 ? 'green' : d.pct >= 80 ? 'ink' : 'red'} /></span>
                    <span className="w-24 shrink-0 text-right tabular text-kia-gray">
                      {d.acum}/{d.meta} <span className={d.pct >= 100 ? 'text-emerald-600 font-semibold' : ''}>{d.pct}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
