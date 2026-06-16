import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../components/ui.jsx'
import { Icon } from '../components/icons.jsx'
import { archivosRecibidos, faltantes, dealerNombre } from '../data/mockData.js'

export default function Step2Archivos() {
  const [drag, setDrag] = useState(false)
  const [archivos, setArchivos] = useState(archivosRecibidos)
  const [procesando, setProcesando] = useState(false)

  const simularCarga = () => {
    setProcesando(true)
    setTimeout(() => {
      setArchivos(prev => [
        ...prev,
        { id: 'F' + (prev.length + 1), dealer: 'D05', nombre: 'Queretaro_cashback_jun26.xlsx', tipo: 'Excel', registros: 6, estatus: 'Procesado' },
        { id: 'F' + (prev.length + 2), dealer: 'D05', nombre: 'Queretaro_facturas_jun26.pdf', tipo: 'PDF', registros: 6, estatus: 'Procesado' }
      ])
      setProcesando(false)
    }, 1100)
  }

  const totalRegistros = archivos.reduce((a, b) => a + b.registros, 0)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Paso 2 · Dealers"
        title="Carga de archivos de los dealers"
        desc="Los concesionarios envían su Excel de unidades y el PDF con las facturas de los coches. Se arrastran aquí, se procesan, y lo que falta se reprograma al siguiente mes automáticamente."
      />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Archivos cargados" value={archivos.length} sub="Excel + PDF" />
        <Kpi label="Registros leídos" value={totalRegistros} sub="Unidades detectadas" />
        <Kpi label="Dealers reportando" value={new Set(archivos.map(a => a.dealer)).size} sub="de 6" />
        <Kpi label="Faltantes" value={faltantes.length} sub="Reprogramados a Julio" accent />
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Dropzone */}
        <div className="col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); simularCarga() }}
            className={`rounded-2xl border-2 border-dashed h-full min-h-[320px] grid place-items-center text-center px-6 transition-colors ${
              drag ? 'border-kia-red bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-kia-black text-white grid place-items-center mb-4">
                <Icon.Upload width={24} height={24} />
              </div>
              <div className="font-bold text-kia-black">Arrastra Excel y PDF aquí</div>
              <p className="text-sm text-kia-gray mt-1.5 max-w-xs mx-auto">
                Acepta el reporte de unidades (.xlsx) y las facturas (.pdf) que mandan los dealers.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Pill tone="green"><Icon.Excel width={13} height={13} /> .xlsx</Pill>
                <Pill tone="red"><Icon.Pdf width={13} height={13} /> .pdf</Pill>
              </div>
              <Button variant="soft" className="mt-5" onClick={simularCarga} disabled={procesando}>
                {procesando ? 'Procesando…' : 'Simular carga de archivos'}
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de archivos */}
        <div className="col-span-3 space-y-4">
          <Card className="p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Icon.File width={17} height={17} /> Archivos procesados</h3>
            <div className="space-y-2">
              {archivos.map(f => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-kia-line px-3.5 py-2.5">
                  <span className={`h-9 w-9 rounded-lg grid place-items-center text-white shrink-0 ${f.tipo === 'PDF' ? 'bg-kia-red' : 'bg-emerald-600'}`}>
                    {f.tipo === 'PDF' ? <Icon.Pdf width={16} height={16} /> : <Icon.Excel width={16} height={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{f.nombre}</div>
                    <div className="text-xs text-kia-gray">{dealerNombre(f.dealer)} · {f.registros} registros</div>
                  </div>
                  <Pill tone={f.estatus.startsWith('Faltante') ? 'amber' : 'green'}>
                    {f.estatus.startsWith('Faltante') ? <Icon.Alert width={13} height={13} /> : <Icon.Check width={13} height={13} />}
                    {f.estatus}
                  </Pill>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2 text-amber-700"><Icon.Clock width={17} height={17} /> Fuera de tiempo</h3>
              <Pill tone="amber">{faltantes.length} VIN</Pill>
            </div>
            <div className="space-y-2">
              {faltantes.map(f => (
                <div key={f.vin} className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-semibold">{f.vin}</span>
                    <span className="text-xs font-semibold text-amber-700">{f.accion}</span>
                  </div>
                  <div className="text-xs text-amber-800/80 mt-0.5">{dealerNombre(f.dealer)} · {f.modelo} — {f.motivo}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
