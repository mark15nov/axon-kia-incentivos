import { useMemo, useState } from 'react'
import { Card, SectionTitle, Pill, Button } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { calcularMargenVariable, avanceDelMes } from '../motor/calculo.js'
import { generarExcelFinanzas, nombreArchivoFinanzas } from '../excel/reporteFinanzas.js'
import { Indicador, SinDatos, BarraUmbral, descargar } from './componentes.jsx'
import { pesos, millones, pct, entero, nombrePeriodo } from './formato.js'

function Interruptor({ on, onChange, titulo, desc }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="w-full text-left flex items-start gap-3 rounded-md border border-kia-line bg-white px-4 py-3 hover:border-slate-400 transition-colors">
      <span className={`mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${on ? 'bg-kia-red' : 'bg-slate-300'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="block text-xs text-kia-gray mt-0.5">{desc}</span>
      </span>
    </button>
  )
}

export default function PasoForecast({ carga, parametros, resultado, irA }) {
  const avance = useMemo(() => (resultado ? avanceDelMes(carga.datos.ventas, resultado.periodo) : null), [carga.datos, resultado])
  const mesIncompleto = avance ? avance.ultimoDia < avance.diasMes : false
  const [supuesto, setSupuesto] = useState(true)
  const [proyectar, setProyectar] = useState(mesIncompleto)
  const [generando, setGenerando] = useState(false)

  const forecast = useMemo(() => {
    if (!resultado) return null
    const escenario = { supuestoInventario: supuesto, factorRunRate: proyectar ? avance.factorRunRate : 1 }
    return calcularMargenVariable(carga.datos, { periodo: resultado.periodo, parametros, escenario })
  }, [carga.datos, resultado, parametros, supuesto, proyectar, avance])

  if (!resultado) return <SinDatos irACarga={() => irA(2)} />

  const f = forecast.resumen
  const real = resultado.resumen
  const orilla = forecast.dealers
    .filter(d => d.mouRetail > 0 && d.pctRetail >= 0.85 && !d.cumpleRetail)
    .map(d => ({ ...d, faltan: Math.max(0, Math.ceil(d.mouRetail * parametros.umbralRetail - d.ventasRetail * forecast.escenario.factorRunRate)) }))
    .sort((a, b) => b.provision - a.provision)
  const cumplen = forecast.dealers.filter(d => d.cumpleRetail).length

  const exportar = async () => {
    setGenerando(true)
    try {
      const buf = await generarExcelFinanzas({ datos: carga.datos, resultado: forecast, meta: { archivos: [carga.archivos.ventas?.nombre, carga.archivos.mv?.nombre] } })
      descargar(buf, nombreArchivoFinanzas(forecast))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 2 · Paso 1" title={`Forecast · ${nombrePeriodo(resultado.periodo)}`}
        desc="Estimación del pago antes del cierre. Por default se asume que todos los dealers cumplen WHS ≥ 90% o MOS > 2; los supuestos se ajustarán con los resultados históricos."
        right={<Button variant="ghost" onClick={exportar} disabled={generando}><Icon.Download width={15} height={15} /> {generando ? 'Generando…' : 'Excel del forecast'}</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
        <Card className="p-6">
          <Indicador label="Pago estimado (sin IVA)" valor={pesos(f.montoProyectado)} tono="red" grande
            sub={`${entero(f.unidadesPagadas)} unidades · ${entero(f.unidadesBono)} con bono`} />
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-kia-line">
            <Indicador label="Con datos reales" valor={millones(real.montoTotal)} sub="WHS/MOS del layout" />
            <Indicador label="Efecto supuestos" valor={millones(f.montoProyectado - real.montoTotal)} tono={f.montoProyectado >= real.montoTotal ? 'ink' : 'red'} />
            <Indicador label="Dealers ≥ 100% retail" valor={`${cumplen} / ${forecast.dealers.length}`} />
          </div>
        </Card>
        <div className="space-y-3">
          <Interruptor on={supuesto} onChange={setSupuesto} titulo="Asumir WHS ≥ 90% o MOS > 2"
            desc="Supuesto default del forecast. Apágalo para usar WHS y MOS del layout." />
          <Interruptor on={proyectar} onChange={setProyectar} titulo={`Proyectar a cierre de mes (×${avance.factorRunRate.toFixed(2)})`}
            desc={mesIncompleto ? `Ventas al día ${avance.ultimoDia} de ${avance.diasMes}; se extrapola el ritmo diario.` : 'El mes ya está completo; el factor es 1.'} />
          <Card className="p-4 text-xs text-kia-gray leading-relaxed">
            El Excel del forecast lleva los mismos supuestos en PARAMETROS (<b>SUPUESTO_INV</b>, <b>FACTOR_RUNRATE</b>) para que Finanzas los vea y ajuste.
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold">Dealers en la orilla</h3>
            <p className="text-xs text-kia-gray mt-0.5">Entre 85% y 100% de retail: con pocas unidades más activan la regla A.</p>
          </div>
          <Pill tone="amber">{orilla.length} dealers</Pill>
        </div>
        {orilla.length === 0 ? <div className="text-sm text-kia-gray">Ningún dealer está entre 85% y 100%.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray border-b border-kia-line">
                <th className="py-2 pr-3 font-semibold">Dealer</th><th className="py-2 px-3 font-semibold text-right">MOU retail</th>
                <th className="py-2 px-3 font-semibold text-right">Ventas retail</th><th className="py-2 px-3 font-semibold">% retail</th>
                <th className="py-2 px-3 font-semibold text-right">Faltan</th><th className="py-2 pl-3 font-semibold text-right">Provisión en juego</th>
              </tr></thead>
              <tbody>
                {orilla.slice(0, 12).map(d => (
                  <tr key={d.dealer} className="border-b border-kia-line/60 last:border-0">
                    <td className="py-2 pr-3 font-semibold">{d.dealer}</td>
                    <td className="py-2 px-3 text-right tabular">{entero(d.mouRetail)}</td>
                    <td className="py-2 px-3 text-right tabular">{entero(d.ventasRetail)}</td>
                    <td className="py-2 px-3"><span className="flex items-center gap-2"><BarraUmbral valor={d.pctRetail} umbral={parametros.umbralRetail} /><span className="tabular text-xs">{pct(d.pctRetail)}</span></span></td>
                    <td className="py-2 px-3 text-right tabular font-bold text-kia-red">{d.faltan}</td>
                    <td className="py-2 pl-3 text-right tabular">{pesos(d.provision)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
