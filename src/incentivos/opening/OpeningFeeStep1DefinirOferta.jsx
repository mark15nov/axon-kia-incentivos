import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  ofOfertaVins, ofCalcOfertaVin, ofOfertaTotales,
  OF_COMISION_PCT, OF_KMX_SHARE, fmtMXN
} from '../../data/openingFee.js'

const REGLAS = [
  'La comisión por apertura se calcula con el monto financiado y la Oferta Comercial en SAP.',
  'Validación SAP: no pagar doble el mismo VIN.',
  'Validación SAP: cotejar contra el Inbursa Requested Payment.',
  'Validación SAP: validar el aporte con el KMX Share.'
]

const kmxPct = Math.round(OF_KMX_SHARE * 100)

const EST = {
  ok: { pill: 'green', label: 'Válido', icon: Icon.Check },
  diferencia: { pill: 'amber', label: 'Δ vs Inbursa', icon: Icon.Alert },
  duplicado: { pill: 'red', label: 'Pago doble', icon: Icon.Alert },
  share: { pill: 'red', label: 'KMX Share', icon: Icon.Alert }
}

export default function OpeningFeeStep1DefinirOferta() {
  const [comisionPct, setComisionPct] = useState(OF_COMISION_PCT * 100) // en %
  const [guardado, setGuardado] = useState(false)

  const pct = comisionPct / 100
  const t = useMemo(() => ofOfertaTotales(pct, OF_KMX_SHARE), [pct])
  const bloqueos = t.duplicados + t.shares

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Constructor"
        title="Definir Oferta"
        desc="Arma la oferta del Opening Fee a partir del monto financiado de cada VIN y la Oferta Comercial en SAP. El sistema calcula la comisión por apertura, aplica el KMX Share y corre las validaciones de SAP antes de determinar el monto a pagar."
        right={<Pill tone={guardado ? 'green' : 'amber'}>{guardado ? <><Icon.Check width={14} height={14} /> Guardada</> : 'Borrador'}</Pill>}
      />

      {/* Reglas de cálculo */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {REGLAS.map((tx, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-kia-gray">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-100 grid place-items-center text-[10px] font-bold text-kia-black">{i + 1}</span>
              <span className="leading-snug">{tx}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Parámetros: Oferta Comercial SAP + KMX Share */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Icon.Sliders width={17} height={17} className="text-kia-red" /> Parámetros de cálculo</h3>
          <Pill tone="ink"><Icon.Database width={13} height={13} /> Origen SAP</Pill>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">Comisión por apertura · Oferta Comercial</label>
            <div className="relative">
              <input type="number" step="0.05" value={comisionPct}
                onChange={e => { setComisionPct(Math.max(0, +e.target.value)); setGuardado(false) }}
                className="w-full pr-7 pl-3 py-2.5 rounded-xl border border-kia-line text-sm tabular font-semibold focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
            <div className="text-[11px] text-kia-gray mt-1">Del monto financiado</div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">KMX Share · PDF Inbursa</label>
            <div className="px-3 py-2.5 rounded-xl border border-kia-line text-sm tabular font-bold text-kia-red bg-red-50/40">{kmxPct}%</div>
            <div className="text-[11px] text-kia-gray mt-1">Aporte KMX = comisión × share</div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="green"><Icon.Excel width={13} height={13} /> Oferta Comercial SAP</Pill>
            <Pill tone="red"><Icon.Pdf width={13} height={13} /> PDF Inbursa</Pill>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="VIN desde SAP" value={t.vins} sub="Monto financiado" />
        <Kpi label="Comisión por apertura" value={fmtMXN(t.comision)} sub={`${comisionPct}% del financiado`} />
        <Kpi label={`Aporte KMX · ${kmxPct}%`} value={fmtMXN(t.aporteKmx)} sub="Comisión × KMX Share" accent />
        <Kpi label="Monto a pagar" value={fmtMXN(t.aPagar)} sub={`${bloqueos} VIN bloqueado(s)`} />
      </div>

      {/* Tabla por VIN */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Cálculo por VIN · comisión × KMX Share</h3>
          <div className="flex items-center gap-2">
            {t.duplicados > 0 && <Pill tone="red"><Icon.Alert width={12} height={12} /> {t.duplicados} pago doble</Pill>}
            {t.shares > 0 && <Pill tone="red"><Icon.Alert width={12} height={12} /> {t.shares} KMX Share</Pill>}
            {t.diferencias > 0 && <Pill tone="amber"><Icon.Alert width={12} height={12} /> {t.diferencias} Δ Inbursa</Pill>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">VIN</th>
                <th className="text-left font-semibold px-3 py-3">Dealer</th>
                <th className="text-right font-semibold px-3 py-3">Monto financiado</th>
                <th className="text-right font-semibold px-3 py-3">Comisión ({comisionPct}%)</th>
                <th className="text-right font-semibold px-3 py-3">Aporte KMX ({kmxPct}%)</th>
                <th className="text-right font-semibold px-3 py-3">Inbursa solicita</th>
                <th className="text-right font-semibold px-3 py-3">Δ</th>
                <th className="text-right font-semibold px-5 py-3">Validación</th>
              </tr>
            </thead>
            <tbody>
              {ofOfertaVins.map(v => {
                const c = ofCalcOfertaVin(v, pct, OF_KMX_SHARE)
                const e = EST[c.estatus]
                const E = e.icon
                return (
                  <tr key={v.vin} className={`border-t border-slate-100 hover:bg-slate-50/60 ${!c.pagable ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3 font-mono text-[12px] font-semibold">{v.vin}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{v.dealer}</div>
                      <div className="text-[11px] text-kia-gray">{v.modelo}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(v.financiado)}</td>
                    <td className="px-3 py-3 text-right tabular text-sky-700">{fmtMXN(c.comision)}</td>
                    <td className="px-3 py-3 text-right tabular font-bold text-kia-red">{c.pagable ? fmtMXN(c.aporteKmx) : '—'}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(v.inbursaPago)}</td>
                    <td className={`px-3 py-3 text-right tabular font-semibold ${!c.pagable ? 'text-kia-gray' : Math.abs(c.delta) > Math.max(300, v.inbursaPago * 0.08) ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {!c.pagable ? '—' : `${c.delta >= 0 ? '+' : '−'}${fmtMXN(Math.abs(c.delta))}`}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Pill tone={e.pill}><E width={12} height={12} /> {e.label}</Pill>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                <td className="px-5 py-3" colSpan={2}>Total</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.financiado)}</td>
                <td className="px-3 py-3 text-right tabular text-sky-700">{fmtMXN(t.comision)}</td>
                <td className="px-3 py-3 text-right tabular text-kia-red">{fmtMXN(t.aporteKmx)}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.inbursa)}</td>
                <td className="px-3 py-3 text-right tabular">{t.aporteKmx - t.inbursa >= 0 ? '+' : '−'}{fmtMXN(Math.abs(t.aporteKmx - t.inbursa))}</td>
                <td className="px-5 py-3 text-right tabular text-kia-red">{fmtMXN(t.aPagar)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Validaciones SAP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ValidacionCard titulo="Sin pago doble" detalle="No se paga dos veces el mismo VIN." n={t.duplicados} okLabel="Sin duplicados" />
        <ValidacionCard titulo="Vs. Inbursa Requested Payment" detalle="El aporte KMX se coteja contra lo solicitado por Inbursa." n={t.diferencias} okLabel="Sin diferencias" tone="amber" />
        <ValidacionCard titulo="KMX Share" detalle="El share aplicado coincide con el PDF comercial de Inbursa." n={t.shares} okLabel="Share validado" />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white border border-kia-line px-5 py-4">
        <div className="text-sm">
          <div className="font-semibold">Monto a pagar del Opening Fee · {fmtMXN(t.aPagar)}</div>
          <div className="text-xs text-kia-gray mt-0.5">{t.vins - bloqueos} de {t.vins} VIN pagables · {bloqueos} bloqueado(s) por validación SAP.</div>
        </div>
        <Button variant="danger" onClick={() => setGuardado(true)} disabled={guardado}>
          {guardado ? <><Icon.Check width={16} height={16} /> Oferta guardada</> : 'Guardar oferta'}
        </Button>
      </div>
    </div>
  )
}

function ValidacionCard({ titulo, detalle, n, okLabel, tone = 'red' }) {
  const ok = n === 0
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold">{titulo}</div>
          <div className="text-xs text-kia-gray mt-0.5 leading-snug">{detalle}</div>
        </div>
        {ok
          ? <span className="shrink-0 h-8 w-8 rounded-lg bg-emerald-50 grid place-items-center text-emerald-600"><Icon.Check width={16} height={16} /></span>
          : <span className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center ${tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-kia-red'}`}><Icon.Alert width={16} height={16} /></span>}
      </div>
      <div className="mt-3">
        {ok
          ? <Pill tone="green"><Icon.Check width={12} height={12} /> {okLabel}</Pill>
          : <Pill tone={tone === 'amber' ? 'amber' : 'red'}>{n} VIN detectado(s)</Pill>}
      </div>
    </Card>
  )
}
