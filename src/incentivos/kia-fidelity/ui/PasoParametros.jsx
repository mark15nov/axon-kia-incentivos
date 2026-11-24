import { Card, SectionTitle, Pill, Button } from '../../margen-variable/ui/base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { PARAMETROS_DEFAULT } from '../motor/parametros.js'

function Campo({ label, ayuda, valor, onChange, sufijo, paso = 1, pendiente }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b border-dashed border-kia-line last:border-b-0">
      <span>
        <span className="text-sm text-kia-black/85 flex items-center gap-2">{label}{pendiente && <Pill tone="amber">Por confirmar</Pill>}</span>
        {ayuda && <span className="block text-xs text-kia-gray mt-0.5">{ayuda}</span>}
      </span>
      <span className="flex items-center rounded border border-kia-line bg-slate-50 focus-within:border-kia-black/40 focus-within:bg-white shrink-0">
        <input type="number" min="0" step={paso} value={valor}
          onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0) onChange(n) }}
          className="sin-spinner w-16 bg-transparent py-1 pl-2 text-right text-sm font-semibold tabular outline-none" />
        <span className="pr-2 pl-1 text-xs text-kia-gray">{sufijo}</span>
      </span>
    </label>
  )
}

const REGLAS_A = [
  ['Cuadre', 'Cada Dossier de CONTRATOS existe en la calculadora y la suma del Charge coincide con la hoja CHARGE.'],
  ['Duplicados', 'Dossier repetidos y VIN en más de un Dossier.'],
  ['VIN válido', '17 caracteres y existe en SAP Fidelity.'],
  ['Datos de captura', 'Plazo, tasa y monto iguales a la calculadora; monto = precio − enganche + accesorios + GAP (+ seguro financiado); versión igual a SAP.'],
  ['Tasa de beneficio', 'Tasa teórica = tasa real + beneficio de la versión según catálogo vigente.'],
  ['Recálculo del Charge', 'Amortización independiente con tolerancia al centavo; detecta si el total de intereses reales (AC) no cuadra con el detalle mensual.'],
  ['Seguro Externa', 'Contratos con póliza de otra aseguradora o sin modalidad.']
]
const REGLAS_B = [
  ['Ya pagado', 'El VIN ya tiene Fidelity en VINS_PAGADOS.'],
  ['Incompatible', 'El VIN tiene otro incentivo pagado no compatible según la matriz COMPAT.'],
  ['Duplicado', 'El VIN aparece en otro contrato.'],
  ['Fuera de plazo (N-rule)', 'Retail Date de SAP fuera del plazo permitido respecto al contrato.'],
  ['Demo', 'Reg.Type Desc = Dealer Demo: alta (Billing Date) contra la fecha del contrato.']
]

function ListaReglas({ titulo, sub, reglas, tono }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-kia-line flex items-center gap-2.5">
        <span className={`h-6 w-6 rounded-[5px] grid place-items-center text-white text-xs font-bold ${tono}`}>{titulo[0]}</span>
        <div>
          <h3 className="font-semibold text-[15px] leading-tight">{titulo}</h3>
          <p className="text-xs text-kia-gray">{sub}</p>
        </div>
      </div>
      <ol className="divide-y divide-kia-line">
        {reglas.map(([t, d]) => (
          <li key={t} className="px-5 py-2.5 text-sm"><span className="font-semibold">{t}.</span> <span className="text-kia-gray">{d}</span></li>
        ))}
      </ol>
    </Card>
  )
}

export default function PasoParametros({ parametros: p, setParametros }) {
  const set = (k) => (v) => setParametros({ ...p, [k]: v })
  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 1 · Paso 1" title="Reglas y parámetros de Kia Fidelity"
        desc="Charge = intereses a tasa teórica − intereses a tasa real. Se responden dos preguntas por separado: cuánto se paga a la financiera y qué se debita al distribuidor. El débito no se resta del pago."
        right={<Button variant="ghost" onClick={() => setParametros(PARAMETROS_DEFAULT)}><Icon.Refresh width={15} height={15} /> Restablecer</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListaReglas titulo="A · Pago a la financiera" sub="Valida que lo reclamado esté correcto, completo y sin duplicados" reglas={REGLAS_A} tono="bg-sky-700" />
        <ListaReglas titulo="B · Débitos al distribuidor" sub="Contratos que no cumplen las reglas de Kia, con motivo por VIN" reglas={REGLAS_B} tono="bg-kia-red" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-kia-line">
          <h3 className="font-semibold text-[15px]">Parámetros</h3>
          <p className="text-xs text-kia-gray mt-0.5">Los marcados "por confirmar" los define Kia; mientras tanto se usan estos valores.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-kia-line">
          <div className="px-5 py-1">
            <Campo label="N-rule: meses previos permitidos" ayuda="El retail puede caer en el mes del contrato o hasta N meses antes." valor={p.nRuleMeses} onChange={set('nRuleMeses')} sufijo="meses" pendiente />
            <Campo label="Antigüedad mínima del demo" ayuda="Días entre el alta del demo (Billing Date SAP) y la fecha del contrato." valor={p.demoMinDias} onChange={set('demoMinDias')} sufijo="días" pendiente />
          </div>
          <div className="px-5 py-1">
            <Campo label="Tolerancia del recálculo" ayuda="Diferencia máxima aceptada entre el Charge reclamado y el recalculado." valor={p.toleranciaCentavos} onChange={set('toleranciaCentavos')} sufijo="$" paso={0.01} />
            <div className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="text-sm text-kia-black/85">Monto del débito al dealer</span>
                <span className="block text-xs text-kia-gray mt-0.5">Charge que se debita por VIN.</span>
              </span>
              <span className="flex shrink-0 rounded-md border border-kia-line p-0.5 bg-slate-50" role="radiogroup" aria-label="Base del débito">
                {[['recalculado', 'Recalculado'], ['reclamado', 'Reclamado']].map(([id, label]) => (
                  <button key={id} role="radio" aria-checked={p.baseDebito === id} onClick={() => set('baseDebito')(id)}
                    className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${p.baseDebito === id ? 'bg-kia-black text-white' : 'text-kia-gray hover:text-kia-black'}`}>{label}</button>
                ))}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 flex items-start gap-3">
        <span className="h-8 w-8 shrink-0 rounded grid place-items-center bg-slate-100 text-kia-gray"><Icon.Shield width={16} height={16} /></span>
        <p className="text-xs text-kia-gray leading-relaxed">
          <b className="text-kia-black">Regla general de la plataforma:</b> todo incentivo que se cargue valida que el VIN no tenga ya pagado otro incentivo
          no compatible según la matriz COMPAT. Los cálculos los hace el motor de reglas; si un caso no está cubierto por las reglas queda <b className="text-kia-black">por revisar</b>.
        </p>
      </Card>
    </div>
  )
}
