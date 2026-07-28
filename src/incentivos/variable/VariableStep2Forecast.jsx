import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  vmForecastDealer, vmForecastResumenRS, vmBrainMetodologiaCon, vmForecastRSCon,
  vmForecastGrupos, vmPlanTrabajo, VM_BASES, VM_BASES_CAMPOS
} from '../../data/variableMargin.js'

// Paleta por grupo de la segmentación (semáforo de cumplimiento).
const GRUPO_TONE = {
  green: {
    card: 'border-emerald-200 bg-emerald-50/60', cardOn: 'ring-2 ring-emerald-500 border-emerald-300',
    dot: 'bg-emerald-500', text: 'text-emerald-700', chip: 'bg-emerald-500 text-white', bar: 'green'
  },
  amber: {
    card: 'border-amber-200 bg-amber-50/60', cardOn: 'ring-2 ring-amber-500 border-amber-300',
    dot: 'bg-amber-500', text: 'text-amber-700', chip: 'bg-amber-500 text-white', bar: 'red'
  },
  red: {
    card: 'border-red-200 bg-red-50/60', cardOn: 'ring-2 ring-kia-red border-red-300',
    dot: 'bg-kia-red', text: 'text-kia-red', chip: 'bg-kia-red text-white', bar: 'red'
  }
}

const TEND = {
  up: { label: 'Al alza', cls: 'text-emerald-600', arrow: '▲' },
  flat: { label: 'Estable', cls: 'text-kia-gray', arrow: '▬' },
  down: { label: 'A la baja', cls: 'text-kia-red', arrow: '▼' }
}

const FILTROS = [
  { v: 'all', label: 'Todas' },
  { v: 'up', label: '▲ Al alza' },
  { v: 'flat', label: '▬ Estable' },
  { v: 'down', label: '▼ A la baja' }
]

export default function VariableStep2Forecast() {
  const [estado, setEstado] = useState('idle') // idle | analizando | listo
  const [expandido, setExpandido] = useState(null)
  const [filtro, setFiltro] = useState('all')
  const [query, setQuery] = useState('')
  const [grupoSel, setGrupoSel] = useState('posibles')
  const [planAbierto, setPlanAbierto] = useState(null)
  const [bases, setBases] = useState(VM_BASES)
  const [guardadas, setGuardadas] = useState(true)
  const listo = estado === 'listo'

  // Todo el paso corre sobre las bases vigentes: al moverlas se
  // recalculan metas, estimados, probabilidades y segmentación.
  const razones = useMemo(() => vmForecastRSCon(bases), [bases])
  const r = useMemo(() => vmForecastResumenRS(razones, bases.umbral), [razones, bases.umbral])
  const grupos = useMemo(() => vmForecastGrupos(razones), [razones])
  const rOriginal = useMemo(() => vmForecastResumenRS(), [])
  const metodologia = useMemo(() => vmBrainMetodologiaCon(bases), [bases])
  const ajustadas = VM_BASES_CAMPOS.some(c => bases[c.id] !== VM_BASES[c.id])

  const setBase = (id, v) => {
    if (v === '' || !Number.isFinite(+v)) return
    const c = VM_BASES_CAMPOS.find(x => x.id === id)
    const val = Math.min(c.max, Math.max(c.min, +v))
    setBases(b => ({ ...b, [id]: +val.toFixed(1) }))
    setGuardadas(false)
  }
  const restablecer = () => { setBases(VM_BASES); setGuardadas(true) }

  const correr = () => {
    if (estado === 'analizando') return
    setEstado('analizando')
    setTimeout(() => setEstado('listo'), 1500)
  }

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return razones.filter(rz =>
      (filtro === 'all' || rz.tendencia === filtro) &&
      (!q ||
        rz.nombre.toLowerCase().includes(q) ||
        rz.corto.toLowerCase().includes(q) ||
        rz.rfc.toLowerCase().includes(q) ||
        rz.zonas.some(z => z.toLowerCase().includes(q)) ||
        rz.dealers.some(d => d.dealer.toLowerCase().includes(q)))
    )
  }, [filtro, query, razones])

  const totalF = useMemo(() => {
    let meta = 0, estimado = 0, hist = 0, enMeta = 0, puntos = 0
    for (const rz of filtrados) {
      const f = vmForecastDealer(rz, bases.umbral)
      meta += f.meta; estimado += f.estimado; hist += rz.hist; puntos += rz.dealers.length
      if (f.enMeta) enMeta += 1
    }
    return { meta, estimado, hist, enMeta, puntos }
  }, [filtrados, bases.umbral])

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Forecast"
        title="Forecast de cumplimiento por razón social"
        desc="El incentivo se define y se liquida contra la razón social, no contra el punto de venta. Sobre el histórico de los últimos 24 meses se consolidan los dealers de cada razón social y se estima, por razón social y por modelo, cuántas unidades cumplirán la meta del periodo. KIA BRAIN corre la estimación y explica cómo llegó a cada cifra."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> Histórico 24 meses</Pill>}
      />

      {/* ---------- Bases del margen variable ---------- */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-10 w-10 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Sliders width={19} height={19} /></span>
            <div className="min-w-0">
              <h3 className="font-bold">Bases del margen variable</h3>
              <p className="text-sm text-kia-gray mt-0.5">
                Parámetros con los que se arma el forecast. Ajústalos a mano para ver el efecto en toda la red antes de reportar a Finanzas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="ink"><Icon.Database width={13} height={13} /> Origen SAP · VQM</Pill>
            <Pill tone={ajustadas ? (guardadas ? 'green' : 'amber') : 'gray'}>
              {ajustadas ? (guardadas ? <><Icon.Check width={13} height={13} /> Bases guardadas</> : 'Bases ajustadas') : 'Bases del programa'}
            </Pill>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {VM_BASES_CAMPOS.map(c => {
            const movido = bases[c.id] !== VM_BASES[c.id]
            return (
              <div key={c.id}>
                <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">{c.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={bases[c.id]}
                    step={c.step} min={c.min} max={c.max}
                    onChange={e => setBase(c.id, e.target.value)}
                    className={`w-full pr-8 pl-3 py-2.5 rounded-xl border text-sm tabular font-semibold focus:outline-none focus:ring-2 focus:ring-slate-100 ${movido ? 'border-kia-red text-kia-red' : 'border-kia-line focus:border-slate-400'}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{c.sufijo}</span>
                </div>
                <div className="text-[11px] text-kia-gray mt-1 leading-snug">{c.desc}</div>
                {movido && (
                  <div className="text-[11px] text-kia-red mt-0.5 tabular">
                    base del programa {VM_BASES[c.id]}{c.sufijo}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Efecto del ajuste contra las bases originales */}
        <div className="mt-4 pt-3 border-t border-kia-line flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-kia-gray">
            <span>
              Meta de red <strong className="tabular text-kia-black">{r.meta.toLocaleString('es-MX')}</strong> u
              {r.meta !== rOriginal.meta && (
                <span className="text-kia-red tabular"> ({r.meta - rOriginal.meta >= 0 ? '+' : ''}{r.meta - rOriginal.meta})</span>
              )}
            </span>
            <span>
              Estimado <strong className="tabular text-kia-black">{r.estimado.toLocaleString('es-MX')}</strong> u
              {r.estimado !== rOriginal.estimado && (
                <span className="text-kia-red tabular"> ({r.estimado - rOriginal.estimado >= 0 ? '+' : ''}{r.estimado - rOriginal.estimado})</span>
              )}
            </span>
            <span>
              Razones sociales en meta <strong className="tabular text-kia-black">{r.razonesMeta}/{r.razones}</strong>
              {r.razonesMeta !== rOriginal.razonesMeta && (
                <span className="text-kia-red tabular"> ({r.razonesMeta - rOriginal.razonesMeta >= 0 ? '+' : ''}{r.razonesMeta - rOriginal.razonesMeta})</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={restablecer} disabled={!ajustadas}>
              <Icon.Refresh width={15} height={15} /> Restablecer
            </Button>
            <Button variant="danger" onClick={() => setGuardadas(true)} disabled={guardadas}>
              <Icon.Check width={15} height={15} /> Guardar bases
            </Button>
          </div>
        </div>
      </Card>

      {/* ---------- KIA BRAIN ---------- */}
      <div className="rounded-2xl border border-kia-line overflow-hidden shadow-card">
        <div className="p-5 bg-gradient-to-r from-kia-black via-[#0c1c2b] to-kia-red text-white">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="h-11 w-11 shrink-0 rounded-xl bg-white/10 backdrop-blur grid place-items-center ring-1 ring-white/20">
                <Icon.Brain width={22} height={22} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-lg">KIA BRAIN</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 px-1.5 py-0.5 rounded">IA predictiva</span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 max-w-md leading-snug">
                  Estima el cumplimiento por razón social y modelo con 24 meses de VQM + SAP, ajustando estacionalidad y tendencia.
                </p>
              </div>
            </div>
            <button
              onClick={correr}
              disabled={estado === 'analizando'}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-kia-black hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              {estado === 'idle' && <><Icon.Spark width={16} height={16} /> Estimar cumplimiento</>}
              {estado === 'analizando' && <><Spinner /> Analizando 24 meses…</>}
              {listo && <><Icon.Refresh width={16} height={16} /> Recalcular</>}
            </button>
          </div>
        </div>

        {/* Explicación de cómo llegó a la cifra */}
        {listo && (
          <div className="p-5 bg-white animate-fade-up">
            <div className="flex items-start gap-3">
              <Icon.Spark width={18} height={18} className="mt-0.5 shrink-0 text-kia-red" />
              <p className="text-sm leading-relaxed">
                Consolidé los {r.puntosVenta} puntos de venta en <strong>{r.razones} razones sociales</strong> y estimo <strong className="tabular">{r.estimado.toLocaleString('es-MX')} unidades</strong> en la red (vs {r.meta.toLocaleString('es-MX')} de meta, {r.delta >= 0 ? '+' : ''}{r.delta}).
                <strong> {r.razonesMeta} de {r.razones} razones sociales</strong> superan su meta con probabilidad ≥ {bases.umbral}%, y {r.paresMeta} de {r.pares} pares razón social·modelo quedan en meta.
                Segmenté la red en <strong className="text-emerald-600">{grupos.logran.n} que lo van a lograr</strong>, <strong className="text-amber-600">{grupos.posibles.n} con posibilidades</strong> (les faltan {grupos.posibles.brecha} u)
                y <strong className="text-kia-red">{grupos.noLogran.n} que no llegan</strong> (brecha de {grupos.noLogran.brecha} u), con plan de trabajo para cada una.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {metodologia.map((m, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-kia-gray">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-100 grid place-items-center text-[10px] font-bold text-kia-black">{i + 1}</span>
                  <span className="leading-snug">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Unidades estimadas" value={listo ? r.estimado.toLocaleString('es-MX') : '—'} sub={listo ? `vs ${r.meta.toLocaleString('es-MX')} meta · ${r.delta >= 0 ? '+' : ''}${r.delta}` : 'Corre KIA BRAIN'} accent />
        <Kpi label="Razones sociales en meta" value={listo ? `${r.razonesMeta} / ${r.razones}` : `— / ${r.razones}`} sub={`Probabilidad ≥ ${bases.umbral}%`} />
        <Kpi label="Pares en meta" value={listo ? `${r.paresMeta} / ${r.pares}` : '—'} sub="Razón social × modelo" />
        <Kpi label="Confianza del modelo" value={listo ? `${r.confianza}%` : '—'} sub="Histórico 24 meses" />
      </div>

      {/* ---------- Segmentación de cumplimiento ---------- */}
      {listo && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Icon.Brain width={18} height={18} className="text-kia-red" /> Segmentación de la red
              </h3>
              <p className="text-xs text-kia-gray mt-0.5">
                KIA BRAIN parte las {r.razones} razones sociales en tres grupos de decisión y genera el plan de trabajo de cada una.
              </p>
            </div>
            <Pill tone="ink"><Icon.Database width={14} height={14} /> 24 meses de histórico</Pill>
          </div>

          {/* Semáforo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['logran', 'posibles', 'noLogran'].map(k => {
              const g = grupos[k]
              const tone = GRUPO_TONE[g.tone]
              const on = grupoSel === k
              return (
                <button key={k} onClick={() => { setGrupoSel(k); setPlanAbierto(null) }}
                  className={`text-left rounded-2xl border p-4 transition-all ${tone.card} ${on ? tone.cardOn : 'hover:border-slate-300'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                    <span className="text-sm font-bold">{g.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-3xl font-bold tabular ${tone.text}`}>{g.n}</span>
                    <span className="text-xs text-kia-gray">razones sociales · {g.pct}% de la red</span>
                  </div>
                  <p className="text-[11px] text-kia-gray mt-1.5 leading-snug">{g.desc}</p>
                  <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                    <span className="text-kia-gray">{g.criterio}</span>
                    <span className={`font-bold tabular ${tone.text}`}>
                      {k === 'logran' ? `+${g.colchon} u sobre meta` : `faltan ${g.brecha} u`}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detalle del grupo seleccionado */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-kia-line flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${GRUPO_TONE[grupos[grupoSel].tone].dot}`} />
                <h4 className="font-bold">{grupos[grupoSel].label}</h4>
                <Pill tone="gray">{grupos[grupoSel].n} razones sociales</Pill>
              </div>
              <div className="text-xs text-kia-gray">
                Meta <strong className="tabular text-kia-black">{grupos[grupoSel].meta.toLocaleString('es-MX')}</strong> u ·
                Estimado <strong className="tabular text-kia-black"> {grupos[grupoSel].estimado.toLocaleString('es-MX')}</strong> u
                {grupoSel !== 'logran' && <> · Extra requerido <strong className="tabular text-kia-red"> {grupos[grupoSel].brecha}</strong> u</>}
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {grupos[grupoSel].items.map(rz => {
                const p = rz.perfil
                const tone = GRUPO_TONE[grupos[grupoSel].tone]
                const abierto = planAbierto === rz.id
                const plan = abierto ? vmPlanTrabajo(rz) : []
                return (
                  <div key={rz.id}>
                    <button
                      onClick={() => grupoSel !== 'logran' && setPlanAbierto(abierto ? null : rz.id)}
                      className={`w-full text-left px-5 py-3.5 flex items-center gap-4 ${grupoSel !== 'logran' ? 'hover:bg-slate-50/70 cursor-pointer' : 'cursor-default'} ${abierto ? 'bg-slate-50/70' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {grupoSel !== 'logran' && (
                            <Icon.Chevron width={13} height={13} className={`text-slate-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />
                          )}
                          <span className="font-semibold text-sm truncate">{rz.nombre}</span>
                          <span className="text-[11px] text-kia-gray">{rz.zona}</span>
                        </div>
                        <div className="text-[11px] text-kia-gray mt-0.5 tabular">
                          {rz.dealers.length} {rz.dealers.length === 1 ? 'dealer' : 'dealers'} · meta {p.meta} u · estimado {p.estimado} u · {TEND[rz.tendencia].label.toLowerCase()}
                        </div>
                      </div>

                      {/* Unidades extra necesarias */}
                      {grupoSel === 'logran' ? (
                        <span className="shrink-0 text-xs font-bold text-emerald-600 tabular">+{p.colchon} u de colchón</span>
                      ) : (
                        <div className="shrink-0 text-right">
                          <div className={`text-lg font-bold tabular leading-none ${tone.text}`}>+{p.brecha} u</div>
                          <div className="text-[10px] text-kia-gray mt-0.5">{p.ritmoNecesario} u/semana</div>
                        </div>
                      )}

                      <div className="shrink-0 w-28 flex items-center gap-2">
                        <div className="flex-1"><ProgressBar value={p.prob} tone={tone.bar} /></div>
                        <span className={`text-xs tabular font-bold w-8 text-right ${tone.text}`}>{p.prob}%</span>
                      </div>
                    </button>

                    {/* Plan de trabajo generado por la IA */}
                    {abierto && (
                      <div className="px-5 pb-5 bg-slate-50/70 animate-fade-up">
                        <div className="rounded-xl bg-white border border-kia-line p-4">
                          <div className="flex items-start gap-2.5 mb-3">
                            <span className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-kia-black to-kia-red text-white grid place-items-center">
                              <Icon.Spark width={14} height={14} />
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-kia-red uppercase tracking-wide">
                                KIA BRAIN · plan de trabajo
                              </div>
                              <p className="text-sm mt-1 leading-relaxed">
                                {rz.corto} necesita <strong className="text-kia-red">{p.brecha} unidades extra</strong> ({p.ritmoNecesario} por semana) repartidas entre {rz.dealers.length === 1 ? 'su punto de venta' : `sus ${rz.dealers.length} puntos de venta`} para
                                asegurar sus {p.meta} u de meta. El pronóstico queda corto en <strong>{p.modelosCortos}</strong> de {rz.modelos.length} modelos;
                                el foco es <strong>{p.modeloFoco}</strong>.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {plan.map((a, i) => (
                              <div key={i} className="flex items-start gap-3 rounded-lg border border-kia-line px-3 py-2.5">
                                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-md bg-kia-black text-white grid place-items-center text-[10px] font-bold">{i + 1}</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold">{a.titulo}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-kia-gray px-1.5 py-0.5 rounded">{a.plazo}</span>
                                  </div>
                                  <p className="text-xs text-kia-gray mt-1 leading-relaxed">{a.detalle}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Modelos a empujar */}
                          {p.cortos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-kia-line">
                              <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-2">Modelos bajo meta</div>
                              <div className="flex flex-wrap gap-2">
                                {p.cortos.map(m => (
                                  <span key={m.modelo} className="inline-flex items-center gap-1.5 rounded-lg border border-kia-line px-2.5 py-1.5 text-xs">
                                    <span className="font-semibold">{m.modelo}</span>
                                    <span className="text-kia-red tabular font-bold">−{m.faltan} u</span>
                                    <span className="text-kia-gray tabular">({m.prob}%)</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ---------- Forecast por razón social ---------- */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold flex items-center gap-2"><Icon.Users width={17} height={17} /> Estimación por razón social</h3>
            <Pill tone="gray">{filtrados.length} de {razones.length} razones sociales</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Buscar por razón social */}
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
            {/* Filtro por tendencia */}
            <div className="inline-flex rounded-xl border border-kia-line p-0.5 bg-slate-50">
              {FILTROS.map(o => (
                <button key={o.v} onClick={() => setFiltro(o.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtro === o.v ? 'bg-white text-kia-black shadow-sm' : 'text-kia-gray hover:text-kia-black'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Razón social</th>
                <th className="text-left font-semibold px-3 py-3">Zona</th>
                <th className="text-right font-semibold px-3 py-3">Dealers</th>
                <th className="text-right font-semibold px-3 py-3">Hist. 24m</th>
                <th className="text-right font-semibold px-3 py-3">Meta</th>
                <th className="text-right font-semibold px-3 py-3">Estimado</th>
                <th className="text-right font-semibold px-3 py-3">Tendencia</th>
                <th className="text-left font-semibold px-5 py-3 w-44">Prob. meta</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(rz => {
                const f = vmForecastDealer(rz, bases.umbral)
                const t = TEND[rz.tendencia]
                const abierto = expandido === rz.id
                return (
                  <ForecastRow key={rz.id}
                    rz={rz} f={f} t={t} listo={listo} abierto={abierto} umbral={bases.umbral}
                    onToggle={() => setExpandido(abierto ? null : rz.id)}
                  />
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-kia-gray text-sm">Sin razones sociales para «{query}»{filtro !== 'all' ? ' con ese filtro' : ''}.</td></tr>
              )}
            </tbody>
            {filtrados.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                  <td className="px-5 py-3">Total {filtro !== 'all' || query ? `(${filtrados.length})` : ''}</td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3 text-right tabular text-kia-gray">{totalF.puntos}</td>
                  <td className="px-3 py-3 text-right tabular text-kia-gray">{totalF.hist.toLocaleString('es-MX')}</td>
                  <td className="px-3 py-3 text-right tabular">{totalF.meta.toLocaleString('es-MX')}</td>
                  <td className="px-3 py-3 text-right tabular text-kia-red">{listo ? totalF.estimado.toLocaleString('es-MX') : '—'}</td>
                  <td className="px-3 py-3" />
                  <td className="px-5 py-3 text-right tabular">{listo ? `${totalF.enMeta}/${filtrados.length} en meta` : '—'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm ${listo ? 'bg-sky-50 border border-sky-100 text-sky-900' : 'bg-slate-50 border border-kia-line text-kia-gray'}`}>
        <Icon.Clock width={18} height={18} className={`mt-0.5 shrink-0 ${listo ? 'text-sky-600' : 'text-slate-400'}`} />
        <p>{listo
          ? <>El forecast alimenta el paso de liquidación: las razones sociales en meta se proyectan al pago estimado y las de riesgo se marcan para seguimiento comercial antes del cierre. Haz clic en una razón social para ver el razonamiento de KIA BRAIN y el desglose de sus dealers.</>
          : <>Corre <strong>KIA BRAIN</strong> para estimar el cumplimiento por razón social y modelo. Cada estimación incluye la explicación de cómo se calculó a partir del histórico.</>}</p>
      </div>
    </div>
  )
}

function ForecastRow({ rz, f, t, listo, abierto, umbral, onToggle }) {
  return (
    <>
      <tr className={`border-t border-slate-100 ${listo ? 'hover:bg-slate-50/60 cursor-pointer' : ''} ${abierto ? 'bg-slate-50/60' : ''}`}
        onClick={listo ? onToggle : undefined}>
        <td className="px-5 py-3">
          <span className="inline-flex items-start gap-2">
            {listo && <Icon.Chevron width={13} height={13} className={`mt-1 text-slate-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />}
            <span>
              <span className="block font-semibold">{rz.nombre}</span>
              <span className="block text-[11px] text-kia-gray tabular">{rz.rfc} · {rz.corto}</span>
            </span>
          </span>
        </td>
        <td className="px-3 py-3 text-kia-gray">{rz.zona}</td>
        <td className="px-3 py-3 text-right tabular text-kia-gray">{rz.dealers.length}</td>
        <td className="px-3 py-3 text-right tabular text-kia-gray">{rz.hist}</td>
        <td className="px-3 py-3 text-right tabular">{f.meta}</td>
        <td className="px-3 py-3 text-right tabular font-bold text-kia-red">{listo ? f.estimado : '—'}</td>
        <td className={`px-3 py-3 text-right tabular text-xs font-semibold ${t.cls}`}>{t.arrow} {t.label}</td>
        <td className="px-5 py-3">
          {listo ? (
            <div className="flex items-center gap-2">
              <div className="flex-1"><ProgressBar value={f.prob} tone={f.enMeta ? 'green' : 'red'} /></div>
              <span className={`text-xs tabular font-semibold w-9 text-right ${f.enMeta ? 'text-emerald-600' : 'text-kia-red'}`}>{f.prob}%</span>
            </div>
          ) : <span className="text-slate-300">—</span>}
        </td>
      </tr>
      {listo && abierto && (
        <tr className="bg-slate-50/60">
          <td colSpan={8} className="px-5 py-4">
            <div className="rounded-xl bg-white border border-kia-line p-4 animate-fade-up whitespace-normal">
              <div className="flex items-start gap-2.5 mb-3">
                <span className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-kia-black to-kia-red text-white grid place-items-center"><Icon.Spark width={14} height={14} /></span>
                <div>
                  <div className="text-xs font-bold text-kia-red uppercase tracking-wide">KIA BRAIN · cómo llegó a {f.estimado} u</div>
                  <p className="text-sm text-kia-black mt-1 leading-relaxed max-w-3xl">{rz.razon}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {rz.modelos.map(m => {
                  const ok = m.prob >= umbral
                  return (
                    <div key={m.modelo} className="rounded-lg border border-kia-line px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{m.modelo}</span>
                        <span className={`text-[11px] tabular font-bold ${ok ? 'text-emerald-600' : 'text-kia-red'}`}>{m.prob}%</span>
                      </div>
                      <div className="text-[11px] text-kia-gray mt-0.5 tabular">est {m.estimado} · meta {m.meta}</div>
                      <div className="mt-1.5"><ProgressBar value={m.prob} tone={ok ? 'green' : 'red'} /></div>
                    </div>
                  )
                })}
              </div>

              {/* Puntos de venta que consolidan la razón social */}
              <div className="mt-4 pt-3 border-t border-kia-line">
                <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-2">
                  Puntos de venta de la razón social ({rz.dealers.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                  {rz.dealers.map(d => {
                    const fd = vmForecastDealer(d, umbral)
                    const td = TEND[d.tendencia]
                    return (
                      <div key={d.dealer} className="flex items-center justify-between gap-3 text-xs border-b border-slate-50 pb-1.5">
                        <span className="min-w-0 truncate">
                          <span className="font-semibold">{d.dealer}</span>
                          <span className="text-kia-gray"> · {d.zona}</span>
                        </span>
                        <span className="shrink-0 tabular text-kia-gray">
                          est <strong className="text-kia-black">{fd.estimado}</strong> / meta {fd.meta}
                          <span className={`ml-2 font-semibold ${td.cls}`}>{td.arrow}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-kia-gray">
                <Icon.Database width={12} height={12} /> Confianza {rz.confianza}% · basado en 24 meses de histórico
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-kia-black/25 border-t-kia-black animate-spin" />
}
