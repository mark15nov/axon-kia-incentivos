// Catálogo de modelos y versiones con dos interruptores por fila:
// si aplica la regla B (cumplimiento por modelo) y si aplica el bono.
import { useMemo, useState } from 'react'
import { Card, Pill } from './base.jsx'
import { Icon } from '../../../components/icons.jsx'
import { CATALOGO_MODELOS, catalogoConVentas, llaveModelo } from '../motor/catalogoModelos.js'

const REGLAS = [
  { lista: 'modelosSinReglaB', titulo: 'Cumplimiento por modelo', sub: 'Regla B' },
  { lista: 'modelosSinBono', titulo: 'Bono adicional', sub: '+50%' }
]

function Interruptor({ on, onClick, disabled, etiqueta }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={etiqueta} onClick={onClick} disabled={disabled}
      className={`relative h-[18px] w-8 rounded-full transition-colors disabled:cursor-not-allowed ${on ? 'bg-emerald-600' : 'bg-slate-300'} ${disabled ? 'opacity-40' : ''}`}>
      <span className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-[14px]' : ''}`} />
    </button>
  )
}

/** Texto corto con las exclusiones de una lista ("SONET · K3 GT-LINE T/A HB"). */
export function resumenExclusiones(lista) {
  return lista.length ? lista.map(k => k.replace('|', ' ')).join(' · ') : 'ninguno'
}

export default function TablaModelos({ parametros: p, setParametros, ventas }) {
  const catalogo = useMemo(() => catalogoConVentas(ventas ?? []), [ventas])
  const base = useMemo(() => new Map(CATALOGO_MODELOS.map(m => [m.familia, new Set(m.versiones)])), [])
  const [abiertos, setAbiertos] = useState(() => new Set())

  const alternar = (lista, llave) => setParametros({
    ...p, [lista]: p[lista].includes(llave) ? p[lista].filter(x => x !== llave) : [...p[lista], llave]
  })
  const abrir = (familia) => setAbiertos(s => {
    const n = new Set(s)
    if (n.has(familia)) n.delete(familia)
    else n.add(familia)
    return n
  })
  const todosAbiertos = abiertos.size === catalogo.filter(m => m.versiones.length).length
  const totalVersiones = catalogo.reduce((a, m) => a + m.versiones.length, 0)

  return (
    <Card className="overflow-hidden" >
      <div id="modelos" className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-kia-line">
        <div>
          <h3 className="font-semibold text-[15px]">Modelos y versiones</h3>
          <p className="text-xs text-kia-gray mt-0.5">{catalogo.length} modelos · {totalVersiones} versiones. Apaga un modelo completo o sólo una versión para cada regla.</p>
        </div>
        <button onClick={() => setAbiertos(todosAbiertos ? new Set() : new Set(catalogo.filter(m => m.versiones.length).map(m => m.familia)))}
          className="text-xs font-semibold text-kia-gray hover:text-kia-black">{todosAbiertos ? 'Contraer versiones' : 'Ver todas las versiones'}</button>
      </div>

      <div className="grid grid-cols-[1fr_150px_150px] items-center px-5 py-2 bg-slate-50 border-b border-kia-line text-[11px] font-semibold uppercase tracking-wider text-kia-gray">
        <span>Modelo / versión</span>
        {REGLAS.map(r => <span key={r.lista} className="text-center leading-tight">{r.titulo}<span className="block normal-case tracking-normal font-normal">{r.sub}</span></span>)}
      </div>

      <ul className="divide-y divide-kia-line">
        {catalogo.map(m => {
          const abierto = abiertos.has(m.familia)
          const nuevasDeBase = base.get(m.familia) ?? new Set()
          return (
            <li key={m.familia}>
              <div className="grid grid-cols-[1fr_150px_150px] items-center px-5 py-2.5 hover:bg-slate-50/70">
                <button type="button" onClick={() => m.versiones.length && abrir(m.familia)} aria-expanded={m.versiones.length ? abierto : undefined}
                  className={`flex items-center gap-2 text-left min-w-0 ${m.versiones.length ? 'cursor-pointer' : 'cursor-default'}`}>
                  <Icon.Chevron width={13} height={13} className={`shrink-0 text-kia-gray transition-transform ${abierto ? 'rotate-90' : ''} ${m.versiones.length ? '' : 'invisible'}`} />
                  <span className="text-sm font-semibold truncate">{m.nombre}</span>
                  <span className="text-xs text-kia-gray shrink-0">{m.versiones.length ? `${m.versiones.length} ${m.versiones.length === 1 ? "versión" : "versiones"}` : 'sin versiones en los layouts aún'}</span>
                  {m.nuevo && <Pill tone="amber">Nuevo en ventas</Pill>}
                </button>
                {REGLAS.map(r => (
                  <span key={r.lista} className="flex justify-center">
                    <Interruptor on={!p[r.lista].includes(m.familia)} onClick={() => alternar(r.lista, m.familia)} etiqueta={`${r.titulo} · ${m.nombre}`} />
                  </span>
                ))}
              </div>
              {abierto && (
                <ul className="bg-slate-50/60 border-t border-kia-line">
                  {m.versiones.map(v => (
                    <li key={v} className="grid grid-cols-[1fr_150px_150px] items-center pl-12 pr-5 py-1.5">
                      <span className="text-[13px] text-kia-black/80 flex items-center gap-2">
                        {v}
                        {!nuevasDeBase.has(v) && !m.nuevo && <Pill tone="amber">Nueva</Pill>}
                      </span>
                      {REGLAS.map(r => {
                        const modeloFuera = p[r.lista].includes(m.familia)
                        const llave = llaveModelo(m.familia, v)
                        return (
                          <span key={r.lista} className="flex justify-center">
                            <Interruptor on={!modeloFuera && !p[r.lista].includes(llave)} disabled={modeloFuera}
                              onClick={() => alternar(r.lista, llave)} etiqueta={`${r.titulo} · ${m.nombre} ${v}`} />
                          </span>
                        )
                      })}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
