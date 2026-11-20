// Componentes compartidos del flujo de Margen Variable.
import { useState } from 'react'
import { Card, Pill, Button } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { REGLA, REGLA_LABEL } from '../motor/calculo.js'

export const REGLA_TONO = Object.freeze({
  [REGLA.A]: 'green', [REGLA.A_BONO]: 'ink', [REGLA.B]: 'blue', [REGLA.B_BONO]: 'ink', [REGLA.NO_CUMPLE]: 'red',
  [REGLA.EXCLUIDO]: 'amber', [REGLA.SIN_PROVISION]: 'gray', [REGLA.SIN_DEALER]: 'amber'
})

export function ReglaPill({ regla }) {
  return <Pill tone={REGLA_TONO[regla] ?? 'gray'}>{REGLA_LABEL[regla] ?? regla}</Pill>
}

/** Indicador grande: el número es lo protagonista. */
export function Indicador({ label, valor, sub, tono = 'ink', grande = false }) {
  const color = { ink: 'text-kia-black', red: 'text-kia-red', green: 'text-emerald-600', gray: 'text-kia-gray' }[tono]
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kia-gray">{label}</div>
      <div className={`tabular font-bold leading-tight mt-1 ${grande ? 'text-3xl' : 'text-xl'} ${color}`}>{valor}</div>
      {sub && <div className="text-xs text-kia-gray mt-0.5">{sub}</div>}
    </div>
  )
}

/** Semáforo de cumplimiento contra un umbral. */
export function Cumple({ ok, children }) {
  return (
    <span className={`inline-flex items-center gap-1 tabular text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-kia-red'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-kia-red'}`} />
      {children}
    </span>
  )
}

/** Barra horizontal de avance vs umbral (marca vertical en el umbral). */
export function BarraUmbral({ valor, umbral, max = 1.5 }) {
  const w = Math.min(100, (valor / max) * 100)
  const u = Math.min(100, (umbral / max) * 100)
  return (
    <div className="relative h-1.5 w-24 rounded-full bg-slate-100" aria-hidden="true">
      <div className={`h-full rounded-full ${valor >= umbral ? 'bg-emerald-500' : 'bg-kia-red/70'}`} style={{ width: `${w}%` }} />
      <span className="absolute -top-1 h-3.5 w-px bg-kia-black/40" style={{ left: `${u}%` }} />
    </div>
  )
}

/** Mensaje cuando aún no hay archivos cargados. */
export function SinDatos({ irACarga }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-md bg-slate-100 text-kia-gray grid place-items-center mb-3"><Icon.Upload width={26} height={26} /></div>
      <h3 className="font-bold text-lg">Aún no hay archivos del mes</h3>
      <p className="text-sm text-kia-gray mt-1 max-w-md mx-auto">Carga el Layout de Ventas y el Layout MV para calcular el incentivo.</p>
      <div className="mt-5 flex justify-center"><Button variant="danger" onClick={irACarga}><Icon.Upload width={16} height={16} /> Ir a carga mensual</Button></div>
    </Card>
  )
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const mesDe = (p) => `${MESES[Number(p.slice(4)) - 1]} ${p.slice(0, 4)}`

/**
 * Aviso destacado cuando ningún VIN vendido trae provisión (el pago sale en $0).
 * Caso típico: la provisión es de otro mes que las ventas.
 */
export function AvisoSinCruce({ resultado, provision }) {
  if (!resultado || resultado.resumen.unidadesConProvision > 0 || !provision?.length) return null
  const periodos = [...new Set(provision.map(p => p.periodo).filter(Boolean))].sort()
  return (
    <Card className="p-5 border-l-4 border-l-kia-red">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 rounded-md bg-red-50 text-kia-red grid place-items-center"><Icon.Alert width={20} height={20} /></span>
        <div className="text-sm">
          <h3 className="font-bold text-base">El pago sale en $0: ningún VIN vendido tiene provisión</h3>
          <p className="text-kia-gray mt-1 leading-relaxed">
            Las ventas son de <b className="text-kia-black">{mesDe(resultado.periodo)}</b> ({resultado.resumen.unidadesVendidas.toLocaleString('es-MX')} VIN) y la provisión
            {periodos.length ? <> es del periodo <b className="text-kia-black">{periodos.map(mesDe).join(', ')}</b></> : ' no trae periodo'} ({provision.length.toLocaleString('es-MX')} VIN).
            No hay ningún VIN en común, así que no hay unidades que pagar.
          </p>
          <p className="text-kia-black mt-2 font-semibold">
            Sube un Layout MV cuya hoja LY_PROVISION_VIN traiga la provisión de los VIN vendidos en {mesDe(resultado.periodo)}
            {periodos.length && !periodos.includes(resultado.periodo) ? ', y MOS / WHS de ese mismo mes' : ''}.
          </p>
        </div>
      </div>
    </Card>
  )
}

/** Paginación simple para tablas grandes. */
export function usePaginacion(filas, porPagina = 50) {
  const [pagina, setPagina] = useState(0)
  const total = Math.max(1, Math.ceil(filas.length / porPagina))
  const actual = Math.min(pagina, total - 1)
  return {
    visibles: filas.slice(actual * porPagina, (actual + 1) * porPagina),
    pagina: actual, total, setPagina, desde: filas.length ? actual * porPagina + 1 : 0, hasta: Math.min(filas.length, (actual + 1) * porPagina)
  }
}

export function Paginador({ p, n }) {
  if (p.total <= 1) return <div className="text-xs text-kia-gray">{n.toLocaleString('es-MX')} registros</div>
  return (
    <div className="flex items-center justify-between text-xs text-kia-gray">
      <span>{p.desde.toLocaleString('es-MX')}–{p.hasta.toLocaleString('es-MX')} de {n.toLocaleString('es-MX')}</span>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" className="px-2.5 py-1.5 text-xs" disabled={p.pagina === 0} onClick={() => p.setPagina(p.pagina - 1)}>←</Button>
        <span className="tabular px-1">{p.pagina + 1} / {p.total}</span>
        <Button variant="ghost" className="px-2.5 py-1.5 text-xs" disabled={p.pagina >= p.total - 1} onClick={() => p.setPagina(p.pagina + 1)}>→</Button>
      </div>
    </div>
  )
}

/** Campo de búsqueda. */
export function Buscador({ valor, onChange, placeholder }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Icon.Search width={15} height={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-kia-gray" />
      <input value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-64 rounded-md border border-kia-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-kia-black focus:ring-2 focus:ring-kia-black/10" />
    </label>
  )
}

/** Descarga un ArrayBuffer como archivo. */
export function descargar(buffer, nombre) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
