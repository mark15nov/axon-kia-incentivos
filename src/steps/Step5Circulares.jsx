import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { consolidarPago, fmtMXN, PERIODO } from '../data/mockData.js'

export default function Step5Circulares() {
  const base = consolidarPago().filter(f => f.total > 0)
  const [estados, setEstados] = useState(() => Object.fromEntries(base.map(f => [f.dealer, 'Pendiente'])))
  const [vista, setVista] = useState(null)

  const setEstado = (dealer, estado) => setEstados(s => ({ ...s, [dealer]: estado }))

  const enviarTodas = () => {
    base.forEach((f, i) => {
      setTimeout(() => setEstado(f.dealer, 'Enviada'), 180 * i)
    })
  }
  const aprobar = (dealer) => setEstado(dealer, 'Aprobada')

  const cont = (e) => base.filter(f => estados[f.dealer] === e).length
  const tono = { Pendiente: 'gray', Enviada: 'blue', Aprobada: 'green' }

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 5 · Automatizado"
        title="Circulares a los dealers"
        desc="Se generan y envían circulares automatizadas a cada concesionario con el detalle de su incentivo para aprobación. El dealer aprueba y queda registrado."
        right={<Button variant="danger" onClick={enviarTodas}><Icon.Mail width={16} height={16} /> Enviar todas las circulares</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Circulares" value={base.length} sub="Una por dealer" />
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
                  <div className="text-xs text-kia-gray">Circular CB-{PERIODO.slice(0, 3).toUpperCase()}-{f.dealer}</div>
                  <h3 className="font-bold mt-0.5">{f.nombre}</h3>
                </div>
                <Pill tone={tono[est]}>{est}</Pill>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
                <div className="flex justify-between"><span className="text-kia-gray">Unidades</span><span className="font-semibold tabular">{f.unidades}</span></div>
                <div className="flex justify-between mt-1"><span className="text-kia-gray">Incentivo total</span><span className="font-bold tabular">{fmtMXN(f.total)}</span></div>
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
      <Card className="max-w-lg w-full p-7 shadow-pop animate-fade-up" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-kia-line pb-4">
            <div className="flex items-center gap-2 font-extrabold text-lg">KIA <span className="text-kia-gray font-medium text-sm">· Circular de incentivo</span></div>
            <button onClick={onClose} className="text-kia-gray hover:text-kia-black text-xl leading-none">×</button>
          </div>
          <div className="py-5 space-y-4 text-sm">
            <p>Estimado <strong>{f.nombre}</strong>,</p>
            <p className="text-slate-600 leading-relaxed">
              Por medio de la presente se notifica el incentivo <strong>Cashback</strong> correspondiente al periodo de cierre,
              calculado sobre las unidades facturadas y validadas conforme a las condiciones del programa.
            </p>
            <div className="rounded-xl border border-kia-line overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 bg-slate-50"><span className="text-kia-gray">Unidades validadas</span><span className="font-semibold">{f.unidades}</span></div>
              <div className="flex justify-between px-4 py-2.5"><span className="text-kia-gray">Cashback</span><span className="font-semibold tabular">{fmtMXN(f.montoCashback)}</span></div>
              {f.bonoVolumen > 0 && <div className="flex justify-between px-4 py-2.5 border-t border-slate-100"><span className="text-kia-gray">Bono volumen</span><span className="font-semibold tabular">{fmtMXN(f.bonoVolumen)}</span></div>}
              <div className="flex justify-between px-4 py-3 bg-kia-black text-white"><span>Total incentivo</span><span className="font-extrabold tabular">{fmtMXN(f.total)}</span></div>
            </div>
            <p className="text-xs text-kia-gray">Al aprobar esta circular, el dealer autoriza la emisión de la factura correspondiente (Paso 6).</p>
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
