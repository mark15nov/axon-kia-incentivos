import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import {
  ofForecastInbursa, ofDiferencia, ofForecastTotales,
  OF_FINANCIERA, OF_CORREO_FINANCIERA, OF_PERIODO, fmtMXN
} from '../../data/openingFee.js'

export default function OpeningStep3RevisionForecast() {
  const t = ofForecastTotales()
  const enContra = ofForecastInbursa.filter(f => ofDiferencia(f).enContra)
  const [enviados, setEnviados] = useState([])

  const enviar = (id) => setEnviados(e => (e.includes(id) ? e : [...e, id]))
  const enviarTodos = () => setEnviados(enContra.map(f => f.id))

  const pendientes = enContra.filter(f => !enviados.includes(f.id))
  const todoEnviado = enContra.length > 0 && pendientes.length === 0

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 3 · Revisión financiera"
        title={`Revisión vs. Forecast de ${OF_FINANCIERA}`}
        desc={`Se compara el monto proyectado por KIA contra el forecast de ${OF_FINANCIERA} por dealer. Cuando el monto de KIA es mayor al forecasteado por la financiera existe una diferencia en contra, y se envía un correo a ${OF_FINANCIERA} para analizar la diferencia antes de liberar el pago.`}
        right={<Pill tone={enContra.length ? (todoEnviado ? 'green' : 'amber') : 'green'}>
          {enContra.length === 0
            ? <><Icon.Check width={13} height={13} /> Sin diferencias</>
            : todoEnviado
              ? <><Icon.Check width={13} height={13} /> Correos enviados</>
              : <><Icon.Alert width={13} height={13} /> {pendientes.length} en contra</>}
        </Pill>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Forecast KIA" value={fmtMXN(t.kia)} sub={`${t.dealers} dealers`} />
        <Kpi label={`Forecast ${OF_FINANCIERA}`} value={fmtMXN(t.inbursa)} sub="Proyección financiera" />
        <Kpi label="Diferencia en contra" value={fmtMXN(t.montoEnContra)} sub={`${t.enContra} dealer(s) por encima`} accent />
        <Kpi label="Correos pendientes" value={pendientes.length} sub={`de ${enContra.length} diferencias`} />
      </div>

      {/* Comparativo por dealer */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
          <h3 className="font-bold flex items-center gap-2"><Icon.Grid width={17} height={17} /> Forecast KIA vs {OF_FINANCIERA} por dealer</h3>
          {pendientes.length > 0 && (
            <Button variant="soft" onClick={enviarTodos}><Icon.Mail width={15} height={15} /> Notificar todas</Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <th className="text-left font-semibold px-5 py-3">Dealer</th>
                <th className="text-left font-semibold px-3 py-3">Zona</th>
                <th className="text-right font-semibold px-3 py-3">Forecast KIA</th>
                <th className="text-right font-semibold px-3 py-3">Forecast {OF_FINANCIERA}</th>
                <th className="text-right font-semibold px-3 py-3">Diferencia</th>
                <th className="text-right font-semibold px-5 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ofForecastInbursa.map(f => {
                const d = ofDiferencia(f)
                const enviado = enviados.includes(f.id)
                return (
                  <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-semibold">{f.dealer}</td>
                    <td className="px-3 py-3 text-kia-gray">{f.zona}</td>
                    <td className="px-3 py-3 text-right tabular font-semibold">{fmtMXN(f.kia)}</td>
                    <td className="px-3 py-3 text-right tabular text-kia-gray">{fmtMXN(f.inbursa)}</td>
                    <td className={`px-3 py-3 text-right tabular font-bold ${d.enContra ? 'text-kia-red' : d.diferencia < 0 ? 'text-emerald-600' : 'text-kia-gray'}`}>
                      {d.enContra ? `+${fmtMXN(d.diferencia)}` : d.diferencia < 0 ? `−${fmtMXN(Math.abs(d.diferencia))}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!d.enContra ? (
                        <Pill tone="green"><Icon.Check width={12} height={12} /> Conforme</Pill>
                      ) : enviado ? (
                        <Pill tone="blue"><Icon.Mail width={12} height={12} /> Correo enviado</Pill>
                      ) : (
                        <button onClick={() => enviar(f.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-kia-red px-2.5 py-1 text-xs font-semibold hover:bg-red-100 transition-colors">
                          <Icon.Mail width={12} height={12} /> Enviar correo
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-kia-line bg-slate-50 font-bold">
                <td className="px-5 py-3" colSpan={2}>Total</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.kia)}</td>
                <td className="px-3 py-3 text-right tabular">{fmtMXN(t.inbursa)}</td>
                <td className="px-3 py-3 text-right tabular text-kia-red">{t.diferencia > 0 ? `+${fmtMXN(t.diferencia)}` : fmtMXN(t.diferencia)}</td>
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Correo de análisis de diferencia */}
      {enContra.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
            <h3 className="font-bold flex items-center gap-2"><Icon.Mail width={17} height={17} className="text-kia-red" /> Correo · análisis de diferencia</h3>
            <Pill tone={todoEnviado ? 'green' : 'amber'}>{todoEnviado ? 'Enviado' : 'Borrador'}</Pill>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div><span className="text-kia-gray">Para:</span> <span className="font-semibold">{OF_CORREO_FINANCIERA}</span></div>
              <div><span className="text-kia-gray">Asunto:</span> <span className="font-semibold">Diferencia en forecast Opening Fee · {OF_PERIODO}</span></div>
            </div>
            <div className="rounded-xl border border-kia-line bg-slate-50/60 p-4 text-sm leading-relaxed">
              <p>Estimado equipo de {OF_FINANCIERA}:</p>
              <p className="mt-2">En la revisión del forecast del Opening Fee de <strong>{OF_PERIODO}</strong> identificamos una diferencia en contra de <strong>{fmtMXN(t.montoEnContra)}</strong> en {t.enContra} dealer(s), donde el monto proyectado por KIA supera su forecast:</p>
              <ul className="mt-2 space-y-1">
                {enContra.map(f => {
                  const d = ofDiferencia(f)
                  return (
                    <li key={f.id} className="flex items-center justify-between max-w-md">
                      <span className="text-kia-gray">{f.dealer}</span>
                      <span className="tabular font-semibold text-kia-red">+{fmtMXN(d.diferencia)}</span>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2">Agradecemos revisar el detalle para conciliar la diferencia antes de liberar el pago del periodo.</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-kia-gray">
                {todoEnviado
                  ? `Correo enviado a ${OF_FINANCIERA} para ${enContra.length} dealer(s).`
                  : `${pendientes.length} diferencia(s) pendiente(s) de notificar.`}
              </span>
              <Button variant="danger" onClick={enviarTodos} disabled={todoEnviado}>
                {todoEnviado ? <><Icon.Check width={16} height={16} /> Correo enviado</> : <><Icon.Mail width={16} height={16} /> Enviar correo de análisis</>}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm border ${enContra.length === 0 || todoEnviado ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
        {enContra.length === 0 || todoEnviado
          ? <Icon.Check width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" />
          : <Icon.Alert width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />}
        <p>{enContra.length === 0
          ? <>El forecast de KIA está por debajo o igual al de {OF_FINANCIERA} en todos los dealers. No hay diferencia en contra; el periodo queda listo para pago.</>
          : todoEnviado
            ? <>Se notificó a {OF_FINANCIERA} la diferencia en contra de <strong>{fmtMXN(t.montoEnContra)}</strong>. Se analiza con la financiera antes de liberar el pago del periodo.</>
            : <>Hay una diferencia en contra de <strong>{fmtMXN(t.montoEnContra)}</strong> en {t.enContra} dealer(s). Envía el correo a {OF_FINANCIERA} para analizar la diferencia antes de pagar.</>}</p>
      </div>
    </div>
  )
}
