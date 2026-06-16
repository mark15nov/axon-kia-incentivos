import { useState, useMemo } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { matriz, ofertas, dealers, dealerNombre, fmtMXN, ESTATUS } from '../data/mockData.js'

export default function Step3Matriz() {
  const [filtro, setFiltro] = useState('todos') // todos | aclaracion | duplicado
  const [sel, setSel] = useState(null)

  const aclaraciones = useMemo(() => matriz.filter(r => r.estatus !== 'ok'), [])
  const filas = useMemo(() => {
    if (filtro === 'todos') return matriz
    return matriz.filter(r => r.estatus === filtro)
  }, [filtro])

  // Agrupar por dealer (vertical: VINs ordenados por dealer)
  const grupos = dealers
    .map(d => ({ dealer: d, regs: filas.filter(r => r.dealer === d.id) }))
    .filter(g => g.regs.length > 0)

  const totalOK = matriz.filter(r => r.estatus === 'ok').length
  const montoOK = matriz.filter(r => r.estatus === 'ok').reduce((a, b) => a + b.monto, 0)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 3 · Motor de cruce"
        title="Matriz VIN × Ofertas"
        desc="Cada VIN (vertical, agrupado por dealer) se cruza contra cada oferta o incentivo (horizontal). El motor detecta información incorrecta, duplicaciones dentro del mes y VINs ya pagados en periodos anteriores, y genera reportes de aclaración para completar."
        right={
          <div className="flex gap-2">
            {[
              { k: 'todos', t: 'Todos' },
              { k: 'aclaracion', t: 'Aclaraciones' },
              { k: 'duplicado', t: 'Duplicados' },
              { k: 'historico', t: 'Mes anterior' }
            ].map(b => (
              <button key={b.k} onClick={() => setFiltro(b.k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  filtro === b.k ? 'bg-kia-black text-white border-kia-black' : 'bg-white text-kia-gray border-kia-line hover:border-slate-300'
                }`}>
                {b.t}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="VINs en matriz" value={matriz.length} sub="Cruzados con ofertas" />
        <Kpi label="Validados" value={totalOK} sub="Listos para pago" />
        <Kpi label="Aclaraciones" value={aclaraciones.length} sub="Requieren completar" accent />
        <Kpi label="Monto validado" value={fmtMXN(montoOK)} sub="Cashback elegible" />
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Matriz */}
        <Card className="col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-kia-line">
                  <th className="text-left font-semibold text-kia-gray px-4 py-3 sticky left-0 bg-slate-50 z-10">VIN</th>
                  {ofertas.map(o => (
                    <th key={o.id} className="px-2 py-3 text-center font-semibold text-kia-gray whitespace-nowrap">
                      <div className="text-[11px]">{o.nombre.replace('Cashback ', '').replace('Bono ', '')}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{fmtMXN(o.monto)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grupos.map(g => (
                  <FilaGrupo key={g.dealer.id} grupo={g} onSel={setSel} sel={sel} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 border-t border-kia-line text-xs text-kia-gray">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Validado</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Aclaración</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kia-red" /> Duplicado</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Ya pagado (mes anterior)</span>
          </div>
        </Card>

        {/* Panel de aclaraciones */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2"><Icon.Alert width={17} height={17} className="text-amber-500" /> Reporte de aclaraciones</h3>
            <Pill tone="amber">{aclaraciones.length}</Pill>
          </div>
          {sel ? (
            <DetalleSel reg={sel} onClose={() => setSel(null)} />
          ) : (
            <div className="space-y-2">
              {aclaraciones.map(r => {
                const e = ESTATUS[r.estatus]
                return (
                  <button key={r.id} onClick={() => setSel(r)}
                    className={`w-full text-left rounded-xl border px-3.5 py-3 hover:border-slate-300 transition-colors ${e.bg} border-transparent`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold">{r.vin.slice(-8)}</span>
                      <span className={`text-[11px] font-bold ${e.text}`}>{e.label}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{dealerNombre(r.dealer)} · {r.modelo}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-snug">{r.nota}</div>
                  </button>
                )
              })}
              <div className="rounded-xl bg-slate-50 border border-kia-line px-3.5 py-3 text-xs text-kia-gray mt-1">
                Toca un caso para ver el detalle y la acción sugerida. Las aclaraciones se envían al dealer; los VINs ya pagados en meses anteriores se excluyen del pago automáticamente.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function FilaGrupo({ grupo, onSel, sel }) {
  return (
    <>
      <tr>
        <td colSpan={ofertas.length + 1} className="px-4 pt-4 pb-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-kia-black">
            <span className="h-5 w-5 rounded bg-kia-black text-white grid place-items-center text-[10px]">{grupo.dealer.id.slice(1)}</span>
            {grupo.dealer.nombre}
            <span className="text-kia-gray font-medium normal-case">· {grupo.regs.length} VIN</span>
          </div>
        </td>
      </tr>
      {grupo.regs.map(r => (
        <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50/60 ${sel?.id === r.id ? 'bg-amber-50/50' : ''}`}>
          <td className="px-4 py-2.5 font-mono text-xs text-slate-600 sticky left-0 bg-white z-10">{r.vin}</td>
          {ofertas.map(o => {
            const match = r.oferta === o.id
            if (!match) return <td key={o.id} className="text-center text-slate-200">·</td>
            const e = ESTATUS[r.estatus]
            return (
              <td key={o.id} className="text-center py-2.5">
                <button onClick={() => r.estatus !== 'ok' && onSel(r)}
                  className={`inline-flex items-center justify-center h-7 min-w-[64px] rounded-lg text-[11px] font-bold ${e.bg} ${e.text} ${r.estatus !== 'ok' ? 'ring-1 ring-current/20 hover:scale-105 transition-transform' : ''}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${e.dot} mr-1.5`} />
                  {fmtMXN(o.monto).replace('$', '').replace(',000', 'k')}
                </button>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

const ACCION = {
  duplicado: 'Eliminar registro duplicado y conservar el de la factura PDF original.',
  historico: 'Excluir del pago. El VIN ya recibió este incentivo en un periodo anterior; no procede doble cashback.',
  aclaracion: 'Solicitar al dealer la corrección del dato y reenviar evidencia.'
}
const ACCION_BTN = {
  duplicado: 'Eliminar duplicado',
  historico: 'Excluir del pago',
  aclaracion: 'Enviar aclaración al dealer'
}

function DetalleSel({ reg, onClose }) {
  const e = ESTATUS[reg.estatus]
  const accion = ACCION[reg.estatus] || ACCION.aclaracion
  return (
    <div className="animate-fade-up">
      <button onClick={onClose} className="text-xs text-kia-gray hover:text-kia-black mb-3">← Volver al listado</button>
      <div className={`rounded-xl ${e.bg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${e.text}`}>{e.label}</span>
          <Pill tone="gray">{reg.id}</Pill>
        </div>
        <div className="font-mono text-sm font-semibold mt-2">{reg.vin}</div>
        <div className="text-xs text-slate-600 mt-1">{dealerNombre(reg.dealer)} · {reg.modelo} · Factura {reg.facturaFecha}</div>
      </div>
      <div className="mt-3 space-y-2.5 text-sm">
        <Campo label="Hallazgo" valor={reg.nota} />
        <Campo label="Oferta afectada" valor={`${reg.oferta} · ${fmtMXN(reg.monto)}`} />
        <Campo label="Acción sugerida" valor={accion} />
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="danger" className="flex-1">{ACCION_BTN[reg.estatus] || ACCION_BTN.aclaracion}</Button>
        <Button variant="ghost">Marcar resuelto</Button>
      </div>
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-kia-gray font-semibold">{label}</div>
      <div className="text-slate-700 mt-0.5 leading-snug">{valor}</div>
    </div>
  )
}
