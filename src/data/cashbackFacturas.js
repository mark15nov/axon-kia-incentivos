// ============================================================
//  CASHBACK · Validación de VIN (análisis de facturas)
//  Analiza las facturas recibidas contra los VIN ya capturados.
//  Base de 11 dealers de la red, con su región y gerente de zona.
//  Data mock para la maqueta.
// ============================================================

export const ESTATUS_FACTURA = {
  correcta:    { label: 'Factura correcta', tone: 'green', dot: 'bg-emerald-500', icon: 'Check' },
  incorrecta:  { label: 'Factura incorrecta', tone: 'red', dot: 'bg-kia-red', icon: 'Alert' },
  falta:       { label: 'Falta por subir', tone: 'amber', dot: 'bg-amber-400', icon: 'Upload' },
  fuera_fecha: { label: 'Fuera de fecha', tone: 'ink', dot: 'bg-slate-500', icon: 'Clock' }
}

export const VIGENCIA = '01–30 Jun 2026'

// 11 dealers de la red con su estatus de factura.
export const dealersFactura = [
  { id: 'D01', nombre: 'KIA Polanco', ciudad: 'CDMX', region: 'Centro', gerente: 'Laura Méndez', estatus: 'correcta', facturas: 14 },
  { id: 'D02', nombre: 'KIA Monterrey Valle', ciudad: 'Monterrey', region: 'Norte', gerente: 'Jorge Salinas', estatus: 'incorrecta', causa: 'RFC del receptor no coincide con KIA', facturas: 11 },
  { id: 'D03', nombre: 'KIA Guadalajara Sur', ciudad: 'Guadalajara', region: 'Occidente', gerente: 'Diana Rocha', estatus: 'correcta', facturas: 9 },
  { id: 'D04', nombre: 'KIA Puebla Angelópolis', ciudad: 'Puebla', region: 'Centro', gerente: 'Laura Méndez', estatus: 'falta', facturas: 0 },
  { id: 'D05', nombre: 'KIA Querétaro', ciudad: 'Querétaro', region: 'Bajío', gerente: 'Marco Treviño', estatus: 'fuera_fecha', causa: 'Factura del 03-Jul, fuera de vigencia', fecha: '03-Jul-2026', facturas: 7 },
  { id: 'D06', nombre: 'KIA Mérida', ciudad: 'Mérida', region: 'Sureste', gerente: 'Paola Uc', estatus: 'correcta', facturas: 6 },
  { id: 'D07', nombre: 'KIA Morelia', ciudad: 'Morelia', region: 'Occidente', gerente: 'Diana Rocha', estatus: 'falta', facturas: 0 },
  { id: 'D08', nombre: 'KIA León', ciudad: 'León', region: 'Bajío', gerente: 'Marco Treviño', estatus: 'incorrecta', causa: 'Subtotal + IVA no cuadra con el XML', facturas: 8 },
  { id: 'D09', nombre: 'KIA Tijuana', ciudad: 'Tijuana', region: 'Noroeste', gerente: 'Iván Bravo', estatus: 'fuera_fecha', causa: 'Factura del 02-Jul, fuera de vigencia', fecha: '02-Jul-2026', facturas: 10 },
  { id: 'D10', nombre: 'KIA Cancún', ciudad: 'Cancún', region: 'Sureste', gerente: 'Paola Uc', estatus: 'correcta', facturas: 12 },
  { id: 'D11', nombre: 'KIA Saltillo', ciudad: 'Saltillo', region: 'Norte', gerente: 'Jorge Salinas', estatus: 'falta', facturas: 0 }
]

// VIN capturados en el incentivo equivocado: los metieron como Downpayment
// cuando debían ser Cashback.
export const vinsMalCapturados = [
  { vin: '3KPA24AD1PE482103', dealer: 'KIA Polanco', modelo: 'Sportage', capturado: 'Downpayment', debioSer: 'Cashback' },
  { vin: 'KNADE163XP6218847', dealer: 'KIA Guadalajara Sur', modelo: 'Seltos', capturado: 'Downpayment', debioSer: 'Cashback' },
  { vin: '3KPF54AD7PE097512', dealer: 'KIA Cancún', modelo: 'K4', capturado: 'Downpayment', debioSer: 'Cashback' }
]

export function resumenFacturas() {
  const c = { correcta: 0, incorrecta: 0, falta: 0, fuera_fecha: 0 }
  dealersFactura.forEach(d => { c[d.estatus] += 1 })
  return { ...c, total: dealersFactura.length, vinsMal: vinsMalCapturados.length }
}

export const dealersPorEstatus = (estatus) => dealersFactura.filter(d => d.estatus === estatus)

// Agrupación por región para el seguimiento del gerente de zona.
export const regionesFactura = (() => {
  const map = {}
  dealersFactura.forEach(d => {
    if (!map[d.region]) map[d.region] = { region: d.region, gerente: d.gerente, dealers: [] }
    map[d.region].dealers.push(d)
  })
  return Object.values(map).map(g => ({
    ...g,
    pendientes: g.dealers.filter(d => d.estatus !== 'correcta').length
  }))
})()
