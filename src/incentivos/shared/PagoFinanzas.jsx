import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { vmVinResumen, VM_PERIODO, fmtMXN } from '../../data/variableMargin.js'

// Etapa de Finanzas y pago. Espeja S15–S19 del diagrama oficial (idéntico en
// Variable Margin y Cashback): descarga de datos de factura, posteo, generación
// del documento de pago, aprobación final y ejecución del pago. Componente
// compartido, parametrizado por nombre del incentivo y folio.
const PASOS_SAP = [
  { s: 'S15', titulo: 'Descargar datos de factura' },
  { s: 'S16', titulo: 'Posteo de factura del incentivo' },
  { s: 'S17', titulo: 'Carga documental y documento de pago' }
]

export default function PagoFinanzas({ nombre = 'el incentivo', folio = 'INC-JUN26-0428' }) {
  const [estado, setEstado] = useState('idle') // idle | procesando | porAprobar | pagado

  const r = vmVinResumen()

  const procesar = () => {
    if (estado === 'procesando') return
    setEstado('procesando')
    setTimeout(() => setEstado('porAprobar'), 1500)
  }
  const aprobar = () => setEstado('pagado')
  const reset = () => setEstado('idle')

  const procesado = estado === 'porAprobar' || estado === 'pagado'
  const pagado = estado === 'pagado'

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 3 · Paso 1"
        title="MONTHLY"
        desc="Finanzas descarga los datos de la factura, postea el incentivo y genera el documento de pago en SAP. Con la aprobación final, el pago se ejecuta y los registros se archivan."
        right={<Pill tone={pagado ? 'green' : procesado ? 'blue' : 'gray'}>
          {pagado ? <><Icon.Check width={14} height={14} /> Pago ejecutado</> : procesado ? <><Icon.Clock width={14} height={14} /> Por aprobar</> : 'Pendiente'}
        </Pill>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Monto a pagar" value={fmtMXN(r.pago)} sub={`${r.ok} VIN que califican`} accent />
        <Kpi label="VIN a pagar" value={String(r.ok)} sub={`de ${r.total} recibidos`} />
        <Kpi label="Monto facturado" value={fmtMXN(r.facturado)} sub={`${r.total} facturas`} />
        <Kpi label="Periodo" value={VM_PERIODO} sub="Proceso mensual" />
      </div>

      {/* Proceso en SAP (S15–S17) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Icon.Database width={17} height={17} /> Posteo y documento de pago en SAP</h3>
          <Pill tone={procesado ? 'green' : 'gray'}>{procesado ? `${PASOS_SAP.length}/${PASOS_SAP.length} listo` : `0/${PASOS_SAP.length}`}</Pill>
        </div>
        <div className="space-y-3">
          {PASOS_SAP.map((p, i) => {
            const done = procesado
            const running = estado === 'procesando'
            return (
              <div key={p.s} className="flex items-start gap-3 rounded-xl border border-kia-line px-4 py-3">
                <span className={`h-7 w-7 shrink-0 rounded-lg grid place-items-center text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-kia-gray'}`}>
                  {done ? <Icon.Check width={15} height={15} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{p.titulo}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-kia-gray px-1.5 py-0.5 rounded">{p.s}</span>
                  </div>
                </div>
                {done && <span className="text-xs font-semibold text-emerald-600 shrink-0">Completado</span>}
                {running && <span className="h-4 w-4 mt-1 shrink-0 rounded-full border-2 border-kia-red/25 border-t-kia-red animate-spin" />}
              </div>
            )
          })}
        </div>
        {estado === 'idle' && (
          <div className="mt-4 flex justify-end">
            <Button variant="danger" onClick={procesar}><Icon.Database width={16} height={16} /> Ejecutar posteo en SAP</Button>
          </div>
        )}
        {estado === 'procesando' && (
          <div className="mt-4 flex justify-end">
            <Button variant="danger" disabled><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Procesando en SAP…</Button>
          </div>
        )}
      </Card>

      {/* Aprobación final (S18) + ejecución (S19) */}
      {procesado && !pagado && (
        <Card className="p-5 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="h-11 w-11 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Check width={20} height={20} /></span>
              <div>
                <h3 className="font-bold">Aprobación final en SAP</h3>
                <p className="text-sm text-kia-gray mt-0.5 max-w-xl leading-snug">
                  El documento de pago por <strong className="text-kia-black">{fmtMXN(r.pago)}</strong> ({r.ok} VIN) está listo. Con la aprobación de <strong className="text-kia-black">Daniel Simon</strong> se ejecuta el pago de {nombre} del periodo {VM_PERIODO}.
                </p>
              </div>
            </div>
            <Button variant="danger" className="shrink-0 px-6 py-3 text-base" onClick={aprobar}>
              <Icon.Check width={18} height={18} /> Aprobar y ejecutar pago
            </Button>
          </div>
        </Card>
      )}

      {pagado && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 animate-fade-up">
          <div className="flex items-start gap-4">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-emerald-800">Pago del incentivo ejecutado</h3>
              <p className="text-sm text-emerald-900/80 mt-1 max-w-2xl leading-relaxed">
                El pago de {nombre} · {VM_PERIODO} se ejecutó por <strong>{fmtMXN(r.pago)}</strong> ({r.ok} VIN) y los registros quedaron archivados.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Pill tone="ink">Folio {folio}</Pill>
                <Pill tone="green"><Icon.Check width={13} height={13} /> Pago ejecutado</Pill>
                <Pill tone="gray">Aprobó Daniel Simon</Pill>
              </div>
            </div>
            <Button variant="ghost" className="shrink-0 ml-auto" onClick={reset}>
              <Icon.Refresh width={15} height={15} /> Reiniciar
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
