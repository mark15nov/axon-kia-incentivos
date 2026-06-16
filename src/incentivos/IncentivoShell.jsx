import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { ESTATUS_INCENTIVO, periodoActivo } from '../data/incentivos.js'
import { fmtMXN } from '../data/mockData.js'

// Las 7 etapas del modelo operativo común a todos los incentivos.
const ETAPAS = [
  { n: 1, t: 'Condiciones', f: 'SAP', icon: Icon.Sliders },
  { n: 2, t: 'Carga de archivos', f: 'Dealers', icon: Icon.Upload },
  { n: 3, t: 'Matriz de cruce', f: 'Motor', icon: Icon.Grid },
  { n: 4, t: 'Validación', f: 'Consolida', icon: Icon.Check },
  { n: 5, t: 'Circulares', f: 'Automatizado', icon: Icon.Mail },
  { n: 6, t: 'Facturas', f: 'Dealer', icon: Icon.Invoice },
  { n: 7, t: 'Pago', f: 'Tesorería', icon: Icon.Cash }
]

export default function IncentivoShell({ incentivo, onBack }) {
  const I = Icon[incentivo.icon] || Icon.Database
  const est = ESTATUS_INCENTIVO[incentivo.estatus]
  const pct = incentivo.presupuesto ? (incentivo.ejecutado / incentivo.presupuesto) * 100 : 0
  const pendiente = incentivo.presupuesto - incentivo.ejecutado

  return (
    <div className="min-h-screen bg-kia-bg text-kia-black">
      <header className="sticky top-0 z-10 bg-kia-bg/85 backdrop-blur border-b border-kia-line px-8 py-4">
        <div className="max-w-[1180px] mx-auto flex items-center gap-2 text-sm">
          <button onClick={onBack} className="text-kia-gray hover:text-kia-black transition-colors">Incentivos</button>
          <span className="text-kia-line">/</span>
          <span className="font-semibold">{incentivo.nombre}</span>
        </div>
      </header>

      <div className="max-w-[1180px] mx-auto px-8 py-7 space-y-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-kia-gray hover:text-kia-black transition-colors">
          <Icon.Chevron width={14} height={14} className="rotate-180" /> Volver al centro de incentivos
        </button>

        <SectionTitle
          kicker={`Incentivo · ${incentivo.clave}`}
          title={incentivo.nombre}
          desc={incentivo.desc}
          right={<Pill tone={est.tone}>{est.label}</Pill>}
        />

        <div className="grid grid-cols-4 gap-4">
          <Kpi label="Presupuesto" value={fmtMXN(incentivo.presupuesto)} sub={`Periodo ${periodoActivo}`} accent />
          <Kpi label="Ejecutado" value={fmtMXN(incentivo.ejecutado)} sub={`${Math.round(pct)}% del presupuesto`} />
          <Kpi label="Pendiente" value={fmtMXN(pendiente)} sub="Por liquidar" />
          <Kpi label="Dealers" value={incentivo.dealers} sub="Participando" />
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-kia-black text-white grid place-items-center"><I width={16} height={16} /></span>
              Avance de ejecución
            </span>
            <span className="text-sm tabular text-kia-gray">{fmtMXN(incentivo.ejecutado)} / {fmtMXN(incentivo.presupuesto)}</span>
          </div>
          <ProgressBar value={pct} tone={pct === 100 ? 'green' : 'red'} />
        </Card>

        {/* Modelo operativo (mismo flujo de 7 pasos del Cashback) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Modelo operativo</h3>
            <Pill tone="gray">7 etapas</Pill>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {ETAPAS.map(e => (
              <div key={e.n} className="rounded-xl border border-kia-line px-2.5 py-3 text-center hover:border-slate-300 transition-colors">
                <div className="mx-auto h-9 w-9 rounded-lg bg-slate-100 text-kia-black grid place-items-center mb-2"><e.icon width={16} height={16} /></div>
                <div className="text-[11px] font-bold">{e.t}</div>
                <div className="text-[10px] text-kia-gray mt-0.5">{e.f}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3.5 text-sm text-sky-900">
          <Icon.Clock width={18} height={18} className="mt-0.5 shrink-0 text-sky-600" />
          <p>Este incentivo opera con el <strong>mismo flujo automatizado</strong> de SAP → dealers → validación → pago. El detalle operativo paso a paso está configurado y disponible hoy en el programa <strong>Cashback</strong>.</p>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onBack}>← Volver al consolidado</Button>
        </div>
      </div>
    </div>
  )
}
