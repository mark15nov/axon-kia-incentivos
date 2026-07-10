import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  ofVins, ofVinResumen, ofVinMotivos, ofVinRechazosPorDealer,
  ofDealerCompliance, OF_BRAIN_RECHAZOS_METODO, OF_PERIODO, fmtMXN
} from '../../data/openingFee.js'

const COMP_TEND = {
  up: { label: 'Empeorando', cls: 'text-kia-red', arrow: '▲' },
  flat: { label: 'Estable', cls: 'text-kia-gray', arrow: '▬' },
  down: { label: 'Mejorando', cls: 'text-emerald-600', arrow: '▼' }
}

const FILTROS = [
  { v: 'all', label: 'Todos' },
  { v: 'ok', label: '✓ Correctos' },
  { v: 'rechazado', label: '✕ Rechazados' }
]

function mensajeRechazo(dealer, vins) {
  const lineas = vins.map(v => `• ${v.vin} · ${v.modelo} — ${v.motivo}`).join('\n')
  return `Estimado ${dealer}:

Tras la validación de VIN del periodo ${OF_PERIODO}, se rechazaron ${vins.length} unidad(es) del incentivo Opening Fee por los siguientes motivos:

${lineas}

Favor de subsanar la documentación o aclarar los VIN observados para su reconsideración. El resto de las unidades procede a pago.

Saludos,
Incentivos KIA`
}

export default function OpeningStep6ValidacionVin() {
  const [filtro, setFiltro] = useState('all')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null) // { dealer, vins }
  const [texto, setTexto] = useState('')
  const [notificados, setNotificados] = useState([])
  const [brain, setBrain] = useState('idle') // idle | analizando | listo

  const r = ofVinResumen()
  const motivos = ofVinMotivos()
  const porDealer = ofVinRechazosPorDealer()
  const rechazoDe = Object.fromEntries(porDealer.map(g => [g.dealer, g]))
  const compliance = ofDealerCompliance()
  const conRech = compliance.filter(d => d.rech > 0)
  const peor = conRech[0]
  const empeorando = conRech.filter(d => d.tendencia === 'up').length
  const brainListo = brain === 'listo'

  const analizarBrain = () => {
    if (brain === 'analizando') return
    setBrain('analizando')
    setTimeout(() => setBrain('listo'), 1500)
  }

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ofVins.filter(v =>
      (filtro === 'all' || v.estatus === filtro) &&
      (!q || v.vin.toLowerCase().includes(q) || v.dealer.toLowerCase().includes(q) || v.folio.toLowerCase().includes(q))
    )
  }, [filtro, query])

  const abrirRechazo = (grupo) => {
    setModal(grupo)
    setTexto(mensajeRechazo(grupo.dealer, grupo.vins))
  }
  const enviarRechazo = () => {
    if (!modal) return
    setNotificados(n => (n.includes(modal.dealer) ? n : [...n, modal.dealer]))
    setModal(null)
  }
  const notificarTodos = () => setNotificados(porDealer.map(g => g.dealer))

  const maxMotivo = Math.max(...motivos.map(m => m.n), 1)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 2 · Paso 2"
        title="Validación de VIN"
        desc="De cada factura se extrae el VIN y se cruza contra el contrato de crédito y la oferta del periodo. Se detecta qué unidades aplican al reembolso de la comisión por apertura y cuáles se rechazan (y por qué), y se notifica el rechazo al dealer."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> {r.total} VIN extraídos</Pill>}
      />

      {/* ---------- Mini dashboard ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="VIN correctos" value={`${r.ok} / ${r.total}`} sub={`${r.pctOk}% cumple la oferta`} />
        <Kpi label="VIN rechazados" value={String(r.rech)} sub={`${porDealer.length} dealers con observación`} />
        <Kpi label="Comisión a reembolsar" value={fmtMXN(r.pago)} sub="Reembolso por unidad válida" accent />
        <Kpi label="Monto facturado" value={fmtMXN(r.facturado)} sub={`${r.total} facturas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Split correctos vs rechazados */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4"><Icon.Check width={17} height={17} /> Resultado de la validación</h3>
          <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100">
            <div className="h-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${r.pctOk}%` }}>{r.pctOk}%</div>
            <div className="h-full bg-kia-red flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${100 - r.pctOk}%` }}>{100 - r.pctOk}%</div>
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Correctos · {r.ok}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kia-red" /> Rechazados · {r.rech}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-kia-line grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-emerald-700">{fmtMXN(r.pago)}</div>
              <div className="text-[11px] text-emerald-700/80">a reembolsar de comisión</div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-kia-red">{r.rech} VIN</div>
              <div className="text-[11px] text-kia-red/80">en rechazo</div>
            </div>
          </div>
        </Card>

        {/* Motivos de rechazo */}
        <Card className="lg:col-span-3 p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4"><Icon.Alert width={17} height={17} className="text-kia-red" /> Motivos de rechazo</h3>
          <div className="space-y-2.5">
            {motivos.map(m => (
              <div key={m.motivo}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-kia-black">{m.motivo}</span>
                  <span className="tabular font-semibold text-kia-red">{m.n}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-kia-red transition-all duration-500" style={{ width: `${(m.n / maxMotivo) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ---------- KIA BRAIN · análisis de rechazos ---------- */}
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
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-white/15 px-1.5 py-0.5 rounded">Análisis de rechazos</span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 max-w-md leading-snug">
                  Analiza las facturas rechazadas contra 12 meses de histórico por dealer para revelar tendencias e incumplimiento.
                </p>
              </div>
            </div>
            <button onClick={analizarBrain} disabled={brain === 'analizando'}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-kia-black hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-wait">
              {brain === 'idle' && <><Icon.Spark width={16} height={16} /> Analizar rechazos</>}
              {brain === 'analizando' && <><span className="h-4 w-4 rounded-full border-2 border-kia-black/25 border-t-kia-black animate-spin" /> Analizando histórico…</>}
              {brainListo && <><Icon.Refresh width={16} height={16} /> Recalcular</>}
            </button>
          </div>
        </div>

        {brainListo && peor && (
          <div className="p-5 bg-white animate-fade-up space-y-4">
            <div className="flex items-start gap-3">
              <Icon.Spark width={18} height={18} className="mt-0.5 shrink-0 text-kia-red" />
              <p className="text-sm leading-relaxed">
                El dealer más incumplido es <strong>{peor.dealer}</strong> con <strong className="text-kia-red">{Math.round(peor.tasaActual * 100)}% de rechazo</strong> este periodo
                (histórico {Math.round(peor.tasaHist * 100)}% · {COMP_TEND[peor.tendencia].label.toLowerCase()}, reincidencia {peor.reincidencia}%).
                El motivo más recurrente en la red es «<strong>{motivos[0]?.motivo}</strong>» ({motivos[0]?.n} casos), y <strong>{empeorando} dealer(s)</strong> muestran tendencia al alza en incumplimiento.
              </p>
            </div>

            {/* Ranking de incumplimiento */}
            <div className="rounded-xl border border-kia-line overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 text-xs font-bold uppercase tracking-wide text-kia-gray">Ranking de incumplimiento por dealer</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="text-kia-gray text-xs uppercase tracking-wide border-b border-kia-line">
                      <th className="text-left font-semibold px-4 py-2.5">#</th>
                      <th className="text-left font-semibold px-3 py-2.5">Dealer</th>
                      <th className="text-right font-semibold px-3 py-2.5">Rechazos</th>
                      <th className="text-left font-semibold px-3 py-2.5 w-36">Tasa periodo</th>
                      <th className="text-right font-semibold px-3 py-2.5">Hist. 12m</th>
                      <th className="text-right font-semibold px-3 py-2.5">Tendencia</th>
                      <th className="text-right font-semibold px-3 py-2.5">Reincid.</th>
                      <th className="text-left font-semibold px-4 py-2.5">Motivo principal</th>
                      <th className="text-right font-semibold px-4 py-2.5">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conRech.map((d, i) => {
                      const t = COMP_TEND[d.tendencia]
                      const pct = Math.round(d.tasaActual * 100)
                      return (
                        <tr key={d.dealer} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                          <td className="px-4 py-2.5">
                            <span className={`h-6 w-6 rounded-lg grid place-items-center text-xs font-bold ${i === 0 ? 'bg-kia-red text-white' : 'bg-slate-100 text-kia-black'}`}>{i + 1}</span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold">{d.dealer}</td>
                          <td className="px-3 py-2.5 text-right tabular">{d.rech}/{d.total}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-kia-red" style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                              <span className="text-xs tabular font-semibold text-kia-red w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular text-kia-gray">{Math.round(d.tasaHist * 100)}%</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-semibold ${t.cls}`}>{t.arrow} {t.label}</td>
                          <td className="px-3 py-2.5 text-right tabular text-kia-gray">{d.reincidencia}%</td>
                          <td className="px-4 py-2.5 text-xs text-kia-gray">{d.motivoTop}</td>
                          <td className="px-4 py-2.5 text-right">
                            {rechazoDe[d.dealer] && (
                              notificados.includes(d.dealer) ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Icon.Check width={12} height={12} /> Enviado</span>
                              ) : (
                                <button onClick={() => abrirRechazo(rechazoDe[d.dealer])}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-kia-red text-white hover:bg-[#a01224] transition-colors">
                                  <Icon.Mail width={12} height={12} /> Rechazar
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {OF_BRAIN_RECHAZOS_METODO.map((m, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-kia-gray">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-100 grid place-items-center text-[10px] font-bold text-kia-black">{i + 1}</span>
                  <span className="leading-snug">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Rechazos por dealer ---------- */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Users width={17} height={17} /> Rechazos por dealer</h3>
          <Button variant="soft" onClick={notificarTodos} disabled={notificados.length === porDealer.length}>
            <Icon.Mail width={15} height={15} /> Notificar a todos
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {porDealer.map(g => {
            const enviado = notificados.includes(g.dealer)
            const monto = g.vins.reduce((a, v) => a + v.bono, 0)
            return (
              <div key={g.dealer} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{g.dealer}</span>
                    <Pill tone="red">{g.vins.length} VIN</Pill>
                    {enviado && <Pill tone="green"><Icon.Check width={12} height={12} /> Rechazo enviado</Pill>}
                  </div>
                  <div className="text-xs text-kia-gray mt-0.5">Bono no pagado {fmtMXN(monto)} · {[...new Set(g.vins.map(v => v.motivo))].length} motivo(s)</div>
                </div>
                <Button variant={enviado ? 'ghost' : 'danger'} className="shrink-0" onClick={() => abrirRechazo(g)}>
                  <Icon.Mail width={15} height={15} /> {enviado ? 'Ver / reenviar' : 'Mandar rechazo a dealer'}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ---------- Detalle de VIN ---------- */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Detalle de VIN validados</h3>
            <Pill tone="gray">{filtrados.length} de {ofVins.length}</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon.Search width={16} height={16} /></span>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por VIN, folio o dealer…"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-kia-line text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-kia-black text-sm">✕</button>}
            </div>
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
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">VIN</th>
                <th className="text-left font-semibold px-3 py-3">Dealer</th>
                <th className="text-left font-semibold px-3 py-3">Modelo</th>
                <th className="text-right font-semibold px-3 py-3">Factura</th>
                <th className="text-right font-semibold px-3 py-3">Incentivo</th>
                <th className="text-left font-semibold px-5 py-3">Estatus / motivo</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(v => {
                const ok = v.estatus === 'ok'
                return (
                  <tr key={v.vin} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs font-semibold">{v.vin}</td>
                    <td className="px-3 py-3">{v.dealer}</td>
                    <td className="px-3 py-3 text-kia-gray">{v.modelo}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(v.montoFactura)}</td>
                    <td className={`px-3 py-3 text-right tabular font-semibold ${ok ? 'text-emerald-600' : 'text-slate-300'}`}>{ok ? fmtMXN(v.bono) : '—'}</td>
                    <td className="px-5 py-3">
                      {ok ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold"><Icon.Check width={13} height={13} /> Cumple</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-kia-red text-xs font-semibold"><Icon.Alert width={13} height={13} /> {v.motivo}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-kia-gray text-sm">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------- Modal de rechazo ---------- */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-kia-line">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-kia-red text-white grid place-items-center"><Icon.Mail width={19} height={19} /></span>
                <div>
                  <h3 className="font-bold">Mandar rechazo a dealer</h3>
                  <p className="text-xs text-kia-gray">{modal.dealer} · {modal.vins.length} VIN rechazados</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-kia-black text-lg leading-none">✕</button>
            </div>
            <div className="px-6 py-4 overflow-y-auto">
              <div className="text-xs font-semibold text-kia-gray uppercase tracking-wide mb-2">Mensaje al concesionario</div>
              <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={12}
                className="w-full rounded-xl border border-kia-line px-3.5 py-3 text-sm leading-relaxed font-mono resize-none focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              <div className="mt-3 rounded-xl bg-slate-50 border border-kia-line p-3 max-h-40 overflow-y-auto">
                <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-2">VIN incluidos</div>
                <div className="space-y-1">
                  {modal.vins.map(v => (
                    <div key={v.vin} className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold">{v.vin}</span>
                      <span className="text-kia-red">{v.motivo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-kia-line">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant="danger" onClick={enviarRechazo}><Icon.Mail width={16} height={16} /> Enviar rechazo al dealer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
