import { useRef, useState } from 'react'
import { Card, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'

// S02 del diagrama (Variable Margin y Cashback): se carga a SAP (ZASDI10000) el
// PDF de la oferta comercial aprobada del mes. Componente compartido.
export default function OfertaComercialUpload({
  titulo = 'Cargar oferta comercial aprobada a SAP',
  subtitulo = 'Monthly Commercial Offer (PDF) · Daniel Silis → SAP ZASDI10000',
  defaultName = 'oferta_comercial_junio_2026.pdf'
}) {
  const [estado, setEstado] = useState('idle') // idle | subiendo | listo
  const [drag, setDrag] = useState(false)
  const [archivo, setArchivo] = useState(null)
  const inputRef = useRef(null)
  const timer = useRef(null)

  const fmtSize = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '1.2 MB')

  const subir = (file) => {
    if (timer.current) clearTimeout(timer.current)
    setArchivo({ name: file?.name || defaultName, size: file?.size })
    setEstado('subiendo')
    timer.current = setTimeout(() => setEstado('listo'), 1100)
  }
  const onDrop = (e) => { e.preventDefault(); setDrag(false); subir(e.dataTransfer.files?.[0]) }
  const onPick = (e) => { const f = e.target.files?.[0]; if (f) subir(f) }
  const reset = () => {
    if (timer.current) clearTimeout(timer.current)
    setEstado('idle'); setArchivo(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-kia-black text-white grid place-items-center"><Icon.Upload width={19} height={19} /></span>
          <div className="min-w-0">
            <h3 className="font-bold">{titulo}</h3>
            <p className="text-sm text-kia-gray mt-0.5">{subtitulo}</p>
          </div>
        </div>
        <Pill tone={estado === 'listo' ? 'green' : 'gray'}>
          {estado === 'listo' ? <><Icon.Check width={13} height={13} /> Cargada a SAP</> : 'Pendiente de carga'}
        </Pill>
      </div>

      {estado === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${drag ? 'border-kia-red bg-red-50/60' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPick} />
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white border border-kia-line grid place-items-center mb-3 shadow-card">
            <Icon.Pdf width={26} height={26} className="text-kia-red" />
          </div>
          <div className="font-bold">{drag ? 'Suelta el PDF para cargar' : 'Arrastra el PDF de la oferta comercial aquí'}</div>
          <div className="text-sm text-kia-gray mt-1">o haz clic para seleccionar · PDF · máx. 20 MB</div>
          <span className="inline-flex items-center gap-2 mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold bg-kia-red text-white pointer-events-none">
            <Icon.Upload width={16} height={16} /> Seleccionar PDF
          </span>
        </div>
      )}

      {estado === 'subiendo' && (
        <div className="rounded-2xl border border-kia-line bg-slate-50/60 px-5 py-6 flex items-center gap-3">
          <span className="h-11 w-11 shrink-0 rounded-xl bg-white border border-kia-line grid place-items-center"><Icon.Pdf width={20} height={20} className="text-kia-red" /></span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{archivo?.name}</div>
            <div className="text-xs text-kia-gray">{fmtSize(archivo?.size)} · cargando a SAP…</div>
          </div>
          <span className="h-4 w-4 rounded-full border-2 border-kia-red/25 border-t-kia-red animate-spin" />
        </div>
      )}

      {estado === 'listo' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-5 py-4 flex items-center gap-4 animate-fade-up">
          <span className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={22} height={22} /></span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-emerald-800">Oferta comercial cargada a SAP</div>
            <div className="text-sm text-emerald-900/80 truncate"><span className="font-semibold">{archivo?.name}</span> · {fmtSize(archivo?.size)} · ZASDI10000 (Incentive Overview List)</div>
          </div>
          <Button variant="ghost" className="shrink-0" onClick={reset}>
            <Icon.Refresh width={15} height={15} /> Cargar otro
          </Button>
        </div>
      )}
    </Card>
  )
}
