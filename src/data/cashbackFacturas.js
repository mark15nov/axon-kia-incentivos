import { VM_RAZON_POR_ID } from './variableMargin.js'

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

// 11 dealers de la red con su estatus de factura y la razón social
// (persona moral) de la que cuelga cada punto de venta.
export const dealersFactura = [
  { id: 'D01', rs: 'andrade', nombre: 'KIA Polanco', ciudad: 'CDMX', region: 'Centro', gerente: 'Laura Méndez', estatus: 'correcta', facturas: 14 },
  { id: 'D02', rs: 'carone', nombre: 'KIA Monterrey Valle', ciudad: 'Monterrey', region: 'Norte', gerente: 'Jorge Salinas', estatus: 'incorrecta', causa: 'RFC del receptor no coincide con KIA', facturas: 11 },
  { id: 'D03', rs: 'dalton', nombre: 'KIA Guadalajara Sur', ciudad: 'Guadalajara', region: 'Occidente', gerente: 'Diana Rocha', estatus: 'correcta', facturas: 9 },
  { id: 'D04', rs: 'angelopolis', nombre: 'KIA Puebla Angelópolis', ciudad: 'Puebla', region: 'Centro', gerente: 'Laura Méndez', estatus: 'falta', facturas: 0 },
  { id: 'D05', rs: 'queretano', nombre: 'KIA Querétaro', ciudad: 'Querétaro', region: 'Bajío', gerente: 'Marco Treviño', estatus: 'fuera_fecha', causa: 'Factura del 03-Jul, fuera de vigencia', fecha: '03-Jul-2026', facturas: 7 },
  { id: 'D06', rs: 'chapur', nombre: 'KIA Mérida', ciudad: 'Mérida', region: 'Sureste', gerente: 'Paola Uc', estatus: 'correcta', facturas: 6 },
  { id: 'D07', rs: 'michoacan', nombre: 'KIA Morelia', ciudad: 'Morelia', region: 'Occidente', gerente: 'Diana Rocha', estatus: 'falta', facturas: 0 },
  { id: 'D08', rs: 'bajio', nombre: 'KIA León', ciudad: 'León', region: 'Bajío', gerente: 'Marco Treviño', estatus: 'incorrecta', causa: 'Subtotal + IVA no cuadra con el XML', facturas: 8 },
  { id: 'D09', rs: 'surman', nombre: 'KIA Tijuana', ciudad: 'Tijuana', region: 'Noroeste', gerente: 'Iván Bravo', estatus: 'fuera_fecha', causa: 'Factura del 02-Jul, fuera de vigencia', fecha: '02-Jul-2026', facturas: 10 },
  { id: 'D10', rs: 'chapur', nombre: 'KIA Cancún', ciudad: 'Cancún', region: 'Sureste', gerente: 'Paola Uc', estatus: 'correcta', facturas: 12 },
  { id: 'D11', rs: 'laguna', nombre: 'KIA Saltillo', ciudad: 'Saltillo', region: 'Norte', gerente: 'Jorge Salinas', estatus: 'falta', facturas: 0 }
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

// ============================================================
//  CIRCULAR DEL PERIODO · va por razón social
//  El comunicado de facturación se dirige a la persona moral que
//  factura, no al punto de venta: una sola circular por RFC,
//  aunque la razón social tenga varios dealers en la red.
// ============================================================

// Destinatarios típicos de la circular dentro de la razón social.
export const CIRCULAR_DESTINATARIOS = [
  { v: 'duenos', label: 'Dueños' },
  { v: 'gg', label: 'Gerentes Generales' },
  { v: 'admin', label: 'Gerentes Administrativos' },
  { v: 'conta', label: 'Contabilidad' }
]

// El estatus de la razón social es el peor de sus puntos de venta:
// una factura incorrecta pesa más que tres correctas.
const SEVERIDAD = ['incorrecta', 'falta', 'fuera_fecha', 'correcta']

export const razonesFactura = (() => {
  const map = {}
  for (const d of dealersFactura) {
    const rz = VM_RAZON_POR_ID[d.rs]
    if (!map[d.rs]) map[d.rs] = { ...rz, dealers: [], regiones: [] }
    map[d.rs].dealers.push(d)
    if (!map[d.rs].regiones.includes(d.region)) map[d.rs].regiones.push(d.region)
  }
  return Object.values(map).map(x => {
    const pendientes = x.dealers.filter(d => d.estatus !== 'correcta')
    return {
      ...x,
      region: x.regiones.length === 1 ? x.regiones[0] : `${x.regiones.length} regiones`,
      facturas: x.dealers.reduce((a, d) => a + (d.facturas || 0), 0),
      estatus: SEVERIDAD.find(e => x.dealers.some(d => d.estatus === e)),
      pendientes,
      nPendientes: pendientes.length,
      alDia: pendientes.length === 0
    }
  }).sort((a, b) => b.nPendientes - a.nPendientes || a.nombre.localeCompare(b.nombre))
})()

export function resumenCircular() {
  const conPendientes = razonesFactura.filter(r => !r.alDia)
  return {
    razones: razonesFactura.length,
    puntosVenta: dealersFactura.length,
    conPendientes: conPendientes.length,
    alDia: razonesFactura.length - conPendientes.length,
    dealersPendientes: conPendientes.reduce((a, r) => a + r.nPendientes, 0)
  }
}

// Acción concreta que se le pide a cada punto de venta según su estatus.
const ACCION = {
  incorrecta: d => `corregir y reenviar la factura (${d.causa}).`,
  falta: () => 'subir la factura del periodo al portal de incentivos.',
  fuera_fecha: d => `refacturar dentro de la vigencia (la recibida es del ${d.fecha}).`,
  correcta: () => 'sin acción; facturación conciliada.'
}

export function circularRazonSocial(rz, incentivo = 'Cashback') {
  const lineas = rz.dealers
    .map(d => `  • ${d.nombre} (${d.ciudad} · ${d.region}): ${ESTATUS_FACTURA[d.estatus].label}${d.facturas ? ` · ${d.facturas} facturas` : ' · sin facturas recibidas'}`)
    .join('\n')

  const acciones = rz.pendientes.length
    ? rz.pendientes.map((d, i) => `  ${i + 1}. ${d.nombre}: ${ACCION[d.estatus](d)}`).join('\n')
    : '  Ninguna. Toda la facturación de la razón social quedó conciliada.'

  return `${rz.nombre}
RFC ${rz.rfc}

CIRCULAR · Incentivo ${incentivo} · vigencia ${VIGENCIA}

Estimados socios:

Al corte de hoy, el estatus de la facturación del incentivo ${incentivo} en ${rz.dealers.length === 1 ? 'su punto de venta' : `sus ${rz.dealers.length} puntos de venta`} es el siguiente:

${lineas}

ACCIONES REQUERIDAS
${acciones}

Las facturas que no queden conciliadas dentro de la vigencia ${VIGENCIA} no entran a la corrida de pago del periodo y se difieren al siguiente corte.

El seguimiento operativo lo coordina el gerente de zona correspondiente. Cualquier aclaración sobre esta circular se atiende con el área de Incentivos.

Saludos,
Incentivos KIA México`
}
