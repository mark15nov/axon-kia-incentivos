import { useState } from 'react'
import { Card, SectionTitle, Kpi, Pill, Button } from '../../components/ui.jsx'
import { Icon } from '../../components/icons.jsx'
import { ESTATUS_FACTURA, VIGENCIA, dealersFactura } from '../../data/cashbackFacturas.js'

// Decisión de Finanzas derivada del análisis del paso 2. Las facturas correctas
// pueden recibir VoBo; el resto se rechaza con su motivo.
function decisionDe(d, vobo) {
  if (d.estatus === 'correcta') return vobo.has(d.id) ? { tipo: 'autorizada' } : { tipo: 'revision' }
  const motivo = d.estatus === 'falta' ? 'Factura no recibida' : d.causa
  return { tipo: 'no_autorizada', motivo }
}

const DEC = {
  autorizada: { label: 'Autorizada', tone: 'green', ord: 0 },
  no_autorizada: { label: 'No autorizada', tone: 'red', ord: 1 },
  revision: { label: 'En revisión', tone: 'amber', ord: 2 }
}
const ORD_FACTURA = { correcta: 0, incorrecta: 1, falta: 2, fuera_fecha: 3 }

const FILTROS = [
  { v: 'all', label: 'Todas' },
  { v: 'autorizada', label: '✓ Autorizadas' },
  { v: 'no_autorizada', label: '✕ No autorizadas' },
  { v: 'revision', label: 'En revisión' }
]

function mailAut(nombre) {
  return `Estimado ${nombre}:

Le informamos que sus facturas de Cashback del periodo (vigencia ${VIGENCIA}) fueron AUTORIZADAS por Finanzas y proceden al pago del incentivo.

No se requiere ninguna acción adicional de su parte.

Saludos,
Finanzas · Incentivos KIA`
}

function mailRech(nombre, motivo) {
  return `Estimado ${nombre}:

Le informamos que sus facturas de Cashback del periodo (vigencia ${VIGENCIA}) NO fueron autorizadas por Finanzas por el siguiente motivo:

• ${motivo}

Favor de subsanar y reenviar la documentación para su reconsideración.

Saludos,
Finanzas · Incentivos KIA`
}

export default function CashbackVoBoFinanzas() {
  const [vobo, setVobo] = useState(() => new Set(dealersFactura.filter(d => d.estatus === 'correcta').map(d => d.id)))
  const [enviadoAut, setEnviadoAut] = useState(false)
  const [enviadoRech, setEnviadoRech] = useState(false)
  const [sort, setSort] = useState({ key: 'factura', dir: 'asc' })
  const [filtro, setFiltro] = useState('all')
  const [modal, setModal] = useState(null) // { nombre, texto, tipo }

  const rows = dealersFactura.map(d => ({ d, dec: decisionDe(d, vobo) }))
  const autorizadas = rows.filter(r => r.dec.tipo === 'autorizada')
  const noAutorizadas = rows.filter(r => r.dec.tipo === 'no_autorizada')
  const enRevision = rows.filter(r => r.dec.tipo === 'revision')

  const toggleVobo = (id) => {
    setEnviadoAut(false); setEnviadoRech(false)
    setVobo(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const onSort = (key) => setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const SORTERS = {
    nombre: (a, b) => a.d.nombre.localeCompare(b.d.nombre),
    region: (a, b) => a.d.region.localeCompare(b.d.region),
    factura: (a, b) => ORD_FACTURA[a.d.estatus] - ORD_FACTURA[b.d.estatus],
    decision: (a, b) => DEC[a.dec.tipo].ord - DEC[b.dec.tipo].ord
  }

  const visibles = rows.filter(r => filtro === 'all' || r.dec.tipo === filtro)
  const ordenadas = sort.key ? [...visibles].sort((a, b) => SORTERS[sort.key](a, b) * (sort.dir === 'asc' ? 1 : -1)) : visibles

  const enviadoDe = (tipo) => (tipo === 'autorizada' ? enviadoAut : tipo === 'no_autorizada' ? enviadoRech : false)

  return (
    <div className="space-y-6">
      <SectionTitle
        kicker="Etapa 1 · Paso 3"
        title="VoBo de Finanzas"
        desc="Finanzas da luz verde a las facturas correctas del análisis del paso 2. Desde aquí se envían los correos a los dealers informando si su factura fue autorizada o no (con el motivo)."
        right={<Pill tone={enviadoAut && enviadoRech ? 'green' : 'amber'}>{enviadoAut && enviadoRech ? <><Icon.Check width={14} height={14} /> Correos enviados</> : 'Pendiente de VoBo'}</Pill>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Autorizadas" value={String(autorizadas.length)} sub="Con VoBo de Finanzas" accent />
        <Kpi label="No autorizadas" value={String(noAutorizadas.length)} sub="Rechazadas con motivo" />
        <Kpi label="En revisión" value={String(enRevision.length)} sub="Sin VoBo aún" />
        <Kpi label="Correos" value={`${(enviadoAut ? autorizadas.length : 0) + (enviadoRech ? noAutorizadas.length : 0)} / ${autorizadas.length + noAutorizadas.length}`} sub="Enviados" />
      </div>

      {/* Tabla de decisión por dealer */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-kia-line flex-wrap">
          <h3 className="font-bold flex items-center gap-2"><Icon.Shield width={17} height={17} /> Decisión de Finanzas por dealer</h3>
          <div className="inline-flex rounded-xl border border-kia-line p-0.5 bg-slate-50">
            {FILTROS.map(o => (
              <button key={o.v} onClick={() => setFiltro(o.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filtro === o.v ? 'bg-white text-kia-black shadow-sm' : 'text-kia-gray hover:text-kia-black'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-kia-gray text-xs uppercase tracking-wide">
                <Th label="Dealer" k="nombre" sort={sort} onSort={onSort} pad="px-5" />
                <Th label="Región" k="region" sort={sort} onSort={onSort} />
                <Th label="Factura (paso 2)" k="factura" sort={sort} onSort={onSort} />
                <th className="text-left font-semibold px-3 py-3">VoBo</th>
                <Th label="Decisión" k="decision" sort={sort} onSort={onSort} />
                <th className="text-right font-semibold px-5 py-3">Correo</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map(({ d, dec }) => {
                const ef = ESTATUS_FACTURA[d.estatus]
                const dd = DEC[dec.tipo]
                const puedeVobo = d.estatus === 'correcta'
                const texto = dec.tipo === 'autorizada' ? mailAut(d.nombre) : dec.tipo === 'no_autorizada' ? mailRech(d.nombre, dec.motivo) : null
                return (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold">{d.nombre}</div>
                      {dec.motivo && <div className="text-xs text-kia-red">{dec.motivo}</div>}
                    </td>
                    <td className="px-3 py-3 text-kia-gray">{d.region}</td>
                    <td className="px-3 py-3"><Pill tone={ef.tone}>{ef.label}</Pill></td>
                    <td className="px-3 py-3">
                      {puedeVobo ? (
                        <button onClick={() => toggleVobo(d.id)}
                          className={`h-6 w-6 rounded-md grid place-items-center border transition-colors ${vobo.has(d.id) ? 'bg-emerald-500 text-white border-transparent' : 'border-slate-300 text-slate-400 hover:border-slate-400'}`}>
                          {vobo.has(d.id) ? <Icon.Check width={14} height={14} /> : <span className="text-base leading-none font-semibold">+</span>}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><Pill tone={dd.tone}>{dd.label}</Pill></td>
                    <td className="px-5 py-3 text-right">
                      {dec.tipo === 'revision' ? (
                        <span className="text-xs text-kia-gray">Sin correo</span>
                      ) : enviadoDe(dec.tipo) ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Icon.Check width={12} height={12} /> Enviado</span>
                      ) : (
                        <button onClick={() => setModal({ nombre: d.nombre, texto, tipo: dec.tipo })} className="text-xs font-semibold text-kia-red hover:underline">Ver correo</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {ordenadas.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-kia-gray text-sm">Sin resultados con este filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------- Correos separados por tipo ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MailBox
          tipo="autorizada"
          titulo="Correos de autorización"
          destinatarios={autorizadas}
          plantilla={mailAut('[Dealer]')}
          enviado={enviadoAut}
          onEnviar={() => setEnviadoAut(true)}
          onVer={(d) => setModal({ nombre: d.nombre, texto: mailAut(d.nombre), tipo: 'autorizada' })}
        />
        <MailBox
          tipo="no_autorizada"
          titulo="Correos de no autorización"
          destinatarios={noAutorizadas}
          plantilla={mailRech('[Dealer]', '[motivo del rechazo]')}
          enviado={enviadoRech}
          onEnviar={() => setEnviadoRech(true)}
          onVer={(d, dec) => setModal({ nombre: d.nombre, texto: mailRech(d.nombre, dec.motivo), tipo: 'no_autorizada' })}
        />
      </div>

      {/* Modal · preview del correo */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-kia-line">
              <div className="flex items-center gap-3">
                <span className={`h-10 w-10 rounded-xl grid place-items-center text-white ${modal.tipo === 'autorizada' ? 'bg-emerald-500' : 'bg-kia-red'}`}><Icon.Mail width={19} height={19} /></span>
                <div>
                  <h3 className="font-bold">Correo a {modal.nombre}</h3>
                  <p className="text-xs text-kia-gray">{DEC[modal.tipo].label}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-kia-black text-lg leading-none">✕</button>
            </div>
            <div className="px-6 py-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-kia-black leading-relaxed rounded-xl bg-slate-50 border border-kia-line p-4">{modal.texto}</pre>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-kia-line">
              <Button variant="ghost" onClick={() => setModal(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ label, k, sort, onSort, pad = 'px-3' }) {
  const active = sort.key === k
  return (
    <th className={`text-left font-semibold ${pad} py-3`}>
      <button onClick={() => onSort(k)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-kia-black transition-colors">
        {label}
        <span className={`text-[9px] ${active ? 'text-kia-black' : 'text-slate-300'}`}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  )
}

function MailBox({ tipo, titulo, destinatarios, plantilla, enviado, onEnviar, onVer }) {
  const aut = tipo === 'autorizada'
  return (
    <Card className={`p-5 border-l-4 ${aut ? 'border-l-emerald-400' : 'border-l-kia-red'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <span className={`h-8 w-8 rounded-lg grid place-items-center text-white ${aut ? 'bg-emerald-500' : 'bg-kia-red'}`}><Icon.Mail width={16} height={16} /></span>
          {titulo}
        </h3>
        {enviado ? <Pill tone="green"><Icon.Check width={12} height={12} /> Enviados</Pill> : <Pill tone={aut ? 'green' : 'red'}>{destinatarios.length}</Pill>}
      </div>

      {/* Plantilla del correo */}
      <pre className={`whitespace-pre-wrap font-mono text-[11px] leading-relaxed rounded-xl border p-3 max-h-40 overflow-y-auto ${aut ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-red-50/50 border-red-100 text-kia-black'}`}>{plantilla}</pre>

      {/* Destinatarios */}
      <div className="mt-3">
        <div className="text-[11px] font-semibold text-kia-gray uppercase tracking-wide mb-1.5">Destinatarios · {destinatarios.length}</div>
        {destinatarios.length === 0 ? (
          <p className="text-sm text-kia-gray">Ninguno.</p>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {destinatarios.map(({ d, dec }) => (
              <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${aut ? 'bg-emerald-500' : 'bg-kia-red'}`} />
                  <span className="font-semibold truncate">{d.nombre}</span>
                  {dec.motivo && <span className="text-xs text-kia-gray truncate">· {dec.motivo}</span>}
                </span>
                <button onClick={() => onVer(d, dec)} className="text-xs font-semibold text-kia-red hover:underline shrink-0">Ver</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant={aut ? 'primary' : 'danger'} className="w-full mt-4" disabled={!destinatarios.length || enviado} onClick={onEnviar}>
        {enviado ? <><Icon.Check width={16} height={16} /> Correos enviados</> : <><Icon.Mail width={16} height={16} /> Enviar {destinatarios.length} correo(s)</>}
      </Button>
    </Card>
  )
}
