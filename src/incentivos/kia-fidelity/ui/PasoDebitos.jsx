import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../../margen-variable/ui/base.jsx'
import { Indicador, Buscador } from '../../margen-variable/ui/componentes.jsx'
import { pesos2 } from '../../margen-variable/ui/formato.js'
import { EstatusDebito, Motivo, SinDatosFidelity } from './componentesFidelity.jsx'

const FILTROS = [['DEBITO', 'Con débito'], ['POR_REVISAR', 'Por revisar'], ['NOTAS', 'Procede con nota'], ['todos', 'Todos']]

export default function PasoDebitos({ resultado, irA }) {
  const [filtro, setFiltro] = useState('DEBITO')
  const [q, setQ] = useState('')
  const filas = useMemo(() => {
    if (!resultado) return []
    const t = q.trim().toUpperCase()
    const pasa = (c) => filtro === 'todos' || (filtro === 'NOTAS' ? c.estatusDebito === 'SIN_DEBITO' && c.notas.length > 0 : c.estatusDebito === filtro)
    return resultado.contratos.filter(c => pasa(c) && (!t || c.vin.includes(t) || c.dossier.includes(t) || c.razonSocial.toUpperCase().includes(t)))
  }, [resultado, filtro, q])
  if (!resultado) return <SinDatosFidelity irACarga={() => irA(2)} />
  const { debito } = resultado.resumen
  const conNota = resultado.contratos.filter(c => c.estatusDebito === 'SIN_DEBITO' && c.notas.length).length
  const cuenta = { DEBITO: debito.vins, POR_REVISAR: debito.porRevisar, NOTAS: conNota, todos: resultado.contratos.length }

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 2 · Parte B" title="Débitos al distribuidor"
        desc="Contratos que no cumplen las reglas de Kia, con el motivo específico por VIN. Es un resultado separado: no se resta del pago a la financiera." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><Indicador label="VIN con débito" valor={debito.vins} /></Card>
        <Card className="p-4"><Indicador label="Monto a debitar" valor={pesos2(debito.total)} tono="red" sub={`Charge ${resultado.parametros.baseDebito}`} /></Card>
        <Card className="p-4"><Indicador label="Por revisar" valor={debito.porRevisar} sub="casos no cubiertos por las reglas" /></Card>
        <Card className="p-4"><Indicador label="Proceden con nota" valor={conNota} sub="compatibles, demo con antigüedad" tono="green" /></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-kia-line">
          <div className="flex gap-1" role="tablist" aria-label="Filtrar">
            {FILTROS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${filtro === id ? 'bg-kia-black text-white' : 'text-kia-gray hover:bg-slate-100'}`}>
                {label} <span className="opacity-60 tabular">{cuenta[id]}</span>
              </button>
            ))}
          </div>
          <Buscador valor={q} onChange={setQ} placeholder="VIN, Dossier o razón social" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-kia-gray bg-slate-50 border-b border-kia-line">
            <th className="py-2.5 pl-4 pr-2 font-semibold">VIN · Dossier</th><th className="py-2.5 px-2 font-semibold">Dealer · razón social</th>
            <th className="py-2.5 px-2 font-semibold">Motivo</th><th className="py-2.5 px-2 font-semibold">Comentario</th>
            <th className="py-2.5 px-2 font-semibold text-right">Débito</th><th className="py-2.5 pl-2 pr-4 font-semibold">Estatus</th>
          </tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-kia-gray">Sin registros en este filtro.</td></tr>}
            {filas.map(c => (
              <tr key={`${c.dossier}-${c.fila}`} className="border-b border-kia-line/60 last:border-0 align-top">
                <td className="py-2.5 pl-4 pr-2"><div className="font-mono text-xs font-semibold">{c.vin || '(sin VIN)'}</div><div className="font-mono text-[11px] text-kia-gray">{c.dossier}</div></td>
                <td className="py-2.5 px-2"><div>{c.dealerSap || c.dealer}</div><div className="text-[11px] text-kia-gray">{c.razonSocial}</div></td>
                <td className="py-2.5 px-2"><div className="flex flex-wrap gap-1">{c.motivos.map((m, i) => <Motivo key={i} codigo={m.codigo} />)}{!c.motivos.length && <span className="text-xs text-kia-gray">—</span>}</div></td>
                <td className="py-2.5 px-2 text-xs text-kia-black/80 max-w-[380px] space-y-1">
                  {[...c.motivos, ...c.porRevisar].map((m, i) => <div key={i}>{m.texto}</div>)}
                  {c.notas.map((m, i) => <div key={`n${i}`} className="text-emerald-700">{m.texto}</div>)}
                </td>
                <td className="py-2.5 px-2 text-right tabular font-semibold">{c.montoDebito ? pesos2(c.montoDebito) : '—'}</td>
                <td className="py-2.5 pl-2 pr-4"><EstatusDebito estatus={c.estatusDebito} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
