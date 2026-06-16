import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { feriaComunicado, feriaAgencias } from '../../data/feriaCredito.js'

export default function FeriaStep2Comunicado() {
  const [estados, setEstados] = useState(() => Object.fromEntries(feriaAgencias.map(a => [a.id, 'Pendiente'])))
  const [enviando, setEnviando] = useState(false)

  const enviarTodos = () => {
    const pend = feriaAgencias.filter(a => estados[a.id] === 'Pendiente')
    if (!pend.length) return
    setEnviando(true)
    pend.forEach((a, i) => {
      setTimeout(() => {
        setEstados(s => ({ ...s, [a.id]: 'Enviado' }))
        if (i === pend.length - 1) setEnviando(false)
      }, 240 * (i + 1))
    })
  }

  const enviados = feriaAgencias.filter(a => estados[a.id] === 'Enviado').length
  const pct = (enviados / feriaAgencias.length) * 100

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 2 · Difusión"
        title="Comunicado automático a las agencias"
        desc="Con las condiciones conciliadas, el sistema envía automáticamente el comunicado de la promoción a toda la red, con material POP y guion de venta."
        right={<Button variant="danger" onClick={enviarTodos} disabled={enviando || enviados === feriaAgencias.length}>
          <Icon.Mail width={16} height={16} /> {enviados === feriaAgencias.length ? 'Comunicado enviado' : enviando ? 'Enviando…' : 'Enviar a la red'}
        </Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Agencias" value={feriaAgencias.length} sub="En la red" />
        <Kpi label="Enviados" value={`${enviados}/${feriaAgencias.length}`} sub={`${Math.round(pct)}% notificado`} accent />
        <Kpi label="Pendientes" value={feriaAgencias.length - enviados} sub="Por notificar" />
      </div>

      <div className="grid grid-cols-5 gap-6 items-start">
        {/* Vista previa del comunicado */}
        <Card className="col-span-2 p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Icon.Mail width={17} height={17} /> Vista previa</h3>
          <div className="rounded-xl border border-kia-line overflow-hidden">
            <div className="bg-kia-black text-white px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-kia-red-soft font-semibold">KIA + Inbursa</div>
              <div className="font-bold mt-0.5 text-sm">{feriaComunicado.asunto}</div>
            </div>
            <div className="px-4 py-4 text-sm text-slate-700 leading-relaxed">
              {feriaComunicado.cuerpo}
              <div className="flex items-center gap-2 mt-4">
                <Pill tone="red"><Icon.Pdf width={13} height={13} /> POP_feria.pdf</Pill>
                <Pill tone="green"><Icon.File width={13} height={13} /> Guion_venta.pdf</Pill>
              </div>
            </div>
          </div>
        </Card>

        {/* Estado de envío por agencia */}
        <Card className="col-span-3 p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Icon.Users width={17} height={17} /> Estado de envío</h3>
          <div className="space-y-2">
            {feriaAgencias.map(a => {
              const est = estados[a.id]
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-kia-line px-3.5 py-2.5">
                  <span className="h-9 w-9 rounded-lg bg-slate-100 grid place-items-center text-xs font-bold shrink-0">{a.id.slice(1)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{a.nombre}</div>
                    <div className="text-xs text-kia-gray">{a.ciudad} · Zona {a.zona}</div>
                  </div>
                  <Pill tone={est === 'Enviado' ? 'green' : 'gray'}>
                    {est === 'Enviado' ? <Icon.Check width={13} height={13} /> : <Icon.Clock width={13} height={13} />}
                    {est}
                  </Pill>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-slate-100 border border-kia-line px-4 py-3.5 text-sm text-slate-700">
        <Icon.Mail width={18} height={18} className="mt-0.5 shrink-0 text-kia-black" />
        <p>El comunicado se entrega por correo y se registra en Zap. A partir del envío, cada agencia reporta avances diarios que alimentan el BI de resultados (Paso 3).</p>
      </div>
    </div>
  )
}
