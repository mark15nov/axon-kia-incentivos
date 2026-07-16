import { useEffect, useState } from 'react'
import { Card, SectionTitle, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { fmtMXN } from '../../data/mockData.js'

const MODELOS = ['Rio', 'K3', 'K4', 'Sonet', 'Seltos', 'Sportage', 'Sportage Híbrida', 'Sorento', 'Telluride', 'Niro', 'Carnival']
const VERSIONES = ['LX', 'EX', 'SX', 'SX Prime', 'GT-Line']
const ANIOS = ['2024', '2025', '2026', '2027']

// Valores que se "extraen" del PDF de la oferta al soltarlo.
const PDF = {
  modelos: ['Sportage', 'Seltos', 'Rio', 'K4'],
  versiones: { Sportage: ['SX', 'SX Prime'], Seltos: ['EX'], Rio: ['LX'], K4: ['GT-Line'] },
  anios: ['2025', '2026'],
  bolsa: 52000,
  c1: 60
}

export default function CashbackOfertaConstructor({ cargado }) {
  const [modelos, setModelos] = useState([])
  const [versiones, setVersiones] = useState({})
  const [anios, setAnios] = useState([])
  const [bolsa, setBolsa] = useState(0)
  const [c1, setC1] = useState(50)
  const [guardado, setGuardado] = useState(false)

  // Al soltar el PDF, los 4 boxes se llenan automáticamente.
  useEffect(() => {
    if (cargado) {
      setModelos([...PDF.modelos])
      setVersiones(JSON.parse(JSON.stringify(PDF.versiones)))
      setAnios([...PDF.anios])
      setBolsa(PDF.bolsa); setC1(PDF.c1)
    } else {
      setModelos([]); setVersiones({}); setAnios([]); setBolsa(0); setC1(50)
    }
    setGuardado(false)
  }, [cargado])

  const toggleModelo = (m) => { setGuardado(false); setModelos(ms => ms.includes(m) ? ms.filter(x => x !== m) : [...ms, m]) }
  const toggleAnio = (a) => { setGuardado(false); setAnios(as => as.includes(a) ? as.filter(x => x !== a) : [...as, a]) }
  const toggleVersion = (m, v) => {
    setGuardado(false)
    setVersiones(prev => {
      const cur = prev[m] || []
      return { ...prev, [m]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] }
    })
  }
  const addBolsa = (d) => { setGuardado(false); setBolsa(b => Math.max(0, b + d)) }

  const c1Monto = Math.round(bolsa * c1 / 100)
  const c2Monto = bolsa - c1Monto

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Paso 1 · Constructor"
        title="Definir Oferta Comercial"
        desc="Al soltar el PDF de la oferta, los boxes se llenan automáticamente. Revísalos para validar que todo esté correcto, o marca/desmarca manualmente si hay cambios de último momento."
        right={<Pill tone={cargado ? 'green' : 'amber'}>{cargado ? <><Icon.Check width={14} height={14} /> Cargada del PDF</> : 'Sin cargar'}</Pill>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ---------- MODELOS ---------- */}
        <BoxHeader icon={Icon.Grid} titulo="Modelos" contador={`${modelos.length}/${MODELOS.length}`} cargado={cargado}>
          <ChipGrid options={MODELOS} selected={modelos} onToggle={toggleModelo} cols="grid-cols-2 sm:grid-cols-3" />
        </BoxHeader>

        {/* ---------- AÑO ---------- */}
        <BoxHeader icon={Icon.Clock} titulo="Año" contador={`${anios.length}/${ANIOS.length}`} cargado={cargado}>
          <ChipGrid options={ANIOS} selected={anios} onToggle={toggleAnio} cols="grid-cols-2 sm:grid-cols-4" />
        </BoxHeader>

        {/* ---------- VERSIÓN ---------- */}
        <div className="lg:col-span-2">
          <BoxHeader icon={Icon.Layers} titulo="Versión" contador={`${modelos.length} modelo(s)`} cargado={cargado}>
            {modelos.length === 0 ? (
              <p className="text-sm text-kia-gray">Selecciona al menos un modelo para definir sus versiones.</p>
            ) : (
              <div className="space-y-4">
                {modelos.map(m => (
                  <div key={m}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold">{m}</span>
                      <span className="tabular text-kia-gray">{(versiones[m] || []).length}/{VERSIONES.length}</span>
                    </div>
                    <ChipGrid options={VERSIONES} selected={versiones[m] || []} onToggle={v => toggleVersion(m, v)} cols="grid-cols-2 sm:grid-cols-5" />
                  </div>
                ))}
              </div>
            )}
          </BoxHeader>
        </div>

        {/* ---------- BOLSA DE PAGOS ---------- */}
        <div className="lg:col-span-2">
          <BoxHeader icon={Icon.Cash} titulo="Bolsa de pagos" contador={fmtMXN(bolsa)} cargado={cargado}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Bolsa total */}
              <div>
                <div className="text-[11px] font-medium text-kia-gray mb-1.5">Bolsa total</div>
                <div className="flex items-center gap-2">
                  <Stepper onClick={() => addBolsa(-5000)}>−</Stepper>
                  <span className="flex-1 text-center tabular font-bold">{fmtMXN(bolsa)}</span>
                  <Stepper onClick={() => addBolsa(5000)}>+</Stepper>
                </div>
              </div>
              {/* % Concepto 1 */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-kia-gray mb-1.5">
                  <span>% Concepto 1</span><span className="tabular font-bold text-kia-red">{c1}%</span>
                </div>
                <input type="range" min="0" max="100" step="5" value={c1}
                  onChange={e => { setC1(+e.target.value); setGuardado(false) }}
                  className="w-full cursor-pointer" style={{ accentColor: '#BB162B' }} />
                <div className="text-[11px] text-kia-gray mt-0.5 tabular">{fmtMXN(c1Monto)}</div>
              </div>
              {/* % Concepto 2 */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-kia-gray mb-1.5">
                  <span>% Concepto 2</span><span className="tabular font-bold text-kia-black">{100 - c1}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2.5">
                  <div className="h-full rounded-full bg-kia-black" style={{ width: `${100 - c1}%` }} />
                </div>
                <div className="text-[11px] text-kia-gray mt-0.5 tabular">{fmtMXN(c2Monto)}</div>
              </div>
            </div>

            {/* Reparto */}
            {bolsa > 0 && (
              <div className="mt-4 pt-4 border-t border-kia-line">
                <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
                  <div className="h-full bg-kia-red" style={{ width: `${c1}%` }} />
                  <div className="h-full bg-kia-black" style={{ width: `${100 - c1}%` }} />
                </div>
              </div>
            )}
          </BoxHeader>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-kia-gray">
          Oferta armada · <span className="font-bold text-kia-black tabular">{fmtMXN(bolsa)}</span> · {modelos.length} modelo(s) · {anios.length} año(s)
        </div>
        <Button variant="danger" disabled={!modelos.length || !bolsa} onClick={() => setGuardado(true)}>
          {guardado ? <><Icon.Check width={16} height={16} /> Oferta guardada</> : <>Guardar oferta comercial</>}
        </Button>
      </div>
    </div>
  )
}

function BoxHeader({ icon: I, titulo, contador, cargado, children }) {
  return (
    <Card className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-lg bg-slate-100 grid place-items-center text-kia-black"><I width={16} height={16} /></span>
          <h3 className="font-bold uppercase tracking-wide text-sm">{titulo}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="gray">{contador}</Pill>
          {cargado && <Pill tone="red"><Icon.Spark width={11} height={11} /> Del PDF</Pill>}
        </div>
      </div>
      {children}
    </Card>
  )
}

function ChipGrid({ options, selected, onToggle, cols }) {
  return (
    <div className={`grid ${cols} gap-1.5`}>
      {options.map(o => {
        const on = selected.includes(o)
        return (
          <button key={o} type="button" onClick={() => onToggle(o)} aria-pressed={on}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${on ? 'border-kia-line bg-white' : 'border-dashed border-slate-200 bg-slate-50/60'}`}>
            <span className={`shrink-0 h-4 w-4 rounded grid place-items-center border transition-colors ${on ? 'bg-kia-red text-white border-transparent' : 'border-slate-300 text-transparent'}`}>
              <Icon.Check width={11} height={11} />
            </span>
            <span className={`text-xs font-semibold truncate ${on ? '' : 'text-kia-gray'}`}>{o}</span>
          </button>
        )
      })}
    </div>
  )
}

function Stepper({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="h-7 w-7 shrink-0 rounded-lg border border-kia-line grid place-items-center text-kia-black font-bold hover:bg-slate-50 transition-colors">
      {children}
    </button>
  )
}
