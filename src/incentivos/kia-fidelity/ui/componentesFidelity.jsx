import { Card, Pill, Button } from '../../margen-variable/ui/base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { MOTIVO_LABEL } from '../motor/debitosDealer.js'

export const ESTATUS_PAGO_UI = Object.freeze({
  PROCEDE: { label: 'Procede', tono: 'green' },
  AJUSTE: { label: 'Ajuste', tono: 'blue' },
  RETENIDO: { label: 'Retenido', tono: 'amber' }
})

export const ESTATUS_DEBITO_UI = Object.freeze({
  DEBITO: { label: 'Débito', tono: 'red' },
  POR_REVISAR: { label: 'Por revisar', tono: 'amber' },
  SIN_DEBITO: { label: 'Sin débito', tono: 'green' }
})

export const EstatusPago = ({ estatus }) => <Pill tone={ESTATUS_PAGO_UI[estatus].tono}>{ESTATUS_PAGO_UI[estatus].label}</Pill>
export const EstatusDebito = ({ estatus }) => <Pill tone={ESTATUS_DEBITO_UI[estatus].tono}>{ESTATUS_DEBITO_UI[estatus].label}</Pill>
export const Motivo = ({ codigo }) => <Pill tone="red">{MOTIVO_LABEL[codigo] ?? codigo}</Pill>

const EFECTO = {
  retiene: 'bg-amber-50 text-amber-800 border-amber-200',
  ajusta: 'bg-sky-50 text-sky-800 border-sky-200',
  informa: 'bg-slate-50 text-slate-600 border-slate-200'
}
const EFECTO_LABEL = { retiene: 'Retiene', ajusta: 'Ajusta', informa: 'Informa' }

export function Observacion({ o }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${EFECTO[o.efecto]}`}>{EFECTO_LABEL[o.efecto]}</span>
      <span className="text-kia-black/80 leading-relaxed">{o.texto}</span>
    </div>
  )
}

export function SinDatosFidelity({ irACarga }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-md bg-slate-100 text-kia-gray grid place-items-center mb-3"><Icon.Upload width={26} height={26} /></div>
      <h3 className="font-bold text-lg">Aún no hay reclamo cargado</h3>
      <p className="text-sm text-kia-gray mt-1 max-w-md mx-auto">Carga los archivos de la financiera, SAP, el catálogo de beneficio y el historial de VINs pagados.</p>
      <div className="mt-5 flex justify-center"><Button variant="danger" onClick={irACarga}><Icon.Upload width={16} height={16} /> Ir a carga del reclamo</Button></div>
    </Card>
  )
}
