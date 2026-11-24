// ============================================================
//  KIA FIDELITY · Parámetros
//  Kia paga a la financiera un subsidio de tasa por crédito:
//    Charge = intereses a tasa teórica − intereses a tasa real
//  Parte A: cuánto se le paga a la financiera.
//  Parte B: qué se le debita al distribuidor (resultado separado;
//           no se resta del pago a la financiera).
// ============================================================

export const CODIGO_FIDELITY = 'FD'

/** @typedef {{
 *   nRuleMeses: number,
 *   demoMinDias: number,
 *   toleranciaCentavos: number,
 *   longitudVin: number,
 *   baseDebito: 'recalculado' | 'reclamado'
 * }} ParametrosFidelity */

/** @type {Readonly<ParametrosFidelity>} */
export const PARAMETROS_DEFAULT = Object.freeze({
  // N-rule: el retail (SAP) puede caer en el mes del contrato o hasta N meses antes.
  // PENDIENTE de confirmar por KIA.
  nRuleMeses: 1,
  // Antigüedad mínima de un demo: días entre su alta (Billing Date SAP) y la fecha del contrato.
  // PENDIENTE de confirmar por KIA.
  demoMinDias: 90,
  // Tolerancia del recálculo del Charge (al centavo).
  toleranciaCentavos: 0.01,
  longitudVin: 17,
  // Monto del débito al dealer: el Charge recalculado (o el reclamado si no se pudo recalcular).
  baseDebito: 'recalculado'
})

export const PENDIENTES_CONFIRMAR = Object.freeze(['nRuleMeses', 'demoMinDias'])

export function normalizarParametros(entrada = {}) {
  const p = { ...PARAMETROS_DEFAULT, ...entrada }
  for (const k of ['nRuleMeses', 'demoMinDias', 'toleranciaCentavos', 'longitudVin']) {
    const v = Number(p[k])
    if (!Number.isFinite(v) || v < 0) throw new Error(`Parámetro inválido: ${k} debe ser un número ≥ 0`)
    p[k] = v
  }
  if (p.baseDebito !== 'recalculado' && p.baseDebito !== 'reclamado') throw new Error("Parámetro inválido: baseDebito debe ser 'recalculado' o 'reclamado'")
  return p
}
