import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  ofBaremos, ofModelosPrecio, ofCalcOferta,
  OF_KMX_SHARE, OF_DEALER_SHARE, fmtMXN
} from '../../data/openingFee.js'

const REGLAS = [
  'El monto financiado considera precio del vehículo, enganche, accesorios y localizador opcional.',
  'El enganche se valida contra el mínimo requerido por Inbursa para el baremo seleccionado.',
  'El incentivo = base de subsidio × factor de retención × share KMX.',
  'Los shares KMX y dealer se obtienen del PDF comercial de Inbursa.'
]

const kmxPct = Math.round(OF_KMX_SHARE * 100)
const dealerPct = Math.round(OF_DEALER_SHARE * 100)

export default function OpeningStep1DefinirOferta() {
  const [baremoId, setBaremoId] = useState('B')
  const [modelo, setModelo] = useState('Sportage')
  const [precio, setPrecio] = useState(545000)
  const [enganche, setEnganche] = useState(163500)
  const [accesorios, setAccesorios] = useState(18000)
  const [locActivo, setLocActivo] = useState(true)
  const [localizador, setLocalizador] = useState(6500)
  const [guardado, setGuardado] = useState(false)

  const baremo = ofBaremos.find(b => b.id === baremoId)
  const loc = locActivo ? localizador : 0
  const r = useMemo(
    () => ofCalcOferta({ precio, enganche, accesorios, localizador: loc, baremo }),
    [precio, enganche, accesorios, loc, baremo]
  )

  const touch = (setter) => (v) => { setter(v); setGuardado(false) }
  const elegirModelo = (m) => {
    const item = ofModelosPrecio.find(x => x.modelo === m)
    setModelo(m)
    if (item) { setPrecio(item.precio); setEnganche(Math.round(item.precio * baremo.minEnganchePct)) }
    setGuardado(false)
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Constructor"
        title="Definir Oferta"
        desc="Arma la oferta del Opening Fee a partir de la operación de financiamiento: el sistema calcula el monto financiado, valida el enganche contra el baremo de Inbursa y determina el incentivo de KMX con la base de subsidio, el factor de retención y el share comercial."
        right={<Pill tone={guardado ? 'green' : 'amber'}>{guardado ? <><Icon.Check width={14} height={14} /> Guardada</> : 'Borrador'}</Pill>}
      />

      {/* Reglas de cálculo */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {REGLAS.map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-kia-gray">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-slate-100 grid place-items-center text-[10px] font-bold text-kia-black">{i + 1}</span>
              <span className="leading-snug">{t}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Parámetros: baremo + shares del PDF Inbursa */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Icon.Sliders width={16} height={16} className="text-kia-red" />
            <span className="text-kia-gray">Baremo Inbursa</span>
            <div className="inline-flex rounded-xl border border-kia-line p-0.5 bg-slate-50">
              {ofBaremos.map(b => (
                <button key={b.id} onClick={() => { setBaremoId(b.id); setGuardado(false) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${baremoId === b.id ? 'bg-white text-kia-black shadow-sm' : 'text-kia-gray hover:text-kia-black'}`}>
                  {b.id}
                </button>
              ))}
            </div>
          </div>
          <div className="h-5 w-px bg-kia-line" />
          <div className="text-sm">
            Plazo <span className="font-bold tabular">{baremo.plazo}m</span>
            <span className="text-kia-gray mx-1.5">·</span>
            Tasa <span className="font-bold tabular text-sky-700">{baremo.tasa}%</span>
            <span className="text-kia-gray mx-1.5">·</span>
            Retención <span className="font-bold tabular">{Math.round(baremo.retencion * 100)}%</span>
          </div>
          <div className="h-5 w-px bg-kia-line" />
          <div className="flex items-center gap-2">
            <Pill tone="red"><Icon.Pdf width={13} height={13} /> PDF comercial Inbursa</Pill>
            <Pill tone="gray">KMX {kmxPct}%</Pill>
            <Pill tone="gray">Dealer {dealerPct}%</Pill>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ---------- Datos de la operación ---------- */}
        <Card className="lg:col-span-3 p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Icon.Sliders width={17} height={17} /> Datos de la operación</h3>

          {/* Modelo */}
          <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">Modelo</label>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {ofModelosPrecio.map(m => (
              <button key={m.modelo} onClick={() => elegirModelo(m.modelo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${modelo === m.modelo ? 'border-kia-red bg-red-50/60 text-kia-red' : 'border-kia-line text-kia-gray hover:border-slate-300'}`}>
                {m.modelo}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MoneyField label="Precio del vehículo" value={precio} onChange={touch(setPrecio)} />
            <MoneyField label="Enganche" value={enganche} onChange={touch(setEnganche)}
              hint={r.engancheOk
                ? <span className="text-emerald-600 flex items-center gap-1"><Icon.Check width={11} height={11} /> Válido · mín {fmtMXN(r.engancheMin)}</span>
                : <span className="text-kia-red flex items-center gap-1"><Icon.Alert width={11} height={11} /> Bajo el mínimo Inbursa · {fmtMXN(r.engancheMin)}</span>}
              invalid={!r.engancheOk} />
            <MoneyField label="Accesorios" value={accesorios} onChange={touch(setAccesorios)} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-kia-gray uppercase tracking-wide">Localizador (opcional)</label>
                <button onClick={() => { setLocActivo(v => !v); setGuardado(false) }}
                  className={`h-5 w-9 rounded-full transition-colors relative ${locActivo ? 'bg-kia-red' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${locActivo ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <input type="number" value={localizador} disabled={!locActivo}
                onChange={e => { setLocalizador(Math.max(0, +e.target.value)); setGuardado(false) }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm tabular font-semibold focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${locActivo ? 'border-kia-line' : 'border-slate-200 bg-slate-50 text-slate-400'}`} />
            </div>
          </div>

          {/* Composición del monto financiado */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
            <div className="flex items-center justify-between text-kia-gray">
              <span>Precio + accesorios{locActivo ? ' + localizador' : ''} − enganche</span>
              <span className="tabular">{fmtMXN(precio)} + {fmtMXN(accesorios)}{locActivo ? ` + ${fmtMXN(loc)}` : ''} − {fmtMXN(enganche)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold">Monto financiado</span>
              <span className="tabular font-bold text-lg">{fmtMXN(r.financiado)}</span>
            </div>
          </div>
        </Card>

        {/* ---------- Resultado del incentivo ---------- */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-kia-red font-semibold">Incentivo KMX</div>
            <div className="text-3xl font-bold tabular mt-1">{fmtMXN(r.incentivoKmx)}</div>
            <div className="text-xs text-kia-gray">Base × retención × share KMX</div>

            <div className="mt-4 space-y-2 text-sm">
              <RowCalc label="Base de subsidio" detalle={`${(baremo.subsidioPct * 100).toFixed(1)}% del financiado`} value={fmtMXN(r.subsidioBase)} />
              <RowCalc label="× Factor de retención" detalle={`${Math.round(baremo.retencion * 100)}%`} value={fmtMXN(r.subsidioNeto)} />
              <RowCalc label={`× Share KMX`} detalle={`${kmxPct}% del PDF Inbursa`} value={fmtMXN(r.incentivoKmx)} accent />
            </div>

            {/* Split KMX vs dealer */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-kia-gray mb-1.5">
                <span>Reparto del subsidio neto</span>
                <span className="tabular">{fmtMXN(r.subsidioNeto)}</span>
              </div>
              <div className="flex h-7 rounded-lg overflow-hidden bg-slate-100">
                <div className="h-full bg-kia-red flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${kmxPct}%` }}>KMX {kmxPct}%</div>
                <div className="h-full bg-kia-black flex items-center justify-center text-[11px] font-bold text-white" style={{ width: `${dealerPct}%` }}>Dealer {dealerPct}%</div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-kia-gray">KMX <span className="tabular font-semibold text-kia-black">{fmtMXN(r.incentivoKmx)}</span></span>
                <span className="text-kia-gray">Dealer <span className="tabular font-semibold text-kia-black">{fmtMXN(r.pagoDealer)}</span></span>
              </div>
            </div>
          </Card>

          <Button variant="danger" className="w-full" disabled={!r.engancheOk || r.financiado <= 0} onClick={() => setGuardado(true)}>
            {guardado ? <><Icon.Check width={16} height={16} /> Oferta guardada</> : 'Guardar oferta'}
          </Button>
          {!r.engancheOk && (
            <p className="text-[11px] text-center text-kia-red">Ajusta el enganche al mínimo de Inbursa para guardar.</p>
          )}
        </div>
      </div>

      {/* Tabla de baremos */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Database width={17} height={17} /> Baremos de Inbursa</h3>
          <Pill tone="gray">Seleccionado · {baremo.nombre}</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Baremo</th>
                <th className="text-right font-semibold px-3 py-3">Plazo</th>
                <th className="text-right font-semibold px-3 py-3">Tasa</th>
                <th className="text-right font-semibold px-3 py-3">Enganche mín.</th>
                <th className="text-right font-semibold px-3 py-3">Retención</th>
                <th className="text-right font-semibold px-5 py-3">% Subsidio</th>
              </tr>
            </thead>
            <tbody>
              {ofBaremos.map(b => (
                <tr key={b.id} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50/60 ${b.id === baremoId ? 'bg-red-50/40' : ''}`}
                  onClick={() => { setBaremoId(b.id); setGuardado(false) }}>
                  <td className="px-5 py-3 font-semibold">{b.nombre}</td>
                  <td className="px-3 py-3 text-right tabular text-kia-gray">{b.plazo}m</td>
                  <td className="px-3 py-3 text-right tabular text-sky-700">{b.tasa}%</td>
                  <td className="px-3 py-3 text-right tabular">{Math.round(b.minEnganchePct * 100)}%</td>
                  <td className="px-3 py-3 text-right tabular">{Math.round(b.retencion * 100)}%</td>
                  <td className="px-5 py-3 text-right tabular font-semibold text-kia-red">{(b.subsidioPct * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function MoneyField({ label, value, onChange, hint, invalid }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input type="number" value={value} onChange={e => onChange(Math.max(0, +e.target.value))}
          className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm tabular font-semibold focus:outline-none focus:ring-2 focus:ring-slate-100 ${invalid ? 'border-kia-red focus:border-kia-red' : 'border-kia-line focus:border-slate-400'}`} />
      </div>
      {hint && <div className="text-[11px] mt-1">{hint}</div>}
    </div>
  )
}

function RowCalc({ label, detalle, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        <span className="text-[11px] text-kia-gray ml-1.5">{detalle}</span>
      </span>
      <span className={`tabular font-bold shrink-0 ${accent ? 'text-kia-red' : ''}`}>{value}</span>
    </div>
  )
}
