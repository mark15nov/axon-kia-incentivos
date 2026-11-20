// ============================================================
//  Conciliación · plataforma vs. cálculo manual de Finanzas
//  Compara VIN por VIN el monto a pagar. Sirve para la corrida
//  en paralelo mientras Finanzas sigue generando su archivo.
// ============================================================

import { REGLA } from './calculo.js'

const TOLERANCIA = 0.5 // pesos

/**
 * @param {{ vins: object[] }} resultado  salida de calcularMargenVariable
 * @param {Map<string, { provision: number, monto: number }>} referencia
 */
export function conciliar(resultado, referencia) {
  const plataforma = new Map(resultado.vins.filter(v => v.regla !== REGLA.SIN_PROVISION).map(v => [v.vin, v]))
  const difieren = []
  const soloPlataforma = []
  let coinciden = 0
  let totalReferencia = 0
  let totalPlataforma = 0

  for (const [vin, v] of plataforma) {
    totalPlataforma += v.monto
    const ref = referencia.get(vin)
    if (!ref) { soloPlataforma.push({ vin, dealer: v.dealer, familia: v.familia, monto: v.monto }); continue }
    if (Math.abs(ref.monto - v.monto) <= TOLERANCIA) { coinciden += 1; continue }
    difieren.push({
      vin, dealer: v.dealer, familia: v.familia, uso: v.uso, regla: v.regla, motivo: v.motivo,
      montoPlataforma: v.monto, montoFinanzas: ref.monto, diferencia: v.monto - ref.monto,
      provisionPlataforma: v.provision, provisionFinanzas: ref.provision
    })
  }
  const soloFinanzas = []
  for (const [vin, ref] of referencia) {
    totalReferencia += ref.monto
    if (!plataforma.has(vin)) soloFinanzas.push({ vin, monto: ref.monto })
  }

  // Agrupa diferencias por dealer para explicar el origen.
  const porDealer = new Map()
  for (const d of difieren) {
    const a = porDealer.get(d.dealer) ?? { dealer: d.dealer, vins: 0, diferencia: 0, reglas: new Set() }
    porDealer.set(d.dealer, { ...a, vins: a.vins + 1, diferencia: a.diferencia + d.diferencia, reglas: new Set([...a.reglas, d.regla]) })
  }

  const comparables = coinciden + difieren.length
  return {
    totalPlataforma: Math.round(totalPlataforma * 100) / 100,
    totalReferencia: Math.round(totalReferencia * 100) / 100,
    diferencia: Math.round((totalPlataforma - totalReferencia) * 100) / 100,
    vinsComparables: comparables,
    coinciden,
    pctCoincidencia: comparables ? coinciden / comparables : 0,
    difieren: difieren.sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia)),
    difierenPorDealer: [...porDealer.values()].map(x => ({ ...x, reglas: [...x.reglas] })).sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia)),
    soloPlataforma,
    soloFinanzas
  }
}
