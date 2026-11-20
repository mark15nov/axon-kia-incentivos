import { useRef, useState } from 'react'
import { Card, SectionTitle, Pill, Button } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { ARCHIVOS } from './useCargaMV.js'
import { VERSIONES } from './versiones.js'
import { Indicador, AvisoSinCruce } from './componentes.jsx'
import { entero, millones, nombrePeriodo, tamano } from './formato.js'

const SEVERIDAD = {
  error: { tono: 'red', label: 'Error', punto: 'bg-kia-red' },
  aviso: { tono: 'amber', label: 'Aviso', punto: 'bg-amber-400' },
  info: { tono: 'gray', label: 'Info', punto: 'bg-slate-400' }
}

function ZonaArchivo({ tipo, archivo, onArchivo, onQuitar }) {
  const meta = ARCHIVOS[tipo]
  const ref = useRef(null)
  const [arrastre, setArrastre] = useState(false)
  const estado = archivo?.estado
  const soltar = (e) => { e.preventDefault(); setArrastre(false); const f = e.dataTransfer.files?.[0]; if (f) onArchivo(tipo, f) }

  return (
    <Card className={`p-4 flex flex-col ${estado === 'error' ? 'ring-1 ring-kia-red/40' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="font-bold text-sm">{meta.titulo}</div>
          <div className="text-xs text-kia-gray mt-0.5 leading-snug">{meta.desc}</div>
        </div>
        {meta.obligatorio ? <Pill tone="ink">Obligatorio</Pill> : <Pill tone="gray">Opcional</Pill>}
      </div>

      {!archivo ? (
        <button type="button" onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setArrastre(true) }} onDragLeave={() => setArrastre(false)} onDrop={soltar}
          className={`flex-1 rounded-md border-2 border-dashed px-4 py-7 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kia-black/20 ${arrastre ? 'border-kia-red bg-red-50/60' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'}`}>
          <Icon.Excel width={26} height={26} className="mx-auto text-emerald-600" />
          <div className="text-sm font-semibold mt-2">Arrastra el .xlsx o haz clic</div>
          <div className="text-[11px] text-kia-gray mt-0.5">Máx. 40 MB</div>
        </button>
      ) : (
        <div className="flex-1 rounded-md border border-kia-line px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className={`h-9 w-9 shrink-0 rounded grid place-items-center ${estado === 'listo' ? 'bg-emerald-50 text-emerald-600' : estado === 'error' ? 'bg-red-50 text-kia-red' : 'bg-slate-100 text-kia-gray'}`}>
              {estado === 'leyendo' ? <Icon.Refresh width={17} height={17} className="animate-spin" /> : estado === 'error' ? <Icon.Alert width={17} height={17} /> : <Icon.Check width={17} height={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate" title={archivo.nombre}>{archivo.nombre}</div>
              <div className="text-[11px] text-kia-gray">{estado === 'leyendo' ? 'Leyendo y validando…' : archivo.resumen ?? (archivo.tamano ? tamano(archivo.tamano) : '')}</div>
            </div>
            {estado !== 'leyendo' && (
              <button onClick={() => onQuitar(tipo)} className="text-xs font-semibold text-kia-gray hover:text-kia-red" aria-label={`Quitar ${meta.titulo}`}>Quitar</button>
            )}
          </div>
          {[...(archivo.errores ?? []), ...(archivo.avisos ?? [])].map((m, i) => (
            <div key={i} className={`mt-2 text-xs rounded px-2.5 py-1.5 ${i < (archivo.errores?.length ?? 0) ? 'bg-red-50 text-kia-red' : 'bg-amber-50 text-amber-700'}`}>{m}</div>
          ))}
        </div>
      )}
      <input ref={ref} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onArchivo(tipo, f); e.target.value = '' }} />
    </Card>
  )
}

function Incidencias({ lista }) {
  if (!lista.length) return <div className="text-sm text-emerald-600 flex items-center gap-2"><Icon.Check width={16} height={16} /> Sin incidencias de cruce.</div>
  const orden = { error: 0, aviso: 1, info: 2 }
  return (
    <div className="space-y-2">
      {[...lista].sort((a, b) => orden[a.severidad] - orden[b.severidad]).map(i => {
        const s = SEVERIDAD[i.severidad]
        return (
          <div key={i.tipo} className="flex items-start gap-3 rounded-md border border-kia-line px-3.5 py-2.5">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.punto}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{i.titulo}</span>
                <Pill tone={s.tono}>{s.label}</Pill>
              </div>
              <div className="text-xs text-kia-gray mt-0.5">{i.detalle}</div>
              {i.ejemplos.length > 0 && <div className="text-[11px] text-kia-gray/80 mt-1 font-mono truncate">{i.ejemplos.join(' · ')}{i.n > i.ejemplos.length ? ' …' : ''}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PasoCarga({ carga, resultado, errorCalculo, version, irA }) {
  const { archivos, cargarArchivo, cargarDemo, quitar, leyendo } = carga
  const tipos = VERSIONES[version].archivos
  const r = resultado?.resumen

  return (
    <div className="space-y-6">
      <SectionTitle kicker="Etapa 1 · Paso 2" title="Carga mensual"
        desc={`Sube ${tipos.length === 2 ? 'los 2 layouts' : 'los layouts'} del mes. La plataforma valida columnas, periodos y cruces (VIN ↔ provisión, dealer ↔ catálogo ↔ MOU) y calcula el incentivo.`}
        right={<Button variant="ghost" onClick={() => cargarDemo(tipos)} disabled={leyendo}><Icon.Database width={15} height={15} /> Cargar demo · marzo 2026</Button>} />

      <div className={`grid grid-cols-1 gap-4 ${tipos.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {tipos.map(t => <ZonaArchivo key={t} tipo={t} archivo={archivos[t]} onArchivo={cargarArchivo} onQuitar={quitar} />)}
      </div>

      {errorCalculo && (
        <Card className="p-4 border-l-4 border-l-kia-red text-sm"><b>No se pudo calcular:</b> {errorCalculo}</Card>
      )}

      {resultado && (
        <>
          <AvisoSinCruce resultado={resultado} provision={archivos.mv?.tablas?.provision} />
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Lectura del periodo</h3>
              <Pill tone="green"><Icon.Check width={13} height={13} /> {nombrePeriodo(resultado.periodo)}</Pill>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
              <Indicador label="Ventas del periodo" valor={entero(r.unidadesVendidas)} />
              <Indicador label="Con provisión" valor={entero(r.unidadesConProvision)} sub={`${entero(r.unidadesVendidas - r.unidadesConProvision)} sin provisión`} />
              <Indicador label="Provisión" valor={millones(r.provisionTotal)} />
              <Indicador label="Dealers" valor={entero(r.dealersTotal)} />
              <Indicador label="MOS / WHS" valor={`${resultado.periodosFuente.mos}`} sub="periodo usado" />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-bold mb-3">Incidencias de cruce</h3>
            <Incidencias lista={resultado.incidencias} />
          </Card>
          <div className="flex justify-end">
            <Button variant="danger" onClick={() => irA(3)}>Ver forecast <Icon.Arrow width={16} height={16} /></Button>
          </div>
        </>
      )}
    </div>
  )
}
