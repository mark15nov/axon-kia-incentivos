// ============================================================
//  KIA FIDELITY · KIA
//  Paso 1 (Definir Oferta) propio: el beneficio de crédito se
//  calcula con el monto financiado y la Oferta Comercial en SAP;
//  ese monto se multiplica por el KMX Share Rate y se compara
//  contra el Inbursa Requested Payment.
//  Pasos 2 (Forecast), 3 (Validar vs financiera) y 4 (Mail) se
//  toman de los flujos existentes.
// ============================================================

export { fmtMXN } from './mockData.js'

export const KF_PERIODO = 'Junio 2026'
export const KF_FINANCIERA = 'Inbursa'

// Oferta Comercial (SAP) y KMX Share Rate (PDF Inbursa).
export const KF_OFERTA_PCT = 0.03   // % del monto financiado
export const KF_KMX_SHARE = 0.65    // KMX Share Rate

// VINs con monto financiado (SAP) y pago solicitado por Inbursa.
export const kfVins = [
  { vin: '3KPA24AD1PE540118', dealer: 'KIA Santa Fe',      modelo: 'Sportage', financiado: 545000, inbursaPago: 10628 },
  { vin: 'KNAD5813XP6541204', dealer: 'KIA Valle Oriente', modelo: 'Sonet',    financiado: 362000, inbursaPago: 6800 },
  { vin: '3KPC24AD7PE098330', dealer: 'KIA Patria',        modelo: 'K3',       financiado: 396000, inbursaPago: 7722 },
  { vin: 'KNADE163BP7744780', dealer: 'KIA Querétaro',     modelo: 'Seltos',   financiado: 472000, inbursaPago: 8450 },
  { vin: '3KPA24AD9PE540552', dealer: 'KIA Interlomas',    modelo: 'Sportage', financiado: 541000, inbursaPago: 10550 },
  { vin: 'KNAD5813XP6541560', dealer: 'KIA Mérida',        modelo: 'Sonet',    financiado: 354000, inbursaPago: 6903 },
  { vin: '3KPC24AD7PE098512', dealer: 'KIA Culiacán',      modelo: 'K3',       financiado: 392000, inbursaPago: 6950 },
  { vin: 'KNADE163BP7744992', dealer: 'KIA Cancún',        modelo: 'Seltos',   financiado: 468000, inbursaPago: 9126 }
]

export function kfCalcVin(v, ofertaPct, kmxShare) {
  const beneficio = Math.round(v.financiado * ofertaPct)
  const aporteKmx = Math.round(beneficio * kmxShare)
  const delta = aporteKmx - v.inbursaPago
  const diferencia = Math.abs(delta) > Math.max(300, v.inbursaPago * 0.08)
  return { beneficio, aporteKmx, delta, estatus: diferencia ? 'diferencia' : 'ok' }
}

export function kfTotales(ofertaPct, kmxShare) {
  let financiado = 0, beneficio = 0, aporteKmx = 0, inbursa = 0, diferencias = 0
  kfVins.forEach(v => {
    const c = kfCalcVin(v, ofertaPct, kmxShare)
    financiado += v.financiado
    beneficio += c.beneficio
    aporteKmx += c.aporteKmx
    inbursa += v.inbursaPago
    if (c.estatus === 'diferencia') diferencias += 1
  })
  return { vins: kfVins.length, financiado, beneficio, aporteKmx, inbursa, diferencias }
}

// ---- Paso 4 · Mail a dealers ----
export const kfDealersAplican = [
  { id: 'D01', dealer: 'KIA Santa Fe',      zona: 'Centro' },
  { id: 'D02', dealer: 'KIA Valle Oriente', zona: 'Norte' },
  { id: 'D03', dealer: 'KIA Patria',        zona: 'Occidente' },
  { id: 'D04', dealer: 'KIA Interlomas',    zona: 'Metropolitana' },
  { id: 'D05', dealer: 'KIA Querétaro',     zona: 'Bajío' },
  { id: 'D06', dealer: 'KIA Mérida',        zona: 'Sureste' }
]

export const kfComunicadoBase = {
  asunto: `KIA Fidelity · Beneficio de crédito por fidelidad — ${KF_PERIODO}`,
  cuerpo: `Estimado concesionario:

Como parte del programa KIA Fidelity de ${KF_PERIODO}, los clientes de recompra que financien su unidad reciben un beneficio de crédito calculado sobre el monto financiado y la Oferta Comercial vigente. KMX aporta su share y el monto se concilia contra el pago solicitado por Inbursa.

Refleja el beneficio en la cotización de financiamiento de los clientes elegibles y reporta los avances del periodo.

Saludos,
Centro de Incentivos KIA`
}
