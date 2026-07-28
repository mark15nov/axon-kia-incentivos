import { useMemo, useState } from 'react'
import { Card, SectionTitle, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  ESTATUS_FACTURA, VIGENCIA, dealersFactura, dealersPorEstatus,
  vinsMalCapturados, resumenFacturas, regionesFactura,
  razonesFactura, resumenCircular, circularRazonSocial, CIRCULAR_DESTINATARIOS
} from '../../data/cashbackFacturas.js'

export default function CashbackValidacionVin() {
  const r = resumenFacturas()

  const tiles = [
    { estatus: 'correcta', valor: r.correcta, tone: 'green', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { estatus: 'incorrecta', valor: r.incorrecta, tone: 'red', bg: 'bg-red-50', text: 'text-kia-red' },
    { estatus: 'falta', valor: r.falta, tone: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
    { estatus: 'fuera_fecha', valor: r.fuera_fecha, tone: 'ink', bg: 'bg-slate-100', text: 'text-slate-600' }
  ]

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 1 · Paso 2"
        title="Validación de VIN"
        desc={`KIA BRAIN analiza las facturas recibidas contra los VIN ya capturados. Este es el estatus de los ${r.total} dealers de la red · vigencia ${VIGENCIA}.`}
        right={<Pill tone="ink"><Icon.Brain width={14} height={14} /> KIA BRAIN</Pill>}
      />

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map(t => {
          const e = ESTATUS_FACTURA[t.estatus]
          const I = Icon[e.icon] || Icon.Database
          return (
            <Card key={t.estatus} className="p-4">
              <div className="flex items-center justify-between">
                <span className={`h-8 w-8 rounded-lg grid place-items-center ${t.bg}`}><I width={15} height={15} className={t.text} /></span>
                <span className={`text-2xl font-bold tabular ${t.text}`}>{t.valor}</span>
              </div>
              <div className="text-xs font-semibold text-kia-black mt-2">{e.label}</div>
            </Card>
          )
        })}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="h-8 w-8 rounded-lg grid place-items-center bg-violet-50"><Icon.Alert width={15} height={15} className="text-violet-600" /></span>
            <span className="text-2xl font-bold tabular text-violet-600">{r.vinsMal}</span>
          </div>
          <div className="text-xs font-semibold text-kia-black mt-2">VIN mal capturados</div>
        </Card>
      </div>

      {/* ---------- Desglose por estatus ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EstatusCard estatus="correcta" />
        <EstatusCard estatus="incorrecta" />
        <EstatusCard estatus="falta" />
        <EstatusCard estatus="fuera_fecha" />
      </div>

      {/* ---------- VIN mal capturados (Downpayment → Cashback) ---------- */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Alert width={17} height={17} className="text-violet-600" /> VIN capturados como Downpayment (deben ser Cashback)</h3>
          <Pill tone="gray">{vinsMalCapturados.length} VIN</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">VIN</th>
                <th className="text-left font-semibold px-3 py-3">Dealer</th>
                <th className="text-left font-semibold px-3 py-3">Modelo</th>
                <th className="text-left font-semibold px-3 py-3">Capturado como</th>
                <th className="text-left font-semibold px-5 py-3">Debió ser</th>
              </tr>
            </thead>
            <tbody>
              {vinsMalCapturados.map(v => (
                <tr key={v.vin} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{v.vin}</td>
                  <td className="px-3 py-3 font-medium">{v.dealer}</td>
                  <td className="px-3 py-3 text-kia-gray">{v.modelo}</td>
                  <td className="px-3 py-3"><Pill tone="ink">{v.capturado}</Pill></td>
                  <td className="px-5 py-3"><Pill tone="green">{v.debioSer}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------- Por región (seguimiento del gerente de zona) ---------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2"><Icon.Users width={18} height={18} /> Estatus por región</h2>
          <span className="text-xs text-kia-gray">Para seguimiento del gerente de zona</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {regionesFactura.map(z => <RegionCard key={z.region} zona={z} />)}
        </div>
      </div>

      {/* ---------- Circular del periodo · por razón social ---------- */}
      <CircularBox />
    </div>
  )
}

// La circular se dirige a la persona moral que factura: un comunicado
// por RFC, aunque la razón social tenga varios puntos de venta.
function CircularBox() {
  const c = resumenCircular()
  const [sel, setSel] = useState(() => razonesFactura.filter(x => !x.alDia).map(x => x.id))
  const [destinatarios, setDestinatarios] = useState(['duenos', 'gg', 'admin'])
  const [preview, setPreview] = useState(false)
  const [idx, setIdx] = useState(0)
  const [asunto, setAsunto] = useState(`Circular Cashback · facturación del periodo ${VIGENCIA}`)
  const [edits, setEdits] = useState({})
  const [enviado, setEnviado] = useState(false)

  const elegidas = useMemo(() => razonesFactura.filter(x => sel.includes(x.id)), [sel])
  const actual = elegidas[Math.min(idx, Math.max(0, elegidas.length - 1))]
  const cuerpo = actual ? (edits[actual.id] ?? circularRazonSocial(actual)) : ''

  const toggle = (id) => setSel(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]))
  const toggleDest = (v) => setDestinatarios(l => (l.includes(v) ? l.filter(x => x !== v) : [...l, v]))
  const abrir = () => { setIdx(0); setPreview(true) }
  const enviar = () => { setPreview(false); setEnviado(true) }

  if (enviado) {
    return (
      <Card className="p-6 border-emerald-200 bg-emerald-50/50 animate-fade-up">
        <div className="flex items-start gap-4">
          <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-emerald-800">Circular enviada</h3>
            <p className="text-sm text-emerald-900/80 mt-1 max-w-2xl leading-relaxed">
              Salió una circular por razón social a {elegidas.length} de las {c.razones} personas morales de la red
              ({elegidas.reduce((a, x) => a + x.dealers.length, 0)} puntos de venta), con el estatus de facturación del periodo {VIGENCIA} y las acciones requeridas.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {CIRCULAR_DESTINATARIOS.filter(d => destinatarios.includes(d.v)).map(d => (
                <Pill key={d.v} tone="green"><Icon.Check width={13} height={13} /> {d.label}</Pill>
              ))}
              {Object.keys(edits).length > 0 && <Pill tone="gray">{Object.keys(edits).length} editada(s) a mano</Pill>}
            </div>
          </div>
          <Button variant="ghost" className="shrink-0 ml-auto" onClick={() => setEnviado(false)}>
            <Icon.Refresh width={15} height={15} /> Deshacer envío
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Megaphone width={20} height={20} /></span>
            <div className="min-w-0">
              <h3 className="font-bold">Enviar circular</h3>
              <p className="text-sm text-kia-gray mt-0.5 max-w-xl leading-snug">
                La circular del estatus de facturación va <strong>por razón social</strong>, no por dealer: un solo comunicado por RFC
                con el detalle de todos sus puntos de venta y lo que tiene que corregir cada uno antes de que cierre la vigencia.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="ink"><Icon.Users width={13} height={13} /> {c.razones} razones sociales · {c.puntosVenta} dealers</Pill>
            <Pill tone={c.conPendientes ? 'red' : 'green'}>{c.conPendientes} con pendientes</Pill>
          </div>
        </div>

        {/* Destinatarios dentro de la razón social */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mr-1">Destinatarios</span>
          {CIRCULAR_DESTINATARIOS.map(d => {
            const on = destinatarios.includes(d.v)
            return (
              <button key={d.v} onClick={() => toggleDest(d.v)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${on ? 'bg-kia-black text-white border-kia-black' : 'bg-white text-kia-gray border-kia-line hover:border-slate-300'}`}>
                {on && '✓ '}{d.label}
              </button>
            )
          })}
        </div>

        {/* Razones sociales a las que va la circular */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {razonesFactura.map(x => {
            const on = sel.includes(x.id)
            const e = ESTATUS_FACTURA[x.estatus]
            return (
              <button key={x.id} onClick={() => toggle(x.id)}
                className={`text-left rounded-xl border px-3.5 py-2.5 flex items-start gap-3 transition-colors ${on ? 'border-kia-black bg-slate-50/70' : 'border-kia-line hover:border-slate-300'}`}>
                <span className={`mt-0.5 h-4 w-4 shrink-0 rounded grid place-items-center text-[10px] font-bold ${on ? 'bg-kia-red text-white' : 'border border-kia-line'}`}>
                  {on ? '✓' : ''}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate">{x.nombre}</span>
                  <span className="block text-[11px] text-kia-gray tabular">
                    {x.rfc} · {x.dealers.length} {x.dealers.length === 1 ? 'punto de venta' : 'puntos de venta'} · {x.region}
                  </span>
                </span>
                <Pill tone={x.alDia ? 'green' : e.tone}>{x.alDia ? 'Al día' : `${x.nPendientes} por corregir`}</Pill>
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-kia-line flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-kia-gray">
            {elegidas.length} de {c.razones} razones sociales seleccionadas ·
            {' '}{elegidas.reduce((a, x) => a + x.dealers.length, 0)} puntos de venta ·
            {' '}{elegidas.reduce((a, x) => a + x.nPendientes, 0)} con acción requerida
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setSel(razonesFactura.map(x => x.id))} disabled={sel.length === razonesFactura.length}>
              Seleccionar todas
            </Button>
            <Button variant="danger" onClick={abrir} disabled={!elegidas.length || !destinatarios.length}>
              <Icon.Megaphone width={16} height={16} /> Enviar circular
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview de la circular, editable por razón social */}
      {preview && actual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up" onClick={() => setPreview(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-kia-line">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-9 w-9 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Megaphone width={17} height={17} /></span>
                <div className="min-w-0">
                  <div className="font-bold">Circular por razón social</div>
                  <div className="text-[11px] text-kia-gray">Cashback · vigencia {VIGENCIA}</div>
                </div>
              </div>
              <button onClick={() => setPreview(false)} className="text-slate-400 hover:text-kia-black text-lg leading-none">✕</button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-kia-gray uppercase tracking-wide w-16">Para</span>
                {CIRCULAR_DESTINATARIOS.filter(d => destinatarios.includes(d.v)).map(d => (
                  <Pill key={d.v} tone="ink">{d.label}</Pill>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-kia-gray uppercase tracking-wide w-16 shrink-0">Asunto</span>
                <input type="text" value={asunto} onChange={e => setAsunto(e.target.value)}
                  className="flex-1 rounded-xl border border-kia-line px-3.5 py-2 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              </div>

              {/* Navegación entre razones sociales */}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-kia-line px-3.5 py-2.5">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-kia-gray hover:text-kia-black disabled:opacity-30 disabled:cursor-not-allowed">
                  <Icon.Chevron width={13} height={13} className="rotate-180" /> Anterior
                </button>
                <div className="text-center min-w-0">
                  <div className="text-sm font-semibold truncate">{actual.nombre}</div>
                  <div className="text-[11px] text-kia-gray">
                    {idx + 1} de {elegidas.length} · {actual.dealers.length} {actual.dealers.length === 1 ? 'punto de venta' : 'puntos de venta'} ·{' '}
                    <span className={actual.alDia ? 'text-emerald-600 font-semibold' : 'text-kia-red font-semibold'}>
                      {actual.alDia ? '✓ al día' : `✕ ${actual.nPendientes} por corregir`}
                    </span>
                    {edits[actual.id] && ' · editada'}
                  </div>
                </div>
                <button onClick={() => setIdx(i => Math.min(elegidas.length - 1, i + 1))} disabled={idx >= elegidas.length - 1}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-kia-gray hover:text-kia-black disabled:opacity-30 disabled:cursor-not-allowed">
                  Siguiente <Icon.Chevron width={13} height={13} />
                </button>
              </div>

              <textarea
                value={cuerpo}
                onChange={e => setEdits(x => ({ ...x, [actual.id]: e.target.value }))}
                rows={16}
                className="w-full rounded-xl border border-kia-line px-3.5 py-3 text-sm leading-relaxed font-mono resize-none focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />

              <p className="text-xs text-kia-gray flex items-start gap-2">
                <Icon.Spark width={13} height={13} className="mt-0.5 shrink-0 text-kia-red" />
                Cada razón social recibe una sola circular con el detalle de todos sus puntos de venta. Navega para revisar cualquiera; los cambios se conservan por razón social.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-kia-line">
              <span className="text-xs text-kia-gray">{Object.keys(edits).length} circular(es) editada(s) a mano</span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setPreview(false)}>Cancelar</Button>
                <Button variant="danger" onClick={enviar}>
                  <Icon.Mail width={16} height={16} /> Enviar a {elegidas.length} razones sociales
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EstatusCard({ estatus }) {
  const e = ESTATUS_FACTURA[estatus]
  const I = Icon[e.icon] || Icon.Database
  const lista = dealersPorEstatus(estatus)
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${e.dot}`} /> {e.label}</h3>
        <Pill tone={e.tone}>{lista.length} dealer(s)</Pill>
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-kia-gray">Ninguno.</p>
      ) : (
        <div className="space-y-2">
          {lista.map(d => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-kia-line px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{d.nombre}</div>
                <div className="text-xs text-kia-gray">{d.ciudad} · {d.region}{d.facturas ? ` · ${d.facturas} facturas` : ''}</div>
                {d.causa && <div className="text-xs text-kia-red mt-1 flex items-center gap-1.5"><Icon.Alert width={12} height={12} /> {d.causa}</div>}
              </div>
              <I width={16} height={16} className={`shrink-0 mt-0.5 ${e.tone === 'green' ? 'text-emerald-500' : e.tone === 'red' ? 'text-kia-red' : e.tone === 'amber' ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function RegionCard({ zona }) {
  return (
    <Card className={`p-5 ${zona.pendientes ? 'ring-1 ring-kia-red/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{zona.region}</h3>
          <div className="text-xs text-kia-gray mt-0.5 flex items-center gap-1.5"><Icon.Users width={13} height={13} /> Gerente: {zona.gerente}</div>
        </div>
        {zona.pendientes > 0
          ? <Pill tone="red">{zona.pendientes} por presionar</Pill>
          : <Pill tone="green"><Icon.Check width={12} height={12} /> Al día</Pill>}
      </div>
      <div className="space-y-2">
        {zona.dealers.map(d => {
          const e = ESTATUS_FACTURA[d.estatus]
          return (
            <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-kia-line px-3.5 py-2.5">
              <div className="min-w-0">
                <span className="text-sm font-semibold">{d.nombre}</span>
                {d.causa && <div className="text-xs text-kia-gray truncate">{d.causa}</div>}
              </div>
              <Pill tone={e.tone}>{e.label}</Pill>
            </div>
          )
        })}
      </div>
      {zona.pendientes > 0 && (
        <Button variant="soft" className="w-full mt-3">
          <Icon.Mail width={15} height={15} /> Notificar al gerente de zona
        </Button>
      )}
    </Card>
  )
}
