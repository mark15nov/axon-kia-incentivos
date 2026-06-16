import { Card, SectionTitle, Kpi, Pill } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { bonoMatriz, BONO_FUENTES, dealerNombre, fmtMXN } from '../../data/bonoVentas.js'

export default function BonoStep1Variables() {
  const aptos = bonoMatriz.filter(v => v.estatus !== 'no_apto')
  const noAptos = bonoMatriz.filter(v => v.estatus === 'no_apto')
  const totalBono = aptos.reduce((a, b) => a + b.bono, 0)
  const prom = aptos.length ? totalBono / aptos.length : 0

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Variables de cálculo"
        title="VQM + Inventario + Curtailment"
        desc="Se juntan tres fuentes para calcular el pago por VIN por agencia: la descarga de ventas de SAP (VQM), los meses de inventario disponible (Excel) y el curtailment o ajuste de piso (Excel + PDF)."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> Origen SAP + Dealers</Pill>}
      />

      {/* Fuentes */}
      <div className="grid grid-cols-3 gap-4">
        {BONO_FUENTES.map(f => {
          const I = Icon[f.icon] || Icon.File
          return (
            <Card key={f.clave} className="p-4 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-kia-black text-white grid place-items-center shrink-0"><I width={20} height={20} /></span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wide text-kia-red">{f.clave}</div>
                <div className="text-sm font-semibold truncate">{f.nombre}</div>
                <div className="text-xs text-kia-gray">{f.tipo}</div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Fórmula + regla */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 border border-kia-line px-4 py-3 text-sm">
        <span className="font-semibold">Bono por VIN</span>
        <span className="text-kia-gray">=</span>
        <Pill tone="gray">Bono base (Monthly Commercial Offer)</Pill>
        <span className="text-kia-gray">+</span>
        <Pill tone="green">Bono inventario (antigüedad)</Pill>
        <span className="mx-1.5 h-4 w-px bg-kia-line" />
        <span className="flex items-center gap-1.5 text-kia-red font-semibold"><Icon.Alert width={14} height={14} /> Si hay curtailment acumulado → No apto para el bono</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="VINs en VQM" value={bonoMatriz.length} sub="Ventas descargadas" />
        <Kpi label="Bono total estimado" value={fmtMXN(totalBono)} sub={`${aptos.length} VIN aptos`} accent />
        <Kpi label="No aptos" value={noAptos.length} sub="Por curtailment acumulado" />
        <Kpi label="Bono promedio" value={fmtMXN(prom)} sub="Por VIN apto" />
      </div>

      {/* Tabla de cálculo por VIN */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Cálculo de pago por VIN</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">VIN</th>
                <th className="text-left font-semibold px-3 py-3">Agencia</th>
                <th className="text-left font-semibold px-3 py-3">Modelo</th>
                <th className="text-right font-semibold px-3 py-3">Meses inv.</th>
                <th className="text-right font-semibold px-3 py-3">Curtailment acum.</th>
                <th className="text-right font-semibold px-3 py-3">Bono base</th>
                <th className="text-right font-semibold px-3 py-3">+ Inventario</th>
                <th className="text-right font-semibold px-5 py-3">Bono VIN</th>
              </tr>
            </thead>
            <tbody>
              {bonoMatriz.map(v => {
                const noApto = v.estatus === 'no_apto'
                return (
                  <tr key={v.id} className={`border-t border-slate-100 hover:bg-slate-50/60 ${noApto ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-600">{v.vin}</td>
                    <td className="px-3 py-2.5">{dealerNombre(v.dealer)}</td>
                    <td className="px-3 py-2.5 font-semibold">{v.modelo}</td>
                    <td className="px-3 py-2.5 text-right tabular">
                      {v.mesesInventario}
                      {v.mesesInventario >= 6 && <span className="ml-1 text-[10px] text-emerald-600 font-bold">añejo</span>}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular ${v.curtailment > 0 ? 'text-kia-red font-semibold' : 'text-slate-300'}`}>
                      {v.curtailment > 0 ? fmtMXN(v.curtailment) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular text-kia-gray">{fmtMXN(v.bonoBase)}</td>
                    <td className="px-3 py-2.5 text-right tabular text-emerald-600">{v.bonoInventario ? '+' + fmtMXN(v.bonoInventario) : '—'}</td>
                    <td className="px-5 py-2.5 text-right">
                      {noApto
                        ? <Pill tone="gray"><Icon.Alert width={11} height={11} /> No apto</Pill>
                        : <span className="tabular font-bold">{fmtMXN(v.bono)}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                <td className="px-5 py-3" colSpan={7}>Total estimado · {aptos.length} VIN aptos</td>
                <td className="px-5 py-3 text-right tabular">{fmtMXN(totalBono)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3.5 text-sm text-sky-900">
        <Icon.Database width={18} height={18} className="mt-0.5 shrink-0 text-sky-600" />
        <p>Los VINs con <strong>curtailment acumulado no son aptos</strong> y quedan fuera del bono. El resto se cruza en el Paso 2 contra la Monthly Commercial Offer para revisión financiera.</p>
      </div>
    </div>
  )
}
