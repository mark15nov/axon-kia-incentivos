import { useState } from 'react'
import { Icon } from './components/icons.jsx'
import kiaLogo from './assets/kia-logo.png'
import { Card, Pill, Button } from './components/ui.jsx'
import { incentivos, ESTATUS_INCENTIVO, periodoActivo } from './data/incentivos.js'
import { fmtMXN } from './data/mockData.js'
import { kpisIncentivo, consolidadoKpis, zonas, zonaResumen, alertas } from './data/dashboard.js'

const NOMBRE_INC = Object.fromEntries(incentivos.map(i => [i.id, i.nombre]))
const pct = (x) => `${Math.round(x)}%`

export default function Dashboard({ onOpen }) {
  const [modulo, setModulo] = useState('resumen')
  const listaAlertas = alertas()

  const MODULOS = [
    { id: 'resumen', label: 'Resumen', icon: Icon.Home },
    { id: 'zonas', label: 'Zonas', icon: Icon.Users },
    { id: 'alertas', label: 'Alertas', icon: Icon.Alert, badge: listaAlertas.length }
  ]
  const activo = MODULOS.find(m => m.id === modulo)

  return (
    <div className="min-h-screen flex bg-kia-bg text-kia-black">
      {/* ---------- Sidebar de módulos (ERP) ---------- */}
      <aside className="w-[248px] shrink-0 bg-white border-r border-kia-line flex flex-col sticky top-0 h-screen">
        <div className="px-5 pt-6 pb-5 border-b border-kia-line">
          <div className="flex items-center gap-2.5">
            <img src={kiaLogo} alt="KIA" className="h-8 w-auto" />
            <span className="h-5 w-px bg-kia-line" />
            <span className="text-sm font-semibold text-kia-gray">Incentivos</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-kia-gray/70">Módulos</div>
          {MODULOS.map(m => {
            const isActive = m.id === modulo
            return (
              <button key={m.id} onClick={() => setModulo(m.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors ${
                  isActive ? 'bg-kia-red text-white' : 'text-kia-black hover:bg-slate-50'
                }`}>
                <m.icon width={18} height={18} className={isActive ? 'text-white' : 'text-kia-gray'} />
                <span className="text-sm font-semibold flex-1">{m.label}</span>
                {m.badge > 0 && (
                  <span className={`text-[11px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                    isActive ? 'bg-white/25 text-white' : 'bg-kia-red text-white'
                  }`}>{m.badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-kia-line">
          <div className="text-[11px] text-kia-gray uppercase tracking-wider">Periodo activo</div>
          <div className="flex items-center gap-2 mt-1">
            <Icon.Clock className="text-kia-red" width={15} height={15} />
            <span className="text-sm font-semibold">{periodoActivo}</span>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-kia-bg/85 backdrop-blur border-b border-kia-line px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <activo.icon width={20} height={20} className="text-kia-red" />
              <h1 className="text-lg font-bold">{activo.label}</h1>
              <span className="text-kia-line">·</span>
              <span className="text-sm text-kia-gray">Centro de Incentivos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-kia-gray">
              <Icon.Clock width={15} height={15} className="text-kia-red" />
              <span className="font-semibold text-kia-black">{periodoActivo}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-8 py-7 max-w-[1280px] w-full mx-auto">
          <div key={modulo} className="animate-fade-up">
            {modulo === 'resumen' && <Resumen onOpen={onOpen} alertas={listaAlertas} irA={setModulo} />}
            {modulo === 'zonas' && <Zonas />}
            {modulo === 'alertas' && <Alertas lista={listaAlertas} />}
          </div>
        </div>
      </main>
    </div>
  )
}

/* =================== RESUMEN =================== */
function Resumen({ onOpen, alertas, irA }) {
  const c = consolidadoKpis()

  return (
    <div className="space-y-7">
      {/* Consolidado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiBox label="Pagado" monto={c.pagado} sub={`${pct(c.pctPagado)} del presupuesto`} tone="green" icon={Icon.Check} />
        <KpiBox label="Por pagar" monto={c.porPagar} sub={`${pct(c.pctPorPagar)} del presupuesto`} tone="amber" icon={Icon.Clock} />
        <KpiBox label="Rechazado" monto={c.rechazado} sub={`${pct(c.tasaRechazo * 100)} de lo procesado`} tone="red" icon={Icon.Alert} />
        <KpiBox label="Alertas activas" valor={String(alertas.length)} sub={alertas.length ? 'Requieren atención' : 'Todo en orden'} tone={alertas.length ? 'red' : 'green'} icon={Icon.Shield} onClick={() => irA('alertas')} />
      </div>

      {/* Franja de alertas */}
      {alertas.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2"><Icon.Alert width={17} height={17} className="text-kia-red" /> Alertas detonadas</h3>
            <button onClick={() => irA('alertas')} className="text-xs font-semibold text-kia-red hover:underline">Ver todas ({alertas.length})</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alertas.slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-kia-line px-3.5 py-2.5">
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${a.severidad === 'alta' ? 'bg-kia-red' : 'bg-amber-400'}`} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug">{a.titulo}</div>
                  <div className="text-xs text-kia-gray mt-0.5 leading-snug">{a.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Boxes por incentivo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2"><Icon.Layers width={18} height={18} /> Programas de incentivo</h2>
          <span className="text-xs text-kia-gray">{incentivos.length} programas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {incentivos.map(inc => <IncentivoBox key={inc.id} inc={inc} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  )
}

function KpiBox({ label, monto, valor, sub, tone, icon: I, onClick }) {
  const tones = {
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ic: 'text-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ic: 'text-amber-500' },
    red: { bg: 'bg-red-50', text: 'text-kia-red', ic: 'text-kia-red' }
  }
  const t = tones[tone] || tones.green
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp onClick={onClick} className={`text-left w-full ${onClick ? 'transition-shadow hover:shadow-pop' : ''}`}>
      <Card className="p-4 h-full">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-kia-gray">{label}</div>
          <span className={`h-7 w-7 rounded-lg grid place-items-center ${t.bg}`}><I width={15} height={15} className={t.ic} /></span>
        </div>
        <div className={`text-2xl font-bold mt-1.5 tabular ${t.text}`}>{valor ?? fmtMXN(monto)}</div>
        {sub && <div className="text-xs text-kia-gray mt-0.5">{sub}</div>}
      </Card>
    </Comp>
  )
}

function IncentivoBox({ inc, onOpen }) {
  const I = Icon[inc.icon] || Icon.Database
  const est = ESTATUS_INCENTIVO[inc.estatus]
  const k = kpisIncentivo(inc)
  const hasAlert = k.alertaRechazo || k.alertaPago
  const disponible = Math.max(0, 100 - k.pctPagado - k.pctPorPagar - k.pctRechazado)

  const rows = [
    { label: 'Pagado', monto: k.pagado, pct: k.pctPagado, bar: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Por pagar', monto: k.porPagar, pct: k.pctPorPagar, bar: 'bg-amber-400', text: 'text-amber-600', alert: k.alertaPago },
    { label: 'Rechazado', monto: k.rechazado, pct: k.pctRechazado, bar: 'bg-kia-red', text: 'text-kia-red', alert: k.alertaRechazo }
  ]

  return (
    <Card className={`p-5 flex flex-col ${hasAlert ? 'ring-1 ring-kia-red/30' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center ${inc.flujo ? 'bg-kia-red text-white' : 'bg-slate-100 text-kia-gray'}`}>
            <I width={19} height={19} />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold leading-tight truncate">{inc.nombre}</h3>
            <div className="text-[11px] text-kia-gray truncate">{inc.fuente}</div>
          </div>
        </div>
        {hasAlert
          ? <Pill tone="red"><Icon.Alert width={12} height={12} /> Alerta</Pill>
          : <Pill tone={est.tone}>{est.label}</Pill>}
      </div>

      {/* Barra apilada del presupuesto */}
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-1.5">
        <div className="h-full bg-emerald-500" style={{ width: `${k.pctPagado}%` }} />
        <div className="h-full bg-amber-400" style={{ width: `${k.pctPorPagar}%` }} />
        <div className="h-full bg-kia-red" style={{ width: `${k.pctRechazado}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-kia-gray mb-3">
        <span>Presupuesto {fmtMXN(inc.presupuesto)}</span>
        <span>{pct(disponible)} disponible</span>
      </div>

      {/* Estatus: pagado / por pagar / rechazado */}
      <div className="space-y-2.5">
        {rows.map(r => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5 text-kia-gray">
                <span className={`h-2 w-2 rounded-full ${r.bar}`} />
                {r.label}
                {r.alert && <Icon.Alert width={12} height={12} className="text-kia-red" />}
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular font-semibold">{fmtMXN(r.monto)}</span>
                <span className={`tabular text-xs font-semibold ${r.text}`}>{pct(r.pct)}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${Math.min(100, r.pct)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick check */}
      <div className="flex items-start gap-2 mt-4 rounded-xl bg-slate-50 border border-kia-line px-3 py-2.5">
        <Icon.Spark width={14} height={14} className="mt-0.5 shrink-0 text-kia-red" />
        <p className="text-xs text-kia-black/80 leading-snug">{k.quick}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-kia-line">
        {inc.aclaraciones > 0
          ? <span className="flex items-center gap-1 text-xs font-semibold text-amber-600"><Icon.Alert width={13} height={13} /> {inc.aclaraciones} aclaraciones</span>
          : <span className="text-xs text-kia-gray">Sin aclaraciones</span>}
        <Button variant="danger" className="px-4 py-2" onClick={() => onOpen(inc.id)}>
          Abrir <Icon.Arrow width={15} height={15} />
        </Button>
      </div>
    </Card>
  )
}

/* =================== ZONAS =================== */
function Zonas() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-kia-gray max-w-2xl">Seguimiento para gerentes de zona: avance de la red y dealers retrasados por incentivo.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {zonas.map(z => <ZonaCard key={z.id} zona={z} />)}
      </div>
    </div>
  )
}

function ZonaCard({ zona }) {
  const r = zonaResumen(zona)
  return (
    <Card className={`p-5 ${r.alerta ? 'ring-1 ring-kia-red/30' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Zona {zona.nombre}</h3>
            {r.alerta && <Pill tone="red"><Icon.Alert width={12} height={12} /> En riesgo</Pill>}
          </div>
          <div className="text-xs text-kia-gray mt-0.5 flex items-center gap-1.5"><Icon.Users width={13} height={13} /> Gerente: {zona.gerente}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold tabular ${r.avance < 60 ? 'text-kia-red' : r.avance < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.avance}%</div>
          <div className="text-[11px] text-kia-gray">avance promedio</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-kia-gray mb-3">
        <span>{r.totalDealers} dealers</span>
        <span className={r.dealersRetrasados.length ? 'text-kia-red font-semibold' : ''}>{r.dealersRetrasados.length} retrasados</span>
        {r.diasMax > 0 && <span>hasta {r.diasMax} días de atraso</span>}
      </div>

      <div className="space-y-2.5">
        {zona.dealers.map(d => (
          <div key={d.id} className="rounded-xl border border-kia-line px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{d.nombre}</span>
              <span className={`text-xs tabular font-semibold ${d.avance < 60 ? 'text-kia-red' : d.avance < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.avance}%</span>
            </div>
            {d.retrasos.length === 0 ? (
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1.5"><Icon.Check width={12} height={12} /> Al día</div>
            ) : (
              <div className="mt-2 space-y-1.5">
                {d.retrasos.map((rt, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-kia-red shrink-0" />
                      <span className="font-semibold truncate">{NOMBRE_INC[rt.incentivo] || rt.incentivo}</span>
                      <span className="text-kia-gray truncate">· {rt.motivo}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-kia-red">{rt.dias}d</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* =================== ALERTAS =================== */
function Alertas({ lista }) {
  if (!lista.length) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-500 grid place-items-center mb-3"><Icon.Check width={28} height={28} /></div>
        <h3 className="font-bold text-lg">Sin alertas</h3>
        <p className="text-sm text-kia-gray mt-1">Todos los KPIs están dentro de umbral.</p>
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-kia-gray">Se detonan cuando un KPI cae bajo umbral (rechazo alto, pago rezagado o zonas retrasadas).</p>
      {lista.map((a, i) => {
        const alta = a.severidad === 'alta'
        return (
          <Card key={i} className={`p-4 flex items-start gap-4 ${alta ? 'border-l-4 border-l-kia-red' : 'border-l-4 border-l-amber-400'}`}>
            <span className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center ${alta ? 'bg-red-50 text-kia-red' : 'bg-amber-50 text-amber-600'}`}>
              {a.tipo === 'zona' ? <Icon.Users width={19} height={19} /> : <Icon.Alert width={19} height={19} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold">{a.titulo}</h3>
                <Pill tone={alta ? 'red' : 'amber'}>{alta ? 'Alta' : 'Media'}</Pill>
                <Pill tone="gray">{a.contexto}</Pill>
              </div>
              <p className="text-sm text-kia-gray mt-1 leading-snug">{a.detalle}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
