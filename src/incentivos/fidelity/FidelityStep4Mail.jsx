import { useMemo, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { kfComunicadoBase, kfDealersAplican, KF_PERIODO } from '../../data/kiaFidelity.js'
import { vmForecast } from '../../data/variableMargin.js'

// Toda la red nacional (universo de dealers).
const RED = vmForecast.map((d, i) => ({ id: 'R' + String(i + 1).padStart(2, '0'), dealer: d.dealer, zona: d.zona }))
const APLICAN = kfDealersAplican

const AUDIENCIAS = [
  { v: 'red', label: 'Toda la red', desc: 'Todos los concesionarios' },
  { v: 'aplican', label: 'Los que aplican', desc: 'Dealers elegibles' },
  { v: 'sel', label: 'Seleccionados', desc: 'Elige manualmente' }
]

export default function FidelityStep4Mail() {
  const [audiencia, setAudiencia] = useState('aplican')
  const [seleccion, setSeleccion] = useState(() => APLICAN.map(d => d.id))
  const [asunto, setAsunto] = useState(kfComunicadoBase.asunto)
  const [cuerpo, setCuerpo] = useState(kfComunicadoBase.cuerpo)
  const [enviados, setEnviados] = useState([])
  const [enviando, setEnviando] = useState(false)

  const destinatarios = useMemo(() => {
    if (audiencia === 'red') return RED
    if (audiencia === 'aplican') return APLICAN
    return RED.filter(d => seleccion.includes(d.id))
  }, [audiencia, seleccion])

  const toggleSel = (id) => setSeleccion(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

  const enviadosActual = destinatarios.filter(d => enviados.includes(d.id)).length
  const pendientes = destinatarios.length - enviadosActual
  const todoEnviado = destinatarios.length > 0 && pendientes === 0

  const enviar = () => {
    if (enviando || !destinatarios.length || todoEnviado) return
    setEnviando(true)
    setEnviados(prev => {
      const set = new Set(prev)
      destinatarios.forEach(d => set.add(d.id))
      return [...set]
    })
    setTimeout(() => setEnviando(false), 600)
  }

  const resetBase = () => { setAsunto(kfComunicadoBase.asunto); setCuerpo(kfComunicadoBase.cuerpo) }
  const editado = asunto !== kfComunicadoBase.asunto || cuerpo !== kfComunicadoBase.cuerpo

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 4 · Comunicado"
        title="Mail a dealers"
        desc="Redacta el comunicado del beneficio de KIA Fidelity sobre la base propuesta y envíalo a la audiencia que definas: a toda la red, solo a los dealers elegibles o a una selección manual. El correo comunica las condiciones del beneficio de crédito por fidelidad del periodo."
        right={<Button variant="danger" onClick={enviar} disabled={enviando || !destinatarios.length || todoEnviado}>
          <Icon.Mail width={16} height={16} /> {todoEnviado ? 'Comunicado enviado' : enviando ? 'Enviando…' : `Enviar a ${destinatarios.length}`}
        </Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Destinatarios" value={destinatarios.length} sub={AUDIENCIAS.find(a => a.v === audiencia).label} accent />
        <Kpi label="En la red" value={RED.length} sub="Concesionarios KIA" />
        <Kpi label="Enviados" value={`${enviadosActual}/${destinatarios.length}`} sub="En esta audiencia" />
        <Kpi label="Pendientes" value={pendientes} sub="Por notificar" />
      </div>

      <div className="grid grid-cols-5 gap-6 items-start">
        {/* ---------- Editor ---------- */}
        <div className="col-span-3 space-y-4">
          <Card className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Icon.Users width={17} height={17} /> Audiencia</h3>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCIAS.map(a => {
                const on = audiencia === a.v
                const n = a.v === 'red' ? RED.length : a.v === 'aplican' ? APLICAN.length : seleccion.length
                return (
                  <button key={a.v} onClick={() => setAudiencia(a.v)}
                    className={`rounded-xl border p-3 text-left transition-colors ${on ? 'border-kia-red bg-red-50/60' : 'border-kia-line hover:border-slate-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${on ? 'text-kia-red' : ''}`}>{a.label}</span>
                      <span className={`text-xs tabular font-bold ${on ? 'text-kia-red' : 'text-kia-gray'}`}>{n}</span>
                    </div>
                    <div className="text-[11px] text-kia-gray mt-0.5">{a.desc}</div>
                  </button>
                )
              })}
            </div>

            {audiencia === 'sel' && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-kia-gray uppercase tracking-wide">Elige dealers ({seleccion.length})</span>
                  <div className="flex items-center gap-2 text-xs">
                    <button onClick={() => setSeleccion(RED.map(d => d.id))} className="font-semibold text-kia-red hover:underline">Todos</button>
                    <span className="text-kia-line">·</span>
                    <button onClick={() => setSeleccion(APLICAN.map(d => d.id))} className="font-semibold text-kia-red hover:underline">Los que aplican</button>
                    <span className="text-kia-line">·</span>
                    <button onClick={() => setSeleccion([])} className="font-semibold text-kia-gray hover:underline">Ninguno</button>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto grid grid-cols-2 gap-1.5 pr-1">
                  {RED.map(d => {
                    const on = seleccion.includes(d.id)
                    const aplica = APLICAN.some(a => a.dealer === d.dealer)
                    return (
                      <button key={d.id} onClick={() => toggleSel(d.id)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${on ? 'border-kia-line bg-white' : 'border-dashed border-slate-200 bg-slate-50/60'}`}>
                        <span className={`shrink-0 h-4 w-4 rounded grid place-items-center border ${on ? 'bg-kia-red text-white border-transparent' : 'border-slate-300 text-transparent'}`}>
                          <Icon.Check width={11} height={11} />
                        </span>
                        <span className={`text-xs font-semibold truncate ${on ? '' : 'text-kia-gray'}`}>{d.dealer}</span>
                        {aplica && <span className="ml-auto shrink-0 text-[9px] font-bold uppercase text-kia-red">Aplica</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Icon.File width={17} height={17} /> Redacción</h3>
              <button onClick={resetBase} disabled={!editado}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-kia-gray hover:text-kia-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Icon.Refresh width={13} height={13} /> Restaurar base
              </button>
            </div>
            <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">Asunto</label>
            <input value={asunto} onChange={e => setAsunto(e.target.value)}
              className="w-full mb-4 px-3.5 py-2.5 rounded-xl border border-kia-line text-sm font-semibold focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
            <label className="block text-[11px] font-medium text-kia-gray uppercase tracking-wide mb-1.5">Cuerpo</label>
            <textarea value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={9}
              className="w-full px-3.5 py-2.5 rounded-xl border border-kia-line text-sm leading-relaxed resize-y focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
          </Card>
        </div>

        {/* ---------- Vista previa + estado ---------- */}
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Icon.Mail width={17} height={17} /> Vista previa</h3>
            <div className="rounded-xl border border-kia-line overflow-hidden">
              <div className="bg-kia-black text-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-wider text-kia-red-soft font-semibold">KIA · KIA Fidelity</div>
                <div className="font-bold mt-0.5 text-sm">{asunto || <span className="text-white/40">Sin asunto</span>}</div>
              </div>
              <div className="px-4 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">{cuerpo}</div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Icon.Users width={17} height={17} /> Estado de envío</h3>
              <Pill tone={todoEnviado ? 'green' : 'gray'}>{enviadosActual}/{destinatarios.length}</Pill>
            </div>
            {destinatarios.length === 0 ? (
              <p className="text-sm text-kia-gray py-4 text-center">Selecciona al menos un dealer.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {destinatarios.map(d => {
                  const enviado = enviados.includes(d.id)
                  return (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-kia-line px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{d.dealer}</div>
                        <div className="text-[11px] text-kia-gray">{d.zona}</div>
                      </div>
                      <Pill tone={enviado ? 'green' : 'gray'}>
                        {enviado ? <><Icon.Check width={12} height={12} /> Enviado</> : <><Icon.Clock width={12} height={12} /> Pendiente</>}
                      </Pill>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm border ${todoEnviado ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-slate-100 border-kia-line text-slate-700'}`}>
        {todoEnviado ? <Icon.Check width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <Icon.Mail width={18} height={18} className="mt-0.5 shrink-0 text-kia-black" />}
        <p>{todoEnviado
          ? <>Comunicado enviado a <strong>{destinatarios.length}</strong> dealer(s) con las condiciones del beneficio de KIA Fidelity del periodo.</>
          : <>Ajusta la redacción y la audiencia; el comunicado se enviará a <strong>{destinatarios.length}</strong> dealer(s) para {KF_PERIODO}.</>}</p>
      </div>
    </div>
  )
}
