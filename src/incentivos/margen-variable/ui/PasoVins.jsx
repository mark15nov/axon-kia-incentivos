import { useCallback, useMemo, useState } from 'react'
import { Card, SectionTitle } from './base.jsx'
import { REGLA, REGLA_LABEL } from '../motor/calculo.js'
import { USO, USO_LABEL } from '../motor/parametros.js'
import { SinDatos, ReglaPill, Buscador, usePaginacion, Paginador, REGLA_TONO } from './componentes.jsx'
import ResumenVins from './ResumenVins.jsx'
import { pesos2, entero, pct } from './formato.js'

const ORDEN_REGLAS = [REGLA.A_BONO, REGLA.A, REGLA.B_BONO, REGLA.B, REGLA.NO_CUMPLE, REGLA.EXCLUIDO, REGLA.SIN_DEALER, REGLA.SIN_PROVISION]
const PUNTO = { green: 'bg-emerald-500', ink: 'bg-kia-black', blue: 'bg-sky-600', red: 'bg-kia-red', amber: 'bg-amber-400', gray: 'bg-slate-400' }

// Tramos de cumplimiento retail del dealer (correlación con la regla aplicada).
const TRAMOS = [
  { id: 't1', label: 'Retail < 90%', hasta: 0.9 },
  { id: 't2', label: 'Retail 90–100%', hasta: 1 },
  { id: 't3', label: 'Retail 100–110%', hasta: 1.1 },
  { id: 't4', label: 'Retail ≥ 110%', hasta: Infinity }
]
const tramoDe = (x) => TRAMOS.find(t => x < t.hasta - 1e-9)?.id ?? 't4'

const FILTROS = [
  { id: 'familia', label: 'Modelo' },
  { id: 'version', label: 'Versión' },
  { id: 'dealer', label: 'Dealer' },
  { id: 'razonSocial', label: 'Razón social' },
  { id: 'dsm', label: 'DSM' },
  { id: 'tramo', label: 'Cumplimiento retail' }
]
const VACIOS = Object.freeze({ familia: '', version: '', dealer: '', razonSocial: '', dsm: '', tramo: '', uso: '' })

function Selector({ f, valor, opciones, onChange, etiqueta }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-kia-gray">{f.label}</span>
      <select value={valor} onChange={e => onChange(e.target.value)}
        className={`w-full rounded border px-2.5 py-1.5 text-sm outline-none focus:border-kia-black/40 ${valor ? 'border-kia-black/40 bg-sky-50/60 font-semibold' : 'border-kia-line bg-white'}`}>
        <option value="">Todos</option>
        {opciones.map(([k, n]) => <option key={k} value={k}>{etiqueta(f.id, k)} ({entero(n)})</option>)}
      </select>
    </label>
  )
}

export default function PasoVins({ resultado, irA }) {
  const [reglas, setReglas] = useState(new Set(ORDEN_REGLAS.filter(r => r !== REGLA.SIN_PROVISION)))
  const [filtros, setFiltros] = useState(VACIOS)
  const [q, setQ] = useState('')

  // VIN enriquecidos con DSM (del dealer) y tramo de cumplimiento retail.
  const base = useMemo(() => {
    if (!resultado) return []
    const dsmPor = new Map(resultado.dealers.map(d => [d.dealer, d.dsm]))
    return resultado.vins.map(v => ({ ...v, dsm: dsmPor.get(v.dealer) || '', tramo: tramoDe(v.pctRetail) }))
  }, [resultado])

  const pasa = useCallback((v, excepto) => {
    if (!reglas.has(v.regla)) return false
    for (const [k, val] of Object.entries(filtros)) if (k !== excepto && val && v[k] !== val) return false
    if (q) {
      const t = q.trim().toUpperCase()
      if (t && !v.vin.includes(t) && !v.dealer.toUpperCase().includes(t) && !v.familia.includes(t) && !v.lsc.toUpperCase().includes(t)) return false
    }
    return true
  }, [reglas, filtros, q])

  const filas = useMemo(() => base.filter(v => pasa(v)), [base, pasa])
  // Opciones de cada filtro según los demás filtros activos (correlación en cascada).
  const opciones = useMemo(() => Object.fromEntries(FILTROS.map(f => {
    const c = new Map()
    for (const v of base) if (pasa(v, f.id) && v[f.id]) c.set(v[f.id], (c.get(v[f.id]) ?? 0) + 1)
    const lista = [...c]
    return [f.id, f.id === 'tramo' ? lista.sort((a, b) => a[0].localeCompare(b[0])) : lista.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))]
  })), [base, pasa])
  const pag = usePaginacion(filas, 50)

  const etiqueta = useCallback((dim, k) => (dim === 'uso' ? USO_LABEL[k] ?? k : dim === 'tramo' ? TRAMOS.find(t => t.id === k)?.label ?? k : k), [])
  const filtrar = useCallback((dim, valor) => setFiltros(f => ({ ...f, [dim]: valor, ...(dim === 'familia' ? { version: '' } : {}) })), [])

  if (!resultado) return <SinDatos irACarga={() => irA(2)} />
  const conteo = Object.fromEntries(ORDEN_REGLAS.map(r => [r, resultado.resumen.porRegla[r]?.unidades ?? 0]))
  const alternar = (r) => setReglas(s => {
    const n = new Set(s)
    if (n.has(r)) n.delete(r)
    else n.add(r)
    return n
  })
  const activos = Object.entries(filtros).filter(([, v]) => v)
  const monto = filas.reduce((a, v) => a + v.monto, 0)
  const provision = filas.reduce((a, v) => a + v.provision, 0)

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

      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {FILTROS.map(f => <Selector key={f.id} f={f} valor={filtros[f.id]} opciones={opciones[f.id]} onChange={v => filtrar(f.id, v)} etiqueta={etiqueta} />)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-kia-line">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {activos.length === 0 ? <span className="text-kia-gray">Sin filtros adicionales.</span> : activos.map(([k, v]) => (
              <button key={k} onClick={() => filtrar(k, '')} className="inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-2 py-0.5 font-semibold text-sky-800 hover:border-sky-400">
                {k === 'uso' ? 'Uso' : FILTROS.find(f => f.id === k)?.label}: {etiqueta(k, v)} <span aria-hidden="true">✕</span>
              </button>
            ))}
            {activos.length > 0 && <button onClick={() => setFiltros(VACIOS)} className="ml-1 font-semibold text-kia-gray hover:text-kia-black">Limpiar filtros</button>}
          </div>
          <div className="text-xs text-kia-gray tabular">
            <b className="text-kia-black">{entero(filas.length)}</b> unidades · provisión <b className="text-kia-black">{pesos2(provision)}</b> · monto <b className="text-kia-black">{pesos2(monto)}</b>{provision ? ` (${pct(monto / provision, 0)})` : ''}
          </div>
        </div>
      </Card>

      <ResumenVins filas={filas} filtros={filtros} onFiltrar={filtrar} etiqueta={etiqueta} />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-kia-line">
          <div className="flex gap-1.5" role="tablist" aria-label="Filtrar por uso">
            {['', USO.RETAIL, USO.DEMO, USO.FLOTA].map(u => (
              <button key={u || 'todos'} role="tab" aria-selected={filtros.uso === u} onClick={() => filtrar('uso', u)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${filtros.uso === u ? 'bg-kia-black text-white' : 'text-kia-gray hover:bg-slate-100'}`}>
                {u ? USO_LABEL[u] : 'Todos los usos'}
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
              <th className="py-2.5 px-2 font-semibold text-right whitespace-nowrap">Retail dealer</th>
              <th className="py-2.5 px-2 font-semibold text-right">Provisión</th>
              <th className="py-2.5 px-2 font-semibold">Regla</th>
              <th className="py-2.5 px-2 font-semibold text-right">Monto</th>
              <th className="py-2.5 pl-2 pr-4 font-semibold">Motivo</th>
            </tr></thead>
            <tbody>
              {pag.visibles.map(v => (
                <tr key={`${v.vin}-${v.fila}`} className="border-b border-kia-line/60 last:border-0 align-top">
                  <td className="py-2 pl-4 pr-2 font-mono text-xs">{v.vin}</td>
                  <td className="py-2 px-2 whitespace-nowrap"><div>{v.dealer}</div><div className="text-[11px] text-kia-gray">{v.dsm}</div></td>
                  <td className="py-2 px-2"><div className="font-semibold text-xs">{v.familia}</div><div className="text-[11px] text-kia-gray truncate max-w-[180px]">{v.lsc}</div></td>
                  <td className="py-2 px-2 text-xs whitespace-nowrap">{USO_LABEL[v.uso]}</td>
                  <td className="py-2 px-2 text-right tabular text-xs">{pct(v.pctRetail)}</td>
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
