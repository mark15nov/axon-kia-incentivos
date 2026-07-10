import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { fcPlan, fcActivosDefault, fcCalcFila, FC_SUBSIDIO_SHARE, fmtMXN } from '../../data/fleetClaim.js'

const REGLAS = [
  'El plan de incentivo de flotilla se crea en SAP.',
  'Incluye modelos y versiones (trims) del lineup.',
  'Cada versión define su descuento de flotilla.',
  'El subsidio se calcula sobre el descuento con el share de KMX.'
]

export default function FleetClaimStep1DefinirOferta() {
  const [share, setShare] = useState(FC_SUBSIDIO_SHARE * 100) // en %
  const [rows, setRows] = useState(() =>
    Object.fromEntries(fcPlan.map(f => [f.id, { activo: fcActivosDefault.includes(f.id), descuentoPct: f.descuentoPct }]))
  )
  const [guardado, setGuardado] = useState(false)

  const touch = (fn) => { setRows(fn); setGuardado(false) }
  const toggle = (id) => touch(s => ({ ...s, [id]: { ...s[id], activo: !s[id].activo } }))
  const setDesc = (id, d) => touch(s => ({ ...s, [id]: { ...s[id], descuentoPct: Math.max(0, Math.min(30, s[id].descuentoPct + d)) } }))

  const shareFrac = share / 100
  const t = useMemo(() => {
    let unidades = 0, descuento = 0, subsidio = 0, modelos = new Set(), versiones = 0
    fcPlan.forEach(f => {
      const st = rows[f.id]
      if (!st.activo) return
      const c = fcCalcFila(f, st.descuentoPct, shareFrac)
      unidades += f.unidades
      descuento += c.descuento * f.unidades
      subsidio += c.subsidioTotal
      modelos.add(f.modelo)
      versiones += 1
    })
    return { unidades, descuento, subsidio, modelos: modelos.size, versiones }
  }, [rows, shareFrac])

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Constructor"
        title="Definir Oferta Comercial"
        desc="Crea el plan de incentivo de flotilla en SAP: selecciona los modelos y versiones (trims) que participan, define el descuento de flotilla de cada versión y el sistema calcula el subsidio con el share de KMX."
        right={<Pill tone={guardado ? 'green' : 'amber'}>{guardado ? <><Icon.Check width={14} height={14} /> Guardado</> : 'Borrador'}</Pill>}
      />

      {/* Reglas */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {REGLAS.map((tx, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-kia-gray">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-100 grid place-items-center text-[10px] font-bold text-kia-black">{i + 1}</span>
              <span className="leading-snug">{tx}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Parámetro del subsidio */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Pill tone="ink"><Icon.Database width={13} height={13} /> Plan creado en SAP</Pill>
          <div className="h-5 w-px bg-kia-line" />
          <div className="flex items-center gap-2 text-sm">
            <Icon.Sliders width={16} height={16} className="text-kia-red" />
            <span className="text-kia-gray">Share KMX del descuento</span>
            <div className="relative w-24">
              <input type="number" step="5" value={share}
                onChange={e => { setShare(Math.max(0, Math.min(100, +e.target.value))); setGuardado(false) }}
                className="w-full pr-7 pl-3 py-2 rounded-xl border border-kia-line text-sm tabular font-bold focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
            <span className="text-xs text-kia-gray">Subsidio = descuento × share</span>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Modelos / versiones" value={`${t.modelos} / ${t.versiones}`} sub="En el plan" />
        <Kpi label="Unidades del plan" value={t.unidades} sub="Volumen de flotilla" />
        <Kpi label="Descuento de flotilla" value={fmtMXN(t.descuento)} sub="Total del plan" />
        <Kpi label="Subsidio KMX" value={fmtMXN(t.subsidio)} sub={`${share}% del descuento`} accent />
      </div>

      {/* Tabla del plan */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Plan de flotilla · modelos y versiones</h3>
          <Pill tone="gray">{t.versiones} de {fcPlan.length} versiones</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Incluir</th>
                <th className="text-left font-semibold px-3 py-3">Modelo</th>
                <th className="text-left font-semibold px-3 py-3">Versión</th>
                <th className="text-right font-semibold px-3 py-3">Precio</th>
                <th className="text-center font-semibold px-3 py-3">Descuento</th>
                <th className="text-right font-semibold px-3 py-3">Descuento $</th>
                <th className="text-right font-semibold px-3 py-3">u</th>
                <th className="text-right font-semibold px-3 py-3">Subsidio/u</th>
                <th className="text-right font-semibold px-5 py-3">Subsidio total</th>
              </tr>
            </thead>
            <tbody>
              {fcPlan.map(f => {
                const st = rows[f.id]
                const c = fcCalcFila(f, st.descuentoPct, shareFrac)
                return (
                  <tr key={f.id} className={`border-t border-slate-100 hover:bg-slate-50/60 ${st.activo ? '' : 'opacity-55'}`}>
                    <td className="px-5 py-3">
                      <button onClick={() => toggle(f.id)} aria-pressed={st.activo}
                        className={`h-6 w-6 rounded-md grid place-items-center border transition-colors ${st.activo ? 'bg-kia-red text-white border-transparent' : 'border-slate-300 text-slate-400 hover:border-slate-400'}`}>
                        {st.activo ? <Icon.Check width={14} height={14} /> : <span className="text-base leading-none font-semibold">+</span>}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-semibold">{f.modelo}</td>
                    <td className="px-3 py-3"><Pill tone="gray">{f.trim}</Pill></td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(f.precio)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <Stepper onClick={() => st.activo && setDesc(f.id, -1)} disabled={!st.activo}>−</Stepper>
                        <span className="tabular font-bold w-10 text-center">{st.descuentoPct}%</span>
                        <Stepper onClick={() => st.activo && setDesc(f.id, 1)} disabled={!st.activo}>+</Stepper>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular">{fmtMXN(c.descuento)}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{f.unidades}</td>
                    <td className="px-3 py-3 text-right tabular">{fmtMXN(c.subsidioUnidad)}</td>
                    <td className="px-5 py-3 text-right tabular font-bold text-kia-red">{st.activo ? fmtMXN(c.subsidioTotal) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                <td className="px-5 py-3" colSpan={6}>Total del plan</td>
                <td className="px-3 py-3 text-right tabular">{t.unidades}</td>
                <td className="px-3 py-3" />
                <td className="px-5 py-3 text-right tabular text-kia-red">{fmtMXN(t.subsidio)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between rounded-xl bg-white border border-kia-line px-5 py-4">
        <div className="text-sm">
          <div className="font-semibold">Plan de flotilla · subsidio KMX {fmtMXN(t.subsidio)}</div>
          <div className="text-xs text-kia-gray mt-0.5">{t.versiones} versión(es) de {t.modelos} modelo(s) · {t.unidades} unidades del plan.</div>
        </div>
        <Button variant="danger" onClick={() => setGuardado(true)} disabled={guardado || t.versiones === 0}>
          {guardado ? <><Icon.Check width={16} height={16} /> Plan guardado</> : 'Guardar plan'}
        </Button>
      </div>
    </div>
  )
}

function Stepper({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="h-6 w-6 shrink-0 rounded-lg border border-kia-line grid place-items-center text-kia-black font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  )
}
