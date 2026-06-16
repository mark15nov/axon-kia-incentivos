import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { consolidarPago, fmtMXN } from '../data/mockData.js'

// Estatus de la factura que manda el dealer:
// 'Pendiente'  → el dealer aún no envía su factura
// 'Recibida'   → factura cargada, falta validar contra la circular
// 'Validada'   → folio + monto coinciden con la circular aprobada, lista para pago
export default function Step6Factura() {
  const base = consolidarPago().filter(f => f.total > 0)
  const [estados, setEstados] = useState(() => Object.fromEntries(base.map(f => [f.dealer, 'Pendiente'])))
  const [drag, setDrag] = useState(false)
  const [recibiendo, setRecibiendo] = useState(false)

  // Simula la llegada de las facturas de los dealers (drag & drop o botón).
  // Al recibir cada una, el sistema verifica folio + monto contra la circular
  // y la valida automáticamente: Pendiente → Recibida → Validada (aprobada).
  const recibirFacturas = () => {
    const pendientes = base.filter(f => estados[f.dealer] === 'Pendiente')
    if (!pendientes.length) return
    setRecibiendo(true)
    pendientes.forEach((f, i) => {
      const t = 280 * (i + 1)
      setTimeout(() => setEstados(s => ({ ...s, [f.dealer]: 'Recibida' })), t)
      setTimeout(() => {
        setEstados(s => ({ ...s, [f.dealer]: 'Validada' }))
        if (i === pendientes.length - 1) setRecibiendo(false)
      }, t + 650)
    })
  }

  const cont = (e) => base.filter(f => estados[f.dealer] === e).length
  // Folio fiscal que viene en la factura del dealer (no lo generamos nosotros).
  const folio = (i) => `F-${String(8841 + i * 7)}`

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 6 · Facturación"
        title="Facturas recibidas del dealer"
        desc="Cada concesionario emite y envía su factura del incentivo. Se arrastran aquí y el sistema verifica que la circular esté aprobada y que el folio y el monto coincidan con lo autorizado. Si todo cuadra, queda validada y lista para pago."
        right={<Pill tone="ink"><Icon.Invoice width={14} height={14} /> {base.length} dealers</Pill>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Facturas esperadas" value={base.length} sub="Una por concesionario" />
        <Kpi label="Recibidas" value={cont('Recibida')} sub="Por validar" />
        <Kpi label="Pendientes" value={cont('Pendiente')} sub="El dealer no ha enviado" />
        <Kpi label="Validadas" value={cont('Validada')} sub="Listas para pago" accent />
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Dropzone — las facturas llegan de los dealers */}
        <div className="col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); recibirFacturas() }}
            className={`rounded-2xl border-2 border-dashed h-full min-h-[320px] grid place-items-center text-center px-6 transition-colors ${
              drag ? 'border-kia-red bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-kia-red text-white grid place-items-center mb-4">
                <Icon.Pdf width={24} height={24} />
              </div>
              <div className="font-bold text-kia-black">Arrastra las facturas aquí</div>
              <p className="text-sm text-kia-gray mt-1.5 max-w-xs mx-auto">
                Acepta el PDF de la factura del incentivo (CFDI) que emite cada dealer. No se generan aquí — llegan de su parte.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Pill tone="red"><Icon.Pdf width={13} height={13} /> .pdf</Pill>
                <Pill tone="blue"><Icon.File width={13} height={13} /> CFDI</Pill>
              </div>
              <Button variant="soft" className="mt-5" onClick={recibirFacturas} disabled={recibiendo || cont('Pendiente') === 0}>
                {recibiendo ? 'Recibiendo…' : cont('Pendiente') === 0 ? 'Todas recibidas' : 'Simular recepción'}
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de facturas por dealer */}
        <div className="col-span-3">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold px-5 py-3">Folio</th>
                  <th className="text-left font-semibold px-3 py-3">Concesionario</th>
                  <th className="text-center font-semibold px-3 py-3">Circular</th>
                  <th className="text-right font-semibold px-3 py-3">Monto</th>
                  <th className="text-center font-semibold px-3 py-3">Estatus</th>
                  <th className="text-right font-semibold px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {base.map((f, i) => {
                  const est = estados[f.dealer]
                  return (
                    <tr key={f.dealer} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-xs font-semibold">{est === 'Pendiente' ? '—' : folio(i)}</td>
                      <td className="px-3 py-3 font-semibold">{f.nombre}</td>
                      <td className="px-3 py-3 text-center"><Pill tone="green"><Icon.Check width={12} height={12} /> Aprobada</Pill></td>
                      <td className="px-3 py-3 text-right tabular font-bold">{fmtMXN(f.total)}</td>
                      <td className="px-3 py-3 text-center">
                        <Pill tone={est === 'Validada' ? 'green' : est === 'Recibida' ? 'amber' : 'gray'}>
                          {est === 'Recibida' ? <Icon.Clock width={12} height={12} /> : est === 'Validada' ? <Icon.Check width={12} height={12} /> : <Icon.Clock width={12} height={12} />}
                          {est === 'Recibida' ? 'Validando' : est === 'Validada' ? 'Aprobada' : est}
                        </Pill>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {est === 'Recibida'
                          ? <span className="text-amber-600 text-xs font-semibold">Verificando folio y monto…</span>
                          : est === 'Validada'
                            ? <span className="text-emerald-600 text-xs font-semibold">✓ Folio y monto OK</span>
                            : <span className="text-kia-gray text-xs">En espera del dealer</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-slate-100 border border-kia-line px-4 py-3.5 text-sm text-slate-700">
        <Icon.Invoice width={18} height={18} className="mt-0.5 shrink-0 text-kia-black" />
        <p>El dealer emite la factura del incentivo y la envía; aquí se concilia contra su circular aprobada. Una vez <strong>validada</strong> (folio y monto coinciden), pasa a tesorería para liberar el pago (Paso 7).</p>
      </div>
    </div>
  )
}
