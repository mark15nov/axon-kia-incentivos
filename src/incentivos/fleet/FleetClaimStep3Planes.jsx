import { useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { fcPlanesDealers, fcValidaPlan, FC_POLITICA, fmtMXN } from '../../data/fleetClaim.js'

export default function FleetClaimStep3Planes() {
  // Fase de carga de la plantilla: idle | analizando | listo
  const [fase, setFase] = useState('idle')
  const [drag, setDrag] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [archivo, setArchivo] = useState(null)
  const inputRef = useRef(null)
  const timer = useRef(null)

  // Resolución de cada plan: 'pendiente' | 'aceptado' | 'rechazado'
  const [estados, setEstados] = useState(() => Object.fromEntries(fcPlanesDealers.map(p => [p.id, 'pendiente'])))

  const fmtSize = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '1.2 MB')

  const analizar = (file) => {
    if (timer.current) clearInterval(timer.current)
    setArchivo({ name: file?.name || 'planes_flotilla_junio_2026.xlsx', size: file?.size })
    setFase('analizando')
    setProgreso(0)
    let p = 0
    timer.current = setInterval(() => {
      p = Math.min(100, p + Math.floor(Math.random() * 10) + 5)
      setProgreso(p)
      if (p >= 100) { clearInterval(timer.current); timer.current = null; setTimeout(() => setFase('listo'), 350) }
    }, 130)
  }

  const onDrop = (e) => { e.preventDefault(); setDrag(false); analizar(e.dataTransfer.files?.[0]) }
  const onPick = (e) => { const f = e.target.files?.[0]; if (f) analizar(f) }
  const reset = () => {
    if (timer.current) clearInterval(timer.current)
    setFase('idle'); setProgreso(0); setArchivo(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const set = (id, v) => setEstados(s => ({ ...s, [id]: v }))
  const aceptarQueCumplen = () => setEstados(s => {
    const n = { ...s }
    fcPlanesDealers.forEach(p => { if (fcValidaPlan(p).dentro) n[p.id] = 'aceptado' })
    return n
  })

  const t = useMemo(() => {
    let dentro = 0, fuera = 0, aceptados = 0, rechazados = 0, pendientes = 0, unidadesAcept = 0
    fcPlanesDealers.forEach(p => {
      const v = fcValidaPlan(p)
      if (v.dentro) dentro++; else fuera++
      if (estados[p.id] === 'aceptado') { aceptados++; unidadesAcept += p.unidades }
      else if (estados[p.id] === 'rechazado') rechazados++
      else pendientes++
    })
    return { total: fcPlanesDealers.length, dentro, fuera, aceptados, rechazados, pendientes, unidadesAcept }
  }, [estados])

  const detectados = fase === 'listo' ? fcPlanesDealers.length : Math.round((fcPlanesDealers.length * progreso) / 100)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 3 · Recepción"
        title="Recepción de planes de dealers"
        desc="Sube la plantilla de planes que envían los dealers. El sistema la analiza y extrae las condiciones propuestas (cliente, volumen y descuento) y las valida contra las políticas de KIA: descuento máximo y volumen mínimo."
        right={<Pill tone={fase === 'listo' ? 'green' : 'gray'}>
          {fase === 'listo' ? <><Icon.Check width={14} height={14} /> Plantilla analizada</> : 'Pendiente de carga'}
        </Pill>}
      />

      {/* ---------- Zona de carga ---------- */}
      {fase === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors ${drag ? 'border-kia-red bg-red-50/60' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'}`}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onPick} />
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white border border-kia-line grid place-items-center mb-4 shadow-card">
            <Icon.Upload width={28} height={28} className="text-kia-red" />
          </div>
          <div className="font-bold text-lg">{drag ? 'Suelta la plantilla para analizar' : 'Arrastra la plantilla de planes aquí'}</div>
          <div className="text-sm text-kia-gray mt-1">o haz clic para seleccionar · Excel / CSV · máx. 50 MB</div>
          <span className="inline-flex items-center gap-2 mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold bg-kia-red text-white pointer-events-none">
            <Icon.Upload width={16} height={16} /> Seleccionar plantilla
          </span>
          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-kia-gray">
            <span className="flex items-center gap-1.5"><Icon.Excel width={13} height={13} className="text-emerald-600" /> Plantilla de planes</span>
            <span className="flex items-center gap-1.5"><Icon.Users width={13} height={13} /> Cliente y volumen</span>
            <span className="flex items-center gap-1.5"><Icon.Sliders width={13} height={13} className="text-kia-red" /> Validación de políticas</span>
          </div>
        </div>
      )}

      {/* ---------- Analizando ---------- */}
      {fase === 'analizando' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 grid place-items-center"><Icon.Excel width={20} height={20} className="text-emerald-600" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{archivo?.name}</div>
              <div className="text-xs text-kia-gray">{fmtSize(archivo?.size)} · plantilla de planes</div>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-kia-black"><Spinner /> Analizando…</span>
          </div>
          <ProgressBar value={progreso} tone="red" />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-kia-gray">Leyendo la plantilla y validando contra las políticas de KIA…</span>
            <span className="text-sm tabular font-semibold">{progreso}%</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular text-kia-red">{detectados}</span>
            <span className="text-sm text-kia-gray">planes detectados</span>
          </div>
        </Card>
      )}

      {/* ---------- Banner de plantilla analizada ---------- */}
      {fase === 'listo' && (
        <Card className="p-5 border-emerald-200 bg-emerald-50/50 animate-fade-up">
          <div className="flex items-center gap-4">
            <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-emerald-800">Plantilla analizada</h3>
                <Pill tone="green">{t.total} planes</Pill>
              </div>
              <p className="text-sm text-emerald-900/80 mt-0.5">
                <span className="font-semibold">{archivo?.name}</span> · {fmtSize(archivo?.size)} · {t.dentro} en política · {t.fuera} fuera de política
              </p>
            </div>
            <Button variant="ghost" className="shrink-0" onClick={reset}>
              <Icon.Refresh width={15} height={15} /> Cargar otra
            </Button>
          </div>
        </Card>
      )}

      {/* ---------- Análisis y resumen (siempre visible) ---------- */}
      <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <Kpi label="Planes recibidos" value={t.total} sub={`${t.dentro} en política`} />
            <Kpi label="Fuera de política" value={t.fuera} sub="Requieren rechazo/revisión" />
            <Kpi label="Aceptados" value={`${t.aceptados}/${t.total}`} sub={`${t.unidadesAcept} unidades`} accent />
            <Kpi label="Pendientes" value={t.pendientes} sub="Por resolver" />
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
              <h3 className="font-bold flex items-center gap-2"><Icon.Upload width={17} height={17} /> Planes recibidos · validación de políticas</h3>
              <div className="flex items-center gap-3">
                <Pill tone="ink"><Icon.Sliders width={12} height={12} /> desc. ≤ {FC_POLITICA.descuentoMax}% · vol. ≥ {FC_POLITICA.volumenMin}</Pill>
                <Button variant="soft" onClick={aceptarQueCumplen}><Icon.Check width={15} height={15} /> Aceptar los que cumplen</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                    <th className="text-left font-semibold px-5 py-3">Dealer</th>
                    <th className="text-left font-semibold px-3 py-3">Cliente / flotilla</th>
                    <th className="text-left font-semibold px-3 py-3">Modelo</th>
                    <th className="text-right font-semibold px-3 py-3">Unidades</th>
                    <th className="text-right font-semibold px-3 py-3">Descuento</th>
                    <th className="text-right font-semibold px-3 py-3">Plazo</th>
                    <th className="text-left font-semibold px-3 py-3">Política</th>
                    <th className="text-right font-semibold px-5 py-3">Resolución</th>
                  </tr>
                </thead>
                <tbody>
                  {fcPlanesDealers.map(p => {
                    const v = fcValidaPlan(p)
                    const est = estados[p.id]
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-semibold">{p.dealer}</td>
                        <td className="px-3 py-3">{p.cliente}</td>
                        <td className="px-3 py-3 text-kia-gray">{p.modelo}</td>
                        <td className={`px-3 py-3 text-right tabular ${v.bajoVolumen ? 'text-kia-red font-bold' : ''}`}>{p.unidades}</td>
                        <td className={`px-3 py-3 text-right tabular ${v.excedeDescuento ? 'text-kia-red font-bold' : ''}`}>{p.descuentoPct}%</td>
                        <td className="px-3 py-3 text-right tabular text-kia-gray">{p.plazo}d</td>
                        <td className="px-3 py-3">
                          {v.dentro
                            ? <Pill tone="green"><Icon.Check width={12} height={12} /> En política</Pill>
                            : <Pill tone="amber"><Icon.Alert width={12} height={12} /> {v.excedeDescuento ? 'Excede descuento' : 'Bajo volumen'}</Pill>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {est === 'pendiente' ? (
                              <>
                                <button onClick={() => set(p.id, 'aceptado')} disabled={!v.dentro}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                  <Icon.Check width={12} height={12} /> Aceptar
                                </button>
                                <button onClick={() => set(p.id, 'rechazado')}
                                  className="inline-flex items-center gap-1 rounded-full bg-red-50 text-kia-red px-2.5 py-1 text-xs font-semibold hover:bg-red-100 transition-colors">
                                  Rechazar
                                </button>
                              </>
                            ) : est === 'aceptado' ? (
                              <button onClick={() => set(p.id, 'pendiente')}>
                                <Pill tone="green"><Icon.Check width={12} height={12} /> Aceptado</Pill>
                              </button>
                            ) : (
                              <button onClick={() => set(p.id, 'pendiente')}>
                                <Pill tone="red"><Icon.Alert width={12} height={12} /> Rechazado</Pill>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm border ${t.pendientes === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-slate-100 border-kia-line text-slate-700'}`}>
            {t.pendientes === 0 ? <Icon.Check width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <Icon.Clock width={18} height={18} className="mt-0.5 shrink-0 text-kia-black" />}
            <p>{t.pendientes === 0
              ? <>Todos los planes fueron resueltos: <strong>{t.aceptados} aceptado(s)</strong> ({t.unidadesAcept} unidades) y {t.rechazados} rechazado(s). Los planes aceptados alimentan el forecast de la oferta (Paso 4).</>
              : <>Quedan <strong>{t.pendientes}</strong> plan(es) por resolver. Los planes fuera de política deben rechazarse o ajustarse antes de aceptarse.</>}</p>
          </div>
      </div>
    </div>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-kia-red/25 border-t-kia-red animate-spin" />
}
