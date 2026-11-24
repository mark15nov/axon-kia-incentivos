import { useMemo, useState } from 'react'
import { Card, SectionTitle, Pill, Button } from '../../margen-variable/ui/base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { descargar } from '../../margen-variable/ui/componentes.jsx'
import { pesos2, nombrePeriodo } from '../../margen-variable/ui/formato.js'
import { correoFinanciera } from '../motor/correo.js'
import { generarExcelFidelity, generarVinsPagadosActualizado, nombreReporteFidelity, nombreVinsPagados } from '../excel/reporteFidelity.js'
import { SinDatosFidelity } from './componentesFidelity.jsx'
import { MOTIVO_LABEL } from '../motor/debitosDealer.js'

function Columna({ titulo, filas, total, tono }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3 bg-slate-50/70 border-b border-kia-line flex items-center gap-2.5">
        <span className={`h-6 w-6 rounded-[5px] grid place-items-center text-white text-xs font-bold ${tono}`}>{titulo[0]}</span>
        <h3 className="font-semibold text-[15px]">{titulo}</h3>
      </div>
      <dl className="px-5 py-2">
        {filas.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2 border-b border-dashed border-kia-line last:border-0 text-sm">
            <dt className="text-kia-gray">{k}</dt><dd className="tabular font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="px-5 py-3.5 border-t border-kia-line flex items-center justify-between">
        <span className="text-sm font-semibold">{total[0]}</span><span className="text-xl font-bold tabular text-kia-red">{total[1]}</span>
      </div>
    </Card>
  )
}

export default function PasoCierre({ resultado, carga, cierre, setCierre, irA }) {
  const correo = useMemo(() => (resultado ? correoFinanciera(resultado) : null), [resultado])
  const [cuerpo, setCuerpo] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [generando, setGenerando] = useState(null)
  const [error, setError] = useState(null)
  if (!resultado) return <SinDatosFidelity irACarga={() => irA(2)} />
  const { pago, debito } = resultado.resumen
  const texto = cuerpo ?? correo.cuerpo
  const rs = resultado.porRazonSocial
  const tot = (k) => rs.reduce((a, x) => a + x[k], 0)

  const bajar = async (tipo) => {
    setGenerando(tipo)
    setError(null)
    try {
      if (tipo === 'reporte') descargar(await generarExcelFidelity({ resultado, datos: carga.datos }), nombreReporteFidelity(resultado))
      else descargar(await generarVinsPagadosActualizado({ resultado, datos: carga.datos }), nombreVinsPagados(resultado))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el archivo.')
    } finally {
      setGenerando(null)
    }
  }
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${correo.asunto}\n\n${texto}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setError('No se pudo copiar al portapapeles; selecciona el texto manualmente.')
    }
  }
  const cerrar = async () => {
    await bajar('vins')
    setCierre({ folio: `FD-${resultado.periodo}-${String(Math.round(pago.aPagar) % 10000).padStart(4, '0')}`, vins: resultado.vinsPagadosNuevos.length })
  }

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 3" title={`Resumen y cierre · ${nombrePeriodo(resultado.periodo)}`}
        desc="Dos resultados separados: lo que se paga a la financiera y lo que se debita a los distribuidores. Todo monto es rastreable al Dossier y al VIN en el Excel de cierre."
        right={cierre ? <Pill tone="green"><Icon.Check width={13} height={13} /> Mes cerrado · {cierre.folio}</Pill> : null} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Columna titulo="Pago a la financiera" tono="bg-sky-700" total={['Monto a pagar', pesos2(pago.aPagar)]}
          filas={[['Monto reclamado', pesos2(pago.reclamado)], ['Ajustes', pesos2(pago.ajustes)], ['Retenido por aclarar', pesos2(pago.retenido)],
            ['Contratos: procede / ajuste / retenido', `${pago.procede} / ${pago.ajustados} / ${pago.retenidos}`]]} />
        <Columna titulo="Débito al distribuidor" tono="bg-kia-red" total={['Monto a debitar', pesos2(debito.total)]}
          filas={[['VIN con débito', debito.vins], ['VIN por revisar', debito.porRevisar], ...debito.porMotivo.map(([k, n]) => [`Motivo · ${MOTIVO_LABEL[k] ?? k}`, n])]} />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-kia-line flex items-center justify-between">
          <h3 className="font-semibold text-[15px]">Subtotales por razón social</h3>
          <span className="text-xs text-kia-gray">Cuadran con el resumen</span>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray bg-slate-50 border-b border-kia-line">
            <th className="py-2 pl-5 pr-2 font-semibold">Razón social</th><th className="py-2 px-2 font-semibold text-right">Contratos</th>
            <th className="py-2 px-2 font-semibold text-right">Reclamado</th><th className="py-2 px-2 font-semibold text-right">Retenido</th>
            <th className="py-2 px-2 font-semibold text-right">Pago a financiera</th><th className="py-2 px-2 font-semibold text-right">VIN débito</th><th className="py-2 pl-2 pr-5 font-semibold text-right">Débito dealer</th>
          </tr></thead>
          <tbody>
            {rs.map(x => (
              <tr key={x.razonSocial} className="border-b border-kia-line/60">
                <td className="py-2 pl-5 pr-2">{x.razonSocial}</td><td className="py-2 px-2 text-right tabular">{x.contratos}</td>
                <td className="py-2 px-2 text-right tabular">{pesos2(x.reclamado)}</td><td className="py-2 px-2 text-right tabular">{pesos2(x.retenido)}</td>
                <td className="py-2 px-2 text-right tabular font-semibold">{pesos2(x.aPagar)}</td><td className="py-2 px-2 text-right tabular">{x.vinsDebito}</td>
                <td className="py-2 pl-2 pr-5 text-right tabular font-semibold">{pesos2(x.debito)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td className="py-2 pl-5 pr-2">Total</td><td className="py-2 px-2 text-right tabular">{tot('contratos')}</td>
              <td className="py-2 px-2 text-right tabular">{pesos2(tot('reclamado'))}</td><td className="py-2 px-2 text-right tabular">{pesos2(tot('retenido'))}</td>
              <td className="py-2 px-2 text-right tabular">{pesos2(tot('aPagar'))}</td><td className="py-2 px-2 text-right tabular">{tot('vinsDebito')}</td>
              <td className="py-2 pl-2 pr-5 text-right tabular">{pesos2(tot('debito'))}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <Card className="overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-kia-line flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-[15px]">Correo a la financiera</h3>
              <p className="text-xs text-kia-gray truncate">Asunto: {correo.asunto}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" onClick={copiar}><Icon.File width={14} height={14} /> {copiado ? 'Copiado' : 'Copiar'}</Button>
              <a href={`mailto:?subject=${encodeURIComponent(correo.asunto)}&body=${encodeURIComponent(texto)}`}
                className="inline-flex items-center gap-2 rounded border border-kia-red bg-kia-red px-4 py-2 text-sm font-semibold text-white hover:bg-[#a01224]">
                <Icon.Mail width={14} height={14} /> Abrir en correo
              </a>
            </div>
          </div>
          <textarea value={texto} onChange={e => setCuerpo(e.target.value)} aria-label="Cuerpo del correo"
            className="flex-1 min-h-[340px] w-full resize-y px-5 py-4 font-mono text-[12px] leading-relaxed text-kia-black/85 outline-none" />
        </Card>

        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-[15px]">Entregables</h3>
            <Button variant="ghost" className="w-full justify-start" onClick={() => bajar('reporte')} disabled={generando !== null}>
              <Icon.Excel width={15} height={15} className="text-emerald-600" /> {generando === 'reporte' ? 'Generando…' : nombreReporteFidelity(resultado)}
            </Button>
            <p className="text-xs text-kia-gray">Resumen, pago por Dossier, débitos por VIN con motivo, subtotales por razón social y observaciones.</p>
            <Button variant="ghost" className="w-full justify-start" onClick={() => bajar('vins')} disabled={generando !== null}>
              <Icon.Database width={15} height={15} /> {generando === 'vins' ? 'Generando…' : 'VINS PAGADOS actualizado'}
            </Button>
            <p className="text-xs text-kia-gray">{resultado.vinsPagadosNuevos.length} pagos Fidelity agregados al historial para validar incentivos futuros.</p>
            {error && <div className="text-xs rounded bg-red-50 text-kia-red px-3 py-2">{error}</div>}
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-[15px]">Cerrar el mes</h3>
            <p className="text-xs text-kia-gray mt-1 leading-relaxed">Registra los {resultado.vinsPagadosNuevos.length} pagos en VINS_PAGADOS y descarga el historial actualizado. Lo retenido se vuelve a validar cuando la financiera reenvíe sus archivos.</p>
            <Button variant="danger" className="w-full mt-3" onClick={cerrar} disabled={Boolean(cierre) || generando !== null}>
              <Icon.Check width={15} height={15} /> {cierre ? `Cerrado · ${cierre.folio}` : 'Cerrar y actualizar VINS pagados'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
