import { Fragment, useMemo, useState } from 'react'
import { Card, SectionTitle } from '../../margen-variable/ui/base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { Indicador, Buscador } from '../../margen-variable/ui/componentes.jsx'
import { pesos2 } from '../../margen-variable/ui/formato.js'
import { ESTATUS_PAGO_UI, EstatusPago, Observacion, SinDatosFidelity } from './componentesFidelity.jsx'

const FILTROS = [['todos', 'Todos'], ['PROCEDE', 'Procede'], ['AJUSTE', 'Ajuste'], ['RETENIDO', 'Retenido']]

function Detalle({ c }) {
  const filas = [
    ['Plazo / tasa real', `${c.plazo} meses · ${c.tasa}%`],
    ['Beneficio catálogo', c.beneficioCatalogo === null ? '—' : `${c.beneficioCatalogo.toFixed(1)} puntos`],
    ['Monto financiado', pesos2(c.monto)],
    ['Intereses real · reclamo / recálculo', `${c.realReclamado === null ? '—' : pesos2(c.realReclamado)} / ${c.interesRealRecalculado === null ? '—' : pesos2(c.interesRealRecalculado)}`],
    ['Intereses teórico · reclamo / recálculo', `${c.teoricoReclamado === null ? '—' : pesos2(c.teoricoReclamado)} / ${c.interesTeoricoRecalculado === null ? '—' : pesos2(c.interesTeoricoRecalculado)}`],
    ['Seguro', `${c.tipoSeguro || '—'}${c.modalidad ? ` · ${c.modalidad}` : ''}`]
  ]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5 px-5 py-4 bg-slate-50/70">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        {filas.map(([k, v]) => <Fragment key={k}><dt className="text-kia-gray">{k}</dt><dd className="tabular text-kia-black">{v}</dd></Fragment>)}
      </dl>
      <div className="space-y-2">
        {c.observaciones.length ? c.observaciones.map((o, i) => <Observacion key={i} o={o} />) : <div className="text-xs text-emerald-700">Sin observaciones: el Charge recalculado coincide al centavo.</div>}
      </div>
    </div>
  )
}

export default function PasoPago({ resultado, irA }) {
  const [filtro, setFiltro] = useState('todos')
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)
  const filas = useMemo(() => {
    if (!resultado) return []
    const t = q.trim().toUpperCase()
    return resultado.contratos.filter(c => (filtro === 'todos' || c.estatusPago === filtro) && (!t || c.dossier.includes(t) || c.vin.includes(t) || c.dealer.toUpperCase().includes(t)))
  }, [resultado, filtro, q])
  if (!resultado) return <SinDatosFidelity irACarga={() => irA(2)} />
  const { pago } = resultado.resumen

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 2 · Parte A" title="Pago a la financiera"
        desc="Se paga lo reclamado cuando cuadra al centavo; el Charge recalculado cuando hay error de tasa o amortización; y se retiene lo que requiere corrección de la financiera." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><Indicador label="Reclamado" valor={pesos2(pago.reclamado)} sub={`${pago.contratos} contratos`} /></Card>
        <Card className="p-4"><Indicador label="Ajustes" valor={pesos2(pago.ajustes)} sub={`${pago.ajustados} recalculados`} tono={pago.ajustes ? 'red' : 'ink'} /></Card>
        <Card className="p-4"><Indicador label="Retenido por aclarar" valor={pesos2(pago.retenido)} sub={`${pago.retenidos} contratos`} /></Card>
        <Card className="p-4 border-kia-black/20"><Indicador label="A pagar" valor={pesos2(pago.aPagar)} sub={`${pago.procede} proceden tal cual`} tono="red" /></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-kia-line">
          <div className="flex gap-1" role="tablist" aria-label="Filtrar por estatus">
            {FILTROS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${filtro === id ? 'bg-kia-black text-white' : 'text-kia-gray hover:bg-slate-100'}`}>
                {label} <span className="opacity-60 tabular">{id === 'todos' ? pago.contratos : resultado.contratos.filter(c => c.estatusPago === id).length}</span>
              </button>
            ))}
          </div>
          <Buscador valor={q} onChange={setQ} placeholder="Dossier, VIN o dealer" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray bg-slate-50 border-b border-kia-line">
            <th className="py-2.5 pl-4 pr-2 font-semibold">Dossier · VIN</th><th className="py-2.5 px-2 font-semibold">Dealer · versión</th>
            <th className="py-2.5 px-2 font-semibold text-right">Reclamado</th><th className="py-2.5 px-2 font-semibold text-right">Recalculado</th>
            <th className="py-2.5 px-2 font-semibold text-right">A pagar</th><th className="py-2.5 px-2 font-semibold">Estatus</th><th className="py-2.5 pl-2 pr-4 font-semibold">Observación principal</th>
          </tr></thead>
          <tbody>
            {filas.map(c => (
              <Fragment key={`${c.dossier}-${c.fila}`}>
                <tr onClick={() => setAbierto(abierto === c.fila ? null : c.fila)} aria-expanded={abierto === c.fila}
                  className="border-b border-kia-line/60 hover:bg-slate-50 cursor-pointer align-top">
                  <td className="py-2.5 pl-4 pr-2">
                    <div className="flex items-center gap-2">
                      <Icon.Chevron width={13} height={13} className={`text-kia-gray transition-transform ${abierto === c.fila ? 'rotate-90' : ''}`} />
                      <div><div className="font-mono text-xs font-semibold">{c.dossier}</div><div className="font-mono text-[11px] text-kia-gray">{c.vin || '(sin VIN)'}</div></div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2"><div className="text-sm">{c.dealer}</div><div className="text-[11px] text-kia-gray">{c.version}</div></td>
                  <td className="py-2.5 px-2 text-right tabular">{pesos2(c.chargeReclamado)}</td>
                  <td className={`py-2.5 px-2 text-right tabular ${c.chargeRecalculado !== null && Math.abs(c.chargeRecalculado - c.chargeReclamado) > 0.01 ? 'text-kia-red font-semibold' : 'text-kia-gray'}`}>{c.chargeRecalculado === null ? '—' : pesos2(c.chargeRecalculado)}</td>
                  <td className="py-2.5 px-2 text-right tabular font-semibold">{pesos2(c.montoPagar)}</td>
                  <td className="py-2.5 px-2"><EstatusPago estatus={c.estatusPago} /></td>
                  <td className="py-2.5 pl-2 pr-4 text-xs text-kia-gray max-w-[320px]">{c.observaciones.find(o => o.efecto !== 'informa')?.texto ?? (c.observaciones[0]?.texto || '—')}</td>
                </tr>
                {abierto === c.fila && <tr><td colSpan={7} className="p-0 border-b border-kia-line"><Detalle c={c} /></td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-kia-line text-xs text-kia-gray flex gap-4">
          {Object.entries(ESTATUS_PAGO_UI).map(([k, v]) => <span key={k}><b className="text-kia-black">{v.label}:</b> {k === 'PROCEDE' ? 'se paga lo reclamado' : k === 'AJUSTE' ? 'se paga el Charge recalculado' : 'no se paga hasta la corrección'}</span>)}
        </div>
      </Card>
    </div>
  )
}
