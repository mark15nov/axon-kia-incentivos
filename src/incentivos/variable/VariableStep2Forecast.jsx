import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  vmForecast, vmForecastDealer, vmForecastResumen, vmBrainMetodologia,
  UMBRAL_META
} from '../../data/variableMargin.js'

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
  const r = vmForecastResumen()
  const listo = estado === 'listo'

  const correr = () => {
    if (estado === 'analizando') return
    setEstado('analizando')
    setTimeout(() => setEstado('listo'), 1500)
  }

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vmForecast.filter(d =>
      (filtro === 'all' || d.tendencia === filtro) &&
      (!q || d.dealer.toLowerCase().includes(q) || d.zona.toLowerCase().includes(q))
    )
  }, [filtro, query])

  const totalF = useMemo(() => {
    let meta = 0, estimado = 0, hist = 0, enMeta = 0
    for (const d of filtrados) {
      const f = vmForecastDealer(d)
      meta += f.meta; estimado += f.estimado; hist += d.hist
      if (f.enMeta) enMeta += 1
    }
    return { meta, estimado, hist, enMeta }
  }, [filtrados])

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 2 · Forecast"
        title="Forecast de cumplimiento por dealer"
        desc="Sobre el histórico de los últimos 24 meses se estima, por dealer y por modelo, cuántas unidades cumplirán la meta del periodo en toda la red KIA México. KIA BRAIN corre la estimación y explica cómo llegó a cada cifra."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> Histórico 24 meses</Pill>}
      />

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
                  Estima el cumplimiento por dealer y modelo con 24 meses de VQM + SAP, ajustando estacionalidad y tendencia.
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
                Con la oferta definida estimo <strong className="tabular">{r.estimado.toLocaleString('es-MX')} unidades</strong> en la red (vs {r.meta.toLocaleString('es-MX')} de meta, {r.delta >= 0 ? '+' : ''}{r.delta}).
                <strong> {r.dealersMeta} de {r.dealers} dealers</strong> superan su meta con probabilidad ≥ {UMBRAL_META}%, y {r.paresMeta} de {r.pares} pares dealer·modelo quedan en meta.
                Los dealers con tendencia a la baja se marcan para seguimiento comercial.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {vmBrainMetodologia.map((m, i) => (
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
        <Kpi label="Dealers en meta" value={listo ? `${r.dealersMeta} / ${r.dealers}` : `— / ${r.dealers}`} sub={`Probabilidad ≥ ${UMBRAL_META}%`} />
        <Kpi label="Pares en meta" value={listo ? `${r.paresMeta} / ${r.pares}` : '—'} sub="Dealer × modelo" />
        <Kpi label="Confianza del modelo" value={listo ? `${r.confianza}%` : '—'} sub="Histórico 24 meses" />
      </div>

      {/* ---------- Forecast por dealer ---------- */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold flex items-center gap-2"><Icon.Users width={17} height={17} /> Estimación por dealer</h3>
            <Pill tone="gray">{filtrados.length} de {vmForecast.length} dealers</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Buscar por dealer */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon.Search width={16} height={16} /></span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por dealer o zona…"
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
                <th className="text-left font-semibold px-5 py-3">Dealer</th>
                <th className="text-left font-semibold px-3 py-3">Zona</th>
                <th className="text-right font-semibold px-3 py-3">Hist. 24m</th>
                <th className="text-right font-semibold px-3 py-3">Meta</th>
                <th className="text-right font-semibold px-3 py-3">Estimado</th>
                <th className="text-right font-semibold px-3 py-3">Tendencia</th>
                <th className="text-left font-semibold px-5 py-3 w-44">Prob. meta</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(d => {
                const f = vmForecastDealer(d)
                const t = TEND[d.tendencia]
                const abierto = expandido === d.dealer
                return (
                  <ForecastRow key={d.dealer}
                    d={d} f={f} t={t} listo={listo} abierto={abierto}
                    onToggle={() => setExpandido(abierto ? null : d.dealer)}
                  />
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-kia-gray text-sm">Sin dealers para «{query}»{filtro !== 'all' ? ' con ese filtro' : ''}.</td></tr>
              )}
            </tbody>
            {filtrados.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                  <td className="px-5 py-3">Total {filtro !== 'all' || query ? `(${filtrados.length})` : ''}</td>
                  <td className="px-3 py-3" />
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
          ? <>El forecast alimenta el paso de liquidación: los dealers en meta se proyectan al pago estimado y los de riesgo se marcan para seguimiento comercial antes del cierre. Haz clic en un dealer para ver el razonamiento de KIA BRAIN.</>
          : <>Corre <strong>KIA BRAIN</strong> para estimar el cumplimiento por dealer y modelo. Cada estimación incluye la explicación de cómo se calculó a partir del histórico.</>}</p>
      </div>
    </div>
  )
}

function ForecastRow({ d, f, t, listo, abierto, onToggle }) {
  return (
    <>
      <tr className={`border-t border-slate-100 ${listo ? 'hover:bg-slate-50/60 cursor-pointer' : ''} ${abierto ? 'bg-slate-50/60' : ''}`}
        onClick={listo ? onToggle : undefined}>
        <td className="px-5 py-3 font-semibold">
          <span className="inline-flex items-center gap-2">
            {listo && <Icon.Chevron width={13} height={13} className={`text-slate-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />}
            {d.dealer}
          </span>
        </td>
        <td className="px-3 py-3 text-kia-gray">{d.zona}</td>
        <td className="px-3 py-3 text-right tabular text-kia-gray">{d.hist}</td>
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
          <td colSpan={7} className="px-5 py-4">
            <div className="rounded-xl bg-white border border-kia-line p-4 animate-fade-up whitespace-normal">
              <div className="flex items-start gap-2.5 mb-3">
                <span className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-kia-black to-kia-red text-white grid place-items-center"><Icon.Spark width={14} height={14} /></span>
                <div>
                  <div className="text-xs font-bold text-kia-red uppercase tracking-wide">KIA BRAIN · cómo llegó a {f.estimado} u</div>
                  <p className="text-sm text-kia-black mt-1 leading-relaxed max-w-3xl">{d.razon}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {d.modelos.map(m => {
                  const ok = m.prob >= UMBRAL_META
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
              <div className="mt-3 flex items-center gap-2 text-[11px] text-kia-gray">
                <Icon.Database width={12} height={12} /> Confianza {d.confianza}% · basado en 24 meses de histórico
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
