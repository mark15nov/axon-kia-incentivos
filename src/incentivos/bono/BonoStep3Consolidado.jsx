import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { bonoMatriz, consolidarBono, dealerNombre, fmtMXN, BONO_PERIODO } from '../../data/bonoVentas.js'

export default function BonoStep3Consolidado() {
  const consolidado = consolidarBono()
  const totalBono = consolidado.reduce((a, b) => a + b.bono, 0)
  const totalUnidades = consolidado.reduce((a, b) => a + b.unidades, 0)
  const validos = bonoMatriz.filter(v => v.estatus === 'ok')

  const celdaCSV = (v) => {
    const s = String(v ?? '')
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const descargar = () => {
    const enc = ['VIN', 'Agencia', 'Modelo', 'Meses inventario', 'Bono base', 'Bono inventario', 'Curtailment', 'Bono VIN', 'Periodo']
    const filas = validos.map(v => [v.vin, dealerNombre(v.dealer), v.modelo, v.mesesInventario, v.bonoBase, v.bonoInventario, v.curtailment, v.bono, BONO_PERIODO])
    const total = ['TOTAL', '', '', '', '', '', '', totalBono, '']
    const csv = [enc, ...filas, total].map(r => r.map(celdaCSV).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bono_Ventas_Consolidado_${BONO_PERIODO.replace(/\s+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 3 · Consolidado"
        title="Archivo consolidado del bono"
        desc="Con la matriz validada, se consolida el bono por agencia y se genera el archivo que baja a Excel para respaldo y circularización."
        right={<Button variant="danger" onClick={descargar}><Icon.Download width={16} height={16} /> Descargar Excel</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Agencias con bono" value={consolidado.length} sub="Elegibles" />
        <Kpi label="Unidades válidas" value={totalUnidades} sub="VIN consolidados" />
        <Kpi label="Bono total" value={fmtMXN(totalBono)} sub="A circularizar" accent />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Icon.Excel width={17} height={17} /> Consolidado por agencia</h3>
          <Pill tone="gray">{validos.length} VIN</Pill>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
              <th className="text-left font-semibold px-5 py-3">Agencia</th>
              <th className="text-left font-semibold px-3 py-3">Zona</th>
              <th className="text-right font-semibold px-3 py-3">Unidades</th>
              <th className="text-right font-semibold px-3 py-3">Bono promedio</th>
              <th className="text-right font-semibold px-5 py-3">Bono total</th>
            </tr>
          </thead>
          <tbody>
            {consolidado.map(d => (
              <tr key={d.dealer} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold">{d.nombre}</td>
                <td className="px-3 py-3 text-kia-gray">{d.zona}</td>
                <td className="px-3 py-3 text-right tabular">{d.unidades}</td>
                <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(d.bono / d.unidades)}</td>
                <td className="px-5 py-3 text-right tabular font-bold">{fmtMXN(d.bono)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
              <td className="px-5 py-3" colSpan={2}>Total</td>
              <td className="px-3 py-3 text-right tabular">{totalUnidades}</td>
              <td className="px-3 py-3"></td>
              <td className="px-5 py-3 text-right tabular">{fmtMXN(totalBono)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="flex items-start gap-3 rounded-xl bg-slate-100 border border-kia-line px-4 py-3.5 text-sm text-slate-700">
        <Icon.Excel width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" />
        <p>El archivo consolidado en Excel es el respaldo oficial del periodo. Con él se generan las circulares con totales a cada dealer (Paso 4).</p>
      </div>
    </div>
  )
}
