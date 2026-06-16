import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { consolidarBono, fmtMXN, BONO_PERIODO } from '../../data/bonoVentas.js'

export default function BonoStep4Circulares() {
  const base = consolidarBono()
  const [estados, setEstados] = useState(() => Object.fromEntries(base.map(f => [f.dealer, 'Pendiente'])))
  const [vista, setVista] = useState(null)

  const setEstado = (dealer, estado) => setEstados(s => ({ ...s, [dealer]: estado }))
  const enviarTodas = () => base.forEach((f, i) => setTimeout(() => setEstado(f.dealer, 'Enviada'), 180 * i))
  const aprobar = (dealer) => setEstado(dealer, 'Aprobada')

  const cont = (e) => base.filter(f => estados[f.dealer] === e).length
  const tono = { Pendiente: 'gray', Enviada: 'blue', Aprobada: 'green' }

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 4 · Automatizado"
        title="Circulares a los dealers"
        desc="Se generan y envían circulares con el total del bono por agencia, según el archivo consolidado. El dealer aprueba y queda registrado para facturar."
        right={<Button variant="danger" onClick={enviarTodas}><Icon.Mail width={16} height={16} /> Enviar todas las circulares</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Circulares" value={base.length} sub="Una por agencia" />
        <Kpi label="Pendientes" value={cont('Pendiente')} sub="Por enviar" />
        <Kpi label="Enviadas" value={cont('Enviada')} sub="Esperando dealer" />
        <Kpi label="Aprobadas" value={cont('Aprobada')} sub="Listas para facturar" accent />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {base.map(f => {
          const est = estados[f.dealer]
          return (
            <Card key={f.dealer} className="p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-kia-gray">Circular BV-{BONO_PERIODO.slice(0, 3).toUpperCase()}-{f.dealer}</div>
                  <h3 className="font-bold mt-0.5">{f.nombre}</h3>
                </div>
                <Pill tone={tono[est]}>{est}</Pill>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
                <div className="flex justify-between"><span className="text-kia-gray">Unidades</span><span className="font-semibold tabular">{f.unidades}</span></div>
                <div className="flex justify-between mt-1"><span className="text-kia-gray">Bono total</span><span className="font-bold tabular">{fmtMXN(f.bono)}</span></div>
              </div>
              <div className="flex gap-2 mt-4 pt-1">
                <Button variant="ghost" className="flex-1 !py-2 text-xs" onClick={() => setVista(f)}>Ver circular</Button>
                {est === 'Enviada'
                  ? <Button variant="primary" className="flex-1 !py-2 text-xs" onClick={() => aprobar(f.dealer)}>Aprobar (dealer)</Button>
                  : <Button variant="soft" className="flex-1 !py-2 text-xs" disabled={est === 'Aprobada'} onClick={() => setEstado(f.dealer, 'Enviada')}>
                      {est === 'Aprobada' ? '✓ Aprobada' : 'Enviar'}
                    </Button>}
              </div>
            </Card>
          )
        })}
      </div>

      {vista && <CircularModal f={vista} onClose={() => setVista(null)} />}
    </div>
  )
}

function CircularModal({ f, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-kia-black/40 backdrop-blur-sm p-6" onClick={onClose}>
      <Card className="max-w-lg w-full p-7 shadow-pop animate-fade-up">
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-kia-line pb-4">
            <div className="flex items-center gap-2 font-extrabold text-lg">KIA <span className="text-kia-gray font-medium text-sm">· Circular de bono</span></div>
            <button onClick={onClose} className="text-kia-gray hover:text-kia-black text-xl leading-none">×</button>
          </div>
          <div className="py-5 space-y-4 text-sm">
            <p>Estimado <strong>{f.nombre}</strong>,</p>
            <p className="text-slate-600 leading-relaxed">
              Por medio de la presente se notifica el <strong>Bono por Ventas</strong> del periodo, calculado por VIN a partir
              de VQM, meses de inventario y curtailment, conforme a la Monthly Commercial Offer.
            </p>
            <div className="rounded-xl border border-kia-line overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 bg-slate-50"><span className="text-kia-gray">Unidades válidas</span><span className="font-semibold">{f.unidades}</span></div>
              <div className="flex justify-between px-4 py-2.5"><span className="text-kia-gray">Bono promedio</span><span className="font-semibold tabular">{fmtMXN(f.bono / f.unidades)}</span></div>
              <div className="flex justify-between px-4 py-3 bg-kia-black text-white"><span>Bono total</span><span className="font-extrabold tabular">{fmtMXN(f.bono)}</span></div>
            </div>
            <p className="text-xs text-kia-gray">Al aprobar esta circular, la agencia podrá emitir su factura por el bono (Paso 5).</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-kia-line pt-4">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button variant="danger" onClick={onClose}>Aprobar circular</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
