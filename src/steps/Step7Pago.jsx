import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { consolidarPago, fmtMXN, PERIODO } from '../data/mockData.js'

export default function Step7Pago() {
  const base = consolidarPago().filter(f => f.total > 0)
  const [estados, setEstados] = useState(() => Object.fromEntries(base.map(f => [f.dealer, 'En espera'])))
  const total = base.reduce((a, b) => a + b.total, 0)

  const ejecutar = () => {
    base.forEach((f, i) => {
      setTimeout(() => setEstados(s => ({ ...s, [f.dealer]: 'Programado' })), 150 * i)
      setTimeout(() => setEstados(s => ({ ...s, [f.dealer]: 'Pagado' })), 150 * i + 700)
    })
  }

  const pagados = base.filter(f => estados[f.dealer] === 'Pagado')
  const pctPagado = (pagados.length / base.length) * 100
  const montoPagado = pagados.reduce((a, b) => a + b.total, 0)

  // Escapa un valor para CSV (comillas, comas y saltos de línea).
  const celdaCSV = (v) => {
    const s = String(v ?? '')
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // Genera y descarga el reporte de pagos como CSV (abre en Excel).
  const descargarReporte = () => {
    const encabezado = ['Concesionario', 'Referencia', 'Monto', 'Estatus de pago', 'Periodo']
    const filas = base.map((f, i) => [f.nombre, `SPEI-${98010 + i}`, f.total, estados[f.dealer], PERIODO])
    const totalRow = ['TOTAL', '', total, '', '']
    const csv = [encabezado, ...filas, totalRow].map(r => r.map(celdaCSV).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Reporte_Pago_Cashback_${PERIODO.replace(/\s+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 7 · Tesorería"
        title="Pago del incentivo"
        desc="Con las facturas validadas, tesorería libera el pago a cada dealer. Cierre del ciclo Cashback del periodo."
        right={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={descargarReporte}>
              <Icon.Download width={16} height={16} /> Descargar reporte
            </Button>
            <Button variant="danger" onClick={ejecutar} disabled={pctPagado === 100}>
              <Icon.Cash width={16} height={16} /> {pctPagado === 100 ? 'Pagos completados' : 'Ejecutar pagos'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Monto total" value={fmtMXN(total)} sub={`Periodo ${PERIODO}`} accent />
        <Kpi label="Dealers" value={base.length} sub="A liquidar" />
        <Kpi label="Pagados" value={`${pagados.length}/${base.length}`} sub={`${Math.round(pctPagado)}% completado`} />
        <Kpi label="Liquidado" value={fmtMXN(montoPagado)} sub="Transferido" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Avance de liquidación</span>
          <span className="text-sm tabular text-kia-gray">{fmtMXN(montoPagado)} / {fmtMXN(total)}</span>
        </div>
        <ProgressBar value={pctPagado} tone={pctPagado === 100 ? 'green' : 'red'} />
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
              <th className="text-left font-semibold px-5 py-3">Concesionario</th>
              <th className="text-left font-semibold px-3 py-3">Referencia</th>
              <th className="text-right font-semibold px-3 py-3">Monto</th>
              <th className="text-center font-semibold px-5 py-3">Estatus de pago</th>
            </tr>
          </thead>
          <tbody>
            {base.map((f, i) => {
              const est = estados[f.dealer]
              return (
                <tr key={f.dealer} className="border-t border-slate-100">
                  <td className="px-5 py-3.5 font-semibold">{f.nombre}</td>
                  <td className="px-3 py-3.5 font-mono text-xs text-kia-gray">SPEI-{String(98010 + i)}</td>
                  <td className="px-3 py-3.5 text-right tabular font-bold">{fmtMXN(f.total)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center">
                      <Pill tone={est === 'Pagado' ? 'green' : est === 'Programado' ? 'blue' : 'gray'}>
                        {est === 'Pagado' && <Icon.Check width={12} height={12} />}
                        {est === 'Programado' && <Icon.Clock width={12} height={12} />}
                        {est}
                      </Pill>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {pctPagado === 100 && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-emerald-900 animate-fade-up">
          <span className="h-10 w-10 rounded-full bg-emerald-500 text-white grid place-items-center"><Icon.Check width={20} height={20} /></span>
          <div>
            <div className="font-bold">Ciclo Cashback {PERIODO} completado</div>
            <div className="text-sm text-emerald-800/80">Se liquidaron {fmtMXN(total)} a {base.length} concesionarios. Todo el flujo quedó trazado de SAP al pago.</div>
          </div>
        </div>
      )}
    </div>
  )
}
