// ============================================================
//  BONO POR VENTAS · KIA
//  Paso 1 combina 3 fuentes (variables de cálculo):
//   · VQM        → descarga de ventas de SAP (VIN, modelo, dealer)
//   · Inventario → meses de inventario disponible (Excel)
//   · Curtailment→ ajuste de piso (Excel + PDF)
//  De ahí sale el cálculo de pago (bono) por VIN por agencia.
// ============================================================

import { dealers, dealerNombre, fmtMXN, ESTATUS } from './mockData.js'

export const BONO_PERIODO = 'Junio 2026'

// Fuentes del Paso 1 (variables de cálculo).
export const BONO_FUENTES = [
  { clave: 'VQM', nombre: 'Descarga de ventas', tipo: 'SAP', icon: 'Database' },
  { clave: 'INV', nombre: 'Meses de inventario disponible', tipo: 'Excel', icon: 'Excel' },
  { clave: 'CURT', nombre: 'Curtailment (ajuste de piso)', tipo: 'Excel + PDF', icon: 'Pdf' }
]

// Monthly Commercial Offer: bono base por modelo (eje horizontal de la matriz).
export const bonoOfertas = [
  { id: 'MO-SPO', modelo: 'Sportage', bono: 14000 },
  { id: 'MO-SEL', modelo: 'Seltos',   bono: 11000 },
  { id: 'MO-SOR', modelo: 'Sorento',  bono: 16000 },
  { id: 'MO-K4',  modelo: 'K4',       bono: 9000 },
  { id: 'MO-K3',  modelo: 'K3',       bono: 8000 },
  { id: 'MO-RIO', modelo: 'Rio',      bono: 6000 },
  { id: 'MO-SOL', modelo: 'Soluto',   bono: 5000 },
  { id: 'MO-PIC', modelo: 'Picanto',  bono: 4000 }
]
const ofertaPorModelo = Object.fromEntries(bonoOfertas.map(o => [o.modelo, o]))

// Bono por antigüedad de inventario (incentiva desplazar piso añejo).
export function bonoInventario(meses) {
  return meses >= 6 ? 3000 : meses >= 3 ? 1500 : 0
}

// --- Construcción de registros VIN (VQM + Inventario + Curtailment) ---
// Regla: si hay curtailment ACUMULADO (> 0), el VIN no es apto para el bono.
let seq = 0
function rec(dealer, modelo, meses, curtailment, estatus, nota = '') {
  seq += 1
  const o = ofertaPorModelo[modelo]
  const bonoBase = o ? o.bono : 0
  const bonoInv = bonoInventario(meses)
  const bono = bonoBase + bonoInv // bono potencial (sin restar; el curtailment descalifica)
  // Si trae curtailment acumulado y no se marcó otro hallazgo, queda No apto.
  const est = estatus || (curtailment > 0 ? 'no_apto' : 'ok')
  const detalle = nota || (est === 'no_apto' ? `Curtailment acumulado de ${fmtMXN(curtailment)} — no apto para bono` : '')
  return {
    id: 'V' + String(seq).padStart(3, '0'),
    vin: '3KPB' + String(40000 + seq).slice(-5) + 'R' + String(200 + seq),
    dealer, modelo, oferta: o?.id,
    mesesInventario: meses,
    curtailment,
    bonoBase, bonoInventario: bonoInv, bono,
    estatus: est, nota: detalle
  }
}

export const bonoMatriz = [
  // D01 KIA Polanco
  rec('D01', 'Sportage', 2, 0), rec('D01', 'Sportage', 7, 0), rec('D01', 'Seltos', 4, 0),
  rec('D01', 'K3', 1, 500), rec('D01', 'Rio', 9, 0),
  rec('D01', 'Sportage', 2, 0, 'aclaracion', 'Meses de inventario en Excel (2) no coincide con VQM (5)'),
  // D02 KIA Monterrey Valle
  rec('D02', 'Sportage', 3, 0), rec('D02', 'Seltos', 6, 0), rec('D02', 'K4', 2, 1000),
  rec('D02', 'Sorento', 1, 0),
  rec('D02', 'Seltos', 6, 0, 'duplicado', 'VIN repetido en VQM y archivo de curtailment'),
  // D03 KIA Guadalajara Sur
  rec('D03', 'Sportage', 5, 0), rec('D03', 'K3', 8, 0), rec('D03', 'Rio', 4, 0),
  rec('D03', 'Soluto', 12, 0),
  rec('D03', 'Sportage', 6, 0, 'aclaracion', 'Curtailment en PDF ($1,500) no reportado en Excel'),
  // D04 KIA Puebla Angelópolis
  rec('D04', 'Rio', 2, 500), rec('D04', 'K4', 3, 0), rec('D04', 'Sportage', 1, 0),
  // D05 KIA Querétaro
  rec('D05', 'Sportage', 4, 0), rec('D05', 'Picanto', 2, 0),
  // D06 KIA Mérida
  rec('D06', 'Seltos', 7, 0), rec('D06', 'K3', 3, 0)
]

// --- Consolidación de pago por dealer (solo VIN válidos) ---
export function consolidarBono() {
  const porDealer = {}
  for (const v of bonoMatriz) {
    if (v.estatus !== 'ok') continue
    if (!porDealer[v.dealer]) porDealer[v.dealer] = { unidades: 0, bono: 0 }
    porDealer[v.dealer].unidades += 1
    porDealer[v.dealer].bono += v.bono
  }
  return dealers.map(d => {
    const base = porDealer[d.id] || { unidades: 0, bono: 0 }
    return { dealer: d.id, nombre: d.nombre, ciudad: d.ciudad, zona: d.zona, unidades: base.unidades, bono: base.bono }
  }).filter(d => d.unidades > 0)
}

// --- Paso 6: factura del dealer (algunos intentan cobrar de más) ---
// factor sobre el monto autorizado; >1 = sobrefacturación a detectar.
export const bonoFacturaFactor = {
  D03: 1.12,
  D02: 1.05
}

export { dealers, dealerNombre, fmtMXN, ESTATUS }
