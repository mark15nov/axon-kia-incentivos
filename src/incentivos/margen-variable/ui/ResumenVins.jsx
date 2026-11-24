// Tabla resumen del detalle por VIN: agrupa las unidades filtradas por una
// dimensión (modelo, dealer, razón social, DSM, uso o cumplimiento retail)
// contra la regla aplicada. Clic en un renglón = filtrar por ese valor.
import { useMemo, useState } from 'react'
import { Card } from './base.jsx'
import { REGLA } from '../motor/calculo.js'
import { pesos, entero, pct } from './formato.js'

export const DIMENSIONES = Object.freeze([
  { id: 'familia', label: 'Modelo' },
  { id: 'version', label: 'Versión' },
  { id: 'dealer', label: 'Dealer' },
  { id: 'razonSocial', label: 'Razón social' },
  { id: 'dsm', label: 'DSM' },
  { id: 'uso', label: 'Uso' },
  { id: 'tramo', label: 'Cumplimiento retail' }
])

const COLUMNAS = [
  { id: 'a', label: 'Regla A', reglas: [REGLA.A] },
  { id: 'abono', label: 'A + bono', reglas: [REGLA.A_BONO] },
  { id: 'b', label: 'Regla B', reglas: [REGLA.B, REGLA.B_BONO] },
  { id: 'no', label: 'No cumple', reglas: [REGLA.NO_CUMPLE] },
  { id: 'otros', label: 'Excl. / sin datos', reglas: [REGLA.EXCLUIDO, REGLA.SIN_DEALER] },
  { id: 'sinprov', label: 'Sin provisión', reglas: [REGLA.SIN_PROVISION] }
]
const LIMITE = 12

function agrupar(filas, dim, etiqueta) {
  const m = new Map()
  for (const v of filas) {
    const k = v[dim] || '(sin dato)'
    const g = m.get(k) ?? { clave: k, unidades: 0, provision: 0, monto: 0, ...Object.fromEntries(COLUMNAS.map(c => [c.id, 0])) }
    const colId = COLUMNAS.find(c => c.reglas.includes(v.regla))?.id
    m.set(k, { ...g, unidades: g.unidades + 1, provision: g.provision + v.provision, monto: g.monto + v.monto, [colId]: g[colId] + 1 })
  }
  return [...m.values()].map(g => ({ ...g, nombre: etiqueta(g.clave) })).sort((a, b) => b.monto - a.monto || b.unidades - a.unidades)
}

/**
 * @param {{ filas: object[], filtros: object, onFiltrar: (dim: string, valor: string) => void, etiqueta: (dim: string, valor: string) => string }} props
 */
export default function ResumenVins({ filas, filtros, onFiltrar, etiqueta }) {
  const [dim, setDim] = useState('familia')
  const [todos, setTodos] = useState(false)
  const grupos = useMemo(() => agrupar(filas, dim, (k) => etiqueta(dim, k)), [filas, dim, etiqueta])
  const visibles = todos ? grupos : grupos.slice(0, LIMITE)
  const total = grupos.reduce((a, g) => ({
    unidades: a.unidades + g.unidades, provision: a.provision + g.provision, monto: a.monto + g.monto,
    ...Object.fromEntries(COLUMNAS.map(c => [c.id, (a[c.id] ?? 0) + g[c.id]]))
  }), { unidades: 0, provision: 0, monto: 0 })
  const maxMonto = Math.max(1, ...grupos.map(g => g.monto))

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-kia-line">
        <div>
          <h3 className="font-semibold text-[15px]">Resumen</h3>
          <p className="text-xs text-kia-gray">Unidades por regla según los filtros activos. Clic en un renglón para filtrar el detalle.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border border-kia-line bg-slate-50 p-0.5" role="tablist" aria-label="Agrupar por">
          {DIMENSIONES.map(d => (
            <button key={d.id} role="tab" aria-selected={dim === d.id} onClick={() => { setDim(d.id); setTodos(false) }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${dim === d.id ? 'bg-kia-black text-white' : 'text-kia-gray hover:text-kia-black'}`}>{d.label}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-[11px] uppercase tracking-wider text-kia-gray bg-slate-50 border-b border-kia-line">
            <th className="py-2 pl-4 pr-2 font-semibold text-left">{DIMENSIONES.find(d => d.id === dim).label}</th>
            <th className="py-2 px-2 font-semibold text-right">Unidades</th>
            {COLUMNAS.map(c => <th key={c.id} className="py-2 px-2 font-semibold text-right whitespace-nowrap">{c.label}</th>)}
            <th className="py-2 px-2 font-semibold text-right">Provisión</th>
            <th className="py-2 px-2 font-semibold text-right">Monto</th>
            <th className="py-2 pl-2 pr-4 font-semibold text-left w-40">% pagado</th>
          </tr></thead>
          <tbody>
            {visibles.length === 0 && <tr><td colSpan={COLUMNAS.length + 5} className="py-6 text-center text-sm text-kia-gray">Sin unidades con estos filtros.</td></tr>}
            {visibles.map(g => {
              const activo = filtros[dim] === g.clave
              const tasa = g.provision ? g.monto / g.provision : 0
              return (
                <tr key={g.clave} onClick={() => onFiltrar(dim, activo ? '' : g.clave)} title={activo ? 'Quitar filtro' : `Filtrar por ${g.nombre}`}
                  className={`border-b border-kia-line/60 cursor-pointer transition-colors ${activo ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                  <td className="py-2 pl-4 pr-2 font-semibold">{g.nombre}</td>
                  <td className="py-2 px-2 text-right tabular">{entero(g.unidades)}</td>
                  {COLUMNAS.map(c => <td key={c.id} className={`py-2 px-2 text-right tabular ${g[c.id] ? '' : 'text-kia-line'}`}>{g[c.id] ? entero(g[c.id]) : '·'}</td>)}
                  <td className="py-2 px-2 text-right tabular text-kia-gray">{pesos(g.provision)}</td>
                  <td className="py-2 px-2 text-right tabular font-semibold">{pesos(g.monto)}</td>
                  <td className="py-2 pl-2 pr-4">
                    <span className="flex items-center gap-2">
                      <span className="relative h-1.5 w-20 rounded-full bg-slate-100" aria-hidden="true">
                        <span className="absolute inset-y-0 left-0 rounded-full bg-kia-black/70" style={{ width: `${(g.monto / maxMonto) * 100}%` }} />
                      </span>
                      <span className="tabular text-xs text-kia-gray">{g.provision ? pct(tasa, 0) : '—'}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot><tr className="bg-slate-50 font-semibold border-t border-kia-line">
            <td className="py-2 pl-4 pr-2">Total ({entero(grupos.length)})</td>
            <td className="py-2 px-2 text-right tabular">{entero(total.unidades)}</td>
            {COLUMNAS.map(c => <td key={c.id} className="py-2 px-2 text-right tabular">{entero(total[c.id] ?? 0)}</td>)}
            <td className="py-2 px-2 text-right tabular">{pesos(total.provision)}</td>
            <td className="py-2 px-2 text-right tabular">{pesos(total.monto)}</td>
            <td className="py-2 pl-2 pr-4 tabular text-xs">{total.provision ? pct(total.monto / total.provision, 0) : '—'}</td>
          </tr></tfoot>
        </table>
      </div>
      {grupos.length > LIMITE && (
        <div className="px-4 py-2.5 border-t border-kia-line">
          <button onClick={() => setTodos(!todos)} className="text-xs font-semibold text-kia-gray hover:text-kia-black">
            {todos ? 'Ver sólo los primeros 12' : `Ver los ${grupos.length} renglones`}
          </button>
        </div>
      )}
    </Card>
  )
}
