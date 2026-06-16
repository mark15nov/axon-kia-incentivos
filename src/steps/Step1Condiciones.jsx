import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { condicionesSAP, forecastSAP, dealerNombre, fmtMXN } from '../data/mockData.js'

export default function Step1Condiciones() {
  const totalForecast = forecastSAP.reduce((a, b) => a + b.montoEstimado, 0)
  const totalUnidades = forecastSAP.reduce((a, b) => a + b.unidades, 0)
  const [dealerAbierto, setDealerAbierto] = useState(null)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Origen SAP"
        title="Condiciones y Forecast"
        desc="KIA define las condiciones del incentivo y el forecast del periodo. Ambos llegan directamente desde SAP — sin captura manual."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> Sincronizado con SAP</Pill>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Condiciones activas" value={condicionesSAP.length} sub="Reglas de incentivo" />
        <Kpi label="Forecast unidades" value={totalUnidades} sub="Estimado del periodo" />
        <Kpi label="Forecast monto" value={fmtMXN(totalForecast)} sub="Presupuesto estimado" accent />
        <Kpi label="Concesionarios" value={forecastSAP.length} sub="Con forecast asignado" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Condiciones */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Sliders width={17} height={17} /> Condiciones del incentivo</h3>
            <Pill tone="green">Vigente</Pill>
          </div>
          <div className="space-y-2">
            {condicionesSAP.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-kia-line px-3.5 py-3 hover:border-slate-300 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{c.oferta}</div>
                  <div className="text-xs text-kia-gray mt-0.5">{c.regla} · {c.vigencia}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-bold tabular">{fmtMXN(c.monto)}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">{c.estatus}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Forecast — cascada: dealer → modelo */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Database width={17} height={17} /> Forecast por dealer</h3>
            <Pill tone="blue">SAP · {fmtMXN(totalForecast)}</Pill>
          </div>
          <div className="space-y-1.5">
            {forecastSAP.map(f => {
              const pct = (f.montoEstimado / totalForecast) * 100
              const abierto = dealerAbierto === f.dealer
              const maxModelo = Math.max(...f.desglose.map(d => d.montoEstimado))
              return (
                <div key={f.dealer} className={`rounded-xl border transition-colors ${abierto ? 'border-slate-300 bg-slate-50/60' : 'border-transparent'}`}>
                  <button
                    type="button"
                    onClick={() => setDealerAbierto(abierto ? null : f.dealer)}
                    aria-expanded={abierto}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate flex items-center gap-1.5">
                        <Icon.Chevron width={14} height={14} className={`text-kia-gray transition-transform ${abierto ? 'rotate-90' : ''}`} />
                        {dealerNombre(f.dealer)}
                      </span>
                      <span className="tabular text-kia-gray shrink-0 ml-3">{f.unidades} u · <span className="font-semibold text-kia-black">{fmtMXN(f.montoEstimado)}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-kia-black transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </button>

                  {abierto && (
                    <div className="px-2.5 pb-3 pt-1">
                      <div className="text-[11px] font-semibold tracking-wide uppercase text-kia-gray mb-2 pl-5">Forecast por modelo</div>
                      <div className="space-y-2 pl-5 border-l-2 border-slate-200 ml-1.5">
                        {f.desglose.map(d => {
                          const mPct = (d.montoEstimado / maxModelo) * 100
                          return (
                            <div key={d.modelo} className="pl-3">
                              <div className="flex items-center justify-between text-[13px] mb-1">
                                <span className="font-medium text-kia-black">{d.modelo}</span>
                                <span className="tabular text-kia-gray">{d.unidades} u · <span className="font-semibold text-kia-black">{fmtMXN(d.montoEstimado)}</span></span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-kia-red/80" style={{ width: `${mPct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3.5 text-sm text-sky-900">
        <Icon.Database width={18} height={18} className="mt-0.5 shrink-0 text-sky-600" />
        <p>Estas condiciones y el forecast son la <strong>base de validación</strong>. En el paso 4 se cruzan automáticamente contra lo que reportan los dealers para autorizar el pago.</p>
      </div>
    </div>
  )
}
