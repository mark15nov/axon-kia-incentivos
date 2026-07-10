import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  fpVins, fpCalcVin, fpTotales, fpTasaAplicada, fpTasaDiaria,
  FP_TASA_REFERENCIA, FP_SPREAD, FP_BASE_DIAS, fmtMXN
} from '../../data/floorPlan.js'

const REGLAS = [
  'La información de VIN se obtiene de SAP y se determina el aging (días en piso) de cada unidad.',
  'El monto a pagar por VIN = número de días × tasa diaria; el resultado se compara con el Inbursa Requested Payment.',
  'A la tasa de referencia se le suman 1.5 pp; esa tasa se convierte a tasa diaria y es la que se usa para el cálculo.',
  'Validaciones en SAP: no pagar doble el mismo VIN, validar contra el pago solicitado por Inbursa y que el VIN no sea curtailment.'
]

const EST = {
  ok: { pill: 'green', label: 'Válido', icon: Icon.Check },
  diferencia: { pill: 'amber', label: 'Δ vs Inbursa', icon: Icon.Alert },
  duplicado: { pill: 'red', label: 'Pago doble', icon: Icon.Alert },
  curtailment: { pill: 'red', label: 'Curtailment', icon: Icon.Alert }
}

export default function FloorPlanStep1DefinirOferta() {
  const [ref, setRef] = useState(FP_TASA_REFERENCIA)
  const [guardado, setGuardado] = useState(false)

  const tasaAplicada = fpTasaAplicada(ref)
  const tasaDiaria = fpTasaDiaria(ref)     // % diario
  const t = useMemo(() => fpTotales(tasaDiaria), [tasaDiaria])

  const bloqueos = t.duplicados + t.curtailment

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Constructor"
        title="Definir Oferta"
        desc="Arma la oferta del Floor Plan a partir del aging de inventario en SAP. El sistema determina los días en piso de cada VIN, aplica la tasa diaria (tasa de referencia + 1.5 pp) y calcula el monto a pagar, comparándolo con el pago solicitado por Inbursa y corriendo las validaciones de SAP."
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

      {/* Tasa: referencia + spread → aplicada → diaria */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Icon.Percent width={17} height={17} className="text-kia-red" /> Construcción de la tasa diaria</h3>
          <Pill tone="ink"><Icon.Database width={13} height={13} /> Origen SAP</Pill>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">Tasa de referencia</label>
            <div className="relative">
              <input type="number" step="0.05" value={ref}
                onChange={e => { setRef(Math.max(0, +e.target.value)); setGuardado(false) }}
                className="w-full pr-7 pl-3 py-2.5 rounded-xl border border-kia-line text-sm tabular font-semibold focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>
          <TasaStep op="+" label="Spread" value={`${FP_SPREAD.toFixed(2)} pp`} />
          <TasaStep op="=" label="Tasa aplicada" value={`${tasaAplicada.toFixed(2)}%`} accent />
          <TasaStep op="÷" label={`${FP_BASE_DIAS} · Tasa diaria`} value={`${tasaDiaria.toFixed(4)}%`} accent />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="VIN desde SAP" value={t.vins} sub={`Aging prom. ${t.diasProm} días`} />
        <Kpi label="Pago calculado" value={fmtMXN(t.calculado)} sub="Días × tasa diaria × base" accent />
        <Kpi label="Inbursa solicita" value={fmtMXN(t.inbursa)} sub="Requested Payment" />
        <Kpi label="Monto a pagar" value={fmtMXN(t.aPagar)} sub={`${bloqueos} VIN bloqueado(s)`} />
      </div>

      {/* Tabla por VIN */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Layers width={17} height={17} /> Aging y cálculo por VIN</h3>
          <div className="flex items-center gap-2">
            {t.duplicados > 0 && <Pill tone="red"><Icon.Alert width={12} height={12} /> {t.duplicados} pago doble</Pill>}
            {t.curtailment > 0 && <Pill tone="red"><Icon.Alert width={12} height={12} /> {t.curtailment} curtailment</Pill>}
            {t.diferencias > 0 && <Pill tone="amber"><Icon.Alert width={12} height={12} /> {t.diferencias} Δ Inbursa</Pill>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">VIN</th>
                <th className="text-left font-semibold px-3 py-3">Dealer</th>
                <th className="text-left font-semibold px-3 py-3">Ingreso</th>
                <th className="text-right font-semibold px-3 py-3">Días</th>
                <th className="text-right font-semibold px-3 py-3">Base</th>
                <th className="text-right font-semibold px-3 py-3">Pago calculado</th>
                <th className="text-right font-semibold px-3 py-3">Inbursa solicita</th>
                <th className="text-right font-semibold px-3 py-3">Δ</th>
                <th className="text-right font-semibold px-5 py-3">Validación</th>
              </tr>
            </thead>
            <tbody>
              {fpVins.map(v => {
                const c = fpCalcVin(v, tasaDiaria)
                const e = EST[c.estatus]
                const E = e.icon
                return (
                  <tr key={v.vin} className={`border-t border-slate-100 hover:bg-slate-50/60 ${!c.pagable ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3 font-mono text-[12px] font-semibold">{v.vin}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{v.dealer}</div>
                      <div className="text-[11px] text-kia-gray">{v.modelo}</div>
                    </td>
                    <td className="px-3 py-3 text-kia-gray">{v.ingreso}</td>
                    <td className="px-3 py-3 text-right tabular font-semibold">{v.dias}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(v.base)}</td>
                    <td className="px-3 py-3 text-right tabular font-bold">{c.pagable ? fmtMXN(c.pagoCalculado) : '—'}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(v.inbursaPago)}</td>
                    <td className={`px-3 py-3 text-right tabular font-semibold ${!c.pagable ? 'text-kia-gray' : Math.abs(c.delta) > Math.max(500, v.inbursaPago * 0.08) ? 'text-amber-600' : 'text-emerald-600'}`}>
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
                <td className="px-5 py-3" colSpan={3}>Total</td>
                <td className="px-3 py-3 text-right tabular">{t.dias}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.calculado)}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.inbursa)}</td>
                <td className="px-3 py-3 text-right tabular">{t.calculado - t.inbursa >= 0 ? '+' : '−'}{fmtMXN(Math.abs(t.calculado - t.inbursa))}</td>
                <td className="px-5 py-3 text-right tabular text-kia-red">{fmtMXN(t.aPagar)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Validaciones SAP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ValidacionCard titulo="Sin pago doble" detalle="No se paga dos veces el mismo VIN." n={t.duplicados} okLabel="Sin duplicados" />
        <ValidacionCard titulo="Vs. Inbursa Requested Payment" detalle="El cálculo se coteja contra lo solicitado por Inbursa." n={t.diferencias} okLabel="Sin diferencias" tone="amber" />
        <ValidacionCard titulo="Sin curtailment" detalle="Los VIN en curtailment se excluyen del pago." n={t.curtailment} okLabel="Sin curtailment" />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white border border-kia-line px-5 py-4">
        <div className="text-sm">
          <div className="font-semibold">Monto a pagar del Floor Plan · {fmtMXN(t.aPagar)}</div>
          <div className="text-xs text-kia-gray mt-0.5">{t.vins - bloqueos} de {t.vins} VIN pagables · {bloqueos} bloqueado(s) por validación SAP.</div>
        </div>
        <Button variant="danger" onClick={() => setGuardado(true)} disabled={guardado}>
          {guardado ? <><Icon.Check width={16} height={16} /> Oferta guardada</> : 'Guardar oferta'}
        </Button>
      </div>
    </div>
  )
}

function TasaStep({ op, label, value, accent }) {
  return (
    <div className="flex items-end gap-3">
      <span className="text-lg font-bold text-slate-300 pb-2.5">{op}</span>
      <div className="flex-1">
        <div className="text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">{label}</div>
        <div className={`px-3 py-2.5 rounded-xl border border-kia-line text-sm tabular font-bold ${accent ? 'text-kia-red bg-red-50/40' : ''}`}>{value}</div>
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
