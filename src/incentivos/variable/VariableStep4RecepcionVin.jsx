import { useRef, useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button, ProgressBar } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { fmtMXN } from '../../data/variableMargin.js'

// Resultado simulado del escaneo del .zip.
const RES = { facturas: 148, pdf: 148, xml: 148, vin: 148, monto: 68420000, pareadas: 146, obs: 2, archivos: 296 }

const PREVIEW = [
  { vin: '3KPA24AD1PE482103', folio: 'A-4821', dealer: 'KIA Polanco', modelo: 'Sportage', monto: 512000 },
  { vin: 'KNADE163XP6218847', folio: 'B-1902', dealer: 'KIA Monterrey Valle', modelo: 'Seltos', monto: 438000 },
  { vin: '3KPF54AD7PE097512', folio: 'A-4822', dealer: 'KIA Patria', modelo: 'K4', monto: 389000 },
  { vin: 'KNAB2511BP7743120', folio: 'C-3310', dealer: 'KIA Querétaro', modelo: 'Rio', monto: 298000 },
  { vin: '3KPA24AD9PE482210', folio: 'A-4823', dealer: 'KIA Cancún', modelo: 'Sportage', monto: 524000 },
  { vin: 'KNADE163XP6219004', folio: 'B-1903', dealer: 'KIA Bajío', modelo: 'Seltos', monto: 442000 }
]

export default function VariableStep4RecepcionVin() {
  const [estado, setEstado] = useState('idle') // idle | escaneando | listo
  const [drag, setDrag] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [archivo, setArchivo] = useState(null)
  const inputRef = useRef(null)
  const timer = useRef(null)

  const fmtSize = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '24.8 MB')

  const escanear = (file) => {
    if (timer.current) clearInterval(timer.current)
    setArchivo({ name: file?.name || 'facturas_junio_2026.zip', size: file?.size })
    setEstado('escaneando')
    setProgreso(0)
    let p = 0
    timer.current = setInterval(() => {
      p = Math.min(100, p + Math.floor(Math.random() * 10) + 5)
      setProgreso(p)
      if (p >= 100) {
        clearInterval(timer.current)
        timer.current = null
        setTimeout(() => setEstado('listo'), 350)
      }
    }, 130)
  }

  const onDrop = (e) => { e.preventDefault(); setDrag(false); escanear(e.dataTransfer.files?.[0]) }
  const onPick = (e) => { const f = e.target.files?.[0]; if (f) escanear(f) }
  const reset = () => {
    if (timer.current) clearInterval(timer.current)
    setEstado('idle'); setProgreso(0); setArchivo(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const detectadas = estado === 'listo' ? RES.facturas : Math.round((RES.facturas * progreso) / 100)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 2 · Paso 1"
        title="Recepción de VIN"
        desc="Sube el .zip con las facturas de los dealers (PDF + XML). El sistema escanea el paquete y detecta automáticamente cuántas facturas contiene y las parea PDF ↔ XML por VIN."
        right={<Pill tone={estado === 'listo' ? 'green' : 'gray'}>
          {estado === 'listo' ? <><Icon.Check width={14} height={14} /> Escaneo completo</> : 'Pendiente de carga'}
        </Pill>}
      />

      {/* ---------- Zona de carga ---------- */}
      {estado === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors ${drag ? 'border-kia-red bg-red-50/60' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'}`}
        >
          <input ref={inputRef} type="file" accept=".zip,.rar,application/zip" className="hidden" onChange={onPick} />
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white border border-kia-line grid place-items-center mb-4 shadow-card">
            <Icon.Upload width={28} height={28} className="text-kia-red" />
          </div>
          <div className="font-bold text-lg">{drag ? 'Suelta el archivo para escanear' : 'Arrastra el .zip con las facturas aquí'}</div>
          <div className="text-sm text-kia-gray mt-1">o haz clic para seleccionar · PDF + XML · máx. 200 MB</div>
          <span className="inline-flex items-center gap-2 mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold bg-kia-red text-white pointer-events-none">
            <Icon.Upload width={16} height={16} /> Seleccionar archivo
          </span>
          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-kia-gray">
            <span className="flex items-center gap-1.5"><Icon.Pdf width={13} height={13} className="text-kia-red" /> Facturas PDF</span>
            <span className="flex items-center gap-1.5"><Icon.Excel width={13} height={13} className="text-emerald-600" /> Archivos XML (CFDI)</span>
            <span className="flex items-center gap-1.5"><Icon.Database width={13} height={13} /> Pareo por VIN</span>
          </div>
        </div>
      )}

      {/* ---------- Escaneando ---------- */}
      {estado === 'escaneando' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 grid place-items-center"><Icon.File width={20} height={20} className="text-kia-black" /></span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{archivo?.name}</div>
              <div className="text-xs text-kia-gray">{fmtSize(archivo?.size)} · paquete comprimido</div>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-kia-black"><Spinner /> Escaneando…</span>
          </div>
          <ProgressBar value={progreso} tone="red" />
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-kia-gray">Leyendo paquete y pareando PDF ↔ XML por VIN…</span>
            <span className="text-sm tabular font-semibold">{progreso}%</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular text-kia-red">{detectadas}</span>
            <span className="text-sm text-kia-gray">facturas detectadas</span>
          </div>
        </Card>
      )}

      {/* ---------- Resultado ---------- */}
      {estado === 'listo' && (
        <div className="space-y-6 animate-fade-up">
          {/* Banner */}
          <Card className="p-5 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-4">
              <span className="h-12 w-12 shrink-0 rounded-xl bg-emerald-500 text-white grid place-items-center"><Icon.Check width={24} height={24} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-emerald-800">Escaneo completado</h3>
                  <Pill tone="green">{RES.facturas} facturas</Pill>
                </div>
                <p className="text-sm text-emerald-900/80 mt-0.5">
                  <span className="font-semibold">{archivo?.name}</span> · {fmtSize(archivo?.size)} · {RES.archivos} archivos leídos ({RES.pdf} PDF + {RES.xml} XML)
                </p>
              </div>
              <Button variant="ghost" className="shrink-0" onClick={reset}>
                <Icon.Refresh width={15} height={15} /> Cargar otro
              </Button>
            </div>
          </Card>

          {/* KPIs del escaneo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Facturas detectadas" value={String(RES.facturas)} sub="En el paquete" accent />
            <Kpi label="Archivos PDF" value={String(RES.pdf)} sub="Representación impresa" />
            <Kpi label="Archivos XML" value={String(RES.xml)} sub="CFDI timbrado" />
            <Kpi label="VIN únicos" value={String(RES.vin)} sub="Sin duplicados" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="green"><Icon.Check width={13} height={13} /> {RES.pareadas} pareadas PDF ↔ XML</Pill>
            <Pill tone="amber"><Icon.Alert width={13} height={13} /> {RES.obs} en revisión</Pill>
            <Pill tone="gray">Monto facturado {fmtMXN(RES.monto)}</Pill>
          </div>

          {/* Vista previa de facturas */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-kia-line">
              <h3 className="font-bold flex items-center gap-2"><Icon.Invoice width={17} height={17} /> Vista previa de facturas detectadas</h3>
              <Pill tone="gray">{PREVIEW.length} de {RES.facturas}</Pill>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                    <th className="text-left font-semibold px-5 py-3">VIN</th>
                    <th className="text-left font-semibold px-3 py-3">Folio</th>
                    <th className="text-left font-semibold px-3 py-3">Dealer</th>
                    <th className="text-left font-semibold px-3 py-3">Modelo</th>
                    <th className="text-right font-semibold px-3 py-3">Monto</th>
                    <th className="text-right font-semibold px-5 py-3">Archivos</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW.map(f => (
                    <tr key={f.vin} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-xs font-semibold">{f.vin}</td>
                      <td className="px-3 py-3 text-kia-gray">{f.folio}</td>
                      <td className="px-3 py-3 font-medium">{f.dealer}</td>
                      <td className="px-3 py-3 text-kia-gray">{f.modelo}</td>
                      <td className="px-3 py-3 text-right tabular font-semibold">{fmtMXN(f.monto)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Icon.Pdf width={13} height={13} className="text-kia-red" />
                          <Icon.Excel width={13} height={13} className="text-emerald-600" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 text-center text-xs text-kia-gray border-t border-slate-100">
                y {RES.facturas - PREVIEW.length} facturas más en el paquete…
              </div>
            </div>
          </Card>

          <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3.5 text-sm text-sky-900">
            <Icon.Clock width={18} height={18} className="mt-0.5 shrink-0 text-sky-600" />
            <p>Se detectaron <strong>{RES.facturas} facturas</strong> listas para validar. En el siguiente paso se cruzan los VIN contra el forecast y el soporte de cada dealer para confirmar el pago del incentivo.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-kia-red/25 border-t-kia-red animate-spin" />
}
