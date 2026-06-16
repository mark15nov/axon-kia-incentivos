// ============================================================
//  FERIA DE CRÉDITO · KIA + Inbursa
//  Modelos reales de KIA México. Paso 1 jala de "Zap" las
//  condiciones y forecast de cada socio; Paso 3 entrega los
//  resultados completos del evento.
// ============================================================

import { fmtMXN, dealers } from './mockData.js'

export const FERIA_PERIODO = 'Feria Junio 2026'
export const FERIA_FUENTE = 'Zap'

// Segmento por modelo (lineup real KIA México).
export const SEGMENTO = {
  Picanto: 'Hatchback', Rio: 'Hatchback',
  Soluto: 'Sedán', K3: 'Sedán', K4: 'Sedán',
  Seltos: 'SUV', Sportage: 'SUV', Sorento: 'SUV'
}

// --- Condiciones por socio (origen: Zap) ---
export const feriaCondiciones = {
  kia: [
    { concepto: 'Bono de enganche', detalle: 'Aportación KIA al enganche por unidad financiada en feria', valor: '$8,000 / unidad' },
    { concepto: 'Bono Sportage / Sorento', detalle: 'Apoyo adicional en SUV de mayor valor', valor: '$6,000 / unidad' },
    { concepto: 'Vigencia', detalle: 'Promoción válida durante el evento', valor: '13–30 Jun 2026' }
  ],
  inbursa: [
    { concepto: 'Tasa preferencial', detalle: 'Tasa fija de feria (estándar 12.9%)', valor: '8.9% anual' },
    { concepto: 'Comisión por apertura', detalle: 'Sin comisión durante el evento', valor: '$0' },
    { concepto: 'Plazo máximo', detalle: 'Crédito automotriz Inbursa', valor: 'Hasta 60 meses' }
  ]
}

// --- Parámetros de tasa (origen: Oferta Comercial + Archivo Inbursa) ---
export const TASA_ESTANDAR = 12.9   // tasa estándar (%)
export const TASA_FERIA = 8.9       // tasa preferencial de feria (%)
export const KMX_SHARE = 0.70       // share de KIA (KMX) sobre la diferencia

export const FERIA_INPUTS = [
  { nombre: 'Oferta Comercial del Mes', tipo: 'PDF' },
  { nombre: 'Archivo Feria de Crédito Inbursa', tipo: 'Excel' }
]

// --- Cálculo por modelo / año (basado en tasa) ---
// La subvención = diferencia entre el monto a tasa estándar (original) y el
// monto a tasa feria. Esa diferencia × Share KMX = pago KIA, que se compara
// contra lo que solicita Inbursa (si pide de más, se aclara el excedente).
export const feriaForecast = [
  { modelo: 'Sportage', anio: 2026, unidades: 36, montoOriginal: 1080000, montoFeria: 1800000, inbursaSolicitado: 504000 },
  { modelo: 'Seltos',   anio: 2026, unidades: 28, montoOriginal: 756000,  montoFeria: 1260000, inbursaSolicitado: 352800 },
  { modelo: 'Sorento',  anio: 2026, unidades: 10, montoOriginal: 200000,  montoFeria: 450000,  inbursaSolicitado: 188000 },
  { modelo: 'K4',       anio: 2026, unidades: 20, montoOriginal: 300000,  montoFeria: 600000,  inbursaSolicitado: 210000 },
  { modelo: 'K3',       anio: 2025, unidades: 24, montoOriginal: 384000,  montoFeria: 720000,  inbursaSolicitado: 235200 },
  { modelo: 'Rio',      anio: 2025, unidades: 22, montoOriginal: 220000,  montoFeria: 484000,  inbursaSolicitado: 184800 },
  { modelo: 'Soluto',   anio: 2025, unidades: 22, montoOriginal: 198000,  montoFeria: 440000,  inbursaSolicitado: 178000 },
  { modelo: 'Picanto',  anio: 2026, unidades: 14, montoOriginal: 126000,  montoFeria: 266000,  inbursaSolicitado: 98000 }
]

// Derivados de cálculo por fila.
export function feriaCalcFila(f) {
  const diferencia = f.montoFeria - f.montoOriginal       // monto a pagar (subvención)
  const pagoKia = Math.round(diferencia * KMX_SHARE)      // diferencia × share KMX
  const excedente = f.inbursaSolicitado - pagoKia         // > 0 → aclarar con Inbursa
  return { diferencia, pagoKia, excedente }
}

// Notas del motor de diferencias (Zap) por modelo con excedente.
export const feriaNotasDiff = {
  Sorento: 'Inbursa solicita por encima de lo calculado — aclarar excedente (D01).',
  Soluto: 'Inbursa solicita por encima de lo calculado — aclarar excedente (D01).'
}

export function feriaTotales() {
  let montoOriginal = 0, montoFeria = 0, diferencia = 0, pagoKia = 0, inbursaSolicitado = 0, excedente = 0, unidades = 0, modelosExcedente = 0
  for (const f of feriaForecast) {
    const c = feriaCalcFila(f)
    montoOriginal += f.montoOriginal
    montoFeria += f.montoFeria
    diferencia += c.diferencia
    pagoKia += c.pagoKia
    inbursaSolicitado += f.inbursaSolicitado
    excedente += Math.max(0, c.excedente)
    unidades += f.unidades
    if (c.excedente > 0) modelosExcedente += 1
  }
  return { montoOriginal, montoFeria, diferencia, pagoKia, inbursaSolicitado, excedente, unidades, modelosExcedente }
}

// --- PASO 2: Comunicado a agencias ---
export const feriaComunicado = {
  asunto: 'Feria de Crédito KIA + Inbursa · Junio 2026',
  cuerpo: 'Estimado concesionario: del 13 al 30 de junio se activa la Feria de Crédito con tasa preferencial Inbursa de 8.9% y bono de enganche KIA de $8,000 por unidad financiada. Material POP y guion de venta adjuntos. Reporten avances diarios en Zap.'
}
export const feriaAgencias = dealers.map(d => ({ ...d }))

// ============================================================
//  PASO 3 · RESULTADOS  (todos los desgloses cuadran a 169 u)
// ============================================================

// Resultados por zona.
export const feriaResultadosZona = [
  { zona: 'Centro',    unidades: 42, monto: 10800000, leads: 142, aprobados: 71 },
  { zona: 'Norte',     unidades: 38, monto: 9700000,  leads: 98,  aprobados: 49 },
  { zona: 'Occidente', unidades: 33, monto: 8100000,  leads: 81,  aprobados: 41 },
  { zona: 'Bajío',     unidades: 30, monto: 7400000,  leads: 54,  aprobados: 33 },
  { zona: 'Sureste',   unidades: 26, monto: 5600000,  leads: 39,  aprobados: 16 }
]

// Real vs forecast (forecast KIA del Paso 1), con monto colocado y tasa de aprobación.
export const feriaResultadosModelo = [
  { modelo: 'Sportage', forecast: 36, real: 38, monto: 12160000, aprobacion: 62 },
  { modelo: 'Seltos',   forecast: 28, real: 26, monto: 7020000,  aprobacion: 58 },
  { modelo: 'Sorento',  forecast: 10, real: 9,  monto: 3780000,  aprobacion: 71 },
  { modelo: 'K4',       forecast: 20, real: 18, monto: 4500000,  aprobacion: 55 },
  { modelo: 'K3',       forecast: 24, real: 24, monto: 5280000,  aprobacion: 51 },
  { modelo: 'Rio',      forecast: 22, real: 22, monto: 3850000,  aprobacion: 47 },
  { modelo: 'Soluto',   forecast: 22, real: 20, monto: 3000000,  aprobacion: 44 },
  { modelo: 'Picanto',  forecast: 14, real: 12, monto: 2010000,  aprobacion: 42 }
]

// Embudo de conversión del crédito.
export const feriaFunnel = [
  { etapa: 'Leads', valor: 414 },
  { etapa: 'Cotizaciones', valor: 310 },
  { etapa: 'Solicitudes', valor: 248 },
  { etapa: 'Aprobados', valor: 210 },
  { etapa: 'Financiados', valor: 169 }
]

// Distribución por plazo del crédito (meses).
export const feriaPlazos = [
  { plazo: '12 m', unidades: 8 },
  { plazo: '24 m', unidades: 15 },
  { plazo: '36 m', unidades: 34 },
  { plazo: '48 m', unidades: 51 },
  { plazo: '60 m', unidades: 61 }
]

// Tendencia diaria de colocación durante la feria.
export const feriaTendencia = [
  { dia: '13–15', unidades: 22, monto: 5400000 },
  { dia: '16–18', unidades: 19, monto: 4600000 },
  { dia: '19–21', unidades: 28, monto: 6900000 },
  { dia: '22–24', unidades: 24, monto: 5900000 },
  { dia: '25–27', unidades: 31, monto: 7700000 },
  { dia: '28–30', unidades: 45, monto: 11100000 }
]

// Ranking de agencias.
export const feriaTopAgencias = [
  { id: 'D01', nombre: 'KIA Polanco', zona: 'Centro', unidades: 42, monto: 10800000, conversion: 29.6 },
  { id: 'D02', nombre: 'KIA Monterrey Valle', zona: 'Norte', unidades: 38, monto: 9700000, conversion: 38.8 },
  { id: 'D03', nombre: 'KIA Guadalajara Sur', zona: 'Occidente', unidades: 33, monto: 8100000, conversion: 40.7 },
  { id: 'D05', nombre: 'KIA Querétaro', zona: 'Bajío', unidades: 30, monto: 7400000, conversion: 55.6 },
  { id: 'D06', nombre: 'KIA Mérida', zona: 'Sureste', unidades: 26, monto: 5600000, conversion: 66.7 },
  { id: 'D04', nombre: 'KIA Puebla Angelópolis', zona: 'Centro', unidades: 0, monto: 0, conversion: 0 }
]

// Estatus de las solicitudes de crédito.
export const feriaAprobacion = [
  { estatus: 'Financiados', valor: 169, tone: 'emerald' },
  { estatus: 'Aprobados sin cerrar', valor: 41, tone: 'sky' },
  { estatus: 'Rechazados', valor: 38, tone: 'red' },
  { estatus: 'En análisis', valor: 30, tone: 'amber' }
]

// Derivado: mix por segmento (a partir de los resultados por modelo).
export function feriaPorSegmento() {
  const acc = {}
  for (const m of feriaResultadosModelo) {
    const seg = SEGMENTO[m.modelo] || 'Otro'
    if (!acc[seg]) acc[seg] = { segmento: seg, unidades: 0, monto: 0 }
    acc[seg].unidades += m.real
    acc[seg].monto += m.monto
  }
  return Object.values(acc).sort((a, b) => b.unidades - a.unidades)
}

export function feriaResultados() {
  const unidades = feriaResultadosZona.reduce((a, b) => a + b.unidades, 0)
  const monto = feriaResultadosZona.reduce((a, b) => a + b.monto, 0)
  const leads = feriaResultadosZona.reduce((a, b) => a + b.leads, 0)
  const forecast = feriaResultadosModelo.reduce((a, b) => a + b.forecast, 0)
  const aprobados = feriaResultadosZona.reduce((a, b) => a + b.aprobados, 0)
  const solicitudes = feriaFunnel.find(f => f.etapa === 'Solicitudes')?.valor || 0
  return {
    unidades, monto, leads, forecast, aprobados, solicitudes,
    conversion: leads ? (unidades / leads) * 100 : 0,
    cumplimiento: forecast ? (unidades / forecast) * 100 : 0,
    aprobacion: solicitudes ? (aprobados / solicitudes) * 100 : 0,
    ticket: unidades ? monto / unidades : 0,
    plazoProm: 48
  }
}

export { fmtMXN }
