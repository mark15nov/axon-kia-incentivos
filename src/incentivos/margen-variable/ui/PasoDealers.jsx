import { Fragment, useMemo, useState } from 'react'
import { Card, SectionTitle } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { REGLA } from '../motor/calculo.js'
import { SinDatos, ReglaPill, Cumple, BarraUmbral, Buscador, usePaginacion, Paginador, Indicador } from './componentes.jsx'
import { pesos, pct, entero } from './formato.js'

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: REGLA.A, label: 'Regla A' },
  { id: REGLA.B, label: 'Regla B' },
  { id: REGLA.NO_CUMPLE, label: 'No cumple' }
]

function Modelos({ dealer, p }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 px-4 py-3 bg-slate-50">
      {dealer.modelos.filter(m => m.mouRetail > 0 || m.ventasRetail > 0).map(m => (
        <div key={m.familia} className="rounded bg-white border border-kia-line px-3 py-2">
          <div className="text-xs font-bold">{m.familia}</div>
          <div className="text-[11px] text-kia-gray tabular">{m.ventasRetail} / {m.mouRetail} MOU</div>
          <Cumple ok={m.cumple}>{pct(m.pct)}</Cumple>
        </div>
      ))}
      <div className="col-span-full text-[11px] text-kia-gray">
        Regla B aplica a un modelo cuando retail &lt; {pct(p.umbralRetail, 0)}, WHS cumple y el modelo supera {pct(p.umbralModelo, 0)}.
      </div>
    </div>
  )
}

export default function PasoDealers({ resultado, parametros: p, irA }) {
  const [filtro, setFiltro] = useState('todos')
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)

  const filas = useMemo(() => {
    if (!resultado) return []
    const t = q.trim().toLowerCase()
    return resultado.dealers
      .filter(d => filtro === 'todos' || d.reglaDealer === filtro)
      .filter(d => !t || d.dealer.toLowerCase().includes(t) || d.razonSocial.toLowerCase().includes(t) || d.grupo.toLowerCase().includes(t))
  }, [resultado, filtro, q])
  const pag = usePaginacion(filas, 40)

  if (!resultado) return <SinDatos irACarga={() => irA(2)} />
  const cuenta = (r) => resultado.dealers.filter(d => d.reglaDealer === r).length

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 2 · Paso 2" title="Cumplimiento por dealer"
        desc="Ventas por Sold Dealer Name (SSI) contra el MOU del mes. Retail = inventario nuevo; total = retail + demo + flota." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><Indicador label="Regla A" valor={cuenta(REGLA.A)} sub="retail ≥ 100% con WHS/MOS" tono="green" /></Card>
        <Card className="p-4"><Indicador label="Regla B" valor={cuenta(REGLA.B)} sub="al menos un modelo cumple" /></Card>
        <Card className="p-4"><Indicador label="Elegibles a bono" valor={resultado.dealers.filter(d => d.bonoElegible).length} sub={`ventas ${p.baseBono === 'retail' ? 'retail' : 'totales'} sobre ${pct(p.umbralBono, 0)}`} /></Card>
        <Card className="p-4"><Indicador label="No cumplen" valor={cuenta(REGLA.NO_CUMPLE)} tono="red" /></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-kia-line">
          <div className="flex gap-1.5" role="tablist" aria-label="Filtrar por regla">
            {FILTROS.map(x => (
              <button key={x.id} role="tab" aria-selected={filtro === x.id} onClick={() => setFiltro(x.id)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${filtro === x.id ? 'bg-kia-black text-white' : 'text-kia-gray hover:bg-slate-100'}`}>{x.label}</button>
            ))}
          </div>
          <Buscador valor={q} onChange={setQ} placeholder="Dealer, razón social o grupo" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray bg-slate-50 border-b border-kia-line">
              <th className="py-2.5 pl-4 pr-2 font-semibold">Dealer</th>
              <th className="py-2.5 px-2 font-semibold text-right">MOU R</th>
              <th className="py-2.5 px-2 font-semibold text-right">Vtas R</th>
              <th className="py-2.5 px-2 font-semibold">% retail</th>
              <th className="py-2.5 px-2 font-semibold text-right">% total</th>
              <th className="py-2.5 px-2 font-semibold text-right">WHS</th>
              <th className="py-2.5 px-2 font-semibold text-right">MOS</th>
              <th className="py-2.5 px-2 font-semibold">Regla</th>
              <th className="py-2.5 px-2 font-semibold text-right">Pagadas</th>
              <th className="py-2.5 pl-2 pr-4 font-semibold text-right">Monto</th>
            </tr></thead>
            <tbody>
              {pag.visibles.map(d => (
                <Fragment key={d.dealer}>
                  <tr onClick={() => setAbierto(abierto === d.dealer ? null : d.dealer)}
                    className="border-b border-kia-line/60 hover:bg-slate-50 cursor-pointer" aria-expanded={abierto === d.dealer}>
                    <td className="py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-2">
                        <Icon.Chevron width={13} height={13} className={`text-kia-gray transition-transform ${abierto === d.dealer ? 'rotate-90' : ''}`} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{d.dealer}</div>
                          <div className="text-[11px] text-kia-gray truncate">{d.razonSocial || 'Sin catálogo'} · {d.dsm}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right tabular">{entero(d.mouRetail)}</td>
                    <td className="py-2.5 px-2 text-right tabular">{entero(d.ventasRetail)}</td>
                    <td className="py-2.5 px-2"><span className="flex items-center gap-2"><BarraUmbral valor={d.pctRetail} umbral={p.umbralRetail} /><span className="tabular text-xs w-12">{pct(d.pctRetail)}</span></span></td>
                    <td className={`py-2.5 px-2 text-right tabular ${d.superaBono ? 'font-bold text-kia-black' : 'text-kia-gray'}`}>{pct(d.pctTotal)}</td>
                    <td className="py-2.5 px-2 text-right"><Cumple ok={d.cumpleWhs}>{pct(d.ws)}</Cumple></td>
                    <td className="py-2.5 px-2 text-right"><Cumple ok={d.cumpleMos}>{d.mos ?? '—'}</Cumple></td>
                    <td className="py-2.5 px-2"><ReglaPill regla={d.reglaDealer} /></td>
                    <td className="py-2.5 px-2 text-right tabular text-xs">{entero(d.unidadesPagadas)} / {entero(d.unidadesProvision)}</td>
                    <td className="py-2.5 pl-2 pr-4 text-right tabular font-semibold">{pesos(d.monto)}</td>
                  </tr>
                  {abierto === d.dealer && <tr><td colSpan={10} className="p-0 border-b border-kia-line"><Modelos dealer={d} p={p} /></td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-kia-line"><Paginador p={pag} n={filas.length} /></div>
      </Card>
    </div>
  )
}
