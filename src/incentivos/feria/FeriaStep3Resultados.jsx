import { Card, SectionTitle, Kpi, Pill, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  feriaResultadosZona, feriaResultadosModelo, feriaResultados, feriaPorSegmento,
  feriaFunnel, feriaPlazos, feriaTendencia, feriaTopAgencias, feriaAprobacion,
  SEGMENTO, fmtMXN
} from '../../data/feriaCredito.js'

const TONE_HEX = {
  emerald: '#10B981', sky: '#0EA5E9', red: '#BB162B', amber: '#F59E0B', slate: '#64748B', ink: '#05141F'
}
const SEG_HEX = { SUV: '#BB162B', 'Sedán': '#05141F', Hatchback: '#0EA5E9' }
const fmtCompact = (n) => `$${(n / 1000000).toFixed(1)}M`

export default function FeriaStep3Resultados() {
  const r = feriaResultados()
  const segmentos = feriaPorSegmento()
  const maxZona = Math.max(...feriaResultadosZona.map(z => z.monto))
  const maxModelo = Math.max(...feriaResultadosModelo.map(m => Math.max(m.real, m.forecast)))
  const maxPlazo = Math.max(...feriaPlazos.map(p => p.unidades))
  const maxTend = Math.max(...feriaTendencia.map(t => t.unidades))
  const maxAgencia = Math.max(...feriaTopAgencias.map(a => a.unidades))
  const totalAprob = feriaAprobacion.reduce((a, b) => a + b.valor, 0)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 3 · Resultados"
        title="Resultados de la Feria de Crédito"
        desc="Resultados completos del evento: colocación por zona, segmento y vehículo, embudo de conversión, plazos, tendencia diaria y ranking de agencias."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> Datos en vivo · Zap</Pill>}
      />

      {/* KPIs principales */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Monto colocado" value={fmtMXN(r.monto)} sub="Crédito financiado" accent />
        <Kpi label="Unidades financiadas" value={r.unidades} sub={`vs ${r.forecast} forecast · ${Math.round(r.cumplimiento)}%`} />
        <Kpi label="Conversión lead→venta" value={`${r.conversion.toFixed(1)}%`} sub={`${r.leads} leads en feria`} />
        <Kpi label="Ticket promedio" value={fmtMXN(r.ticket)} sub="Por crédito" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Tasa de aprobación" value={`${r.aprobacion.toFixed(0)}%`} sub={`${r.aprobados} de ${r.solicitudes} solicitudes`} />
        <Kpi label="Plazo promedio" value={`${r.plazoProm} m`} sub="Crédito Inbursa" />
        <Kpi label="Zonas activas" value={feriaResultadosZona.length} sub="Cobertura nacional" />
        <Kpi label="Cumplimiento" value={`${Math.round(r.cumplimiento)}%`} sub="Real vs forecast" />
      </div>

      {/* Cumplimiento vs forecast */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Cumplimiento vs forecast (Paso 1)</span>
          <span className="text-sm tabular text-kia-gray">{r.unidades} / {r.forecast} unidades · {Math.round(r.cumplimiento)}%</span>
        </div>
        <ProgressBar value={r.cumplimiento} tone={r.cumplimiento >= 100 ? 'green' : 'red'} />
      </Card>

      {/* Embudo + estatus de solicitudes */}
      <div className="grid grid-cols-5 gap-6 items-start">
        <Card className="col-span-3 p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Icon.Trending width={17} height={17} /> Embudo de conversión del crédito</h3>
          <div className="space-y-2.5">
            {feriaFunnel.map((f, i) => {
              const pct = (f.valor / feriaFunnel[0].valor) * 100
              const drop = i > 0 ? ((f.valor / feriaFunnel[i - 1].valor) * 100).toFixed(0) : null
              return (
                <div key={f.etapa}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{f.etapa}</span>
                    <span className="tabular text-kia-gray">
                      {f.valor} {drop && <span className="text-[11px] text-kia-gray/70">· {drop}% del paso previo</span>}
                    </span>
                  </div>
                  <div className="h-6 rounded-lg bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-lg bg-gradient-to-r from-kia-black to-kia-red flex items-center justify-end pr-2 text-[11px] font-bold text-white transition-all duration-500"
                      style={{ width: `${pct}%` }}>
                      {Math.round(pct)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="col-span-2 p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Icon.Check width={17} height={17} /> Estatus de solicitudes</h3>
          <div className="flex items-center gap-5">
            <Donut data={feriaAprobacion.map(a => ({ value: a.valor, color: TONE_HEX[a.tone] }))} total={totalAprob} label="solicitudes" />
            <div className="space-y-2 flex-1">
              {feriaAprobacion.map(a => (
                <div key={a.estatus} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: TONE_HEX[a.tone] }} />
                    {a.estatus}
                  </span>
                  <span className="tabular font-semibold">{a.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Zona + vehículo */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Icon.Layers width={17} height={17} /> Colocación por zona</h3>
          <div className="space-y-3">
            {feriaResultadosZona.map(z => (
              <BarRow key={z.zona} label={z.zona} right={<span className="tabular text-kia-gray">{z.unidades} u · <span className="font-semibold text-kia-black">{fmtMXN(z.monto)}</span></span>} pct={(z.monto / maxZona) * 100} color="#05141F" />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Box width={17} height={17} /> Desempeño por vehículo</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kia-red" /> Real</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Forecast</span>
            </div>
          </div>
          <div className="space-y-3">
            {feriaResultadosModelo.map(m => {
              const realPct = (m.real / maxModelo) * 100
              const fcPct = (m.forecast / maxModelo) * 100
              const cumple = m.real >= m.forecast
              return (
                <div key={m.modelo}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{m.modelo} <span className="text-[11px] text-kia-gray">· {SEGMENTO[m.modelo]}</span></span>
                    <span className={`tabular text-xs font-semibold ${cumple ? 'text-emerald-600' : 'text-kia-red'}`}>{m.real}/{m.forecast} u {cumple ? '▲' : '▼'}</span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300" style={{ width: `${fcPct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-kia-red transition-all duration-500" style={{ width: `${realPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Segmento + plazo */}
      <div className="grid grid-cols-5 gap-6 items-start">
        <Card className="col-span-2 p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Icon.Grid width={17} height={17} /> Mix por segmento</h3>
          <div className="flex items-center gap-5">
            <Donut data={segmentos.map(s => ({ value: s.unidades, color: SEG_HEX[s.segmento] || '#64748B' }))} total={r.unidades} label="unidades" />
            <div className="space-y-2 flex-1">
              {segmentos.map(s => (
                <div key={s.segmento} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEG_HEX[s.segmento] || '#64748B' }} />
                    {s.segmento}
                  </span>
                  <span className="tabular text-kia-gray">{s.unidades} u · <span className="font-semibold text-kia-black">{Math.round((s.unidades / r.unidades) * 100)}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="col-span-3 p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Icon.Clock width={17} height={17} /> Distribución por plazo del crédito</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {feriaPlazos.map(p => (
              <div key={p.plazo} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs font-bold tabular mb-1">{p.unidades}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-kia-red to-kia-red-soft transition-all duration-500" style={{ height: `${(p.unidades / maxPlazo) * 100}%` }} />
                <span className="text-[11px] text-kia-gray mt-1.5">{p.plazo}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tendencia diaria */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Icon.Trending width={17} height={17} /> Tendencia de colocación durante la feria</h3>
          <span className="text-xs text-kia-gray">13–30 Jun 2026</span>
        </div>
        <div className="flex items-end justify-between gap-4 h-48">
          {feriaTendencia.map(t => (
            <div key={t.dia} className="flex-1 flex flex-col items-center justify-end h-full group">
              <span className="text-[11px] font-bold tabular">{t.unidades}u</span>
              <span className="text-[10px] text-kia-gray mb-1">{fmtCompact(t.monto)}</span>
              <div className="w-full rounded-t-lg bg-kia-black group-hover:bg-kia-red transition-all duration-500" style={{ height: `${(t.unidades / maxTend) * 100}%` }} />
              <span className="text-[11px] text-kia-gray mt-1.5">{t.dia} Jun</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Ranking de agencias */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Icon.Star width={17} height={17} /> Ranking de agencias</h3>
          <Pill tone="gray">Por unidades financiadas</Pill>
        </div>
        <div className="p-5 space-y-3">
          {[...feriaTopAgencias].sort((a, b) => b.unidades - a.unidades).map((a, i) => (
            <div key={a.id} className="flex items-center gap-3">
              <span className={`h-7 w-7 shrink-0 rounded-lg grid place-items-center text-xs font-bold ${i === 0 ? 'bg-kia-red text-white' : 'bg-slate-100 text-kia-black'}`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold truncate">{a.nombre} <span className="text-[11px] text-kia-gray font-normal">· {a.zona}</span></span>
                  <span className="tabular text-kia-gray shrink-0 ml-3">{a.unidades} u · <span className="font-semibold text-kia-black">{fmtMXN(a.monto)}</span> · conv {a.conversion}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${i === 0 ? 'bg-kia-red' : 'bg-kia-black'}`} style={{ width: `${maxAgencia ? (a.unidades / maxAgencia) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detalle por zona */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Detalle por zona</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
              <th className="text-left font-semibold px-5 py-3">Zona</th>
              <th className="text-right font-semibold px-3 py-3">Leads</th>
              <th className="text-right font-semibold px-3 py-3">Aprobados</th>
              <th className="text-right font-semibold px-3 py-3">Financiadas</th>
              <th className="text-right font-semibold px-3 py-3">Conversión</th>
              <th className="text-right font-semibold px-5 py-3">Monto colocado</th>
            </tr>
          </thead>
          <tbody>
            {feriaResultadosZona.map(z => (
              <tr key={z.zona} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold">{z.zona}</td>
                <td className="px-3 py-3 text-right tabular text-kia-gray">{z.leads}</td>
                <td className="px-3 py-3 text-right tabular text-kia-gray">{z.aprobados}</td>
                <td className="px-3 py-3 text-right tabular font-semibold">{z.unidades}</td>
                <td className="px-3 py-3 text-right tabular">{((z.unidades / z.leads) * 100).toFixed(1)}%</td>
                <td className="px-5 py-3 text-right tabular font-bold">{fmtMXN(z.monto)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
              <td className="px-5 py-3">Total</td>
              <td className="px-3 py-3 text-right tabular">{r.leads}</td>
              <td className="px-3 py-3 text-right tabular">{r.aprobados}</td>
              <td className="px-3 py-3 text-right tabular">{r.unidades}</td>
              <td className="px-3 py-3 text-right tabular">{r.conversion.toFixed(1)}%</td>
              <td className="px-5 py-3 text-right tabular">{fmtMXN(r.monto)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  )
}

function BarRow({ label, right, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        {right}
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function Donut({ data, total, label, size = 128 }) {
  const sum = data.reduce((a, b) => a + b.value, 0) || 1
  let acc = 0
  const stops = data.map(d => {
    const start = (acc / sum) * 360
    acc += d.value
    const end = (acc / sum) * 360
    return `${d.color} ${start}deg ${end}deg`
  }).join(', ')
  const hole = Math.round(size * 0.6)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="rounded-full" style={{ width: size, height: size, background: `conic-gradient(${stops})` }} />
      <div className="absolute rounded-full bg-white grid place-items-center text-center" style={{ width: hole, height: hole, top: (size - hole) / 2, left: (size - hole) / 2 }}>
        <div>
          <div className="text-xl font-bold tabular leading-none">{total}</div>
          <div className="text-[10px] text-kia-gray mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  )
}
