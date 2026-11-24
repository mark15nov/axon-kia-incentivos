// Amortización francesa (pago nivelado) usada por la calculadora de la
// financiera: interés del mes = saldo × tasa anual / 12.

/**
 * Intereses mes a mes de un crédito.
 * @param {number} monto     monto financiado
 * @param {number} tasaPct   tasa anual en % (8.95 = 8.95%)
 * @param {number} plazo     meses
 * @returns {number[]}
 */
export function interesesMensuales(monto, tasaPct, plazo) {
  if (!(monto > 0) || !(plazo > 0)) return []
  const i = tasaPct / 100 / 12
  if (i === 0) return Array(plazo).fill(0)
  const pago = (monto * i) / (1 - (1 + i) ** -plazo)
  const out = []
  let saldo = monto
  for (let k = 0; k < plazo; k += 1) {
    const interes = saldo * i
    out.push(interes)
    saldo -= pago - interes
  }
  return out
}

export const totalIntereses = (monto, tasaPct, plazo) => interesesMensuales(monto, tasaPct, plazo).reduce((a, x) => a + x, 0)

/** Charge = intereses a tasa teórica − intereses a tasa real. */
export function chargeRecalculado({ monto, tasaReal, beneficio, plazo }) {
  const real = totalIntereses(monto, tasaReal, plazo)
  const teorico = totalIntereses(monto, tasaReal + beneficio, plazo)
  return { real, teorico, charge: teorico - real }
}

export const round2 = (x) => Math.round(Number((x * 100).toPrecision(15))) / 100
