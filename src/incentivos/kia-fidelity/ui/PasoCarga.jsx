import { Card, SectionTitle, Pill, Button } from '../../margen-variable/ui/base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { ZonaArchivo } from '../../margen-variable/ui/PasoCarga.jsx'
import { Indicador } from '../../margen-variable/ui/componentes.jsx'
import { pesos, nombrePeriodo } from '../../margen-variable/ui/formato.js'
import { ARCHIVOS_FIDELITY } from '../motor/layouts.js'
import { EstatusPago, EstatusDebito } from './componentesFidelity.jsx'

function Aceptacion({ a }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-kia-line">
        <div>
          <h3 className="font-semibold text-[15px]">Prueba de aceptación · casos plantados</h3>
          <p className="text-xs text-kia-gray mt-0.5">Cada caso de la clave contra lo que detectó el motor.</p>
        </div>
        <Pill tone={a.ok ? 'green' : 'red'}>{a.detectados} / {a.total} detectados</Pill>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50"><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray border-b border-kia-line">
            <th className="py-2 pl-5 pr-2 font-semibold w-8" />
            <th className="py-2 px-2 font-semibold">Dossier</th><th className="py-2 px-2 font-semibold">Caso plantado</th>
            <th className="py-2 px-2 font-semibold">Detección</th><th className="py-2 px-2 font-semibold">Pago</th><th className="py-2 pl-2 pr-5 font-semibold">Dealer</th>
          </tr></thead>
          <tbody>
            {a.filas.map(f => (
              <tr key={f.dossier} className="border-b border-kia-line/60 last:border-0">
                <td className="py-2 pl-5 pr-2">{f.ok ? <Icon.Check width={15} height={15} className="text-emerald-600" /> : <Icon.Alert width={15} height={15} className="text-kia-red" />}</td>
                <td className="py-2 px-2 font-mono text-xs">{f.dossier}</td>
                <td className="py-2 px-2">{f.caso}</td>
                <td className="py-2 px-2 text-xs text-kia-gray">{f.detalle}</td>
                <td className="py-2 px-2">{f.estatusPago && <EstatusPago estatus={f.estatusPago} />}</td>
                <td className="py-2 pl-2 pr-5">{f.estatusDebito && <EstatusDebito estatus={f.estatusDebito} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function PasoCarga({ carga, resultado, errorCalculo, aceptacion, irA }) {
  const { archivos, cargarArchivo, cargarDemo, quitar, leyendo } = carga
  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 1 · Paso 2" title="Carga del reclamo"
        desc="Sube los archivos del mes. Cuando la financiera envíe correcciones, vuelve a subir sus archivos y todo se recalcula."
        right={<Button variant="ghost" onClick={cargarDemo} disabled={leyendo}><Icon.Database width={15} height={15} /> Cargar simulado · sep 2026</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(ARCHIVOS_FIDELITY).map(([tipo, meta]) => (
          <ZonaArchivo key={tipo} tipo={tipo} meta={meta} archivo={archivos[tipo]} onArchivo={cargarArchivo} onQuitar={quitar} />
        ))}
      </div>

      {errorCalculo && <Card className="p-4 border-l-4 border-l-kia-red text-sm"><b>No se pudo calcular:</b> {errorCalculo}</Card>}

      {resultado && (
        <>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[15px]">Cuadre del reclamo</h3>
              <Pill tone={resultado.cuadre.cuadra ? 'green' : 'red'}>{resultado.periodo ? nombrePeriodo(resultado.periodo) : 'Sin periodo'}</Pill>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-4">
              <Indicador label="Contratos" valor={resultado.cuadre.contratos} />
              <Indicador label="Charge reclamado" valor={pesos(resultado.cuadre.totalReclamado)} />
              <Indicador label="Hoja CHARGE" valor={resultado.cuadre.totalHojaCharge === null ? '—' : pesos(resultado.cuadre.totalHojaCharge)} />
              <Indicador label="Calculadora" valor={`${resultado.cuadre.contratos - resultado.cuadre.dossiersSinCalculadora.length} / ${resultado.cuadre.contratos}`} sub="Dossier con cálculo" />
            </div>
            <ul className="space-y-1.5">
              {resultado.cuadre.chequeos.map(c => (
                <li key={c.texto} className="flex items-center gap-2 text-sm">
                  {c.ok ? <Icon.Check width={15} height={15} className="text-emerald-600" /> : <Icon.Alert width={15} height={15} className="text-kia-red" />}
                  <span className={c.ok ? 'text-kia-black/80' : 'text-kia-red font-semibold'}>{c.texto}</span>
                </li>
              ))}
            </ul>
          </Card>
          {aceptacion && <Aceptacion a={aceptacion} />}
          <div className="flex justify-end"><Button variant="danger" onClick={() => irA(3)}>Validar pago <Icon.Arrow width={16} height={16} /></Button></div>
        </>
      )}
    </div>
  )
}
