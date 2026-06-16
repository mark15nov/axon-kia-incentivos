import { Card, SectionTitle, Kpi, Pill, Button } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { consolidarPago, forecastSAP, fmtMXN } from '../data/mockData.js'

export default function Step4Validacion() {
  const filas = consolidarPago()
  const totalPagar = filas.reduce((a, b) => a + b.total, 0)
  const totalForecast = forecastSAP.reduce((a, b) => a + b.montoEstimado, 0)
  const variacion = totalPagar - totalForecast

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 4 · Consolidación"
        title="Validación de pago"
        desc="Se consolida el Paso 1 (condiciones y forecast de SAP) con el Paso 3 (matriz validada) y se genera un reporte estándar listo para autorizar."
        right={<Button variant="ghost"><Icon.Download width={16} height={16} /> Exportar reporte</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Forecast SAP" value={fmtMXN(totalForecast)} sub="Estimado paso 1" />
        <Kpi label="Total a pagar" value={fmtMXN(totalPagar)} sub="Validado paso 3" accent />
        <Kpi label="Variación vs forecast" value={`${variacion >= 0 ? '+' : ''}${fmtMXN(variacion)}`} sub={variacion <= 0 ? 'Dentro de presupuesto' : 'Excede forecast'} />
        <Kpi label="Dealers a pagar" value={filas.filter(f => f.total > 0).length} sub="Con monto validado" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Icon.Check width={17} height={17} className="text-emerald-600" /> Reporte estándar de validación</h3>
          <Pill tone="green">Listo para autorizar</Pill>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
              <th className="text-left font-semibold px-5 py-3">Concesionario</th>
              <th className="text-right font-semibold px-3 py-3">Unidades</th>
              <th className="text-right font-semibold px-3 py-3">Cashback</th>
              <th className="text-right font-semibold px-3 py-3">Bono volumen</th>
              <th className="text-right font-semibold px-3 py-3">Forecast</th>
              <th className="text-right font-semibold px-5 py-3">Total a pagar</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.dealer} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold">{f.nombre}</td>
                <td className="px-3 py-3 text-right tabular">{f.unidades}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(f.montoCashback)}</td>
                <td className="px-3 py-3 text-right tabular">{f.bonoVolumen ? fmtMXN(f.bonoVolumen) : '—'}</td>
                <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(f.forecast)}</td>
                <td className="px-5 py-3 text-right tabular font-bold">{fmtMXN(f.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-kia-line bg-slate-50/70">
              <td className="px-5 py-3.5 font-bold">Total programa</td>
              <td className="px-3 py-3.5 text-right font-bold tabular">{filas.reduce((a, b) => a + b.unidades, 0)}</td>
              <td className="px-3 py-3.5 text-right font-bold tabular">{fmtMXN(filas.reduce((a, b) => a + b.montoCashback, 0))}</td>
              <td className="px-3 py-3.5 text-right font-bold tabular">{fmtMXN(filas.reduce((a, b) => a + b.bonoVolumen, 0))}</td>
              <td className="px-3 py-3.5 text-right font-bold tabular text-kia-gray">{fmtMXN(totalForecast)}</td>
              <td className="px-5 py-3.5 text-right font-extrabold tabular text-kia-red">{fmtMXN(totalPagar)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 text-sm text-emerald-900">
        <Icon.Check width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" />
        <p>El cruce automático confirma que el monto validado está <strong>dentro del forecast</strong>. Al continuar se disparan las circulares de aprobación a cada dealer (Paso 5).</p>
      </div>
    </div>
  )
}
