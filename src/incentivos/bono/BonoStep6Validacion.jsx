import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { consolidarBono, bonoFacturaFactor, fmtMXN } from '../../data/bonoVentas.js'

// Compara lo facturado por el dealer contra el bono autorizado por la circular.
// Si el dealer factura de más → 'Sobrefacturado' (se ajusta al autorizado).
export default function BonoStep6Validacion() {
  const base = consolidarBono().map(f => {
    const factor = bonoFacturaFactor[f.dealer] || 1
    return { ...f, autorizado: f.bono, facturado: Math.round(f.bono * factor) }
  })

  const [ajustados, setAjustados] = useState({}) // dealer → true (ajustado al autorizado)
  const estadoDe = (f) => {
    if (ajustados[f.dealer]) return 'Ajustada'
    return f.facturado > f.autorizado ? 'Sobrefacturado' : 'Conforme'
  }
  const ajustar = (dealer) => setAjustados(s => ({ ...s, [dealer]: true }))

  const sobre = base.filter(f => estadoDe(f) === 'Sobrefacturado')
  const excedente = sobre.reduce((a, f) => a + (f.facturado - f.autorizado), 0)
  const conformes = base.filter(f => estadoDe(f) !== 'Sobrefacturado').length

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 6 · Control"
        title="Validación de facturas"
        desc="Se valida que el monto facturado por cada agencia no exceda el bono autorizado en la circular. Si una factura intenta cobrar de más, se detecta y se ajusta al autorizado antes de pagar."
        right={<Pill tone={sobre.length ? 'red' : 'green'}>
          {sobre.length ? <Icon.Alert width={14} height={14} /> : <Icon.Check width={14} height={14} />} {sobre.length} sobrefacturada(s)
        </Pill>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Facturas" value={base.length} sub="Recibidas del dealer" />
        <Kpi label="Conformes" value={conformes} sub="Monto = autorizado" />
        <Kpi label="Sobrefacturadas" value={sobre.length} sub="Cobran de más" accent />
        <Kpi label="Excedente detectado" value={fmtMXN(excedente)} sub="Evitado en el pago" />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
              <th className="text-left font-semibold px-5 py-3">Agencia</th>
              <th className="text-right font-semibold px-3 py-3">Autorizado</th>
              <th className="text-right font-semibold px-3 py-3">Facturado</th>
              <th className="text-right font-semibold px-3 py-3">Diferencia</th>
              <th className="text-center font-semibold px-3 py-3">Estatus</th>
              <th className="text-right font-semibold px-5 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {base.map(f => {
              const est = estadoDe(f)
              const diff = f.facturado - f.autorizado
              const pagar = est === 'Sobrefacturado' ? f.facturado : f.autorizado
              return (
                <tr key={f.dealer} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-semibold">{f.nombre}</td>
                  <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(f.autorizado)}</td>
                  <td className={`px-3 py-3 text-right tabular font-semibold ${est === 'Sobrefacturado' ? 'text-kia-red' : ''}`}>{fmtMXN(est === 'Ajustada' ? f.autorizado : f.facturado)}</td>
                  <td className={`px-3 py-3 text-right tabular font-bold ${diff > 0 && est === 'Sobrefacturado' ? 'text-kia-red' : 'text-emerald-600'}`}>
                    {est === 'Sobrefacturado' ? '+' + fmtMXN(diff) : est === 'Ajustada' ? 'ajustado' : '✓'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Pill tone={est === 'Conforme' ? 'green' : est === 'Ajustada' ? 'blue' : 'red'}>
                      {est === 'Sobrefacturado' ? <Icon.Alert width={12} height={12} /> : <Icon.Check width={12} height={12} />} {est}
                    </Pill>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {est === 'Sobrefacturado'
                      ? <Button variant="danger" className="!py-1.5 !px-3 text-xs" onClick={() => ajustar(f.dealer)}>Ajustar al autorizado</Button>
                      : <span className="text-emerald-600 text-xs font-semibold">✓ Pagar {fmtMXN(est === 'Ajustada' ? f.autorizado : pagar)}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm ${sobre.length ? 'bg-red-50 border border-red-100 text-kia-red' : 'bg-emerald-50 border border-emerald-100 text-emerald-900'}`}>
        <Icon.Alert width={18} height={18} className="mt-0.5 shrink-0" />
        <p>{sobre.length
          ? <>Se detectaron <strong>{fmtMXN(excedente)}</strong> de sobrefacturación en {sobre.length} agencia(s). Ajusta al monto autorizado para que el pago no exceda lo calculado.</>
          : <>Todas las facturas coinciden con el bono autorizado. Listas para liberar el pago en tesorería (Paso 7).</>}
        </p>
      </div>
    </div>
  )
}
