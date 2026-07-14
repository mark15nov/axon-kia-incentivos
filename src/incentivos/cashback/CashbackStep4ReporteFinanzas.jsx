import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { vmVins, vmVinResumen, VM_PERIODO, fmtMXN } from '../../data/variableMargin.js'

// Condiciones que debe cumplir cada VIN (validadas por SAP en el paso anterior)
// para calificar al pago de su Cashback.
const CONDICIONES = [
  'Fecha de retail dentro del periodo del incentivo',
  'Método de pago asignado',
  'Incentivo calculado con la oferta comercial',
  'Sin duplicados · aplicabilidad · uso del vehículo validados'
]

export default function CashbackStep4ReporteFinanzas() {
  const [confirmado, setConfirmado] = useState(false)
  const [estado, setEstado] = useState('idle') // idle | enviando | enviado

  const r = vmVinResumen()

  // VIN que califican al pago de Cashback, agrupados por dealer.
  const porDealer = useMemo(() => {
    const map = {}
    vmVins.forEach(v => {
      const g = map[v.dealer] || (map[v.dealer] = { dealer: v.dealer, total: 0, ok: 0, pago: 0 })
      g.total++
      if (v.estatus === 'ok') { g.ok++; g.pago += v.bono }
    })
    return Object.values(map).sort((a, b) => b.pago - a.pago)
  }, [])

  const enviar = () => {
    if (!confirmado || estado === 'enviando') return
    setEstado('enviando')
    setTimeout(() => setEstado('enviado'), 1300)
  }

  const enviado = estado === 'enviado'

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 1 · Paso 4"
        title="Reporte a Finanzas"
        desc="Consolidado de cuántos VIN cumplieron las condiciones para que se les pague su Cashback y el monto a liberar. Revisa el resultado y envía el reporte a Finanzas para su validación y pago."
        right={<Pill tone={enviado ? 'blue' : 'green'}>
          {enviado ? <><Icon.Clock width={14} height={14} /> En validación</> : <><Icon.Check width={14} height={14} /> Listo para envío</>}
        </Pill>}
      />

      {/* KPIs consolidados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="VIN que califican a Cashback" value={`${r.ok} / ${r.total}`} sub={`${r.pctOk}% cumple condiciones`} />
        <Kpi label="Monto a pagar · Cashback" value={fmtMXN(r.pago)} sub="Bono por VIN que califica" accent />
        <Kpi label="VIN rechazados" value={String(r.rech)} sub="No cumplen condiciones" />
        <Kpi label="Monto facturado" value={fmtMXN(r.facturado)} sub={`${r.total} facturas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Resumen de calificación */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4"><Icon.Check width={17} height={17} /> VIN que califican al pago</h3>
          <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100">
            <div className="h-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${r.pctOk}%` }}>{r.pctOk}%</div>
            <div className="h-full bg-kia-red flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${100 - r.pctOk}%` }}>{100 - r.pctOk}%</div>
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Califican · {r.ok}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kia-red" /> Rechazados · {r.rech}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-kia-line grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-emerald-700">{fmtMXN(r.pago)}</div>
              <div className="text-[11px] text-emerald-700/80">Cashback a pagar</div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-kia-red">{r.rech} VIN</div>
              <div className="text-[11px] text-kia-red/80">sin pago</div>
            </div>
          </div>
        </Card>

        {/* Condiciones para el pago */}
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Database width={17} height={17} /> Condiciones para el pago de Cashback</h3>
            <Pill tone="green">Validadas en SAP</Pill>
          </div>
          <div className="space-y-2.5">
            {CONDICIONES.map((c, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-kia-line px-4 py-2.5">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center"><Icon.Check width={14} height={14} /></span>
                <span className="text-sm leading-snug">{c}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* VIN que califican por dealer */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Users width={17} height={17} /> VIN que califican al pago por dealer</h3>
          <Pill tone="gray">{porDealer.length} dealers</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Dealer</th>
                <th className="text-right font-semibold px-3 py-3">VIN que califican</th>
                <th className="text-right font-semibold px-3 py-3">Total VIN</th>
                <th className="text-right font-semibold px-5 py-3">Cashback a pagar</th>
              </tr>
            </thead>
            <tbody>
              {porDealer.map(d => (
                <tr key={d.dealer} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium">{d.dealer}</td>
                  <td className="px-3 py-3 text-right tabular font-semibold text-emerald-600">{d.ok}</td>
                  <td className="px-3 py-3 text-right tabular text-kia-gray">{d.total}</td>
                  <td className="px-5 py-3 text-right tabular font-semibold">{fmtMXN(d.pago)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-kia-line bg-slate-50 font-bold">
                <td className="px-5 py-3">Total</td>
                <td className="px-3 py-3 text-right tabular text-emerald-600">{r.ok}</td>
                <td className="px-3 py-3 text-right tabular">{r.total}</td>
                <td className="px-5 py-3 text-right tabular text-kia-red">{fmtMXN(r.pago)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Envío a Finanzas */}
      {!enviado ? (
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="h-11 w-11 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Mail width={20} height={20} /></span>
              <div>
                <h3 className="font-bold">Enviar reporte a Finanzas</h3>
                <p className="text-sm text-kia-gray mt-0.5 max-w-xl leading-snug">
                  Se reportan <strong className="text-kia-black">{r.ok} VIN</strong> que cumplieron las condiciones para el pago de su Cashback, por un total de <strong className="text-kia-black">{fmtMXN(r.pago)}</strong>, para validación y liberación por Finanzas del periodo {VM_PERIODO}.
                </p>
                <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: '#BB162B' }} />
                  Confirmo que revisé el consolidado de VIN que califican y es correcto.
                </label>
              </div>
            </div>
            <Button variant="danger" className="shrink-0 px-6 py-3 text-base"
              disabled={!confirmado || estado === 'enviando'}
              onClick={enviar}>
              {estado === 'enviando'
                ? <><Spinner /> Enviando…</>
                : <><Icon.Mail width={18} height={18} /> Enviar a validación (Finanzas)</>}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 animate-fade-up">
          <div className="flex items-start gap-4">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-emerald-800">Reporte enviado a Finanzas</h3>
              <p className="text-sm text-emerald-900/80 mt-1 max-w-2xl leading-relaxed">
                El reporte del incentivo Cashback · {VM_PERIODO} quedó <strong>en validación por Finanzas</strong>: {r.ok} VIN califican al pago por {fmtMXN(r.pago)}. Recibirás la resolución para liberar el pago del periodo.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Pill tone="ink">Folio CB-JUN26-0428</Pill>
                <Pill tone="blue"><Icon.Clock width={13} height={13} /> En validación</Pill>
                <Pill tone="gray">{r.ok} VIN · {fmtMXN(r.pago)}</Pill>
              </div>
            </div>
            <Button variant="ghost" className="shrink-0 ml-auto" onClick={() => { setEstado('idle'); setConfirmado(false) }}>
              <Icon.Refresh width={15} height={15} /> Deshacer envío
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}
