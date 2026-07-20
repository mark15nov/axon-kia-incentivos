import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  vmCierre, vmCierreResumen, vmVinResumen, vmCorreoDealer, vmCorreoFinanzas,
  VM_PERIODO, fmtMXN
} from '../../data/variableMargin.js'

// A quién se le manda el reporte de cierre.
const AUDIENCIAS = [
  { v: 'todos', label: 'Todos los dealers' },
  { v: 'cumplio', label: 'Solo los que cumplieron' },
  { v: 'fallo', label: 'Solo los que no cumplieron' }
]

// Etapa 3 · MONTHLY. Cierre del periodo: resumen general de lo que se
// logró (quién cumplió la meta, quién no y por qué) y envío del reporte
// a los dealers y de la corrida del cálculo final a Finanzas.

const VISTAS = [
  { v: 'todos', label: 'Todos' },
  { v: 'cumplio', label: '✓ Cumplieron' },
  { v: 'fallo', label: '✕ No cumplieron' }
]

const GRUPO_LABEL = {
  logran: 'Pronóstico: lo lograba',
  posibles: 'Pronóstico: con posibilidades',
  noLogran: 'Pronóstico: no llegaba'
}

export default function VariableStepMonthly({ nombre = 'Variable Margin', folio = 'VM-JUN26-0428' }) {
  const [vista, setVista] = useState('todos')
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [envioDealers, setEnvioDealers] = useState('idle')   // idle | enviando | enviado
  const [envioFinanzas, setEnvioFinanzas] = useState('idle')

  // Modal de preview del correo: 'dealers' | 'finanzas' | null
  const [preview, setPreview] = useState(null)
  const [audiencia, setAudiencia] = useState('todos')
  const [idx, setIdx] = useState(0)                // dealer que se está previsualizando
  const [asunto, setAsunto] = useState(`Cierre Variable Margin · ${VM_PERIODO} — resultado de tu dealer`)
  const [asuntoFin, setAsuntoFin] = useState(`Corrida del cálculo final · Variable Margin ${VM_PERIODO}`)
  const [edits, setEdits] = useState({})           // { dealer: cuerpo editado }
  const [cuerpoFin, setCuerpoFin] = useState(null)
  const [enviadosN, setEnviadosN] = useState(0)    // a cuántos dealers se mandó

  const r = vmCierreResumen()
  const v = vmVinResumen()

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vmCierre.filter(c =>
      (vista === 'todos' || (vista === 'cumplio') === c.cumplio) &&
      (!q || c.dealer.toLowerCase().includes(q) || c.zona.toLowerCase().includes(q))
    )
  }, [vista, query])

  // Dealers que reciben el reporte según la audiencia elegida.
  const audiencia_dealers = useMemo(() => (
    audiencia === 'todos' ? vmCierre : vmCierre.filter(c => (audiencia === 'cumplio') === c.cumplio)
  ), [audiencia])

  const actual = audiencia_dealers[Math.min(idx, audiencia_dealers.length - 1)]
  const cuerpo = actual ? (edits[actual.dealer] ?? vmCorreoDealer(actual, nombre)) : ''

  const editarCuerpo = (txt) => setEdits(e => ({ ...e, [actual.dealer]: txt }))
  const abrir = (cual) => {
    setIdx(0)
    if (cual === 'finanzas' && cuerpoFin === null) setCuerpoFin(vmCorreoFinanzas(r, v, nombre, folio))
    setPreview(cual)
  }

  const confirmarEnvio = () => {
    const setter = preview === 'dealers' ? setEnvioDealers : setEnvioFinanzas
    if (preview === 'dealers') setEnviadosN(audiencia_dealers.length)
    setter('enviando')
    setPreview(null)
    setTimeout(() => setter('enviado'), 1500)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 3 · Paso 1"
        title="MONTHLY · cierre del periodo"
        desc="Resumen general de lo que se logró en el periodo: qué dealers alcanzaron su meta, cuáles no y por qué. Desde aquí se manda el reporte de resultados a cada dealer y la corrida del cálculo final a Finanzas."
        right={<Pill tone="ink"><Icon.Clock width={14} height={14} /> {VM_PERIODO}</Pill>}
      />

      {/* ---------- KPIs del cierre ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Dealers que cumplieron" value={`${r.cumplieron} / ${r.dealers}`} sub={`${r.pctDealers}% de la red`} accent />
        <Kpi label="Unidades de la red" value={r.real.toLocaleString('es-MX')} sub={`vs ${r.meta.toLocaleString('es-MX')} meta · ${r.dif >= 0 ? '+' : ''}${r.dif}`} />
        <Kpi label="Cumplimiento de meta" value={`${r.pctRed}%`} sub="Unidades reales / meta" />
        <Kpi label="Precisión de KIA BRAIN" value={`${r.precision}%`} sub="Acertó el resultado del dealer" />
      </div>

      {/* ---------- Split cumplieron / no cumplieron ---------- */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Icon.Users width={17} height={17} /> Resultado de la red</h3>
          <Pill tone="gray">{r.dealers} dealers</Pill>
        </div>
        <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100">
          <div className="h-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${r.pctDealers}%` }}>{r.pctDealers}%</div>
          <div className="h-full bg-kia-red flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${100 - r.pctDealers}%` }}>{100 - r.pctDealers}%</div>
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Cumplieron · {r.cumplieron}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kia-red" /> No cumplieron · {r.fallaron}</span>
        </div>

        {/* Cierre contra lo que pronosticó el forecast */}
        <div className="mt-4 pt-4 border-t border-kia-line">
          <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-2.5">Resultado contra el pronóstico del paso 1</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['logran', 'posibles', 'noLogran'].map(k => {
              const g = r.porGrupo[k]
              const pct = g.n ? Math.round((g.cumplieron / g.n) * 100) : 0
              const tone = k === 'logran' ? 'green' : k === 'posibles' ? 'red' : 'red'
              return (
                <div key={k} className="rounded-xl border border-kia-line px-3.5 py-3">
                  <div className="text-xs text-kia-gray">{GRUPO_LABEL[k]}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold tabular">{g.cumplieron}</span>
                    <span className="text-xs text-kia-gray">de {g.n} cumplieron</span>
                  </div>
                  <div className="mt-2"><ProgressBar value={pct} tone={tone} /></div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-kia-gray mt-3 leading-relaxed">
            KIA BRAIN acertó el resultado en <strong className="text-kia-black">{r.precision}%</strong> de los dealers.
            Los {r.porGrupo.posibles.n} clasificados como «con posibilidades» son los que movió el plan de trabajo: {r.porGrupo.posibles.cumplieron} de ellos cerraron su meta.
          </p>
        </div>
      </Card>

      {/* ---------- Detalle por dealer ---------- */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Quién cumplió y por qué</h3>
            <Pill tone="gray">{filtrados.length} de {vmCierre.length}</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon.Search width={16} height={16} /></span>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por dealer o zona…"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-kia-line text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-kia-black text-sm">✕</button>}
            </div>
            <div className="inline-flex rounded-xl border border-kia-line p-0.5 bg-slate-50">
              {VISTAS.map(o => (
                <button key={o.v} onClick={() => setVista(o.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${vista === o.v ? 'bg-white text-kia-black shadow-sm' : 'text-kia-gray hover:text-kia-black'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
          {filtrados.map(c => {
            const open = abierto === c.dealer
            return (
              <div key={c.dealer}>
                <button onClick={() => setAbierto(open ? null : c.dealer)}
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/70 ${open ? 'bg-slate-50/70' : ''}`}>
                  <span className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center ${c.cumplio ? 'bg-emerald-500' : 'bg-kia-red'} text-white`}>
                    {c.cumplio ? <Icon.Check width={16} height={16} /> : <Icon.Alert width={16} height={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon.Chevron width={13} height={13} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
                      <span className="font-semibold text-sm truncate">{c.dealer}</span>
                      <span className="text-[11px] text-kia-gray">{c.zona}</span>
                      {!c.acierto && <Pill tone="gray">fuera de pronóstico</Pill>}
                    </div>
                    <div className="text-[11px] text-kia-gray mt-0.5 tabular">
                      meta {c.meta} u · real {c.real} u · pronóstico {c.estimado} u
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-lg font-bold tabular leading-none ${c.cumplio ? 'text-emerald-600' : 'text-kia-red'}`}>
                      {c.dif >= 0 ? '+' : ''}{c.dif} u
                    </div>
                    <div className="text-[10px] text-kia-gray mt-0.5">{c.pctMeta}% de meta</div>
                  </div>
                </button>

                {open && (
                  <div className="px-5 pb-5 bg-slate-50/70 animate-fade-up">
                    <div className="rounded-xl bg-white border border-kia-line p-4">
                      <div className="flex items-start gap-2.5">
                        <span className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-kia-black to-kia-red text-white grid place-items-center">
                          <Icon.Spark width={14} height={14} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-kia-red uppercase tracking-wide">
                            KIA BRAIN · por qué {c.cumplio ? 'cumplió' : 'no cumplió'}
                          </div>
                          <p className="text-sm mt-1 leading-relaxed">{c.motivo}</p>
                          <p className="text-xs text-kia-gray mt-1.5">
                            {GRUPO_LABEL[c.grupo]} con {c.prob}% de probabilidad · {c.acierto ? 'el resultado coincidió' : 'el resultado se salió del pronóstico'}.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-kia-line">
                        <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-2">Cierre por modelo</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {c.modelos.map(m => (
                            <div key={m.modelo} className="rounded-lg border border-kia-line px-3 py-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">{m.modelo}</span>
                                <span className={`text-[11px] tabular font-bold ${m.dif >= 0 ? 'text-emerald-600' : 'text-kia-red'}`}>
                                  {m.dif >= 0 ? '+' : ''}{m.dif} u
                                </span>
                              </div>
                              <div className="text-[11px] text-kia-gray mt-0.5 tabular">real {m.real} · meta {m.meta}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="px-5 py-10 text-center text-kia-gray text-sm">Sin dealers para «{query}».</div>
          )}
        </div>
      </Card>

      {/* ---------- Envío de reportes ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Reporte a dealers */}
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Users width={20} height={20} /></span>
            <div className="min-w-0">
              <h3 className="font-bold">Reporte de resultados a dealers</h3>
              <p className="text-sm text-kia-gray mt-1 leading-relaxed">
                Cada dealer recibe su cierre individual: meta, unidades reales, si alcanzó el incentivo y el motivo del resultado.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-emerald-700">{r.cumplieron}</div>
              <div className="text-[11px] text-emerald-700/80">reportes de meta cumplida</div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-kia-red">{r.fallaron}</div>
              <div className="text-[11px] text-kia-red/80">reportes con motivo de incumplimiento</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {envioDealers === 'enviado'
              ? <Pill tone="green"><Icon.Check width={13} height={13} /> Enviado a {enviadosN} dealers</Pill>
              : <span className="text-xs text-kia-gray">{r.dealers} destinatarios</span>}
            <Button variant="danger" onClick={() => abrir('dealers')} disabled={envioDealers !== 'idle'}>
              {envioDealers === 'idle' && <><Icon.Mail width={16} height={16} /> Enviar reporte a dealers</>}
              {envioDealers === 'enviando' && <><Spinner /> Enviando…</>}
              {envioDealers === 'enviado' && <><Icon.Check width={16} height={16} /> Reporte enviado</>}
            </Button>
          </div>
        </Card>

        {/* Corrida del cálculo final a Finanzas */}
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-kia-red text-white grid place-items-center"><Icon.Database width={20} height={20} /></span>
            <div className="min-w-0">
              <h3 className="font-bold">Corrida del cálculo final a Finanzas</h3>
              <p className="text-sm text-kia-gray mt-1 leading-relaxed">
                Base de pago del periodo: los VIN reclamados al incentivo y validados contra la oferta comercial.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-kia-line divide-y divide-slate-100 text-sm">
            <Linea label="Dealers con incentivo" valor={`${r.cumplieron} de ${r.dealers}`} />
            <Linea label="VIN reclamados al incentivo" valor={String(v.total)} />
            <Linea label="VIN que califican" valor={`${v.ok} · ${v.rech} rechazados`} />
            <Linea label="Monto a pagar" valor={fmtMXN(v.pago)} destacado />
            <Linea label="Periodo · folio" valor={`${VM_PERIODO} · ${folio}`} />
          </div>
          <p className="text-[11px] text-kia-gray mt-2.5 leading-snug">
            El resultado comercial de la red ({r.real.toLocaleString('es-MX')} u vendidas) mide el cumplimiento de metas; la base de pago son solo los VIN reclamados al incentivo.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {envioFinanzas === 'enviado'
              ? <Pill tone="green"><Icon.Check width={13} height={13} /> Corrida enviada</Pill>
              : <span className="text-xs text-kia-gray">Destino: Finanzas KIA</span>}
            <Button variant="danger" onClick={() => abrir('finanzas')} disabled={envioFinanzas !== 'idle'}>
              {envioFinanzas === 'idle' && <><Icon.Mail width={16} height={16} /> Enviar corrida a Finanzas</>}
              {envioFinanzas === 'enviando' && <><Spinner /> Enviando…</>}
              {envioFinanzas === 'enviado' && <><Icon.Check width={16} height={16} /> Corrida enviada</>}
            </Button>
          </div>
        </Card>
      </div>

      {/* ---------- Preview del correo antes de enviar ---------- */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Encabezado */}
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-kia-line">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-kia-black to-kia-red text-white grid place-items-center">
                  <Icon.Spark width={19} height={19} />
                </span>
                <div>
                  <h3 className="font-bold">
                    {preview === 'dealers' ? 'Reporte de cierre a dealers' : 'Corrida del cálculo final a Finanzas'}
                  </h3>
                  <p className="text-xs text-kia-gray">
                    Redactado por KIA BRAIN con los datos del periodo · editable antes de enviar
                  </p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-kia-black text-lg leading-none">✕</button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-3">
              {/* Destinatarios */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-kia-gray uppercase tracking-wide w-16">Para</span>
                {preview === 'dealers' ? (
                  <>
                    <div className="inline-flex rounded-xl border border-kia-line p-0.5 bg-slate-50">
                      {AUDIENCIAS.map(a => (
                        <button key={a.v} onClick={() => { setAudiencia(a.v); setIdx(0) }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${audiencia === a.v ? 'bg-white text-kia-black shadow-sm' : 'text-kia-gray hover:text-kia-black'}`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                    <Pill tone="ink">{audiencia_dealers.length} destinatarios</Pill>
                  </>
                ) : (
                  <Pill tone="ink"><Icon.Database width={13} height={13} /> Finanzas KIA · 1 destinatario</Pill>
                )}
              </div>

              {/* Asunto */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-kia-gray uppercase tracking-wide w-16 shrink-0">Asunto</span>
                <input type="text"
                  value={preview === 'dealers' ? asunto : asuntoFin}
                  onChange={e => (preview === 'dealers' ? setAsunto : setAsuntoFin)(e.target.value)}
                  className="flex-1 rounded-xl border border-kia-line px-3.5 py-2 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              </div>

              {/* Navegación entre dealers */}
              {preview === 'dealers' && actual && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-kia-line px-3.5 py-2.5">
                  <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-kia-gray hover:text-kia-black disabled:opacity-30 disabled:cursor-not-allowed">
                    <Icon.Chevron width={13} height={13} className="rotate-180" /> Anterior
                  </button>
                  <div className="text-center min-w-0">
                    <div className="text-sm font-semibold truncate">{actual.dealer}</div>
                    <div className="text-[11px] text-kia-gray">
                      {idx + 1} de {audiencia_dealers.length} ·{' '}
                      <span className={actual.cumplio ? 'text-emerald-600 font-semibold' : 'text-kia-red font-semibold'}>
                        {actual.cumplio ? '✓ cumplió meta' : `✕ ${actual.dif} u`}
                      </span>
                      {edits[actual.dealer] && ' · editado'}
                    </div>
                  </div>
                  <button onClick={() => setIdx(i => Math.min(audiencia_dealers.length - 1, i + 1))} disabled={idx >= audiencia_dealers.length - 1}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-kia-gray hover:text-kia-black disabled:opacity-30 disabled:cursor-not-allowed">
                    Siguiente <Icon.Chevron width={13} height={13} />
                  </button>
                </div>
              )}

              {/* Cuerpo editable */}
              <textarea
                value={preview === 'dealers' ? cuerpo : (cuerpoFin ?? '')}
                onChange={e => preview === 'dealers' ? editarCuerpo(e.target.value) : setCuerpoFin(e.target.value)}
                rows={16}
                className="w-full rounded-xl border border-kia-line px-3.5 py-3 text-sm leading-relaxed font-mono resize-none focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />

              {preview === 'dealers' && (
                <p className="text-xs text-kia-gray flex items-start gap-2">
                  <Icon.Spark width={13} height={13} className="mt-0.5 shrink-0 text-kia-red" />
                  Cada dealer recibe su versión con sus propios números y su motivo. Navega para revisar cualquiera; los cambios que hagas se conservan por dealer.
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-kia-line">
              <span className="text-xs text-kia-gray">
                {preview === 'dealers'
                  ? `${Object.keys(edits).length} correo(s) editado(s) manualmente`
                  : `Folio ${folio}`}
              </span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setPreview(null)}>Cancelar</Button>
                <Button variant="danger" onClick={confirmarEnvio} disabled={preview === 'dealers' && audiencia_dealers.length === 0}>
                  <Icon.Mail width={16} height={16} />
                  {preview === 'dealers' ? `Enviar a ${audiencia_dealers.length} dealers` : 'Enviar a Finanzas'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Cierre ---------- */}
      {envioDealers === 'enviado' && envioFinanzas === 'enviado' && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 animate-fade-up">
          <div className="flex items-start gap-4">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-emerald-800">Periodo cerrado</h3>
              <p className="text-sm text-emerald-900/80 mt-1 max-w-2xl leading-relaxed">
                {nombre} · {VM_PERIODO}: {r.cumplieron} de {r.dealers} dealers alcanzaron su meta ({r.real.toLocaleString('es-MX')} u contra {r.meta.toLocaleString('es-MX')} de meta).
                El reporte salió a la red y la corrida del cálculo final por {fmtMXN(v.pago)} quedó en Finanzas para posteo y pago.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Pill tone="ink">Folio {folio}</Pill>
                <Pill tone="green"><Icon.Check width={13} height={13} /> Reporte a dealers</Pill>
                <Pill tone="green"><Icon.Check width={13} height={13} /> Corrida a Finanzas</Pill>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function Linea({ label, valor, destacado }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <span className="text-kia-gray text-xs">{label}</span>
      <span className={`tabular font-semibold ${destacado ? 'text-kia-red' : ''}`}>{valor}</span>
    </div>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}
