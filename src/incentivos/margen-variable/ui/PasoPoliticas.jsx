import { Card, SectionTitle, Pill, Button } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { PARAMETROS_DEFAULT, PRESET_FINANZAS, POLITICA_ESCRITA, esPresetFinanzas } from '../motor/parametros.js'
import TablaModelos, { resumenExclusiones } from './TablaModelos.jsx'

const TONO = {
  green: { insignia: 'bg-emerald-600' },
  blue: { insignia: 'bg-sky-700' },
  ink: { insignia: 'bg-kia-black' }
}

function Umbral({ label, valor, onChange, sufijo = '%', escala = 100, paso = 1 }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2.5 border-b border-dashed border-kia-line last:border-b-0">
      <span className="text-sm text-kia-black/80">{label}</span>
      <span className="flex items-center rounded border border-kia-line bg-slate-50 focus-within:border-kia-black/40 focus-within:bg-white transition-colors">
        <input type="number" min="0" step={paso} value={Math.round(valor * escala * 100) / 100}
          onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0) onChange(n / escala) }}
          className="sin-spinner w-14 bg-transparent py-1 pl-2 text-right text-sm font-semibold tabular outline-none" />
        <span className="w-6 pr-2 text-right text-xs text-kia-gray">{sufijo}</span>
      </span>
    </label>
  )
}

function Regla({ letra, tono, titulo, children, paga }) {
  const t = TONO[tono]
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="px-5 pt-4 pb-3.5 bg-slate-50/70 border-b border-kia-line">
        <div className="flex items-center gap-2.5">
          <span className={`h-6 w-6 rounded-[5px] grid place-items-center text-white text-xs font-bold ${t.insignia}`}>{letra}</span>
          <h3 className="font-semibold text-[15px] leading-tight">{titulo}</h3>
        </div>
        <p className="text-xs text-kia-gray mt-1.5 leading-relaxed">{paga}</p>
      </div>
      <div className="px-5 pt-1.5 pb-4 flex-1">{children}</div>
    </Card>
  )
}

function Divisor({ children }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-0.5">
      <span className="text-[11px] font-medium text-kia-gray">{children}</span>
      <span className="h-px flex-1 bg-kia-line" />
    </div>
  )
}

function Excluidos({ lista }) {
  return (
    <a href="#modelos" className="group mt-3 flex items-start justify-between gap-3 rounded border border-kia-line bg-slate-50/70 px-3 py-2 text-xs hover:border-kia-black/30">
      <span>
        <span className="text-kia-gray">Modelos excluidos: </span>
        <span className="font-semibold text-kia-black">{resumenExclusiones(lista)}</span>
      </span>
      <span className="shrink-0 font-semibold text-kia-gray group-hover:text-kia-black">Configurar ↓</span>
    </a>
  )
}

function Nota({ icono: I, tono, titulo, etiqueta, children }) {
  const fondo = { red: 'bg-red-50 text-kia-red', amber: 'bg-amber-50 text-amber-700' }[tono]
  return (
    <Card className="p-4 flex items-start gap-3">
      <span className={`h-8 w-8 shrink-0 rounded grid place-items-center ${fondo}`}><I width={16} height={16} /></span>
      <div className="text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{titulo}</span>
          {etiqueta && <Pill tone="amber">{etiqueta}</Pill>}
        </div>
        <div className="text-kia-gray text-xs mt-1 leading-relaxed">{children}</div>
      </div>
    </Card>
  )
}

export default function PasoPoliticas({ parametros: p, setParametros, version, carga }) {
  const conFinanzas = version !== 'plataforma'
  const set = (k) => (v) => setParametros({ ...p, [k]: v })
  const finanzas = esPresetFinanzas(p)
  const mayor = p.comparacionInclusiva ? '≥' : '>'

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 1 · Paso 1" title="Políticas de Margen Variable"
        desc="Reglas vigentes (sujetas a cambio). Cada umbral es editable y se aplica igual en la plataforma y en las fórmulas del Excel que recibe Finanzas."
        right={<Button variant="ghost" onClick={() => setParametros(PARAMETROS_DEFAULT)}><Icon.Refresh width={15} height={15} /> Restablecer</Button>} />

      {/* Interpretación (sólo en la versión con conciliación) */}
      {conFinanzas && (
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-6 p-5">
            <div className="max-w-xl">
              <h3 className="font-semibold text-[15px]">¿Con qué interpretación calculamos?</h3>
              <p className="text-sm text-kia-gray mt-1 leading-relaxed">
                La guía (archivo de cálculo de Finanzas) es la regla oficial. El texto de la política difiere en tres puntos (bono, "mayor a" y curtailment).
                Con la guía, la plataforma coincide en <b className="text-kia-black">8,113 de 8,114 VIN</b>; con la política escrita
                el pago de marzo es <b className="text-kia-black">$3.47 M menor</b> ($21.92 M vs $25.39 M).
              </p>
            </div>
            <div className="flex shrink-0 rounded-md border border-kia-line p-1 bg-slate-50 gap-1" role="radiogroup" aria-label="Interpretación de la política">
              {[
                { id: 'finanzas', label: 'Guía de Finanzas', sub: 'Oficial · bono sobre retail · "≥" · curtailment en $0', on: finanzas, apply: () => setParametros({ ...p, ...PRESET_FINANZAS }) },
                { id: 'politica', label: 'Política escrita', sub: 'Bono sobre ventas totales · ">" · sin curtailment', on: !finanzas, apply: () => setParametros({ ...p, ...POLITICA_ESCRITA }) }
              ].map(o => (
                <button key={o.id} role="radio" aria-checked={o.on} onClick={o.apply}
                  className={`w-48 text-left rounded px-3.5 py-2.5 transition-colors ${o.on ? 'bg-kia-black text-white shadow-sm' : 'text-kia-black hover:bg-white'}`}>
                  <div className="text-sm font-semibold">{o.label}</div>
                  <div className={`text-[11px] mt-0.5 leading-snug ${o.on ? 'text-white/60' : 'text-kia-gray'}`}>{o.sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-kia-line md:divide-x divide-kia-line bg-slate-50/60">
            <div className="px-5 py-3.5 text-sm">
              <div className="font-semibold">Base del bono 110%</div>
              <div className="text-kia-gray text-xs mt-1">Política: ventas totales (retail + demo + flota) vs MOU total. Finanzas: ventas retail vs MOU retail. Explica 1,836 VIN de marzo.</div>
            </div>
            <div className="px-5 py-3.5 text-sm">
              <div className="font-semibold">"Mayor a" vs "mayor o igual"</div>
              <div className="text-kia-gray text-xs mt-1">Finanzas usa &gt;0.999 / &gt;1.099 / &gt;0.899: un modelo en 100% exacto sí paga. Explica 114 VIN de marzo.</div>
            </div>
          </div>
        </Card>
      )}

      {/* Reglas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Regla letra="A" tono="green" titulo="Cumplimiento retail" paga="Paga la provisión de todas las unidades (retail, demo, flota).">
          <Umbral label="Ventas retail vs MOU retail ≥" valor={p.umbralRetail} onChange={set('umbralRetail')} />
          <Divisor>y además, cualquiera de</Divisor>
          <Umbral label="WHS vs objetivo ≥" valor={p.umbralWhs} onChange={set('umbralWhs')} />
          <Umbral label="MOS >" valor={p.umbralMos} onChange={set('umbralMos')} sufijo="" escala={1} paso={0.1} />
        </Regla>
        <Regla letra="B" tono="blue" titulo="Cumplimiento por modelo" paga="Retail < 100%: paga sólo las unidades del modelo que cumple.">
          <Umbral label={`WHS vs objetivo ${mayor}`} valor={p.umbralWhs} onChange={set('umbralWhs')} />
          <Umbral label={`Ventas del modelo vs MOU ${mayor}`} valor={p.umbralModelo} onChange={set('umbralModelo')} />
          <p className="text-xs text-kia-gray pt-3 leading-relaxed">K3 SD + K3 HB y K4 SD + K4 HB se evalúan como una sola familia.</p>
          <Excluidos lista={p.modelosSinReglaB} />
        </Regla>
        <Regla letra="+" tono="ink" titulo="Bono adicional" paga="Sobre la provisión pagada (regla A o B), sólo inventario nuevo.">
          <Umbral label={`Ventas ${p.baseBono === 'retail' ? 'retail' : 'totales'} vs MOU ${mayor}`} valor={p.umbralBono} onChange={set('umbralBono')} />
          <Umbral label="Factor sobre provisión" valor={p.factorBono} onChange={set('factorBono')} sufijo="×" escala={1} paso={0.05} />
          <Excluidos lista={p.modelosSinBono} />
        </Regla>
      </div>

      <TablaModelos parametros={p} setParametros={setParametros} ventas={carga?.datos?.ventas} />

      <div className={`grid grid-cols-1 gap-4 ${p.excluirCurtailment ? 'md:grid-cols-2' : ''}`}>
        <Nota icono={Icon.Trending} tono="red" titulo="Forecast">
          Por default se asume que el dealer cumple WHS ≥ 90% o MOS &gt; 2; se ajustará con los resultados históricos.
        </Nota>
        {p.excluirCurtailment && (
          <Nota icono={Icon.Shield} tono="amber" titulo="Curtailment" etiqueta="Hoja nueva en el layout">
            Como en la guía, los VIN con curtailment se pagan en $0. El Layout MV debe traer la hoja <b className="text-kia-black">LY_CURTAILMENT</b> (VIN, PROGRAMA); el layout actual no la tiene.
          </Nota>
        )}
      </div>
    </div>
  )
}
