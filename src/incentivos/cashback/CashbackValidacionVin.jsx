import { Card, SectionTitle, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  ESTATUS_FACTURA, VIGENCIA, dealersFactura, dealersPorEstatus,
  vinsMalCapturados, resumenFacturas, regionesFactura
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
    </div>
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
