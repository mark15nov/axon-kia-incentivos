import { useState } from 'react'
import { Card, SectionTitle, Pill, Button } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { REGLA, REGLA_LABEL } from '../motor/calculo.js'
import { esPresetFinanzas } from '../motor/parametros.js'
import { generarExcelFinanzas, nombreArchivoFinanzas } from '../excel/reporteFinanzas.js'
import { SinDatos, Indicador, ReglaPill, AvisoSinCruce, descargar } from './componentes.jsx'
import { pesos, pesos2, millones, entero, pct, nombrePeriodo } from './formato.js'

const HOJAS_EXCEL = [
  ['MONTHLY MV', 'Control mensual: monto MXN/USD, centro de costo y facturas por razón social'],
  ['MV por Modelo', 'Por dealer: MOU, SALES, ACHIEVE, MISSING, % WHS, MOS y bloque por modelo'],
  ['CALCULO', 'Una fila por VIN: PROVIS, MOS, %WHS, % SALES, % MODEL, MONTO A PAGAR'],
  ['Resumen de Pago', 'Por modelo / dealer / razón social y tablas para BC en MXN y USD'],
  ['BC', 'Retail vs MOU y provisión vs margen variable por modelo'],
  ['PARAMETROS', 'Umbrales, tipo de cambio y centro de costo: cambia uno y se recalcula'],
  ['SALES · PROVISION · MOS · WHS · MOU · DEALERS · Curtailment', 'Las bases usadas en el cálculo']
]

function Conciliacion({ c }) {
  const ok = Math.abs(c.diferencia) < 1
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold">Conciliación contra el cálculo de Finanzas</h3>
          <p className="text-xs text-kia-gray mt-0.5">VIN por VIN, tolerancia de $0.50.</p>
        </div>
        <Pill tone={c.pctCoincidencia > 0.999 ? 'green' : c.pctCoincidencia > 0.95 ? 'amber' : 'red'}>{pct(c.pctCoincidencia, 2)} coincide</Pill>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Indicador label="Plataforma" valor={millones(c.totalPlataforma)} />
        <Indicador label="Finanzas" valor={millones(c.totalReferencia)} />
        <Indicador label="Diferencia" valor={pesos(c.diferencia)} tono={ok ? 'green' : 'red'} />
        <Indicador label="VIN distintos" valor={entero(c.difieren.length)} sub={`${entero(c.soloPlataforma.length)} sólo plataforma · ${entero(c.soloFinanzas.length)} sólo Finanzas`} />
      </div>
      {c.difieren.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray border-b border-kia-line">
              <th className="py-2 pr-2 font-semibold">VIN</th><th className="py-2 px-2 font-semibold">Dealer</th><th className="py-2 px-2 font-semibold">Regla plataforma</th>
              <th className="py-2 px-2 font-semibold text-right">Plataforma</th><th className="py-2 px-2 font-semibold text-right">Finanzas</th><th className="py-2 pl-2 font-semibold text-right">Diferencia</th>
            </tr></thead>
            <tbody>
              {c.difieren.slice(0, 8).map(d => (
                <tr key={d.vin} className="border-b border-kia-line/60 last:border-0">
                  <td className="py-2 pr-2 font-mono text-xs">{d.vin}</td><td className="py-2 px-2">{d.dealer}</td><td className="py-2 px-2"><ReglaPill regla={d.regla} /></td>
                  <td className="py-2 px-2 text-right tabular">{pesos2(d.montoPlataforma)}</td><td className="py-2 px-2 text-right tabular">{pesos2(d.montoFinanzas)}</td>
                  <td className={`py-2 pl-2 text-right tabular font-semibold ${d.diferencia > 0 ? 'text-kia-black' : 'text-kia-red'}`}>{pesos2(d.diferencia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {c.difieren.length > 8 && <div className="text-xs text-kia-gray mt-2">… y {entero(c.difieren.length - 8)} VIN más. El detalle completo está en la hoja CALCULO.</div>}
        </div>
      )}
    </Card>
  )
}

export default function PasoFinanzas({ resultado, carga, conciliacion, parametros, version, irA }) {
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(null)
  if (!resultado) return <SinDatos irACarga={() => irA(2)} />

  const r = resultado.resumen
  const pagadas = [REGLA.A, REGLA.A_BONO, REGLA.B, REGLA.B_BONO].map(x => ({ regla: x, ...r.porRegla[x] })).filter(x => x.unidades > 0)
  const exportar = async () => {
    setGenerando(true)
    setError(null)
    try {
      const archivos = ['ventas', 'mv'].map(t => carga.archivos[t]?.nombre).filter(Boolean)
      const buf = await generarExcelFinanzas({ datos: carga.datos, resultado, meta: { archivos } })
      descargar(buf, nombreArchivoFinanzas(resultado))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el Excel.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 3 · Paso 1" title={`Reporte a Finanzas · ${nombrePeriodo(resultado.periodo)}`}
        desc="Finanzas recibe un Excel formulado con el cálculo completo y las bases consideradas, listo para auditar y facturar."
        right={<Pill tone="ink">{esPresetFinanzas(parametros) ? 'Reglas de la guía' : 'Política escrita'}</Pill>} />

      <AvisoSinCruce resultado={resultado} provision={carga.archivos.mv?.tablas?.provision} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card className="p-6">
          <Indicador label="Monto a pagar (sin IVA)" valor={pesos(r.montoTotal)} tono="red" grande sub={`${pesos(r.montoConIva)} con IVA · ${entero(r.unidadesPagadas)} de ${entero(r.unidadesConProvision)} unidades con provisión`} />
          <div className="mt-6 space-y-2.5">
            {pagadas.map(x => (
              <div key={x.regla}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-kia-gray">{REGLA_LABEL[x.regla]} · {entero(x.unidades)} u</span>
                  <span className="tabular font-semibold">{pesos(x.monto)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${x.regla === REGLA.B ? 'bg-sky-600' : x.regla === REGLA.A ? 'bg-emerald-500' : 'bg-kia-black'}`} style={{ width: `${r.montoTotal ? (x.monto / r.montoTotal) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-kia-line">
            {r.porFamilia.slice(0, 6).map(fam => <Indicador key={fam.clave} label={fam.clave} valor={millones(fam.monto)} sub={`${entero(fam.unidadesPagadas)} u`} />)}
          </div>
        </Card>

        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-10 w-10 rounded-md bg-emerald-50 text-emerald-600 grid place-items-center"><Icon.Excel width={20} height={20} /></span>
            <div>
              <h3 className="font-bold leading-tight">{nombreArchivoFinanzas(resultado)}</h3>
              <div className="text-xs text-kia-gray">Formulado · recalcula al abrir</div>
            </div>
          </div>
          <ul className="space-y-1.5 flex-1">
            {HOJAS_EXCEL.map(([h, d]) => (
              <li key={h} className="text-xs"><span className="font-semibold text-kia-black">{h}</span><span className="text-kia-gray"> — {d}</span></li>
            ))}
          </ul>
          {error && <div className="mt-3 text-xs rounded bg-red-50 text-kia-red px-3 py-2">{error}</div>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={exportar} disabled={generando}><Icon.Download width={15} height={15} /> {generando ? 'Generando…' : 'Descargar'}</Button>
            <Button variant="danger" onClick={() => setEnviado(`MV-${resultado.periodo}-${String(Math.round(r.montoTotal) % 10000).padStart(4, '0')}`)}>
              <Icon.Mail width={15} height={15} /> Enviar a Finanzas
            </Button>
          </div>
        </Card>
      </div>

      {version === 'plataforma' ? null : conciliacion ? <Conciliacion c={conciliacion} /> : (
        <Card className="p-4 flex items-center justify-between gap-4">
          <div className="text-sm"><b>Corrida en paralelo.</b> <span className="text-kia-gray">Sube el Calculation File de Finanzas en la carga mensual para conciliar VIN por VIN.</span></div>
          <Button variant="ghost" onClick={() => irA(2)}>Ir a carga</Button>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-kia-line flex items-center justify-between">
          <h3 className="font-bold">Pago por razón social</h3>
          <span className="text-xs text-kia-gray">{r.porRazonSocial.length} razones sociales</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50"><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray border-b border-kia-line">
              <th className="py-2 pl-5 pr-2 font-semibold">Razón social</th><th className="py-2 px-2 font-semibold text-right">Unidades pagadas</th>
              <th className="py-2 px-2 font-semibold text-right">Sin IVA</th><th className="py-2 pl-2 pr-5 font-semibold text-right">Con IVA</th>
            </tr></thead>
            <tbody>
              {r.porRazonSocial.map(x => (
                <tr key={x.clave} className="border-b border-kia-line/60 last:border-0">
                  <td className="py-2 pl-5 pr-2">{x.clave}</td>
                  <td className="py-2 px-2 text-right tabular">{entero(x.unidadesPagadas)}</td>
                  <td className="py-2 px-2 text-right tabular">{pesos(x.monto)}</td>
                  <td className="py-2 pl-2 pr-5 text-right tabular font-semibold">{pesos(x.monto * (1 + parametros.iva))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {enviado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up" onClick={() => setEnviado(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="mv-enviado" className="bg-white rounded-md shadow-lg w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto h-14 w-14 rounded-md bg-emerald-500 text-white grid place-items-center mb-4"><Icon.Check width={28} height={28} /></div>
            <h3 id="mv-enviado" className="text-lg font-bold">Reporte enviado a Finanzas</h3>
            <p className="text-sm text-kia-gray mt-1.5 leading-relaxed">Margen Variable · {nombrePeriodo(resultado.periodo)} por {pesos(r.montoConIva)} con IVA, con el Excel formulado adjunto.</p>
            <div className="mt-3 flex justify-center"><Pill tone="ink">Folio {enviado}</Pill></div>
            <div className="mt-5 flex justify-center"><Button variant="danger" onClick={() => setEnviado(null)}>Entendido</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
