// ============================================================
//  DATOS SIMULADOS · Maqueta Cashback KIA
//  Todo es data mock para demostrar el alcance del flujo.
//  En producción: pasos 1 vienen de SAP, paso 2 de archivos
//  de los dealers (Excel + PDF de facturas).
// ============================================================

export const PERIODO = 'Junio 2026'
export const PERIODO_CORTO = '2026-06'

// --- Concesionarios (dealers) ---
export const dealers = [
  { id: 'D01', nombre: 'KIA Polanco', ciudad: 'CDMX', zona: 'Centro' },
  { id: 'D02', nombre: 'KIA Monterrey Valle', ciudad: 'Monterrey', zona: 'Norte' },
  { id: 'D03', nombre: 'KIA Guadalajara Sur', ciudad: 'Guadalajara', zona: 'Occidente' },
  { id: 'D04', nombre: 'KIA Puebla Angelópolis', ciudad: 'Puebla', zona: 'Centro' },
  { id: 'D05', nombre: 'KIA Querétaro', ciudad: 'Querétaro', zona: 'Bajío' },
  { id: 'D06', nombre: 'KIA Mérida', ciudad: 'Mérida', zona: 'Sureste' }
]

// --- Ofertas / Incentivos (columnas de la matriz) ---
export const ofertas = [
  { id: 'OF1', clave: 'CB-SPORTAGE', nombre: 'Cashback Sportage', modelo: 'Sportage', monto: 18000, condicion: 'Unidad facturada y entregada en el mes' },
  { id: 'OF2', clave: 'CB-RIO', nombre: 'Cashback Rio', modelo: 'Rio', monto: 9000, condicion: 'Unidad facturada en el mes' },
  { id: 'OF3', clave: 'CB-SELTOS', nombre: 'Cashback Seltos', modelo: 'Seltos', monto: 14000, condicion: 'Unidad facturada y entregada en el mes' },
  { id: 'OF4', clave: 'CB-K3', nombre: 'Cashback K3', modelo: 'K3', monto: 11000, condicion: 'Unidad facturada en el mes' },
  { id: 'OF5', clave: 'BONO-VOLUMEN', nombre: 'Bono Volumen', modelo: 'Todos', monto: 5000, condicion: '+10 unidades en el mes' }
]

// --- PASO 1: Condiciones (SAP) ---
export const condicionesSAP = [
  { id: 'C1', oferta: 'CB-SPORTAGE', regla: 'Modelo = Sportage', vigencia: '01–30 Jun 2026', monto: 18000, estatus: 'Activa' },
  { id: 'C2', oferta: 'CB-RIO', regla: 'Modelo = Rio', vigencia: '01–30 Jun 2026', monto: 9000, estatus: 'Activa' },
  { id: 'C3', oferta: 'CB-SELTOS', regla: 'Modelo = Seltos', vigencia: '01–30 Jun 2026', monto: 14000, estatus: 'Activa' },
  { id: 'C4', oferta: 'CB-K3', regla: 'Modelo = K3', vigencia: '01–30 Jun 2026', monto: 11000, estatus: 'Activa' },
  { id: 'C5', oferta: 'BONO-VOLUMEN', regla: 'Unidades dealer > 10', vigencia: '01–30 Jun 2026', monto: 5000, estatus: 'Activa' }
]

// --- PASO 1: Forecast (SAP) por dealer y modelo ---
// El desglose por modelo permite la vista en cascada: dealer → modelo.
// Los totales (unidades / montoEstimado) se derivan del desglose.
const forecastBase = [
  { dealer: 'D01', desglose: [
    { modelo: 'Sportage', unidades: 6, montoEstimado: 108000 },
    { modelo: 'Seltos', unidades: 4, montoEstimado: 56000 },
    { modelo: 'Rio', unidades: 2, montoEstimado: 18000 },
    { modelo: 'K3', unidades: 2, montoEstimado: 22000 }
  ] },
  { dealer: 'D02', desglose: [
    { modelo: 'Sportage', unidades: 5, montoEstimado: 90000 },
    { modelo: 'Seltos', unidades: 3, montoEstimado: 42000 },
    { modelo: 'K3', unidades: 2, montoEstimado: 22000 },
    { modelo: 'Rio', unidades: 1, montoEstimado: 9000 }
  ] },
  { dealer: 'D03', desglose: [
    { modelo: 'Sportage', unidades: 4, montoEstimado: 72000 },
    { modelo: 'Seltos', unidades: 2, montoEstimado: 28000 },
    { modelo: 'K3', unidades: 2, montoEstimado: 22000 },
    { modelo: 'Rio', unidades: 1, montoEstimado: 9000 }
  ] },
  { dealer: 'D04', desglose: [
    { modelo: 'Sportage', unidades: 3, montoEstimado: 54000 },
    { modelo: 'K3', unidades: 2, montoEstimado: 22000 },
    { modelo: 'Rio', unidades: 2, montoEstimado: 18000 }
  ] },
  { dealer: 'D05', desglose: [
    { modelo: 'Sportage', unidades: 3, montoEstimado: 54000 },
    { modelo: 'Rio', unidades: 2, montoEstimado: 18000 },
    { modelo: 'Seltos', unidades: 1, montoEstimado: 14000 }
  ] },
  { dealer: 'D06', desglose: [
    { modelo: 'Seltos', unidades: 2, montoEstimado: 28000 },
    { modelo: 'K3', unidades: 1, montoEstimado: 11000 },
    { modelo: 'Sportage', unidades: 1, montoEstimado: 18000 }
  ] }
]

export const forecastSAP = forecastBase.map(f => ({
  ...f,
  unidades: f.desglose.reduce((a, d) => a + d.unidades, 0),
  montoEstimado: f.desglose.reduce((a, d) => a + d.montoEstimado, 0)
}))

// --- PASO 2: Archivos recibidos de dealers ---
export const archivosRecibidos = [
  { id: 'F1', dealer: 'D01', nombre: 'Polanco_cashback_jun26.xlsx', tipo: 'Excel', registros: 14, estatus: 'Procesado' },
  { id: 'F2', dealer: 'D01', nombre: 'Polanco_facturas_jun26.pdf', tipo: 'PDF', registros: 14, estatus: 'Procesado' },
  { id: 'F3', dealer: 'D02', nombre: 'MTY_valle_cashback.xlsx', tipo: 'Excel', registros: 11, estatus: 'Procesado' },
  { id: 'F4', dealer: 'D02', nombre: 'MTY_valle_facturas.pdf', tipo: 'PDF', registros: 10, estatus: 'Faltante 1' },
  { id: 'F5', dealer: 'D03', nombre: 'GDL_sur_jun.xlsx', tipo: 'Excel', registros: 9, estatus: 'Procesado' },
  { id: 'F6', dealer: 'D03', nombre: 'GDL_sur_facturas.pdf', tipo: 'PDF', registros: 9, estatus: 'Procesado' }
]

// VINs faltantes que se reprograman al próximo mes
export const faltantes = [
  { vin: 'KNAP3811XR5550021', dealer: 'D02', modelo: 'Seltos', motivo: 'Factura PDF no recibida', accion: 'Reprogramado a Julio 2026' },
  { vin: 'KNAD6814XR6120098', dealer: 'D04', modelo: 'K3', motivo: 'Sin entrega registrada', accion: 'Reprogramado a Julio 2026' }
]

// --- Helper para generar VINs realistas ---
function vin(seq) {
  const base = '3KPA24AD'
  return base + String(70000 + seq).padStart(7, '0').slice(-7) + 'R' + String(100 + seq)
}

// --- MATRIZ (Paso 3): registros VIN × oferta ---
// estatus: 'ok' | 'aclaracion' | 'duplicado'
const modelosPorOferta = {
  OF1: 'Sportage', OF2: 'Rio', OF3: 'Seltos', OF4: 'K3'
}
const ofertaMonto = Object.fromEntries(ofertas.map(o => [o.id, o.monto]))

let seq = 0
function reg(dealer, ofertaId, estatus = 'ok', nota = '') {
  seq += 1
  return {
    id: 'R' + String(seq).padStart(3, '0'),
    vin: vin(seq),
    dealer,
    modelo: modelosPorOferta[ofertaId] || 'Todos',
    oferta: ofertaId,
    monto: ofertaMonto[ofertaId] || 0,
    facturaFecha: `2026-06-${String(3 + (seq % 24)).padStart(2, '0')}`,
    estatus,
    nota
  }
}

export const matriz = [
  // D01 KIA Polanco
  reg('D01', 'OF1'), reg('D01', 'OF1'), reg('D01', 'OF3'), reg('D01', 'OF2'),
  reg('D01', 'OF4'), reg('D01', 'OF1'),
  reg('D01', 'OF2', 'aclaracion', 'Fecha de factura fuera de vigencia (02-Jul)'),
  // D02 KIA Monterrey Valle
  reg('D02', 'OF1'), reg('D02', 'OF1'), reg('D02', 'OF3'),
  reg('D02', 'OF3', 'duplicado', 'VIN repetido en archivo Excel y PDF'),
  reg('D02', 'OF4'), reg('D02', 'OF2'),
  // D03 KIA Guadalajara Sur
  reg('D03', 'OF1'), reg('D03', 'OF3'), reg('D03', 'OF2'), reg('D03', 'OF4'),
  reg('D03', 'OF1', 'aclaracion', 'Monto en Excel ($16,000) no coincide con condición SAP ($18,000)'),
  reg('D03', 'OF1', 'historico', 'VIN ya pagado como Sportage en Mayo 2026 (folio CB-00712)'),
  // D04 KIA Puebla
  reg('D04', 'OF2'), reg('D04', 'OF4'), reg('D04', 'OF1'),
  // D05 KIA Querétaro
  reg('D05', 'OF1'), reg('D05', 'OF2'),
  reg('D05', 'OF3', 'historico', 'VIN ya recibió cashback Seltos en Abril 2026 (folio CB-00489)'),
  // D06 KIA Mérida
  reg('D06', 'OF3'), reg('D06', 'OF4')
]

// --- PASO 4: Validación de pago (consolida Paso 1 + Paso 3) ---
export function consolidarPago() {
  const porDealer = {}
  for (const r of matriz) {
    if (r.estatus !== 'ok') continue
    if (!porDealer[r.dealer]) porDealer[r.dealer] = { dealer: r.dealer, unidades: 0, monto: 0 }
    porDealer[r.dealer].unidades += 1
    porDealer[r.dealer].monto += r.monto
  }
  // Bono volumen si > 10 unidades válidas
  return dealers.map(d => {
    const base = porDealer[d.id] || { unidades: 0, monto: 0 }
    const bono = base.unidades > 10 ? 5000 : 0
    const fc = forecastSAP.find(f => f.dealer === d.id)
    return {
      dealer: d.id,
      nombre: d.nombre,
      unidades: base.unidades,
      montoCashback: base.monto,
      bonoVolumen: bono,
      total: base.monto + bono,
      forecast: fc ? fc.montoEstimado : 0
    }
  })
}

// --- PASO 5/6/7: Circulares, facturas y pago ---
export const estadosCircular = ['Pendiente', 'Enviada', 'Aprobada']
export const estadosFactura = ['Sin generar', 'Generada', 'Validada']
export const estadosPago = ['En espera', 'Programado', 'Pagado']

// Etiquetas de estatus de matriz
export const ESTATUS = {
  ok: { label: 'Validado', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  aclaracion: { label: 'Aclaración', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  duplicado: { label: 'Duplicado', dot: 'bg-kia-red', text: 'text-kia-red', bg: 'bg-red-50' },
  // Duplicado contra meses anteriores: el VIN ya recibió este incentivo en un periodo previo.
  historico: { label: 'Mes anterior', dot: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50' }
}

export const fmtMXN = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

export const dealerNombre = (id) => dealers.find(d => d.id === id)?.nombre || id
export const ofertaNombre = (id) => ofertas.find(o => o.id === id)?.nombre || id
