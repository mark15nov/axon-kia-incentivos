import { useMemo, useState } from 'react'
import { Card, SectionTitle } from './base.jsx'
import { REGLA, REGLA_LABEL } from '../motor/calculo.js'
import { USO, USO_LABEL } from '../motor/parametros.js'
import { SinDatos, ReglaPill, Buscador, usePaginacion, Paginador, REGLA_TONO } from './componentes.jsx'
import { pesos2, entero } from './formato.js'

const ORDEN_REGLAS = [REGLA.A_BONO, REGLA.A, REGLA.B_BONO, REGLA.B, REGLA.NO_CUMPLE, REGLA.EXCLUIDO, REGLA.SIN_DEALER, REGLA.SIN_PROVISION]
const PUNTO = { green: 'bg-emerald-500', ink: 'bg-kia-black', blue: 'bg-sky-600', red: 'bg-kia-red', amber: 'bg-amber-400', gray: 'bg-slate-400' }

export default function PasoVins({ resultado, irA }) {
  const [reglas, setReglas] = useState(new Set(ORDEN_REGLAS.filter(r => r !== REGLA.SIN_PROVISION)))
  const [uso, setUso] = useState('todos')
  const [q, setQ] = useState('')

  const filas = useMemo(() => {
    if (!resultado) return []
    const t = q.trim().toUpperCase()
    return resultado.vins
      .filter(v => reglas.has(v.regla))
      .filter(v => uso === 'todos' || v.uso === uso)
      .filter(v => !t || v.vin.includes(t) || v.dealer.toUpperCase().includes(t) || v.familia.includes(t))
  }, [resultado, reglas, uso, q])
  const pag = usePaginacion(filas, 50)

  if (!resultado) return <SinDatos irACarga={() => irA(2)} />
  const conteo = Object.fromEntries(ORDEN_REGLAS.map(r => [r, resultado.resumen.porRegla[r]?.unidades ?? 0]))
  const alternar = (r) => setReglas(s => {
    const n = new Set(s)
    if (n.has(r)) n.delete(r)
    else n.add(r)
    return n
  })

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 2 · Paso 3" title="Detalle por VIN"
        desc="Cada unidad vendida con la regla aplicada, el factor sobre la provisión y el motivo. Es la misma tabla que la hoja CALCULO del Excel." />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por regla">
        {ORDEN_REGLAS.map(r => {
          const on = reglas.has(r)
          return (
            <button key={r} onClick={() => alternar(r)} aria-pressed={on}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${on ? 'bg-white border-kia-black shadow-sm' : 'bg-transparent border-kia-line text-kia-gray hover:border-slate-400'}`}>
              <span className={`h-2 w-2 rounded-full ${PUNTO[REGLA_TONO[r]]}`} />
              <span className="font-semibold">{REGLA_LABEL[r]}</span>
              <span className="tabular text-xs text-kia-gray">{entero(conteo[r])}</span>
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-kia-line">
          <div className="flex gap-1.5" role="tablist" aria-label="Filtrar por uso">
            {['todos', USO.RETAIL, USO.DEMO, USO.FLOTA].map(u => (
              <button key={u} role="tab" aria-selected={uso === u} onClick={() => setUso(u)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${uso === u ? 'bg-kia-black text-white' : 'text-kia-gray hover:bg-slate-100'}`}>
                {u === 'todos' ? 'Todos los usos' : USO_LABEL[u]}
              </button>
            ))}
          </div>
          <Buscador valor={q} onChange={setQ} placeholder="VIN, dealer o modelo" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray bg-slate-50 border-b border-kia-line">
              <th className="py-2.5 pl-4 pr-2 font-semibold">VIN</th>
              <th className="py-2.5 px-2 font-semibold">Dealer</th>
              <th className="py-2.5 px-2 font-semibold">Modelo</th>
              <th className="py-2.5 px-2 font-semibold">Uso</th>
              <th className="py-2.5 px-2 font-semibold text-right">Provisión</th>
              <th className="py-2.5 px-2 font-semibold">Regla</th>
              <th className="py-2.5 px-2 font-semibold text-right">Monto</th>
              <th className="py-2.5 pl-2 pr-4 font-semibold">Motivo</th>
            </tr></thead>
            <tbody>
              {pag.visibles.map(v => (
                <tr key={`${v.vin}-${v.fila}`} className="border-b border-kia-line/60 last:border-0 align-top">
                  <td className="py-2 pl-4 pr-2 font-mono text-xs">{v.vin}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{v.dealer}</td>
                  <td className="py-2 px-2"><div className="font-semibold text-xs">{v.familia}</div><div className="text-[11px] text-kia-gray truncate max-w-[180px]">{v.lsc}</div></td>
                  <td className="py-2 px-2 text-xs whitespace-nowrap">{USO_LABEL[v.uso]}</td>
                  <td className="py-2 px-2 text-right tabular text-xs">{v.provision ? pesos2(v.provision) : '—'}</td>
                  <td className="py-2 px-2"><ReglaPill regla={v.regla} /></td>
                  <td className={`py-2 px-2 text-right tabular font-semibold ${v.monto > 0 ? '' : 'text-kia-gray'}`}>{pesos2(v.monto)}</td>
                  <td className="py-2 pl-2 pr-4 text-xs text-kia-gray min-w-[260px]">{v.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-kia-line"><Paginador p={pag} n={filas.length} /></div>
      </Card>
    </div>
  )
}
