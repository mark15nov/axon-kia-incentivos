import { Card, SectionTitle, Kpi, Pill } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  feriaCondiciones, feriaForecast, feriaCalcFila, feriaNotasDiff, feriaTotales,
  TASA_ESTANDAR, TASA_FERIA, KMX_SHARE, FERIA_INPUTS, fmtMXN
} from '../../data/feriaCredito.js'

const sharePct = Math.round(KMX_SHARE * 100)

export default function FeriaStep1Condiciones() {
  const t = feriaTotales()

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Origen Zap"
        title="Condiciones y Cálculo · KIA + Inbursa"
        desc="La feria es por tasa: Zap toma la Oferta Comercial y el archivo Inbursa, y la diferencia entre el monto a tasa estándar y a tasa de feria es la subvención a pagar. Esa diferencia × el Share KMX define el pago de KIA, que se compara contra lo que solicita Inbursa."
        right={<Pill tone="ink"><Icon.Database width={14} height={14} /> Sincronizado con Zap</Pill>}
      />

      {/* Parámetros de tasa + inputs */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Icon.Percent width={16} height={16} className="text-sky-600" />
            <span className="text-sm">
              Tasa estándar <span className="font-bold tabular">{TASA_ESTANDAR}%</span>
              <span className="text-kia-gray mx-1.5">→</span>
              Tasa feria <span className="font-bold tabular text-sky-700">{TASA_FERIA}%</span>
            </span>
          </div>
          <div className="h-5 w-px bg-kia-line" />
          <div className="flex items-center gap-2 text-sm">
            <Icon.Sliders width={16} height={16} className="text-kia-red" />
            Share KMX <span className="font-bold tabular text-kia-red">{sharePct}%</span>
            <span className="text-xs text-kia-gray">de la diferencia</span>
          </div>
          <div className="h-5 w-px bg-kia-line" />
          <div className="flex items-center gap-2">
            {FERIA_INPUTS.map(i => (
              <Pill key={i.nombre} tone={i.tipo === 'PDF' ? 'red' : 'green'}>
                {i.tipo === 'PDF' ? <Icon.Pdf width={13} height={13} /> : <Icon.Excel width={13} height={13} />} {i.nombre}
              </Pill>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Diferencia (subvención)" value={fmtMXN(t.diferencia)} sub="Monto a pagar por tasa" />
        <Kpi label={`Pago KIA · Share ${sharePct}%`} value={fmtMXN(t.pagoKia)} sub="Diferencia × Share KMX" accent />
        <Kpi label="Inbursa solicitado" value={fmtMXN(t.inbursaSolicitado)} sub={`${t.unidades} unidades forecast`} />
        <Kpi label="Excedente a aclarar" value={fmtMXN(t.excedente)} sub={`${t.modelosExcedente} modelo(s) sobre lo calculado`} />
      </div>

      {/* Condiciones por socio */}
      <div className="grid grid-cols-2 gap-6">
        <CondicionesCard socio="KIA" tone="red" items={feriaCondiciones.kia} icon={Icon.Sliders} />
        <CondicionesCard socio="Inbursa" tone="blue" items={feriaCondiciones.inbursa} icon={Icon.Percent} />
      </div>

      {/* Cálculo por modelo / año */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Database width={17} height={17} /> Cálculo por modelo · diferencia × Share KMX</h3>
          <Pill tone="gray">Pago KIA = diferencia × {sharePct}%</Pill>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Modelo / año</th>
                <th className="text-right font-semibold px-3 py-3">u</th>
                <th className="text-right font-semibold px-3 py-3">Monto estándar</th>
                <th className="text-right font-semibold px-3 py-3">Monto feria</th>
                <th className="text-right font-semibold px-3 py-3">Diferencia</th>
                <th className="text-right font-semibold px-3 py-3">Pago KIA ({sharePct}%)</th>
                <th className="text-right font-semibold px-3 py-3">Inbursa solicita</th>
                <th className="text-right font-semibold px-5 py-3">Δ excedente</th>
              </tr>
            </thead>
            <tbody>
              {feriaForecast.map(f => {
                const c = feriaCalcFila(f)
                const nota = feriaNotasDiff[f.modelo]
                return (
                  <tr key={f.modelo} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-semibold">
                      {f.modelo} <span className="text-[11px] text-kia-gray font-normal">· {f.anio}</span>
                      {nota && <div className="text-[11px] font-normal text-amber-600 mt-0.5 flex items-center gap-1 whitespace-normal"><Icon.Alert width={11} height={11} className="shrink-0" /> {nota}</div>}
                    </td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{f.unidades}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(f.montoOriginal)}</td>
                    <td className="px-3 py-3 text-right tabular text-sky-700">{fmtMXN(f.montoFeria)}</td>
                    <td className="px-3 py-3 text-right tabular font-semibold">{fmtMXN(c.diferencia)}</td>
                    <td className="px-3 py-3 text-right tabular font-bold text-kia-red">{fmtMXN(c.pagoKia)}</td>
                    <td className="px-3 py-3 text-right tabular">{fmtMXN(f.inbursaSolicitado)}</td>
                    <td className={`px-5 py-3 text-right tabular font-bold ${c.excedente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {c.excedente > 0 ? `+${fmtMXN(c.excedente)}` : '✓'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                <td className="px-5 py-3">Total</td>
                <td className="px-3 py-3 text-right tabular">{t.unidades}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.montoOriginal)}</td>
                <td className="px-3 py-3 text-right tabular text-sky-700">{fmtMXN(t.montoFeria)}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.diferencia)}</td>
                <td className="px-3 py-3 text-right tabular text-kia-red">{fmtMXN(t.pagoKia)}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.inbursaSolicitado)}</td>
                <td className="px-5 py-3 text-right tabular text-amber-600">{t.excedente > 0 ? `+${fmtMXN(t.excedente)}` : '✓'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3.5 text-sm text-amber-900">
        <Icon.Alert width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p>Inbursa solicita <strong>{fmtMXN(t.excedente)}</strong> por encima de lo calculado en {t.modelosExcedente} modelo(s). El excedente se revisa y aclara con Inbursa antes de solicitar el monto aprobado y enviarlo a Finanzas para validación y pago en SAP.</p>
      </div>
    </div>
  )
}

function CondicionesCard({ socio, tone, items, icon: I }) {
  const accent = tone === 'red' ? 'text-kia-red' : 'text-sky-700'
  const chip = tone === 'red' ? 'red' : 'blue'
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2"><I width={17} height={17} className={accent} /> Condiciones {socio}</h3>
        <Pill tone={chip}>{socio}</Pill>
      </div>
      <div className="space-y-2">
        {items.map(c => (
          <div key={c.concepto} className="flex items-start justify-between rounded-xl border border-kia-line px-3.5 py-3 hover:border-slate-300 transition-colors">
            <div className="min-w-0 pr-3">
              <div className="text-sm font-semibold">{c.concepto}</div>
              <div className="text-xs text-kia-gray mt-0.5 leading-snug">{c.detalle}</div>
            </div>
            <div className={`text-sm font-bold shrink-0 ${accent}`}>{c.valor}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
