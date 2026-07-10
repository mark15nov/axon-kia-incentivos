import { useState } from 'react'
import { Icon } from '../../components/icons.jsx'
import kiaLogo from '../../assets/kia-logo.png'
import { Button } from '../../components/ui.jsx'
import { OF_PERIODO } from '../../data/openingFee.js'

import OpeningStep1 from './OpeningStep1DefinirOferta.jsx'
import OpeningFeeStep1 from './OpeningFeeStep1DefinirOferta.jsx'
import FloorPlanStep1 from './FloorPlanStep1DefinirOferta.jsx'
import OpeningStep2 from './OpeningStep2Forecast.jsx'
import OpeningStep3 from './OpeningStep3RevisionForecast.jsx'
import OpeningStep4 from './OpeningStep4Comunicado.jsx'
import OpeningStep5 from './OpeningStep5RecepcionVin.jsx'
import OpeningStep6 from './OpeningStep6ValidacionVin.jsx'

const ETAPAS = {
  1: 'Definición del incentivo',
  2: 'Facturación y validación'
}

// Subtítulo del sidebar por programa (los tres comparten el mismo flujo).
const SUBTITULO = {
  opening: 'Comisión por apertura',
  lowrate: 'Tasa preferencial',
  floorplan: 'Piso de inventario'
}

const STEPS = [
  { n: 1, etapa: 1, p: 1, key: 'oferta', titulo: 'Definir Oferta', fuente: 'Constructor de oferta', icon: Icon.Sliders, Comp: OpeningStep1 },
  { n: 2, etapa: 1, p: 2, key: 'forecast', titulo: 'Forecast por dealer', fuente: 'Histórico 24 meses · KIA BRAIN', icon: Icon.Trending, Comp: OpeningStep2 },
  { n: 3, etapa: 1, p: 3, key: 'revision', titulo: 'Revisión vs. Inbursa', fuente: 'Forecast financiera', icon: Icon.Grid, Comp: OpeningStep3 },
  { n: 4, etapa: 1, p: 4, key: 'comunicado', titulo: 'Comunicado a dealers', fuente: 'Difusión a la red', icon: Icon.Mail, Comp: OpeningStep4 },
  { n: 5, etapa: 2, p: 1, key: 'vin', titulo: 'Recepción de VIN', fuente: 'Facturas PDF + XML', icon: Icon.Upload, Comp: OpeningStep5 },
  { n: 6, etapa: 2, p: 2, key: 'valid', titulo: 'Validación de VIN', fuente: 'Cruce y rechazos', icon: Icon.Check, Comp: OpeningStep6 }
]

export default function OpeningFeeFlow({ onBack, incentivo }) {
  const [current, setCurrent] = useState(1)
  const [done, setDone] = useState([])
  const [okPago, setOkPago] = useState(false)

  const nombre = incentivo?.nombre ?? 'Opening Fee'
  const subtitulo = SUBTITULO[incentivo?.id] ?? 'Comisión por apertura'
  const folio = `${incentivo?.clave ?? 'OF'}-JUN26-0428`

  const active = STEPS.find(s => s.n === current)
  // Cada programa puede tener su propio paso 1 (Definir Oferta); el resto de pasos es compartido.
  const STEP1 = { floorplan: FloorPlanStep1, opening: OpeningFeeStep1 }
  const ActiveComp = active.n === 1 ? (STEP1[incentivo?.id] ?? active.Comp) : active.Comp

  const markDone = (n) => setDone(d => (d.includes(n) ? d : [...d, n]))
  const goNext = () => { markDone(current); if (current < STEPS.length) setCurrent(current + 1) }
  const goPrev = () => current > 1 && setCurrent(current - 1)

  return (
    <div className="min-h-screen flex bg-kia-bg text-kia-black">
      {/* ---------- Sidebar ---------- */}
      <aside className="w-[290px] shrink-0 bg-kia-black text-white flex flex-col sticky top-0 h-screen">
        <div className="px-6 pt-6 pb-5 border-b border-white/10">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-white/55 hover:text-white transition-colors mb-4">
            <Icon.Chevron width={14} height={14} className="rotate-180" /> Centro de incentivos
          </button>
          <div className="flex items-center gap-2.5">
            <img src={kiaLogo} alt="KIA" className="h-8 w-auto brightness-0 invert" />
            <span className="h-5 w-px bg-white/25" />
            <span className="text-sm font-medium text-white/70">Incentivos</span>
          </div>
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-kia-red-soft font-semibold">Programa</div>
            <div className="text-lg font-bold mt-0.5">{nombre}</div>
            <div className="text-[11px] text-white/45 mt-0.5">{subtitulo}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {STEPS.map((s, i) => {
            const isActive = s.n === current
            const isDone = done.includes(s.n)
            const nuevaEtapa = i === 0 || STEPS[i - 1].etapa !== s.etapa
            return (
              <div key={s.key}>
                {nuevaEtapa && (
                  <div className={`px-3 pb-1.5 ${i === 0 ? 'pt-0' : 'pt-4'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Etapa {s.etapa}</span>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="text-[11px] text-white/35 mt-0.5">{ETAPAS[s.etapa]}</div>
                  </div>
                )}
                <button onClick={() => setCurrent(s.n)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors ${
                    isActive ? 'bg-white text-kia-black' : 'text-white/75 hover:bg-white/10'
                  }`}>
                  <span className={`shrink-0 h-7 w-7 rounded-lg grid place-items-center text-xs font-bold ${
                    isActive ? 'bg-kia-red text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/80'
                  }`}>{isDone && !isActive ? '✓' : s.p}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">{s.titulo}</span>
                    <span className={`block text-[11px] truncate ${isActive ? 'text-kia-gray' : 'text-white/45'}`}>{s.fuente}</span>
                  </span>
                </button>
              </div>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <div className="text-[11px] text-white/45 uppercase tracking-wider">Periodo activo</div>
          <div className="flex items-center gap-2 mt-1">
            <Icon.Clock className="text-kia-red-soft" width={15} height={15} />
            <span className="text-sm font-semibold">{OF_PERIODO}</span>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-kia-bg/85 backdrop-blur border-b border-kia-line px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={onBack} className="text-kia-gray hover:text-kia-black transition-colors">Incentivos</button>
              <span className="text-kia-line">/</span>
              <span className="text-kia-gray">{nombre}</span>
              <span className="text-kia-line">/</span>
              <span className="text-kia-gray">Etapa {active.etapa} · Paso {active.p}</span>
              <span className="text-kia-line">·</span>
              <span className="font-semibold">{active.titulo}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {STEPS.map(s => (
                <span key={s.n} className={`h-1.5 rounded-full transition-all ${
                  s.n === current ? 'w-7 bg-kia-red' : done.includes(s.n) ? 'w-4 bg-emerald-400' : 'w-4 bg-kia-line'
                }`} />
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 px-8 py-7 max-w-[1180px] w-full mx-auto">
          <div key={current} className="animate-fade-up">
            <ActiveComp />
          </div>
        </div>

        <footer className="sticky bottom-0 bg-white border-t border-kia-line px-8 py-3.5">
          <div className="max-w-[1180px] mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={goPrev} disabled={current === 1}>← Anterior</Button>
            {current === STEPS.length ? (
              <Button variant="danger" onClick={() => setOkPago(true)}>
                <Icon.Check width={16} height={16} /> OK a pago
              </Button>
            ) : (
              <Button variant="danger" onClick={goNext}>
                Continuar <Icon.Arrow width={16} height={16} />
              </Button>
            )}
          </div>
        </footer>
      </main>

      {/* ---------- Pop-up · OK a pago ---------- */}
      {okPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up" onClick={() => setOkPago(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500 text-white grid place-items-center mb-4"><Icon.Check width={28} height={28} /></div>
            <h3 className="text-lg font-bold">Reporte enviado a Finanzas</h3>
            <p className="text-sm text-kia-gray mt-1.5 leading-relaxed">
              El reporte de pago del incentivo {nombre} · {OF_PERIODO} se envió a Finanzas para su liberación.
            </p>
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-kia-black text-white">Folio {folio}</span>
            </div>
            <div className="mt-5 flex justify-center">
              <Button variant="danger" onClick={() => setOkPago(false)}>Entendido</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
