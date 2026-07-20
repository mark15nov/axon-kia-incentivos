import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  vmPilares, vmActivosDefault, VM_PRESUPUESTO, VM_PERIODO,
  vmForecast, vmForecastResumen, UMBRAL_META, fmtMXN
} from '../../data/variableMargin.js'

const TONE = {
  red: { text: 'text-kia-red', chip: 'red', hex: '#BB162B' },
  ink: { text: 'text-kia-black', chip: 'ink', hex: '#05141F' },
  blue: { text: 'text-sky-700', chip: 'blue', hex: '#0EA5E9' }
}

const ALL_VARS = vmPilares.flatMap(p => p.variables.map(v => ({ ...v, pilar: p.id, tone: p.tone })))

export default function VariableStep3Reporte() {
  const [confirmado, setConfirmado] = useState(false)
  const [estado, setEstado] = useState('idle') // idle | enviando | enviado

  const activos = ALL_VARS.filter(v => vmActivosDefault.includes(v.id))
  const presupuesto = activos.reduce((a, v) => a + v.bolsa, 0)
  const pesoTotal = activos.reduce((a, v) => a + v.peso, 0)
  const balanceada = pesoTotal === 100 && presupuesto <= VM_PRESUPUESTO

  const porPilar = vmPilares.map(p => ({
    ...p,
    activas: p.variables.filter(v => vmActivosDefault.includes(v.id)),
    peso: p.variables.filter(v => vmActivosDefault.includes(v.id)).reduce((a, v) => a + v.peso, 0),
    bolsa: p.variables.filter(v => vmActivosDefault.includes(v.id)).reduce((a, v) => a + v.bolsa, 0)
  }))

  const r = vmForecastResumen()
  const tc = vmForecast.reduce((a, d) => { a[d.tendencia]++; return a }, { up: 0, flat: 0, down: 0 })

  // Provisión contable: 1.10% del Dealer Basic Price (S04). Base estimada a
  // partir de las unidades del forecast y un precio base promedio por unidad.
  const TASA_PROVISION = 0.011
  const dealerBasicPrice = r.estimado * 420000
  const provision = Math.round(dealerBasicPrice * TASA_PROVISION)

  // Checklist de validación (todo verde → listo para envío).
  const checklist = [
    { ok: balanceada, titulo: 'Oferta comercial balanceada', detalle: `${activos.length} variables · pesos ${pesoTotal}% · ${fmtMXN(presupuesto)} dentro del tope ${fmtMXN(VM_PRESUPUESTO)}` },
    { ok: true, titulo: 'Forecast KIA BRAIN ejecutado', detalle: `${r.estimado.toLocaleString('es-MX')} u estimadas · confianza ${r.confianza}% · histórico 24 meses` },
    { ok: true, titulo: 'Cobertura de red', detalle: `${r.dealers} dealers en 8 zonas · ${r.dealersMeta} en meta (prob ≥ ${UMBRAL_META}%)` },
    { ok: true, titulo: 'Ejes de desempeño configurados', detalle: 'Cumplimiento de ventas · márgenes · calidad en la atención' }
  ]
  const todoOk = checklist.every(c => c.ok)

  const enviar = () => {
    if (!confirmado || !todoOk || estado === 'enviando') return
    setEstado('enviando')
    setTimeout(() => setEstado('enviado'), 1300)
  }

  const enviado = estado === 'enviado'

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 2 · Validación"
        title="Reporte a Finanzas"
        desc="Consolidado de la oferta comercial y el forecast del periodo. Revisa todas las variables; si todo está correcto, envía el reporte a Finanzas para su validación."
        right={<Pill tone={enviado ? 'blue' : todoOk ? 'green' : 'amber'}>
          {enviado ? <><Icon.Clock width={14} height={14} /> En validación</> : todoOk ? <><Icon.Check width={14} height={14} /> Listo para envío</> : 'Revisar'}
        </Pill>}
      />

      {/* KPIs consolidados */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Presupuesto de la oferta" value={fmtMXN(presupuesto)} sub={`${activos.length} variables · tope ${fmtMXN(VM_PRESUPUESTO)}`} accent />
        <Kpi label="Unidades estimadas" value={r.estimado.toLocaleString('es-MX')} sub={`vs ${r.meta.toLocaleString('es-MX')} meta`} />
        <Kpi label="Dealers en meta" value={`${r.dealersMeta} / ${r.dealers}`} sub={`Prob ≥ ${UMBRAL_META}%`} />
        <Kpi label="Confianza del modelo" value={`${r.confianza}%`} sub="Histórico 24 meses" />
      </div>

      {/* Provisión contable · 1.10% del Dealer Basic Price (S04 / S08) */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-10 w-10 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Cash width={19} height={19} /></span>
            <div className="min-w-0">
              <h3 className="font-bold">Provisión contable</h3>
              <p className="text-sm text-kia-gray mt-0.5">Cálculo de SAP: 1.10% del Dealer Basic Price · disponible en la transacción de Contabilidad</p>
            </div>
          </div>
          <Pill tone="ink">Tasa 1.10%</Pill>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-kia-line bg-slate-50/60 px-4 py-3.5">
            <div className="text-xs text-kia-gray">Dealer Basic Price (base)</div>
            <div className="text-xl font-bold tabular mt-0.5">{fmtMXN(dealerBasicPrice)}</div>
            <div className="text-[11px] text-kia-gray mt-0.5">{r.estimado.toLocaleString('es-MX')} u estimadas</div>
          </div>
          <div className="rounded-xl border border-kia-line bg-slate-50/60 px-4 py-3.5">
            <div className="text-xs text-kia-gray">Tasa de provisión</div>
            <div className="text-xl font-bold tabular mt-0.5">1.10%</div>
            <div className="text-[11px] text-kia-gray mt-0.5">Sobre Dealer Basic Price</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3.5">
            <div className="text-xs text-emerald-700/80">Provisión contable</div>
            <div className="text-xl font-bold tabular mt-0.5 text-emerald-700">{fmtMXN(provision)}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">Disponible en Contabilidad</div>
          </div>
        </div>
      </Card>

      {/* Checklist de validación */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Icon.Check width={17} height={17} /> Checklist de validación</h3>
          <Pill tone={todoOk ? 'green' : 'amber'}>{checklist.filter(c => c.ok).length}/{checklist.length} listo</Pill>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklist.map((c, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-kia-line px-4 py-3">
              <span className={`h-7 w-7 shrink-0 rounded-lg grid place-items-center ${c.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {c.ok ? <Icon.Check width={15} height={15} /> : <Icon.Alert width={15} height={15} />}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{c.titulo}</div>
                <div className="text-xs text-kia-gray mt-0.5 leading-snug">{c.detalle}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revisión de variables: oferta + forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Oferta comercial */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Sliders width={17} height={17} /> Oferta comercial</h3>
            <Pill tone="gray">{activos.length} variables · {pesoTotal}%</Pill>
          </div>
          <div className="space-y-4">
            {porPilar.map(p => {
              const t = TONE[p.tone]
              const I = Icon[p.icon] || Icon.Sliders
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-6 w-6 rounded-lg grid place-items-center text-white" style={{ background: t.hex }}><I width={13} height={13} /></span>
                      {p.nombre}
                    </span>
                    <span className="text-xs tabular text-kia-gray">{p.peso}% · <span className={`font-semibold ${t.text}`}>{fmtMXN(p.bolsa)}</span></span>
                  </div>
                  <div className="space-y-1.5 pl-8">
                    {p.activas.map(v => (
                      <div key={v.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon.Check width={13} height={13} className="shrink-0 text-emerald-500" />
                          <span className="truncate">{v.nombre}</span>
                          <span className="text-[11px] text-kia-gray shrink-0">· meta {v.meta}</span>
                        </span>
                        <span className="tabular text-kia-gray shrink-0 ml-3">{v.peso}% · {fmtMXN(v.bolsa)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-kia-line flex items-center justify-between">
            <span className="text-sm font-semibold">Presupuesto total</span>
            <span className="text-sm font-bold tabular text-kia-red">{fmtMXN(presupuesto)}</span>
          </div>
        </Card>

        {/* Forecast del periodo */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Icon.Trending width={17} height={17} /> Forecast del periodo</h3>
            <Pill tone="ink"><Icon.Brain width={13} height={13} /> KIA BRAIN</Pill>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-kia-gray">Estimado vs meta</span>
              <span className="tabular font-semibold">{r.estimado.toLocaleString('es-MX')} / {r.meta.toLocaleString('es-MX')} u</span>
            </div>
            <ProgressBar value={(r.estimado / r.meta) * 100} tone={r.estimado >= r.meta ? 'green' : 'red'} />
            <div className={`text-[11px] mt-1 ${r.delta >= 0 ? 'text-emerald-600' : 'text-kia-red'}`}>{r.delta >= 0 ? '+' : ''}{r.delta} u vs meta de la red</div>
          </div>

          <div className="text-xs font-semibold text-kia-gray uppercase tracking-wide mb-2">Tendencia de la red</div>
          <div className="space-y-2.5">
            <TendRow label="Al alza" arrow="▲" n={tc.up} total={r.dealers} hex="#10B981" />
            <TendRow label="Estable" arrow="▬" n={tc.flat} total={r.dealers} hex="#64748B" />
            <TendRow label="A la baja" arrow="▼" n={tc.down} total={r.dealers} hex="#BB162B" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
              <div className="text-lg font-bold tabular text-emerald-700">{r.dealersMeta}/{r.dealers}</div>
              <div className="text-[11px] text-emerald-700/80">dealers en meta</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-kia-line px-3 py-2.5">
              <div className="text-lg font-bold tabular">{r.paresMeta}/{r.pares}</div>
              <div className="text-[11px] text-kia-gray">pares dealer·modelo</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Envío a Finanzas */}
      {!enviado ? (
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="h-11 w-11 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Mail width={20} height={20} /></span>
              <div>
                <h3 className="font-bold">Enviar reporte a Finanzas</h3>
                <p className="text-sm text-kia-gray mt-0.5 max-w-xl leading-snug">
                  El reporte consolidado (oferta comercial + forecast KIA BRAIN) se envía a Finanzas para validación presupuestal antes de liberar el incentivo del periodo {VM_PERIODO}.
                </p>
                <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: '#BB162B' }} />
                  Confirmo que revisé todas las variables y son correctas.
                </label>
              </div>
            </div>
            <Button variant="danger" className="shrink-0 px-6 py-3 text-base"
              disabled={!confirmado || !todoOk || estado === 'enviando'}
              onClick={enviar}>
              {estado === 'enviando'
                ? <><Spinner /> Enviando…</>
                : <><Icon.Mail width={18} height={18} /> Enviar a validación (Finanzas)</>}
            </Button>
          </div>
          {!todoOk && (
            <p className="text-[11px] text-amber-600 mt-3">Resuelve los puntos pendientes del checklist para poder enviar.</p>
          )}
        </Card>
      ) : (
        <Card className="p-6 border-emerald-200 bg-emerald-50/50 animate-fade-up">
          <div className="flex items-start gap-4">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-emerald-800">Reporte enviado a Finanzas</h3>
              <p className="text-sm text-emerald-900/80 mt-1 max-w-2xl leading-relaxed">
                El reporte del incentivo Variable Margin · {VM_PERIODO} quedó <strong>en validación por Finanzas</strong>. Recibirás la resolución para liberar el pago del periodo.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Pill tone="ink">Folio VM-JUN26-0428</Pill>
                <Pill tone="blue"><Icon.Clock width={13} height={13} /> En validación</Pill>
                <Pill tone="gray">{fmtMXN(presupuesto)} · {r.estimado.toLocaleString('es-MX')} u</Pill>
              </div>
            </div>
            <Button variant="ghost" className="shrink-0 ml-auto" onClick={() => { setEstado('idle'); setConfirmado(false) }}>
              <Icon.Refresh width={15} height={15} /> Deshacer envío
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function TendRow({ label, arrow, n, total, hex }) {
  const pct = total ? (n / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-2"><span className="tabular text-xs font-bold" style={{ color: hex }}>{arrow}</span> {label}</span>
        <span className="tabular text-kia-gray">{n} <span className="text-[11px]">· {Math.round(pct)}%</span></span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: hex }} />
      </div>
    </div>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}
