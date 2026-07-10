import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { vmPilares, vmActivosDefault, VM_PRESUPUESTO, VM_MODELOS_KIA, vmModelosRetailDefault, fmtMXN } from '../../data/variableMargin.js'

const TONE = {
  red: { text: 'text-kia-red', bar: 'bg-kia-red', chip: 'red', hex: '#BB162B' },
  ink: { text: 'text-kia-black', bar: 'bg-kia-black', chip: 'ink', hex: '#05141F' },
  blue: { text: 'text-sky-700', bar: 'bg-sky-500', chip: 'blue', hex: '#0EA5E9' }
}

const ALL_VARS = vmPilares.flatMap(p => p.variables.map(v => ({ ...v, pilar: p.id, tone: p.tone })))

export default function VariableStep1Conceptos() {
  const [state, setState] = useState(() => {
    const s = {}
    ALL_VARS.forEach(v => { s[v.id] = { activo: vmActivosDefault.includes(v.id), peso: v.peso, bolsa: v.bolsa } })
    return s
  })
  const [guardado, setGuardado] = useState(false)
  const [modelosRetail, setModelosRetail] = useState(vmModelosRetailDefault)

  const touch = (fn) => { setState(fn); setGuardado(false) }
  const toggleModelo = (m) => {
    setGuardado(false)
    setModelosRetail(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }
  const toggle = (id) => touch(s => ({ ...s, [id]: { ...s[id], activo: !s[id].activo } }))
  const setPeso = (id, peso) => touch(s => ({ ...s, [id]: { ...s[id], peso } }))
  const addBolsa = (id, d) => touch(s => ({ ...s, [id]: { ...s[id], bolsa: Math.max(0, s[id].bolsa + d) } }))

  const activos = ALL_VARS.filter(v => state[v.id].activo)
  const presupuesto = activos.reduce((a, v) => a + state[v.id].bolsa, 0)
  const pesoTotal = activos.reduce((a, v) => a + state[v.id].peso, 0)
  const balanceada = pesoTotal === 100
  const excede = presupuesto > VM_PRESUPUESTO

  const balancear = () => {
    if (!activos.length) return
    const base = Math.floor(100 / activos.length)
    const resto = 100 - base * activos.length
    touch(s => {
      const n = { ...s }
      activos.forEach((v, i) => { n[v.id] = { ...n[v.id], peso: base + (i < resto ? 1 : 0) } })
      return n
    })
  }

  const porPilar = useMemo(() => vmPilares.map(p => ({
    ...p,
    peso: p.variables.filter(v => state[v.id].activo).reduce((a, v) => a + state[v.id].peso, 0),
    bolsa: p.variables.filter(v => state[v.id].activo).reduce((a, v) => a + state[v.id].bolsa, 0),
    activas: p.variables.filter(v => state[v.id].activo).length
  })), [state])

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 1 · Constructor"
        title="Definir Oferta Comercial"
        desc="Arma el incentivo del periodo seleccionando variables de tres ejes: cumplimiento de ventas, de márgenes y de calidad en la atención. Ajusta el peso de cada variable en el score y la bolsa que aporta; los pesos activos deben sumar 100%."
        right={<Pill tone={guardado ? 'green' : 'amber'}>{guardado ? <><Icon.Check width={14} height={14} /> Guardada</> : 'Borrador'}</Pill>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ---------- Constructor ---------- */}
        <div className="lg:col-span-2 space-y-5">
          {vmPilares.map(p => {
            const t = TONE[p.tone]
            const I = Icon[p.icon] || Icon.Sliders
            const rp = porPilar.find(x => x.id === p.id)
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-xl grid place-items-center text-white" style={{ background: t.hex }}><I width={17} height={17} /></span>
                    <div>
                      <h3 className="font-bold leading-tight">{p.nombre}</h3>
                      <p className="text-xs text-kia-gray">{p.desc}</p>
                    </div>
                  </div>
                  <Pill tone={rp.activas ? t.chip : 'gray'}>{rp.activas}/{p.variables.length} · {rp.peso}%</Pill>
                </div>

                <div className="space-y-2.5">
                  {p.variables.map(v => {
                    const st = state[v.id]
                    return (
                      <div key={v.id} className={`rounded-xl border p-4 transition-colors ${st.activo ? 'border-kia-line bg-white' : 'border-dashed border-slate-200 bg-slate-50/60'}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggle(v.id)}
                            aria-pressed={st.activo}
                            className={`shrink-0 h-6 w-6 rounded-md grid place-items-center border transition-colors ${st.activo ? 'text-white border-transparent' : 'border-slate-300 text-slate-400 hover:border-slate-400'}`}
                            style={st.activo ? { background: t.hex } : undefined}
                          >
                            {st.activo ? <Icon.Check width={14} height={14} /> : <span className="text-base leading-none font-semibold">+</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-semibold ${st.activo ? '' : 'text-kia-gray'}`}>{v.nombre}</span>
                              <span className={`text-sm font-bold tabular shrink-0 ${st.activo ? t.text : 'text-slate-300'}`}>{fmtMXN(st.bolsa)}</span>
                            </div>
                            <p className="text-xs text-kia-gray mt-0.5 leading-snug">{v.desc}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Pill tone="gray">Meta {v.meta}</Pill>
                              {st.activo && <Pill tone={t.chip}>{st.peso}% del score</Pill>}
                            </div>

                            {st.activo && v.id === 'v_ret' && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[11px] font-medium text-kia-gray mb-2">
                                  <span>Modelos aplicables</span>
                                  <span className="tabular font-bold text-kia-black">{modelosRetail.length}/{VM_MODELOS_KIA.length}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                  {VM_MODELOS_KIA.map(m => {
                                    const on = modelosRetail.includes(m)
                                    return (
                                      <button key={m} type="button" onClick={() => toggleModelo(m)} aria-pressed={on}
                                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${on ? 'border-kia-line bg-white' : 'border-dashed border-slate-200 bg-slate-50/60'}`}>
                                        <span className={`shrink-0 h-4 w-4 rounded grid place-items-center border transition-colors ${on ? 'text-white border-transparent' : 'border-slate-300 text-transparent'}`}
                                          style={on ? { background: t.hex } : undefined}>
                                          <Icon.Check width={11} height={11} />
                                        </span>
                                        <span className={`text-xs font-semibold truncate ${on ? '' : 'text-kia-gray'}`}>{m}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {st.activo && v.id !== 'v_ret' && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                <div>
                                  <div className="flex items-center justify-between text-[11px] font-medium text-kia-gray mb-1.5">
                                    <span>Peso en el score</span>
                                    <span className="tabular font-bold text-kia-black">{st.peso}%</span>
                                  </div>
                                  <input type="range" min="0" max="40" step="1" value={st.peso}
                                    onChange={e => setPeso(v.id, +e.target.value)}
                                    className="w-full cursor-pointer" style={{ accentColor: t.hex }} />
                                </div>
                                <div>
                                  <div className="text-[11px] font-medium text-kia-gray mb-1.5">Bolsa asignada</div>
                                  <div className="flex items-center gap-2">
                                    <Stepper onClick={() => addBolsa(v.id, -5000)}>−</Stepper>
                                    <span className="flex-1 text-center tabular font-bold text-sm">{fmtMXN(st.bolsa)}</span>
                                    <Stepper onClick={() => addBolsa(v.id, 5000)}>+</Stepper>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}

          <button type="button"
            className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3.5 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide text-kia-gray hover:border-kia-red hover:text-kia-red transition-colors">
            <span className="text-lg leading-none font-semibold">+</span> Nueva variable
          </button>
        </div>

        {/* ---------- Resumen en vivo ---------- */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-kia-red font-semibold">Oferta armada</div>
            <div className="text-3xl font-bold tabular mt-1">{fmtMXN(presupuesto)}</div>
            <div className="text-xs text-kia-gray">Presupuesto estimado · {activos.length} variable(s)</div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-kia-gray mb-1.5">
                <span>vs tope autorizado</span>
                <span className="tabular">{fmtMXN(presupuesto)} / {fmtMXN(VM_PRESUPUESTO)}</span>
              </div>
              <ProgressBar value={(presupuesto / VM_PRESUPUESTO) * 100} tone={excede ? 'red' : 'ink'} />
              {excede && (
                <div className="text-[11px] text-kia-red mt-1.5 flex items-center gap-1">
                  <Icon.Alert width={11} height={11} /> Excede el tope por {fmtMXN(presupuesto - VM_PRESUPUESTO)}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold">Balance del score</span>
              <Pill tone={balanceada ? 'green' : 'amber'}>
                {balanceada ? <><Icon.Check width={13} height={13} /> Balanceada</> : <><Icon.Alert width={13} height={13} /> Ajustar</>}
              </Pill>
            </div>

            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold tabular">{pesoTotal}%</span>
              <span className="text-xs text-kia-gray">/ 100%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${balanceada ? 'bg-emerald-500' : pesoTotal > 100 ? 'bg-kia-red' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(100, pesoTotal)}%` }} />
            </div>

            <div className="mt-4 space-y-2.5">
              {porPilar.map(p => {
                const t = TONE[p.tone]
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-kia-gray">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.hex }} /> {p.nombre}
                      </span>
                      <span className="tabular font-semibold">{p.peso}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, p.peso)}%`, background: t.hex }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <Button variant="soft" className="w-full mt-4" onClick={balancear}>
              <Icon.Refresh width={15} height={15} /> Balancear pesos a 100%
            </Button>
          </Card>

          <Button variant="danger" className="w-full" disabled={!activos.length || !balanceada || excede} onClick={() => setGuardado(true)}>
            {guardado ? <><Icon.Check width={16} height={16} /> Oferta guardada</> : <>Guardar oferta comercial</>}
          </Button>
          {!balanceada && activos.length > 0 && (
            <p className="text-[11px] text-center text-amber-600">Ajusta los pesos a 100% para guardar.</p>
          )}
          {excede && (
            <p className="text-[11px] text-center text-kia-red">Reduce las bolsas por debajo del tope para guardar.</p>
          )}
        </div>
      </div>
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
