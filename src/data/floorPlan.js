// ============================================================
//  FLOOR PLAN · KIA
//  Paso 1 (Definir Oferta) propio: la info de VIN viene de SAP y
//  se determina el aging de cada unidad. El monto a pagar por VIN
//  = días × tasa diaria, comparado con el Inbursa Requested Payment.
//  A la tasa de referencia se le suman 1.5 pp y se convierte a tasa
//  diaria. Validaciones SAP: no pagar doble el mismo VIN, validar
//  contra el pago solicitado por Inbursa y que el VIN no sea curtailment.
// ============================================================

export { fmtMXN } from './mockData.js'

export const FP_PERIODO = 'Junio 2026'

// Tasa de referencia + spread → tasa aplicada → tasa diaria.
export const FP_TASA_REFERENCIA = 11.25   // %
export const FP_SPREAD = 1.5              // +1.5 puntos porcentuales
export const FP_BASE_DIAS = 360           // convención para la tasa diaria

export function fpTasaAplicada(ref = FP_TASA_REFERENCIA) { return ref + FP_SPREAD }
export function fpTasaDiaria(ref = FP_TASA_REFERENCIA) { return fpTasaAplicada(ref) / FP_BASE_DIAS }

// VINs con aging desde SAP (fecha de ingreso a piso → días).
// flags: curtailment (excluido), duplicado (ya pagado).
export const fpVins = [
  { vin: '3KPA24AD1PE530041', dealer: 'KIA Santa Fe',      modelo: 'Sportage', ingreso: '28 abr 2026', dias: 43,  base: 545000, inbursaPago: 7350,  curtailment: false, duplicado: false },
  { vin: 'KNAD5813XP6531207', dealer: 'KIA Valle Oriente', modelo: 'Sonet',    ingreso: '10 abr 2026', dias: 62,  base: 362000, inbursaPago: 7900,  curtailment: false, duplicado: false },
  { vin: '3KPC24AD7PE097820', dealer: 'KIA Patria',        modelo: 'K3',       ingreso: '05 mar 2026', dias: 88,  base: 396000, inbursaPago: 12300, curtailment: false, duplicado: false },
  { vin: 'KNADE163BP7743901', dealer: 'KIA Querétaro',     modelo: 'Seltos',   ingreso: '09 may 2026', dias: 35,  base: 472000, inbursaPago: 5850,  curtailment: false, duplicado: false },
  { vin: '3KPA24AD9PE530515', dealer: 'KIA Tijuana',       modelo: 'Sportage', ingreso: '02 feb 2026', dias: 132, base: 541000, inbursaPago: 22800, curtailment: true,  duplicado: false },
  { vin: 'KNAD5813XP6531440', dealer: 'KIA Mérida',        modelo: 'Sonet',    ingreso: '21 abr 2026', dias: 54,  base: 354000, inbursaPago: 6700,  curtailment: false, duplicado: false },
  { vin: '3KPC24AD7PE097955', dealer: 'KIA Culiacán',      modelo: 'K3',       ingreso: '25 mar 2026', dias: 71,  base: 392000, inbursaPago: 9800,  curtailment: false, duplicado: true  },
  { vin: 'KNADE163BP7744120', dealer: 'KIA Cancún',        modelo: 'Seltos',   ingreso: '15 may 2026', dias: 29,  base: 468000, inbursaPago: 4800,  curtailment: false, duplicado: false },
  { vin: '3KPA24AD1PE530688', dealer: 'KIA Interlomas',    modelo: 'Sportage', ingreso: '05 mar 2026', dias: 96,  base: 545000, inbursaPago: 16400, curtailment: false, duplicado: false },
  { vin: 'KNAD5813XP6531662', dealer: 'KIA Chihuahua',     modelo: 'Sonet',    ingreso: '24 abr 2026', dias: 47,  base: 358000, inbursaPago: 5950,  curtailment: false, duplicado: false }
]

// Cálculo por VIN con la tasa diaria vigente.
//  pagoCalculado = base × tasaDiaria% × días
//  se compara contra el pago solicitado por Inbursa (delta).
export function fpCalcVin(v, tasaDiariaPct) {
  const pagoCalculado = Math.round(v.base * (tasaDiariaPct / 100) * v.dias)
  const delta = pagoCalculado - v.inbursaPago
  let estatus = 'ok'
  if (v.duplicado) estatus = 'duplicado'
  else if (v.curtailment) estatus = 'curtailment'
  else if (Math.abs(delta) > Math.max(500, v.inbursaPago * 0.08)) estatus = 'diferencia'
  const pagable = !v.duplicado && !v.curtailment
  return { pagoCalculado, delta, estatus, pagable, pagoFinal: pagable ? pagoCalculado : 0 }
}

export function fpTotales(tasaDiariaPct) {
  let dias = 0, calculado = 0, inbursa = 0, aPagar = 0, duplicados = 0, curtailment = 0, diferencias = 0
  fpVins.forEach(v => {
    const c = fpCalcVin(v, tasaDiariaPct)
    dias += v.dias
    calculado += c.pagoCalculado
    inbursa += v.inbursaPago
    aPagar += c.pagoFinal
    if (c.estatus === 'duplicado') duplicados += 1
    if (c.estatus === 'curtailment') curtailment += 1
    if (c.estatus === 'diferencia') diferencias += 1
  })
  return {
    vins: fpVins.length, dias, calculado, inbursa, aPagar,
    diasProm: Math.round(dias / fpVins.length),
    duplicados, curtailment, diferencias
  }
}
