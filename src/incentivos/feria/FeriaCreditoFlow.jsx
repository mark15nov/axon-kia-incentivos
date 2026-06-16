import { useState } from 'react'
import { Icon } from '../../components/icons.jsx'
import { Button } from '../../components/ui.jsx'
import { FERIA_PERIODO } from '../../data/feriaCredito.js'

import FeriaStep1 from './FeriaStep1Condiciones.jsx'
import FeriaStep2 from './FeriaStep2Comunicado.jsx'
import FeriaStep3 from './FeriaStep3Resultados.jsx'

const STEPS = [
  { n: 1, key: 'cond', titulo: 'Condiciones y Forecast', fuente: 'Zap · KIA + Inbursa', icon: Icon.Sliders, Comp: FeriaStep1 },
  { n: 2, key: 'com', titulo: 'Comunicado a agencias', fuente: 'Difusión automática', icon: Icon.Mail, Comp: FeriaStep2 },
  { n: 3, key: 'res', titulo: 'Resultados', fuente: 'Resultados de la feria', icon: Icon.Trending, Comp: FeriaStep3 }
]

export default function FeriaCreditoFlow({ onBack }) {
  const [current, setCurrent] = useState(1)
  const [done, setDone] = useState([])

  const active = STEPS.find(s => s.n === current)
  const ActiveComp = active.Comp

  const markDone = (n) => setDone(d => (d.includes(n) ? d : [...d, n]))
  const goNext = () => {
    markDone(current)
    if (current < STEPS.length) setCurrent(current + 1)
  }
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
            <span className="text-2xl font-extrabold tracking-tight">KIA</span>
            <span className="h-5 w-px bg-white/25" />
            <span className="text-sm font-medium text-white/70">Incentivos</span>
          </div>
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-kia-red-soft font-semibold">Programa</div>
            <div className="text-lg font-bold mt-0.5">Feria de Crédito</div>
            <div className="text-[11px] text-white/45 mt-0.5">KIA + Inbursa</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {STEPS.map((s) => {
            const isActive = s.n === current
            const isDone = done.includes(s.n)
            return (
              <button
                key={s.key}
                onClick={() => setCurrent(s.n)}
                className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors group ${
                  isActive ? 'bg-white text-kia-black' : 'text-white/75 hover:bg-white/10'
                }`}
              >
                <span className={`shrink-0 h-7 w-7 rounded-lg grid place-items-center text-xs font-bold ${
                  isActive ? 'bg-kia-red text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/80'
                }`}>
                  {isDone && !isActive ? '✓' : s.n}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{s.titulo}</span>
                  <span className={`block text-[11px] truncate ${isActive ? 'text-kia-gray' : 'text-white/45'}`}>{s.fuente}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <div className="text-[11px] text-white/45 uppercase tracking-wider">Evento</div>
          <div className="flex items-center gap-2 mt-1">
            <Icon.Clock className="text-kia-red-soft" width={15} height={15} />
            <span className="text-sm font-semibold">{FERIA_PERIODO}</span>
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
              <span className="text-kia-gray">Feria de Crédito</span>
              <span className="text-kia-line">/</span>
              <span className="font-semibold">Paso {active.n}</span>
              <span className="text-kia-line">·</span>
              <span className="font-semibold">{active.titulo}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {STEPS.map(s => (
                <span key={s.n}
                  className={`h-1.5 rounded-full transition-all ${
                    s.n === current ? 'w-7 bg-kia-red' : done.includes(s.n) ? 'w-4 bg-emerald-400' : 'w-4 bg-kia-line'
                  }`}
                />
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
            <Button variant="ghost" onClick={goPrev} disabled={current === 1}>
              ← Anterior
            </Button>
            <div className="text-xs text-kia-gray">
              Paso <span className="font-semibold text-kia-black">{current}</span> de {STEPS.length}
            </div>
            <Button variant="danger" onClick={goNext} disabled={current === STEPS.length}>
              {current === STEPS.length ? 'Flujo completo' : 'Continuar'} <Icon.Arrow width={16} height={16} />
            </Button>
          </div>
        </footer>
      </main>
    </div>
  )
}
