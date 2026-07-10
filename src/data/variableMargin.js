// ============================================================
//  VARIABLE MARGIN · Incentivos adicionales por desempeño
//  Mismo modelo operativo del resto de incentivos: SAP baja los
//  conceptos y su meta, cada dealer carga su soporte, se valida
//  contra SAP y se liquida al cierre. Todos los desgloses cuadran:
//    Presupuesto (meta) = 765,000 · Ejecutado = 300,000
// ============================================================

import { fmtMXN } from './mockData.js'

export const VM_PERIODO = 'Junio 2026'
export const VM_FUENTE = 'SAP · Dealers'

// Tope de pago del periodo (presupuesto autorizado) y participación KIA.
export const VM_PRESUPUESTO = 765000
export const VM_EJECUTADO = 300000

// Insumos que consolida el cálculo (origen: SAP + soporte del dealer).
export const VM_INPUTS = [
  { nombre: 'Cierre de margen SAP', tipo: 'SAP' },
  { nombre: 'Soporte de concesionario', tipo: 'Excel' }
]

// ============================================================
//  PASO 1 · CONSTRUCTOR DE OFERTA COMERCIAL
//  La oferta se arma seleccionando variables de tres ejes:
//  cumplimiento de ventas, de márgenes y de calidad en la
//  atención. Cada variable aporta una bolsa (presupuesto) y un
//  peso dentro del score. Los pesos de las variables activas
//  deben sumar 100%.
// ============================================================
export const vmPilares = [
  {
    id: 'ventas', nombre: 'Cumplimiento de Ventas', icon: 'Trending', tone: 'red',
    desc: 'Desempeño en colocación de unidades del periodo.',
    variables: [
      { id: 'v_vol', nombre: 'Volumen mensual', desc: 'Cumplimiento del objetivo de unidades del mes', meta: '180 u', peso: 25, bolsa: 132000 },
      { id: 'v_ret', nombre: 'Aceleración retail', desc: 'Ventas retail por encima de flotilla', meta: '+15%', peso: 12, bolsa: 58000 },
      { id: 'v_foco', nombre: 'Modelos foco (SUV)', desc: 'Colocación de Sportage / Sorento / Seltos', meta: '60 u', peso: 10, bolsa: 45000 }
    ]
  },
  {
    id: 'margen', nombre: 'Cumplimiento de Márgenes', icon: 'Percent', tone: 'ink',
    desc: 'Rentabilidad y sanidad del inventario.',
    variables: [
      { id: 'm_mix', nombre: 'Mezcla premium (Mix)', desc: 'Penetración de modelos premium sobre lo facturado', meta: '32%', peso: 18, bolsa: 61000 },
      { id: 'm_neto', nombre: 'Margen neto por unidad', desc: 'Margen promedio por unidad facturada', meta: '≥ 8.5%', peso: 20, bolsa: 70000 },
      { id: 'm_inv', nombre: 'Antigüedad de inventario', desc: 'Colocación de unidades con +90 días en patio', meta: '≤ 90 d', peso: 8, bolsa: 32000 }
    ]
  },
  {
    id: 'calidad', nombre: 'Calidad en la Atención', icon: 'Star', tone: 'blue',
    desc: 'KPIs de experiencia del cliente.',
    variables: [
      { id: 'c_csi', nombre: 'CSI de Ventas', desc: 'Índice de satisfacción en el proceso de venta', meta: '≥ 92 pts', peso: 15, bolsa: 40000 },
      { id: 'c_nps', nombre: 'NPS de Posventa', desc: 'Recomendación neta del cliente de servicio', meta: '≥ 70', peso: 10, bolsa: 35000 },
      { id: 'c_lead', nombre: 'Respuesta a leads', desc: 'Tiempo de primer contacto a prospectos digitales', meta: '≤ 30 min', peso: 6, bolsa: 22000 }
    ]
  }
]

// Selección inicial (sus pesos suman 100%).
export const vmActivosDefault = ['v_vol', 'v_ret', 'm_mix', 'm_neto', 'c_csi', 'c_nps']

// --- Conceptos que componen el margen variable del periodo ---
// suma meta = 765,000 · suma ejecutado = 300,000 (cuadra con el KPI).
export const vmConceptos = [
  { nombre: 'Bono por Volumen', desc: 'Cumplimiento del objetivo de unidades del mes', meta: 220000, ejecutado: 132000, dealers: 6 },
  { nombre: 'Bono de Mezcla (Mix)', desc: 'Penetración de modelos premium sobre el total facturado', meta: 165000, ejecutado: 61000, dealers: 5 },
  { nombre: 'Aceleración Retail', desc: 'Ventas retail por encima de flotilla en el periodo', meta: 140000, ejecutado: 58000, dealers: 4 },
  { nombre: 'Antigüedad de Inventario', desc: 'Colocación de unidades con +90 días en patio', meta: 130000, ejecutado: 32000, dealers: 6 },
  { nombre: 'Penetración de Financiamiento', desc: 'Unidades con crédito KIA Finance contratado', meta: 110000, ejecutado: 17000, dealers: 5 }
]

// ============================================================
//  PASO 2 · FORECAST POR DEALER  (KIA BRAIN)
//  Sobre el histórico de 24 meses (VQM + facturación SAP) se
//  estima, por dealer y por modelo, cuántas unidades cumplirán
//  la meta del periodo. `prob` = probabilidad de alcanzar la
//  meta; se considera "en meta" cuando prob >= UMBRAL_META.
// ============================================================
export const UMBRAL_META = 70

// Red nacional de distribuidores KIA México (nombres reales por ciudad/zona).
// [ nombre, zona, base (u/periodo), tendencia ]
const VM_DEALERS_BASE = [
  // --- Centro (CDMX) ---
  ['KIA Polanco', 'Centro', 165, 'up'],
  ['KIA Del Valle', 'Centro', 150, 'up'],
  ['KIA Pedregal', 'Centro', 138, 'flat'],
  ['KIA Santa Fe', 'Centro', 158, 'up'],
  ['KIA Konfidence Santa Fe', 'Centro', 120, 'flat'],
  ['KIA Mariano Escobedo', 'Centro', 132, 'down'],
  ['KIA Río San Joaquín', 'Centro', 126, 'up'],
  ['KIA Aeropuerto', 'Centro', 112, 'flat'],
  ['KIA Coapa', 'Centro', 118, 'down'],
  ['KIA División del Norte', 'Centro', 110, 'flat'],
  ['KIA Iztapalapa', 'Centro', 104, 'up'],
  ['KIA Tláhuac', 'Centro', 96, 'down'],
  // --- Metropolitana (Estado de México) ---
  ['KIA Metepec', 'Metropolitana', 140, 'up'],
  ['KIA Toluca', 'Metropolitana', 128, 'flat'],
  ['KIA Interlomas', 'Metropolitana', 146, 'up'],
  ['KIA Satélite', 'Metropolitana', 134, 'flat'],
  ['KIA Ecatepec', 'Metropolitana', 108, 'down'],
  ['KIA Tlalnepantla', 'Metropolitana', 116, 'flat'],
  ['KIA Cuautitlán', 'Metropolitana', 102, 'up'],
  ['KIA Atlacomulco', 'Metropolitana', 84, 'flat'],
  // --- Occidente (Jalisco, Michoacán, Colima, Nayarit) ---
  ['KIA Patria', 'Occidente', 150, 'up'],
  ['KIA González Gallo', 'Occidente', 132, 'flat'],
  ['Dalton KIA Country', 'Occidente', 144, 'up'],
  ['KIA Galerías', 'Occidente', 128, 'flat'],
  ['KIA Altozano', 'Occidente', 96, 'up'],
  ['KIA Uruapan', 'Occidente', 72, 'flat'],
  ['KIA Zamora', 'Occidente', 68, 'down'],
  ['KIA Colima', 'Occidente', 78, 'up'],
  ['KIA Tepic', 'Occidente', 82, 'flat'],
  ['KIA Puerto Vallarta', 'Occidente', 94, 'up'],
  // --- Norte (Nuevo León, Coahuila, Tamaulipas, Chihuahua) ---
  ['KIA Sendero', 'Norte', 148, 'up'],
  ['Car One KIA Lindavista', 'Norte', 136, 'flat'],
  ['KIA Valle Oriente', 'Norte', 152, 'up'],
  ['KIA Saltillo', 'Norte', 110, 'flat'],
  ['KIA Monclova', 'Norte', 74, 'down'],
  ['KIA Torreón', 'Norte', 112, 'up'],
  ['KIA Avenida', 'Norte', 98, 'flat'],
  ['KIA Reynosa', 'Norte', 88, 'down'],
  ['KIA Nuevo Laredo', 'Norte', 80, 'flat'],
  ['KIA Chihuahua', 'Norte', 120, 'up'],
  ['KIA Ciudad Juárez', 'Norte', 124, 'flat'],
  // --- Noroeste (Baja California, Sonora, Sinaloa, BCS) ---
  ['KIA Tijuana', 'Noroeste', 134, 'up'],
  ['KIA Mexicali', 'Noroeste', 108, 'flat'],
  ['KIA Ensenada', 'Noroeste', 82, 'down'],
  ['KIA Hermosillo', 'Noroeste', 118, 'up'],
  ['KIA Ciudad Obregón', 'Noroeste', 88, 'flat'],
  ['KIA Culiacán', 'Noroeste', 126, 'up'],
  ['KIA Ahome', 'Noroeste', 84, 'flat'],
  ['KIA Mazatlán', 'Noroeste', 96, 'down'],
  ['KIA La Paz', 'Noroeste', 70, 'flat'],
  // --- Bajío (Guanajuato, Querétaro, Aguascalientes, SLP, Zacatecas) ---
  ['KIA Bajío', 'Bajío', 142, 'up'],
  ['KIA Altaria', 'Bajío', 118, 'flat'],
  ['KIA Querétaro', 'Bajío', 130, 'up'],
  ['KIA Juriquilla', 'Bajío', 124, 'up'],
  ['KIA San Luis Potosí', 'Bajío', 114, 'flat'],
  ['KIA Irapuato', 'Bajío', 92, 'flat'],
  ['KIA Celaya', 'Bajío', 98, 'up'],
  ['KIA Salamanca', 'Bajío', 72, 'down'],
  ['KIA Zacatecas', 'Bajío', 80, 'flat'],
  // --- Sur (Puebla, Morelos, Guerrero, Oaxaca, Chiapas) ---
  ['KIA Angelópolis', 'Sur', 132, 'down'],
  ['KIA Serdán', 'Sur', 110, 'flat'],
  ['KIA Tehuacán', 'Sur', 76, 'down'],
  ['KIA Cuernavaca', 'Sur', 118, 'up'],
  ['KIA Acapulco', 'Sur', 94, 'flat'],
  ['KIA Chilpancingo', 'Sur', 66, 'down'],
  ['KIA Oaxaca', 'Sur', 102, 'flat'],
  ['KIA Tuxtla Gutiérrez', 'Sur', 98, 'up'],
  // --- Sureste (Veracruz, Tabasco, Yucatán, Q. Roo, Campeche) ---
  ['KIA Altas Montañas', 'Sureste', 84, 'flat'],
  ['KIA Veracruz', 'Sureste', 126, 'up'],
  ['KIA Xalapa', 'Sureste', 104, 'flat'],
  ['KIA Coatzacoalcos', 'Sureste', 88, 'down'],
  ['KIA Villahermosa', 'Sureste', 110, 'flat'],
  ['KIA Mérida', 'Sureste', 120, 'up'],
  ['KIA Cancún', 'Sureste', 134, 'up'],
  ['KIA Playa del Carmen', 'Sureste', 108, 'flat'],
  ['KIA Chetumal', 'Sureste', 72, 'down'],
  ['KIA Bahía', 'Sureste', 70, 'flat']
]

const MODELOS_FC = ['Sportage', 'Seltos', 'K4', 'Rio']
const RATIOS_FC = [0.30, 0.24, 0.27, 0.19]

// Estimación determinista por modelo a partir del histórico y la tendencia.
function vmGenModelos(base, tend, idx) {
  const tf = tend === 'up' ? 1.09 : tend === 'down' ? 0.92 : 1.0
  return MODELOS_FC.map((modelo, i) => {
    const meta = Math.max(6, Math.round(base * RATIOS_FC[i]))
    const jit1 = ((idx * 13 + i * 7) % 3) - 1
    const estimado = Math.max(0, Math.round(meta * tf) + jit1)
    const ratio = estimado / meta
    const jit2 = ((idx * 31 + i * 17) % 13) - 6
    const prob = Math.max(38, Math.min(97, Math.round(66 + (ratio - 1) * 200 + jit2)))
    return { modelo, meta, estimado, prob }
  })
}

function vmRazon(tend, hist, est, meta, prob) {
  if (tend === 'up') return `Promedia ${hist} u con tendencia al alza en el último semestre; junio suma +8% estacional, así que estimo ${est} unidades y ${prob}% de probabilidad de superar las ${meta} de meta.`
  if (tend === 'down') return `Tendencia a la baja en los últimos 6 meses y menor mezcla SUV arrastran el pronóstico a ${est} unidades, ${prob}% de alcanzar las ${meta} de meta.`
  return `Histórico estable en ${hist} u sin catalizador claro; el pronóstico queda en ${est} unidades, ${prob}% de alcanzar las ${meta} de meta.`
}

export const vmForecast = VM_DEALERS_BASE.map(([dealer, zona, base, tend], idx) => {
  const modelos = vmGenModelos(base, tend, idx)
  const meta = modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = modelos.reduce((a, m) => a + m.estimado, 0)
  const prob = Math.round(modelos.reduce((a, m) => a + m.prob, 0) / modelos.length)
  const hist = Math.round(base * (0.97 + ((idx % 5) * 0.015)))
  const confianza = 82 + ((idx * 7) % 15)
  return { dealer, zona, hist, tendencia: tend, confianza, razon: vmRazon(tend, hist, estimado, meta, prob), modelos }
})

// Cómo llegó KIA BRAIN a la estimación (se muestra al correr el análisis).
export const vmBrainMetodologia = [
  'Tomé 24 meses de ventas por dealer y modelo desde VQM + facturación SAP.',
  'Ajusté por estacionalidad: junio históricamente rinde +8% sobre el promedio mensual.',
  'Ponderé la tendencia de los últimos 6 meses al doble que los meses previos.',
  'Descarté 2 quiebres de inventario de 2024 que distorsionaban el promedio.',
  'Estimé la probabilidad de meta con una regresión sobre el cumplimiento histórico.'
]

// Derivados del forecast por dealer.
export function vmForecastDealer(d) {
  const meta = d.modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = d.modelos.reduce((a, m) => a + m.estimado, 0)
  const paresMeta = d.modelos.filter(m => m.prob >= UMBRAL_META).length
  const prob = Math.round(d.modelos.reduce((a, m) => a + m.prob, 0) / d.modelos.length)
  return { meta, estimado, prob, paresMeta, pares: d.modelos.length, enMeta: prob >= UMBRAL_META }
}

export function vmForecastResumen() {
  let meta = 0, estimado = 0, pares = 0, paresMeta = 0, dealersMeta = 0, conf = 0
  for (const d of vmForecast) {
    const r = vmForecastDealer(d)
    meta += r.meta; estimado += r.estimado; pares += r.pares; paresMeta += r.paresMeta
    if (r.enMeta) dealersMeta += 1
    conf += d.confianza
  }
  return {
    meta, estimado, pares, paresMeta,
    dealers: vmForecast.length, dealersMeta,
    confianza: Math.round(conf / vmForecast.length),
    delta: estimado - meta
  }
}

// --- Desglose por dealer ---
// asignado suma = 765,000 · ejecutado suma = 300,000.
// estatus 'ok' → soporte conciliado; 'aclaracion' → diferencia contra SAP.
export const vmDealers = [
  { dealer: 'KIA Polanco', zona: 'Centro', asignado: 165000, ejecutado: 78000, estatus: 'ok' },
  { dealer: 'KIA Monterrey Valle', zona: 'Norte', asignado: 148000, ejecutado: 66000, estatus: 'ok' },
  { dealer: 'KIA Guadalajara Sur', zona: 'Occidente', asignado: 132000, ejecutado: 51000, estatus: 'aclaracion' },
  { dealer: 'KIA Puebla Angelópolis', zona: 'Centro', asignado: 118000, ejecutado: 42000, estatus: 'aclaracion' },
  { dealer: 'KIA Querétaro', zona: 'Bajío', asignado: 108000, ejecutado: 38000, estatus: 'aclaracion' },
  { dealer: 'KIA Mérida', zona: 'Sureste', asignado: 94000, ejecutado: 25000, estatus: 'aclaracion' }
]

// --- Aclaraciones abiertas (diferencias soporte vs SAP) ---
export const vmAclaraciones = [
  { dealer: 'KIA Guadalajara Sur', concepto: 'Bono por Volumen', monto: 51000, detalle: '3 VIN sin soporte de entrega en el periodo.' },
  { dealer: 'KIA Puebla Angelópolis', concepto: 'Bono de Mezcla', monto: 42000, detalle: 'Mezcla premium no coincide con el reporte SAP.' },
  { dealer: 'KIA Querétaro', concepto: 'Antigüedad de Inventario', monto: 38000, detalle: '2 unidades en disputa por fecha de ingreso a patio.' },
  { dealer: 'KIA Mérida', concepto: 'Penetración de Financiamiento', monto: 25000, detalle: 'Falta comprobante de contrato KIA Finance.' }
]

// --- Derivados / totales ---
export function vmTotales() {
  const presupuesto = VM_PRESUPUESTO
  const ejecutado = vmDealers.reduce((a, d) => a + d.ejecutado, 0)
  const pendiente = presupuesto - ejecutado
  const liquidable = vmDealers.filter(d => d.estatus === 'ok').reduce((a, d) => a + d.ejecutado, 0)
  const retenido = vmDealers.filter(d => d.estatus === 'aclaracion').reduce((a, d) => a + d.ejecutado, 0)
  const aclaraciones = vmAclaraciones.length
  const conciliados = vmDealers.filter(d => d.estatus === 'ok').length
  return {
    presupuesto, ejecutado, pendiente, liquidable, retenido, aclaraciones,
    conciliados, dealers: vmDealers.length,
    pctEjecutado: presupuesto ? (ejecutado / presupuesto) * 100 : 0
  }
}

// ============================================================
//  ETAPA 2 · VALIDACIÓN DE VIN
//  De cada factura se extrae el VIN y se cruza contra el
//  forecast y la oferta comercial (parte 1). Los que cumplen
//  generan el bono por unidad del incentivo; los que no, se
//  rechazan con motivo y se notifica al dealer.
// ============================================================

// Bono por unidad según modelo (oferta comercial · parte 1).
const VM_BONO_MODELO = { Sportage: 8000, Seltos: 6000, K4: 5000, Rio: 4000 }

const VM_VIN_MOTIVOS = [
  'Modelo fuera de la oferta comercial',
  'Incentivo duplicado',
  'Incentivo ya pagado',
  'VIN duplicado',
  'Información incompleta',
  'Fuera de política',
  'XML sin timbrar · CFDI inválido',
  'Fecha de factura fuera del periodo',
  'Monto por debajo del mínimo de la oferta'
]

// Secuencia realista de motivos por rechazo (cola larga): la causa
// dominante es "Información incompleta"(4), luego "Incentivo duplicado"(1),
// "Fuera de política"(5), etc. Índices refieren a VM_VIN_MOTIVOS.
const VM_REJECT_SEQ = [4, 1, 5, 4, 2, 1, 4, 3, 5, 1, 4, 8, 4, 1, 5, 2, 4, 3, 7, 0, 6]

const VM_VIN_DEALERS = [
  'KIA Polanco', 'KIA Monterrey Valle', 'KIA Patria', 'KIA Querétaro',
  'KIA Cancún', 'KIA Bajío', 'KIA Del Valle', 'KIA Santa Fe',
  'KIA Interlomas', 'KIA Sendero', 'KIA Veracruz', 'KIA Culiacán'
]
const VM_VIN_MODELOS = ['Sportage', 'Seltos', 'K4', 'Rio']
const VM_VIN_PREFIX = { Sportage: '3KPA', Seltos: 'KNADE', K4: '3KPF5', Rio: 'KNAB2' }
const VM_VIN_BASE = { Sportage: 510000, Seltos: 440000, K4: 385000, Rio: 300000 }
const VM_VIN_ALPH = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'

function vmVinStr(modelo, i) {
  let s = VM_VIN_PREFIX[modelo]
  let x = ((i + 1) * 2654435761) % 2147483647
  while (s.length < 17) {
    x = (x * 48271) % 2147483647
    s += VM_VIN_ALPH[x % VM_VIN_ALPH.length]
  }
  return s.slice(0, 17)
}

export const vmVins = Array.from({ length: 148 }, (_, i) => {
  const dealer = VM_VIN_DEALERS[i % VM_VIN_DEALERS.length]
  const modelo = VM_VIN_MODELOS[(i * 3 + 1) % VM_VIN_MODELOS.length]
  const montoFactura = VM_VIN_BASE[modelo] + (((i * 7) % 13) - 6) * 3000
  const rechazado = i % 7 === 2 // ~21 rechazos, repartidos entre los 12 dealers
  const ord = rechazado ? (i - 2) / 7 : -1
  const motivo = rechazado ? VM_VIN_MOTIVOS[VM_REJECT_SEQ[ord]] : null
  return {
    vin: vmVinStr(modelo, i),
    folio: `F-${(4800 + i).toString()}`,
    dealer, modelo, montoFactura,
    bono: VM_BONO_MODELO[modelo],
    estatus: rechazado ? 'rechazado' : 'ok',
    motivo
  }
})

export function vmVinResumen() {
  const ok = vmVins.filter(v => v.estatus === 'ok')
  const rech = vmVins.filter(v => v.estatus === 'rechazado')
  const pago = ok.reduce((a, v) => a + v.bono, 0)
  const facturado = vmVins.reduce((a, v) => a + v.montoFactura, 0)
  return {
    total: vmVins.length, ok: ok.length, rech: rech.length,
    pago, facturado, pctOk: Math.round((ok.length / vmVins.length) * 100)
  }
}

export function vmVinMotivos() {
  const acc = {}
  for (const v of vmVins) if (v.estatus === 'rechazado') acc[v.motivo] = (acc[v.motivo] || 0) + 1
  return Object.entries(acc).map(([motivo, n]) => ({ motivo, n })).sort((a, b) => b.n - a.n)
}

export function vmVinRechazosPorDealer() {
  const acc = {}
  for (const v of vmVins) if (v.estatus === 'rechazado') {
    if (!acc[v.dealer]) acc[v.dealer] = { dealer: v.dealer, vins: [] }
    acc[v.dealer].vins.push(v)
  }
  return Object.values(acc).sort((a, b) => b.vins.length - a.vins.length)
}

// --- KIA BRAIN · análisis de rechazos con histórico por dealer ---
function vmHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000
  return h
}

// Cruza el rechazo del periodo con 12 meses de histórico por dealer:
// tasa de rechazo actual vs histórica, tendencia, reincidencia y motivo principal.
export function vmDealerCompliance() {
  const acc = {}
  for (const v of vmVins) {
    if (!acc[v.dealer]) acc[v.dealer] = { dealer: v.dealer, total: 0, rech: 0, montoRech: 0, motivos: {} }
    const d = acc[v.dealer]
    d.total++
    if (v.estatus === 'rechazado') {
      d.rech++
      d.montoRech += v.bono
      d.motivos[v.motivo] = (d.motivos[v.motivo] || 0) + 1
    }
  }
  return Object.values(acc).map(d => {
    const tasaActual = d.total ? d.rech / d.total : 0
    const h = vmHash(d.dealer)
    const tasaHist = Math.max(0.02, Math.min(0.45, (h % 20) / 100 + 0.04))
    const tendencia = tasaActual > tasaHist + 0.02 ? 'up' : tasaActual < tasaHist - 0.02 ? 'down' : 'flat'
    const reincidencia = 30 + (h % 45)          // % de rechazos reincidentes
    const motivoTop = Object.entries(d.motivos).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    return { ...d, tasaActual, tasaHist, tendencia, reincidencia, motivoTop }
  }).sort((a, b) => b.tasaActual - a.tasaActual || b.rech - a.rech)
}

export const VM_BRAIN_RECHAZOS_METODO = [
  'Crucé los VIN rechazados del periodo contra 12 meses de validaciones previas por dealer.',
  'Calculé la tasa de rechazo histórica y la comparé con la del periodo para detectar la tendencia.',
  'Identifiqué reincidencia: rechazos por un motivo que el dealer ya había presentado antes.',
  'Detecté incentivos duplicados y ya pagados cruzando el catálogo histórico de VIN incentivados.',
  'Ordené a los dealers por severidad de incumplimiento para priorizar el seguimiento comercial.'
]

export { fmtMXN }
