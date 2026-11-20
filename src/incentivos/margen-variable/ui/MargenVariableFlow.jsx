import { useMemo, useState } from 'react'
import { Icon } from '../../../components/icons.jsx'
import { Button } from './base.jsx'
import kiaLogo from '../../../assets/kia-logo.png'
import { PARAMETROS_DEFAULT, PRESET_FINANZAS } from '../motor/parametros.js'
import { calcularMargenVariable } from '../motor/calculo.js'
import { conciliar } from '../motor/conciliacion.js'
import { useCargaMV } from './useCargaMV.js'
import { VERSION, VERSIONES } from './versiones.js'
import { nombrePeriodo } from './formato.js'
import PasoPoliticas from './PasoPoliticas.jsx'
import PasoCarga from './PasoCarga.jsx'
import PasoForecast from './PasoForecast.jsx'
import PasoDealers from './PasoDealers.jsx'
import PasoVins from './PasoVins.jsx'
import PasoFinanzas from './PasoFinanzas.jsx'

const ETAPAS = { 1: 'Política y carga mensual', 2: 'Forecast y cálculo', 3: 'Finanzas' }

const PASOS = [
  { n: 1, etapa: 1, titulo: 'Políticas', fuente: 'Reglas y umbrales', Comp: PasoPoliticas },
  { n: 2, etapa: 1, titulo: 'Carga mensual', fuente: (v) => `${VERSIONES[v].archivos.length} archivos Excel`, Comp: PasoCarga },
  { n: 3, etapa: 2, titulo: 'Forecast', fuente: 'WHS/MOS asumidos', Comp: PasoForecast },
  { n: 4, etapa: 2, titulo: 'Cumplimiento por dealer', fuente: 'Retail · total · WHS · MOS', Comp: PasoDealers },
  { n: 5, etapa: 2, titulo: 'Detalle por VIN', fuente: 'Regla aplicada y motivo', Comp: PasoVins },
  { n: 6, etapa: 3, titulo: 'Reporte a Finanzas', fuente: (v) => (VERSIONES[v].conciliacion ? 'Excel formulado · conciliación' : 'Excel formulado para Finanzas'), Comp: PasoFinanzas }
]

function useResultado(datos, parametros) {
  return useMemo(() => {
    if (!datos) return { resultado: null, error: null }
    try {
      return { resultado: calcularMargenVariable(datos, { parametros }), error: null }
    } catch (err) {
      return { resultado: null, error: err instanceof Error ? err.message : 'Error al calcular' }
    }
  }, [datos, parametros])
}

export default function MargenVariableFlow({ onBack, incentivo }) {
  const [actual, setActual] = useState(1)
  const [parametros, setParametros] = useState(PARAMETROS_DEFAULT)
  const [version, setVersion] = useState(VERSION.PLATAFORMA)
  const carga = useCargaMV()
  const conConciliacion = VERSIONES[version].conciliacion

  const cambiarVersion = (v) => {
    setVersion(v)
    if (!VERSIONES[v].conciliacion) {
      carga.quitar('finanzas')
      setParametros(p => ({ ...p, ...PRESET_FINANZAS }))
    }
  }
  const { resultado, error } = useResultado(carga.datos, parametros)
  const conciliacion = useMemo(
    () => (conConciliacion && resultado && carga.referencia ? conciliar(resultado, carga.referencia) : null),
    [conConciliacion, resultado, carga.referencia]
  )

  const nombre = incentivo?.nombre ?? 'Margen Variable'
  const paso = PASOS.find(p => p.n === actual)
  const Paso = paso.Comp
  const props = { parametros, setParametros, carga, resultado, errorCalculo: error, conciliacion, version, irA: setActual }

  return (
    <div className="min-h-screen flex bg-kia-bg text-kia-black">
      <aside className="w-[280px] shrink-0 bg-kia-black text-white flex flex-col sticky top-0 h-screen">
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
            <div className="text-[11px] text-white/45 mt-0.5">Provisión por VIN · cálculo mensual</div>
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 mb-1.5">Versión</div>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-white/5 p-1" role="radiogroup" aria-label="Versión del flujo">
              {Object.entries(VERSIONES).map(([id, v]) => (
                <button key={id} role="radio" aria-checked={version === id} onClick={() => cambiarVersion(id)} title={v.sub}
                  className={`rounded px-2 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${version === id ? 'bg-white text-kia-black' : 'text-white/60 hover:text-white'}`}>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-white/40 mt-1.5">{VERSIONES[version].sub}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Pasos del incentivo">
          {PASOS.map((p, i) => {
            const activo = p.n === actual
            const bloqueado = p.n > 2 && !resultado
            const nuevaEtapa = i === 0 || PASOS[i - 1].etapa !== p.etapa
            return (
              <div key={p.n}>
                {nuevaEtapa && (
                  <div className={`px-3 pb-1.5 ${i === 0 ? '' : 'pt-4'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Etapa {p.etapa}</span>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="text-[11px] text-white/35 mt-0.5">{ETAPAS[p.etapa]}</div>
                  </div>
                )}
                <button onClick={() => setActual(p.n)} aria-current={activo ? 'step' : undefined}
                  className={`w-full text-left rounded-md px-3 py-2.5 flex items-center gap-3 transition-colors ${activo ? 'bg-white text-kia-black' : 'text-white/75 hover:bg-white/10'} ${bloqueado && !activo ? 'opacity-50' : ''}`}>
                  <span className={`shrink-0 h-7 w-7 rounded grid place-items-center text-xs font-bold ${activo ? 'bg-kia-red text-white' : 'bg-white/10 text-white/80'}`}>{p.n}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">{p.titulo}</span>
                    <span className={`block text-[11px] truncate ${activo ? 'text-kia-gray' : 'text-white/45'}`}>{typeof p.fuente === 'function' ? p.fuente(version) : p.fuente}</span>
                  </span>
                </button>
              </div>
            )
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <div className="text-[11px] text-white/45 uppercase tracking-wider">Periodo calculado</div>
          <div className="flex items-center gap-2 mt-1">
            <Icon.Clock className="text-kia-red-soft" width={15} height={15} />
            <span className="text-sm font-semibold">{resultado ? nombrePeriodo(resultado.periodo) : 'Sin archivos'}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-kia-bg/85 backdrop-blur border-b border-kia-line px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={onBack} className="text-kia-gray hover:text-kia-black transition-colors">Incentivos</button>
              <span className="text-kia-line">/</span>
              <span className="text-kia-gray">{nombre}</span>
              <span className="text-kia-line">/</span>
              <span className="font-semibold">{paso.titulo}</span>
            </div>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {PASOS.map(p => <span key={p.n} className={`h-1.5 rounded-full transition-all ${p.n === actual ? 'w-7 bg-kia-red' : p.n < actual ? 'w-4 bg-emerald-400' : 'w-4 bg-kia-line'}`} />)}
            </div>
          </div>
        </header>

        <div className="flex-1 px-8 py-7 max-w-[1240px] w-full mx-auto">
          <div key={actual} className="animate-fade-up"><Paso {...props} /></div>
        </div>

        <footer className="sticky bottom-0 bg-white border-t border-kia-line px-8 py-3.5">
          <div className="max-w-[1240px] mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={() => setActual(actual - 1)} disabled={actual === 1}>← Anterior</Button>
            {actual < PASOS.length && (
              <Button variant="danger" onClick={() => setActual(actual + 1)} disabled={actual >= 2 && !resultado}>
                Continuar <Icon.Arrow width={16} height={16} />
              </Button>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}
