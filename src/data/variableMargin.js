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

// Lineup KIA México — modelos aplicables a la Aceleración retail.
export const VM_MODELOS_KIA = [
  'K3', 'K4', 'Seltos', 'Sonet', 'Sportage', 'Sportage Híbrida', 'Sorento', 'Telluride', 'Niro'
]

// Modelos preseleccionados por defecto para el concepto.
export const vmModelosRetailDefault = ['K3', 'K4', 'Seltos', 'Sportage', 'Sorento']

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

// --- Razones sociales de la red ---
// El incentivo se define, estima y liquida contra la persona moral
// que factura (razón social), no contra el punto de venta: una razón
// social agrupa uno o varios dealers.
export const VM_RAZONES = [
  { id: 'andrade', nombre: 'Automotriz Andrade, S.A. de C.V.', corto: 'Grupo Andrade', rfc: 'AAN980312H45' },
  { id: 'vento', nombre: 'Comercializadora Vento del Valle, S.A. de C.V.', corto: 'Grupo Vento', rfc: 'CVV010725QJ8' },
  { id: 'konfidence', nombre: 'Konfidence Automotriz, S.A. de C.V.', corto: 'Konfidence', rfc: 'KAU040218LM3' },
  { id: 'oriente', nombre: 'Automotores del Oriente, S.A. de C.V.', corto: 'Grupo Oriente', rfc: 'AOR991104TR6' },
  { id: 'alden', nombre: 'Automotriz del Valle de Toluca, S.A. de C.V.', corto: 'Grupo Alden', rfc: 'AVT970606BD1' },
  { id: 'satelite', nombre: 'Satélite Motors, S.A. de C.V.', corto: 'Satélite Motors', rfc: 'SMO030915PK9' },
  { id: 'nororiente', nombre: 'Automotriz Nororiente, S.A. de C.V.', corto: 'Grupo Nororiente', rfc: 'ANO060427GX2' },
  { id: 'dalton', nombre: 'Dalton Automotriz, S.A. de C.V.', corto: 'Grupo Dalton', rfc: 'DAU880521RE4' },
  { id: 'michoacan', nombre: 'Automotriz de Michoacán, S.A. de C.V.', corto: 'Grupo Michoacán', rfc: 'AMI020813WD7' },
  { id: 'pacifico', nombre: 'Grupo Automotriz del Pacífico, S.A. de C.V.', corto: 'Grupo Pacífico', rfc: 'GAP051129HN5' },
  { id: 'carone', nombre: 'Car One Automotriz, S.A. de C.V.', corto: 'Car One', rfc: 'COA930408KQ1' },
  { id: 'laguna', nombre: 'Automotriz Laguna Coahuila, S.A. de C.V.', corto: 'Grupo Laguna', rfc: 'ALC001017VB8' },
  { id: 'frontera', nombre: 'Motores de la Frontera, S.A. de C.V.', corto: 'Grupo Frontera', rfc: 'MFR070302JS3' },
  { id: 'chihuahua', nombre: 'Automotriz Chihuahuense, S.A. de C.V.', corto: 'Grupo Chihuahuense', rfc: 'ACH950723DP2' },
  { id: 'surman', nombre: 'Surman Baja Automotriz, S.A. de C.V.', corto: 'Grupo Surman', rfc: 'SBA911205LT7' },
  { id: 'desierto', nombre: 'Automotriz del Desierto, S.A. de C.V.', corto: 'Grupo Desierto', rfc: 'ADE040610NF6' },
  { id: 'humaya', nombre: 'Autos del Humaya, S.A. de C.V.', corto: 'Grupo Humaya', rfc: 'AHU960919CZ4' },
  { id: 'bajio', nombre: 'Automotriz del Bajío, S.A. de C.V.', corto: 'Grupo Bajío', rfc: 'ABA890214RM9' },
  { id: 'queretano', nombre: 'Grupo Automotriz Queretano, S.A. de C.V.', corto: 'Grupo Queretano', rfc: 'GAQ011122XK5' },
  { id: 'torrescorzo', nombre: 'Torres Corzo Automotriz, S.A. de C.V.', corto: 'Torres Corzo', rfc: 'TCA850430PL8' },
  { id: 'angelopolis', nombre: 'Automotriz Angelópolis, S.A. de C.V.', corto: 'Grupo Angelópolis', rfc: 'AAN031205BG7' },
  { id: 'motoressur', nombre: 'Motores del Sur, S.A. de C.V.', corto: 'Motores del Sur', rfc: 'MSU980827HV3' },
  { id: 'istmo', nombre: 'Automotriz Istmo, S.A. de C.V.', corto: 'Grupo Istmo', rfc: 'AIS050316QW1' },
  { id: 'golfo', nombre: 'Autos del Golfo, S.A. de C.V.', corto: 'Grupo Golfo', rfc: 'AGO920611DK6' },
  { id: 'chapur', nombre: 'Grupo Chapur Peninsular, S.A. de C.V.', corto: 'Grupo Chapur', rfc: 'GCP870129RN2' }
]

export const VM_RAZON_POR_ID = Object.fromEntries(VM_RAZONES.map(r => [r.id, r]))

// Red nacional de distribuidores KIA México (nombres reales por ciudad/zona).
// [ nombre, zona, base (u/periodo), tendencia, razón social ]
const VM_DEALERS_BASE = [
  // --- Centro (CDMX) ---
  ['KIA Polanco', 'Centro', 165, 'up', 'andrade'],
  ['KIA Del Valle', 'Centro', 150, 'up', 'vento'],
  ['KIA Pedregal', 'Centro', 138, 'flat', 'konfidence'],
  ['KIA Santa Fe', 'Centro', 158, 'up', 'konfidence'],
  ['KIA Konfidence Santa Fe', 'Centro', 120, 'flat', 'konfidence'],
  ['KIA Mariano Escobedo', 'Centro', 132, 'down', 'andrade'],
  ['KIA Río San Joaquín', 'Centro', 126, 'up', 'andrade'],
  ['KIA Aeropuerto', 'Centro', 112, 'flat', 'andrade'],
  ['KIA Coapa', 'Centro', 118, 'down', 'vento'],
  ['KIA División del Norte', 'Centro', 110, 'flat', 'vento'],
  ['KIA Iztapalapa', 'Centro', 104, 'up', 'oriente'],
  ['KIA Tláhuac', 'Centro', 96, 'down', 'oriente'],
  // --- Metropolitana (Estado de México) ---
  ['KIA Metepec', 'Metropolitana', 140, 'up', 'alden'],
  ['KIA Toluca', 'Metropolitana', 128, 'flat', 'alden'],
  ['KIA Interlomas', 'Metropolitana', 146, 'up', 'satelite'],
  ['KIA Satélite', 'Metropolitana', 134, 'flat', 'satelite'],
  ['KIA Ecatepec', 'Metropolitana', 108, 'down', 'nororiente'],
  ['KIA Tlalnepantla', 'Metropolitana', 116, 'flat', 'satelite'],
  ['KIA Cuautitlán', 'Metropolitana', 102, 'up', 'nororiente'],
  ['KIA Atlacomulco', 'Metropolitana', 84, 'flat', 'alden'],
  // --- Occidente (Jalisco, Michoacán, Colima, Nayarit) ---
  ['KIA Patria', 'Occidente', 150, 'up', 'dalton'],
  ['KIA González Gallo', 'Occidente', 132, 'flat', 'dalton'],
  ['Dalton KIA Country', 'Occidente', 144, 'up', 'dalton'],
  ['KIA Galerías', 'Occidente', 128, 'flat', 'dalton'],
  ['KIA Altozano', 'Occidente', 96, 'up', 'michoacan'],
  ['KIA Uruapan', 'Occidente', 72, 'flat', 'michoacan'],
  ['KIA Zamora', 'Occidente', 68, 'down', 'michoacan'],
  ['KIA Colima', 'Occidente', 78, 'up', 'pacifico'],
  ['KIA Tepic', 'Occidente', 82, 'flat', 'pacifico'],
  ['KIA Puerto Vallarta', 'Occidente', 94, 'up', 'pacifico'],
  // --- Norte (Nuevo León, Coahuila, Tamaulipas, Chihuahua) ---
  ['KIA Sendero', 'Norte', 148, 'up', 'carone'],
  ['Car One KIA Lindavista', 'Norte', 136, 'flat', 'carone'],
  ['KIA Valle Oriente', 'Norte', 152, 'up', 'carone'],
  ['KIA Saltillo', 'Norte', 110, 'flat', 'laguna'],
  ['KIA Monclova', 'Norte', 74, 'down', 'laguna'],
  ['KIA Torreón', 'Norte', 112, 'up', 'laguna'],
  ['KIA Avenida', 'Norte', 98, 'flat', 'carone'],
  ['KIA Reynosa', 'Norte', 88, 'down', 'frontera'],
  ['KIA Nuevo Laredo', 'Norte', 80, 'flat', 'frontera'],
  ['KIA Chihuahua', 'Norte', 120, 'up', 'chihuahua'],
  ['KIA Ciudad Juárez', 'Norte', 124, 'flat', 'chihuahua'],
  // --- Noroeste (Baja California, Sonora, Sinaloa, BCS) ---
  ['KIA Tijuana', 'Noroeste', 134, 'up', 'surman'],
  ['KIA Mexicali', 'Noroeste', 108, 'flat', 'surman'],
  ['KIA Ensenada', 'Noroeste', 82, 'down', 'surman'],
  ['KIA Hermosillo', 'Noroeste', 118, 'up', 'desierto'],
  ['KIA Ciudad Obregón', 'Noroeste', 88, 'flat', 'desierto'],
  ['KIA Culiacán', 'Noroeste', 126, 'up', 'humaya'],
  ['KIA Ahome', 'Noroeste', 84, 'flat', 'humaya'],
  ['KIA Mazatlán', 'Noroeste', 96, 'down', 'humaya'],
  ['KIA La Paz', 'Noroeste', 70, 'flat', 'surman'],
  // --- Bajío (Guanajuato, Querétaro, Aguascalientes, SLP, Zacatecas) ---
  ['KIA Bajío', 'Bajío', 142, 'up', 'bajio'],
  ['KIA Altaria', 'Bajío', 118, 'flat', 'queretano'],
  ['KIA Querétaro', 'Bajío', 130, 'up', 'queretano'],
  ['KIA Juriquilla', 'Bajío', 124, 'up', 'queretano'],
  ['KIA San Luis Potosí', 'Bajío', 114, 'flat', 'torrescorzo'],
  ['KIA Irapuato', 'Bajío', 92, 'flat', 'bajio'],
  ['KIA Celaya', 'Bajío', 98, 'up', 'bajio'],
  ['KIA Salamanca', 'Bajío', 72, 'down', 'bajio'],
  ['KIA Zacatecas', 'Bajío', 80, 'flat', 'torrescorzo'],
  // --- Sur (Puebla, Morelos, Guerrero, Oaxaca, Chiapas) ---
  ['KIA Angelópolis', 'Sur', 132, 'down', 'angelopolis'],
  ['KIA Serdán', 'Sur', 110, 'flat', 'angelopolis'],
  ['KIA Tehuacán', 'Sur', 76, 'down', 'angelopolis'],
  ['KIA Cuernavaca', 'Sur', 118, 'up', 'motoressur'],
  ['KIA Acapulco', 'Sur', 94, 'flat', 'motoressur'],
  ['KIA Chilpancingo', 'Sur', 66, 'down', 'motoressur'],
  ['KIA Oaxaca', 'Sur', 102, 'flat', 'istmo'],
  ['KIA Tuxtla Gutiérrez', 'Sur', 98, 'up', 'istmo'],
  // --- Sureste (Veracruz, Tabasco, Yucatán, Q. Roo, Campeche) ---
  ['KIA Altas Montañas', 'Sureste', 84, 'flat', 'golfo'],
  ['KIA Veracruz', 'Sureste', 126, 'up', 'golfo'],
  ['KIA Xalapa', 'Sureste', 104, 'flat', 'golfo'],
  ['KIA Coatzacoalcos', 'Sureste', 88, 'down', 'golfo'],
  ['KIA Villahermosa', 'Sureste', 110, 'flat', 'golfo'],
  ['KIA Mérida', 'Sureste', 120, 'up', 'chapur'],
  ['KIA Cancún', 'Sureste', 134, 'up', 'chapur'],
  ['KIA Playa del Carmen', 'Sureste', 108, 'flat', 'chapur'],
  ['KIA Chetumal', 'Sureste', 72, 'down', 'chapur'],
  ['KIA Bahía', 'Sureste', 70, 'flat', 'chapur']
]

const MODELOS_FC = ['Sportage', 'Seltos', 'K4', 'Rio']
const RATIOS_FC = [0.30, 0.24, 0.27, 0.19]

// ------------------------------------------------------------
//  BASES DEL MARGEN VARIABLE
//  Los cuatro parámetros con los que se arma el forecast. Vienen
//  de la definición del programa y se pueden ajustar a mano en el
//  paso 1 para simular el efecto sobre toda la red antes de
//  mandar el reporte a Finanzas.
// ------------------------------------------------------------
export const VM_BASES = {
  metaAjuste: 0,       // % de ajuste sobre la meta base del histórico
  estacionalidad: 8,   // % que aporta la estacionalidad del periodo
  pesoTendencia: 1,    // cuánto pesa la tendencia de los últimos 6 meses
  umbral: 70           // probabilidad mínima para contar como "en meta"
}

// Estacionalidad con la que está calibrado el modelo (junio +8%).
const VM_ESTACIONALIDAD_BASE = 8

export const VM_BASES_CAMPOS = [
  {
    id: 'metaAjuste', label: 'Ajuste de meta', sufijo: '%', step: 1, min: -10, max: 10,
    desc: 'Sube o baja la meta que sale del histórico de 24 meses.'
  },
  {
    id: 'estacionalidad', label: 'Estacionalidad del periodo', sufijo: '%', step: 1, min: 0, max: 20,
    desc: `Aporte estacional del mes sobre el promedio (calibrado en ${VM_ESTACIONALIDAD_BASE}%).`
  },
  {
    id: 'pesoTendencia', label: 'Peso de la tendencia', sufijo: '×', step: 0.1, min: 0, max: 3,
    desc: 'Cuánto amplifica el modelo la tendencia de los últimos 6 meses.'
  },
  {
    id: 'umbral', label: 'Umbral de meta', sufijo: '%', step: 1, min: 40, max: 95,
    desc: 'Probabilidad mínima para dar una razón social por "en meta".'
  }
]

// Estimación determinista por modelo a partir del histórico, la
// tendencia y las bases vigentes del programa.
function vmGenModelos(base, tend, idx, b = VM_BASES) {
  const tf0 = tend === 'up' ? 1.09 : tend === 'down' ? 0.92 : 1.0
  const tf = 1 + (tf0 - 1) * b.pesoTendencia
  const fe = 1 + (b.estacionalidad - VM_ESTACIONALIDAD_BASE) / 100
  const fm = 1 + b.metaAjuste / 100
  return MODELOS_FC.map((modelo, i) => {
    // La venta estimada sale del histórico y la tendencia; el ajuste de
    // meta solo mueve el objetivo, así que subirla baja la probabilidad.
    const metaBase = Math.max(6, Math.round(base * RATIOS_FC[i]))
    const meta = Math.max(6, Math.round(metaBase * fm))
    const jit1 = ((idx * 13 + i * 7) % 3) - 1
    const estimado = Math.max(0, Math.round(metaBase * tf * fe) + jit1)
    const ratio = estimado / meta
    const jit2 = ((idx * 31 + i * 17) % 13) - 6
    const prob = Math.max(38, Math.min(97, Math.round(66 + (ratio - 1) * 200 + jit2)))
    return { modelo, meta, estimado, prob }
  })
}

function vmRazon(tend, hist, est, meta, prob, estac = VM_BASES.estacionalidad) {
  if (tend === 'up') return `Promedia ${hist} u con tendencia al alza en el último semestre; el periodo suma +${estac}% estacional, así que estimo ${est} unidades y ${prob}% de probabilidad de superar las ${meta} de meta.`
  if (tend === 'down') return `Tendencia a la baja en los últimos 6 meses y menor mezcla SUV arrastran el pronóstico a ${est} unidades, ${prob}% de alcanzar las ${meta} de meta.`
  return `Histórico estable en ${hist} u sin catalizador claro; el pronóstico queda en ${est} unidades, ${prob}% de alcanzar las ${meta} de meta.`
}

// Red completa recalculada con un juego de bases (el paso 1 la usa
// para simular; el resto del flujo corre con las bases vigentes).
export function vmForecastCon(bases) {
  const b = { ...VM_BASES, ...bases }
  return VM_DEALERS_BASE.map(([dealer, zona, base, tend, rs], idx) => vmDealerForecast(dealer, zona, base, tend, rs, idx, b))
}

function vmDealerForecast(dealer, zona, base, tend, rs, idx, b) {
  const modelos = vmGenModelos(base, tend, idx, b)
  const meta = modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = modelos.reduce((a, m) => a + m.estimado, 0)
  const prob = Math.round(modelos.reduce((a, m) => a + m.prob, 0) / modelos.length)
  const hist = Math.round(base * (0.97 + ((idx % 5) * 0.015)))
  const confianza = 82 + ((idx * 7) % 15)
  return {
    dealer, zona, rs, rsNombre: VM_RAZON_POR_ID[rs].nombre, rsCorto: VM_RAZON_POR_ID[rs].corto,
    hist, tendencia: tend, confianza, razon: vmRazon(tend, hist, estimado, meta, prob, b.estacionalidad), modelos
  }
}

export const vmForecast = vmForecastCon(VM_BASES)

// ============================================================
//  FORECAST POR RAZÓN SOCIAL
//  El paso 1 se evalúa contra la persona moral: se consolidan
//  los dealers de cada razón social y se vuelve a estimar la
//  probabilidad de meta sobre el agregado. Consolidar N puntos
//  de venta baja la dispersión del pronóstico (el error del
//  ratio escala ~1/√N), así que la curva es la misma que a
//  nivel dealer pero más pronunciada:
//    prob ≈ 66 + (estimado/meta − 1) × 200 × √N
// ============================================================
function vmRazonRS(rz, ds, tend, hist, est, meta, prob, estac = VM_BASES.estacionalidad) {
  const cuantos = ds.length === 1 ? 'su único punto de venta' : `sus ${ds.length} puntos de venta`
  const base = tend === 'up'
    ? `${rz.corto} promedia ${hist} u consolidadas en ${cuantos} con tendencia al alza en el último semestre; el periodo suma +${estac}% estacional`
    : tend === 'down'
      ? `${rz.corto} viene a la baja en los últimos 6 meses y con menor mezcla SUV en ${cuantos}`
      : `${rz.corto} sostiene un histórico estable de ${hist} u en ${cuantos} sin catalizador claro`
  return `${base}, así que estimo ${est} unidades para la razón social y ${prob}% de probabilidad de superar las ${meta} de meta.`
}

export function vmAgrupaRS(dealers, bases = VM_BASES) {
  return VM_RAZONES.map(rz => {
  const ds = dealers.filter(d => d.rs === rz.id)

  // Consolidado por modelo: metas y estimados se suman, la
  // probabilidad se recalcula sobre el ratio agregado.
  const escala = 200 * Math.sqrt(ds.length)
  const modelos = MODELOS_FC.map((modelo, i) => {
    const meta = ds.reduce((a, d) => a + d.modelos[i].meta, 0)
    const estimado = ds.reduce((a, d) => a + d.modelos[i].estimado, 0)
    const ratio = meta ? estimado / meta : 0
    return { modelo, meta, estimado, prob: Math.max(38, Math.min(97, Math.round(66 + (ratio - 1) * escala))) }
  })

  const meta = modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = modelos.reduce((a, m) => a + m.estimado, 0)
  const prob = Math.round(modelos.reduce((a, m) => a + m.prob, 0) / modelos.length)
  const hist = ds.reduce((a, d) => a + d.hist, 0)
  const confianza = Math.round(ds.reduce((a, d) => a + d.confianza, 0) / ds.length)

  // Tendencia dominante de la razón social, ponderada por histórico.
  const peso = { up: 0, flat: 0, down: 0 }
  for (const d of ds) peso[d.tendencia] += d.hist
  const tendencia = ['up', 'flat', 'down'].sort((a, b) => peso[b] - peso[a])[0]

  const zonas = [...new Set(ds.map(d => d.zona))]

  return {
    ...rz,
    zonas,
    zona: zonas.length === 1 ? zonas[0] : `${zonas.length} zonas`,
    dealers: ds,
    hist, tendencia, confianza,
    razon: vmRazonRS(rz, ds, tendencia, hist, estimado, meta, prob, bases.estacionalidad),
    modelos
  }
  })
}

export const vmForecastRS = vmAgrupaRS(vmForecast)

// Forecast por razón social recalculado con otras bases (simulación
// del paso 1).
export function vmForecastRSCon(bases) {
  const b = { ...VM_BASES, ...bases }
  return vmAgrupaRS(vmForecastCon(b), b)
}

// Cómo llegó KIA BRAIN a la estimación, redactada sobre las bases
// vigentes (el paso 1 las puede ajustar a mano).
export function vmBrainMetodologiaCon(bases = VM_BASES) {
  const b = { ...VM_BASES, ...bases }
  return [
    `Tomé 24 meses de ventas por dealer y modelo desde VQM + facturación SAP${b.metaAjuste ? ` y ajusté la meta base en ${b.metaAjuste > 0 ? '+' : ''}${b.metaAjuste}%` : ''}.`,
    `Ajusté por estacionalidad: el periodo rinde ${b.estacionalidad >= 0 ? '+' : ''}${b.estacionalidad}% sobre el promedio mensual.`,
    `Ponderé la tendencia de los últimos 6 meses con un peso de ${b.pesoTendencia}× contra los meses previos.`,
    'Descarté 2 quiebres de inventario de 2024 que distorsionaban el promedio.',
    `Estimé la probabilidad de meta con una regresión sobre el cumplimiento histórico y conté "en meta" desde ${b.umbral}%.`
  ]
}

// Cómo llegó KIA BRAIN a la estimación (se muestra al correr el análisis).
export const vmBrainMetodologia = [
  'Tomé 24 meses de ventas por dealer y modelo desde VQM + facturación SAP.',
  'Ajusté por estacionalidad: junio históricamente rinde +8% sobre el promedio mensual.',
  'Ponderé la tendencia de los últimos 6 meses al doble que los meses previos.',
  'Descarté 2 quiebres de inventario de 2024 que distorsionaban el promedio.',
  'Estimé la probabilidad de meta con una regresión sobre el cumplimiento histórico.'
]

// Nombre de la entidad evaluada: razón social en el paso 1, dealer
// en el resto de los pasos. Se usa como semilla determinista.
const vmNombreEnt = (e) => e.nombre ?? e.dealer

// Derivados del forecast por entidad (dealer o razón social).
export function vmForecastDealer(d, umbral = UMBRAL_META) {
  const meta = d.modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = d.modelos.reduce((a, m) => a + m.estimado, 0)
  const paresMeta = d.modelos.filter(m => m.prob >= umbral).length
  const prob = Math.round(d.modelos.reduce((a, m) => a + m.prob, 0) / d.modelos.length)
  return { meta, estimado, prob, paresMeta, pares: d.modelos.length, enMeta: prob >= umbral }
}

export function vmForecastResumen(lista = vmForecast, umbral = UMBRAL_META) {
  let meta = 0, estimado = 0, pares = 0, paresMeta = 0, dealersMeta = 0, conf = 0
  for (const d of lista) {
    const r = vmForecastDealer(d, umbral)
    meta += r.meta; estimado += r.estimado; pares += r.pares; paresMeta += r.paresMeta
    if (r.enMeta) dealersMeta += 1
    conf += d.confianza
  }
  return {
    meta, estimado, pares, paresMeta,
    dealers: lista.length, dealersMeta,
    confianza: Math.round(conf / lista.length),
    delta: estimado - meta
  }
}

// Resumen del paso 1: mismos totales de unidades, pero contados
// contra razones sociales en lugar de puntos de venta.
export function vmForecastResumenRS(lista = vmForecastRS, umbral = UMBRAL_META) {
  const r = vmForecastResumen(lista, umbral)
  const puntosVenta = lista.reduce((a, rz) => a + rz.dealers.length, 0)
  return { ...r, razones: r.dealers, razonesMeta: r.dealersMeta, puntosVenta }
}

// ============================================================
//  SEGMENTACIÓN DE CUMPLIMIENTO · el "cerebro" del forecast
//  Sobre la probabilidad estimada con 24 meses de histórico,
//  KIA BRAIN parte la red en tres grupos de decisión:
//    logran    → alta probabilidad, solo seguimiento
//    posibles  → alcanzable con empuje; se calcula cuántas
//                unidades extra faltan y un plan de trabajo
//    noLogran  → brecha estructural; plan de recuperación
// ============================================================
export const VM_CORTE_ALTO = 78   // prob >= → van a lograrlo
export const VM_CORTE_MEDIO = 55  // prob >= → tienen posibilidades

export const VM_GRUPOS = {
  logran: {
    key: 'logran', label: 'Lo van a lograr', corto: 'Logran',
    desc: 'Mayores posibilidades de cerrar la meta del periodo.',
    tone: 'green', criterio: `Probabilidad ≥ ${VM_CORTE_ALTO}%`
  },
  posibles: {
    key: 'posibles', label: 'Tienen posibilidades', corto: 'Posibles',
    desc: 'Alcanzan la meta con empuje comercial dirigido.',
    tone: 'amber', criterio: `Probabilidad ${VM_CORTE_MEDIO}–${VM_CORTE_ALTO - 1}%`
  },
  noLogran: {
    key: 'noLogran', label: 'No lo van a lograr', corto: 'No logran',
    desc: 'Brecha estructural contra la meta; requieren plan de recuperación.',
    tone: 'red', criterio: `Probabilidad < ${VM_CORTE_MEDIO}%`
  }
}

// Acciones que KIA BRAIN propone según el grupo. Se eligen de forma
// determinista por dealer para que la maqueta sea estable entre corridas.
const VM_ACCIONES_POSIBLES = [
  { titulo: 'Empujar el modelo con mayor brecha', plazo: 'Semana 1–2', detalle: d => `Concentrar piso y prospección en ${d.modeloFoco}: es donde el pronóstico queda más corto (${d.faltanFoco} u bajo meta) y donde ${d.entEl} tiene mejor histórico de conversión.` },
  { titulo: 'Reactivar prospectos no cerrados', plazo: 'Semana 1', detalle: d => `Recontactar la cartera de los últimos 90 días sin cierre. En el histórico de 24 meses ${d.entEste} recupera ~${d.recupera}% de esos prospectos cuando hay incentivo vigente.` },
  { titulo: 'Comunicar el incentivo a piso de venta', plazo: 'Semana 1', detalle: () => 'Sesión con el equipo de ventas para aterrizar el bono por unidad y el corte del periodo; en la red, los dealers con sesión formal cierran +6% sobre los que no la hacen.' },
  { titulo: 'Priorizar inventario de rotación rápida', plazo: 'Semana 2', detalle: d => `Reordenar el piso hacia ${d.modeloFoco} en ${d.nDealers > 1 ? `los ${d.nDealers} puntos de venta` : 'el punto de venta'} y liberar unidades con más de 60 días; el objetivo es sostener ${d.ritmoNecesario} u/semana en lo que resta del periodo.` },
  { titulo: 'Alinear con la financiera', plazo: 'Semana 2–3', detalle: () => 'Empatar la oferta con Opening Fee y Low Rate vigentes para bajar el enganche efectivo; históricamente sube la tasa de cierre en el segmento de entrada.' }
]

const VM_ACCIONES_NO_LOGRAN = [
  { titulo: 'Revisión de causa raíz con la dirección', plazo: 'Semana 1', detalle: d => `Sesión con dirección ${d.entDe}: la brecha es de ${d.brecha} u (${d.pctBrecha}% bajo meta) y la tendencia de los últimos 6 meses es ${d.tendLabel.toLowerCase()}. Hay que validar si es demanda, inventario o fuerza de venta.` },
  { titulo: 'Auditoría de inventario y mezcla', plazo: 'Semana 1–2', detalle: d => `Contrastar el piso actual ${d.nDealers > 1 ? `de los ${d.nDealers} puntos de venta ` : ''}contra la mezcla que sí rota en ${d.zona}. El pronóstico queda corto en ${d.modelosCortos} de 4 modelos de la oferta.` },
  { titulo: 'Meta ajustada y recuperación parcial', plazo: 'Semana 2', detalle: d => `La meta completa no es alcanzable en el periodo. Proponer objetivo puente de ${d.metaPuente} u para asegurar el tramo pagable y no perder el periodo completo.` },
  { titulo: 'Refuerzo de fuerza de venta', plazo: 'Semana 2–3', detalle: () => 'Acompañamiento de zona en piso y capacitación de cierre; en casos comparables de la red recupera entre 8 y 12% del volumen faltante.' },
  { titulo: 'Escalar a seguimiento comercial', plazo: 'Cierre', detalle: d => `Marcar ${d.entA} para revisión en el comité de incentivos: riesgo de no ejecutar el presupuesto asignado del periodo.` }
]

const VM_TEND_LABEL = { up: 'Al alza', flat: 'Estable', down: 'A la baja' }

// Perfil completo de la entidad evaluada (razón social en el paso 1,
// dealer en los demás): grupo, brecha contra meta, unidades extra por
// semana y modelos a empujar.
export function vmPerfilDealer(d) {
  const esRS = Boolean(d.nombre)
  const f = vmForecastDealer(d)
  const grupo = f.prob >= VM_CORTE_ALTO ? 'logran' : f.prob >= VM_CORTE_MEDIO ? 'posibles' : 'noLogran'
  const deficit = Math.max(0, f.meta - f.estimado)
  const colchon = Math.max(0, f.estimado - f.meta)

  // Unidades extra para asegurar la meta. El modelo estima
  // prob ≈ 66 + (estimado/meta - 1) × 200, así que subir la
  // probabilidad hasta el corte alto exige meta × Δprob / 200
  // unidades adicionales sobre el pronóstico. Nunca menos que
  // el déficit puro contra la meta.
  const porProb = Math.ceil((f.meta * Math.max(0, VM_CORTE_ALTO - f.prob)) / 200)
  const brecha = grupo === 'logran' ? 0 : Math.max(deficit, porProb)

  // Modelos donde el pronóstico queda bajo meta, de mayor a menor faltante.
  const cortos = d.modelos
    .map(m => ({ ...m, faltan: Math.max(0, m.meta - m.estimado) }))
    .filter(m => m.faltan > 0)
    .sort((a, b) => b.faltan - a.faltan)
  // Si ningún modelo queda bajo meta, el foco es el de menor
  // probabilidad: es el que sostiene menos el pronóstico.
  const foco = cortos[0] ?? [...d.modelos].sort((a, b) => a.prob - b.prob)[0]

  return {
    ...f,
    grupo,
    brecha,
    deficit,
    colchon,
    cortos,
    modeloFoco: foco.modelo,
    faltanFoco: Math.max(Math.ceil(brecha / 2), foco.meta - foco.estimado),
    modelosCortos: cortos.length,
    pctBrecha: f.meta ? Math.round((brecha / f.meta) * 100) : 0,
    ritmoNecesario: Math.max(1, Math.ceil(brecha / 4)),   // 4 semanas de periodo
    metaPuente: Math.round(f.meta - brecha * 0.55),
    recupera: 18 + (vmNombreEnt(d).length % 9),
    tendLabel: VM_TEND_LABEL[d.tendencia],
    zona: d.zona,
    // Etiquetas para redactar el plan al nivel correcto.
    esRS,
    nDealers: esRS ? d.dealers.length : 1,
    entEl: esRS ? 'la razón social' : 'el dealer',
    entDe: esRS ? 'de la razón social' : 'del dealer',
    entA: esRS ? 'a la razón social' : 'al dealer',
    entEste: esRS ? 'esta razón social' : 'este dealer'
  }
}

// Plan de trabajo generado por KIA BRAIN. 3 acciones por entidad,
// elegidas de forma determinista a partir de su nombre.
export function vmPlanTrabajo(d) {
  const p = vmPerfilDealer(d)
  if (p.grupo === 'logran') return []
  const pool = p.grupo === 'posibles' ? VM_ACCIONES_POSIBLES : VM_ACCIONES_NO_LOGRAN
  const seed = vmNombreEnt(d).length + d.zona.length
  return [0, 1, 2].map(i => {
    const a = pool[(seed + i * 2) % pool.length]
    return { titulo: a.titulo, plazo: a.plazo, detalle: a.detalle(p) }
  })
}

// Red partida en los tres grupos, con totales por grupo. `lista` define
// el nivel de la segmentación: razones sociales (paso 1) o dealers.
export function vmForecastGrupos(lista = vmForecast) {
  const out = {
    logran: { ...VM_GRUPOS.logran, items: [], meta: 0, estimado: 0, brecha: 0, colchon: 0 },
    posibles: { ...VM_GRUPOS.posibles, items: [], meta: 0, estimado: 0, brecha: 0, colchon: 0 },
    noLogran: { ...VM_GRUPOS.noLogran, items: [], meta: 0, estimado: 0, brecha: 0, colchon: 0 }
  }
  for (const d of lista) {
    const p = vmPerfilDealer(d)
    const g = out[p.grupo]
    g.items.push({ ...d, perfil: p })
    g.meta += p.meta; g.estimado += p.estimado
    g.brecha += p.brecha; g.colchon += p.colchon
  }
  for (const k of Object.keys(out)) {
    out[k].n = out[k].items.length
    out[k].pct = Math.round((out[k].n / lista.length) * 100)
    out[k].items.sort((a, b) => b.perfil.prob - a.perfil.prob)
  }
  return out
}

// Segmentación del paso 1: los tres grupos a nivel razón social.
export function vmForecastGruposRS() {
  return vmForecastGrupos(vmForecastRS)
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

// ============================================================
//  ETAPA 3 · MONTHLY · cierre del periodo
//  Resultado real contra la meta y contra lo que pronosticó
//  KIA BRAIN en el paso de forecast. Cierra el ciclo: quién
//  cumplió, quién no y por qué.
// ============================================================

// Causa del incumplimiento cuando el dealer no alcanza la meta.
const VM_CAUSAS_FALLA = [
  'Inventario insuficiente del modelo foco durante la segunda quincena.',
  'Tráfico de piso a la baja frente al promedio de 24 meses.',
  'Entregas diferidas al siguiente corte por disponibilidad de unidad.',
  'No se ejecutó el plan de trabajo propuesto al inicio del periodo.',
  'Documentación de VIN rechazada en validación y no subsanada a tiempo.'
]

const VM_CAUSAS_LOGRO = [
  'Ejecutó el plan de trabajo y cerró el modelo foco.',
  'Recuperó cartera de prospectos de los 90 días previos.',
  'Sostuvo inventario y mezcla SUV todo el periodo.',
  'Empuje de piso en la última quincena del corte.'
]

// Cierre real por dealer. Determinista: el resultado se desvía del
// pronóstico según el grupo en que KIA BRAIN clasificó al dealer.
export function vmCierreDealer(d, idx) {
  const p = vmPerfilDealer(d)
  const factor = p.grupo === 'logran' ? 1.03 : p.grupo === 'posibles' ? 0.985 : 0.93
  const jit = (((idx * 17 + d.dealer.length * 5) % 9) - 4) / 100
  const real = Math.max(0, Math.round(p.estimado * (factor + jit)))
  const cumplio = real >= p.meta
  const dif = real - p.meta
  const pctMeta = p.meta ? Math.round((real / p.meta) * 100) : 0

  // Reparto del resultado por modelo, para saber dónde quedó la brecha.
  const ratio = p.estimado ? real / p.estimado : 0
  const modelos = d.modelos.map(m => {
    const realM = Math.round(m.estimado * ratio)
    return { ...m, real: realM, dif: realM - m.meta }
  })
  const peor = [...modelos].sort((a, b) => a.dif - b.dif)[0]
  const mejor = [...modelos].sort((a, b) => b.dif - a.dif)[0]

  // KIA BRAIN esperaba que cumpliera si su probabilidad superaba el umbral.
  const esperaba = p.prob >= UMBRAL_META
  const acierto = esperaba === cumplio

  const seed = idx + d.dealer.length
  const motivo = cumplio
    ? (dif > p.meta * 0.05
        ? `Sobrecumplió por ${dif} u. ${mejor.modelo} cerró ${mejor.dif >= 0 ? '+' : ''}${mejor.dif} u contra su meta.`
        : `${dif === 0 ? 'Cerró exactamente en meta' : `Cerró la meta con ${dif} u de margen`}. ${VM_CAUSAS_LOGRO[seed % VM_CAUSAS_LOGRO.length]}`)
    : `Quedó ${Math.abs(dif)} u por debajo de meta. El faltante se concentra en ${peor.modelo} (${peor.dif} u). ${VM_CAUSAS_FALLA[seed % VM_CAUSAS_FALLA.length]}`

  return {
    dealer: d.dealer, zona: d.zona, rs: d.rs, tendencia: d.tendencia,
    meta: p.meta, estimado: p.estimado, real, cumplio, dif, pctMeta,
    prob: p.prob, grupo: p.grupo, esperaba, acierto, motivo,
    modelos, modeloPeor: peor.modelo, modeloMejor: mejor.modelo
  }
}

export const vmCierre = vmForecast.map((d, i) => vmCierreDealer(d, i))

// Resumen del cierre + precisión del pronóstico de KIA BRAIN.
export function vmCierreResumen() {
  const cumplieron = vmCierre.filter(c => c.cumplio)
  const fallaron = vmCierre.filter(c => !c.cumplio)
  const meta = vmCierre.reduce((a, c) => a + c.meta, 0)
  const real = vmCierre.reduce((a, c) => a + c.real, 0)
  const aciertos = vmCierre.filter(c => c.acierto).length

  // Cumplimiento real desglosado por el grupo que predijo el forecast.
  const porGrupo = {}
  for (const k of ['logran', 'posibles', 'noLogran']) {
    const del = vmCierre.filter(c => c.grupo === k)
    porGrupo[k] = { n: del.length, cumplieron: del.filter(c => c.cumplio).length }
  }

  return {
    dealers: vmCierre.length,
    cumplieron: cumplieron.length,
    fallaron: fallaron.length,
    pctDealers: Math.round((cumplieron.length / vmCierre.length) * 100),
    meta, real, dif: real - meta,
    pctRed: Math.round((real / meta) * 100),
    precision: Math.round((aciertos / vmCierre.length) * 100),
    porGrupo
  }
}

// ============================================================
//  PASO 2 · RESULTADOS · corte del periodo en curso
//  Al día 24 de 30 se mide a cada razón social contra las
//  variables activas de la oferta comercial (paso 1), no solo
//  contra unidades. Dos naturalezas de variable:
//    · medida  → el dato ya está levantado (CSI, NPS, leads);
//                lo que dio, dio: cumple o no cumple.
//    · abierta → se cierra con el periodo (volumen, mezcla,
//                margen); todavía se puede mover.
//  De ahí salen los tres estados que interesan al comité:
//  quién ya cumplió, quién sigue pendiente y quién ya no llega.
//  El cierre definitivo con el pago se ve en MONTHLY.
// ============================================================
export const VM_DIAS_PERIODO = 30
export const VM_DIA_CORTE = 24
export const VM_FECHA_CORTE = '24 de junio de 2026'
export const VM_DIAS_RESTANTES = VM_DIAS_PERIODO - VM_DIA_CORTE
export const VM_AVANCE_TIEMPO = VM_DIA_CORTE / VM_DIAS_PERIODO

// Puntos de la oferta que hay que devengar para entrar al incentivo.
export const VM_UMBRAL_SCORE = 70

// Una variable abierta se da por perdida cuando su proyección al
// cierre queda por debajo de este % de la meta.
const VM_CORTE_RESCATE = 0.92

// Naturaleza de cada variable de la oferta.
const VM_VAR_CIERRE = {
  v_vol: 'abierta', v_ret: 'abierta', v_foco: 'abierta',
  m_mix: 'abierta', m_neto: 'abierta', m_inv: 'abierta',
  c_csi: 'medida', c_nps: 'medida', c_lead: 'medida'
}

// Cómo se lee cada variable en el corte.
const VM_VAR_UNIDAD = {
  v_vol: 'unidades', v_ret: 'retail vs flotilla', v_foco: 'unidades SUV',
  m_mix: 'penetración premium', m_neto: 'margen por unidad', m_inv: 'unidades +90 días',
  c_csi: 'puntos CSI', c_nps: 'NPS posventa', c_lead: 'tiempo de respuesta'
}

// Estado de cada variable en el corte.
export const VM_RESULTADO_ESTADO = {
  cumplida: { key: 'cumplida', label: 'Cumplida', corto: 'Cumplida', tone: 'green', desc: 'Ya alcanzó la meta del periodo.' },
  enRitmo: { key: 'enRitmo', label: 'En ritmo', corto: 'En ritmo', tone: 'blue', desc: 'Proyecta cerrar la meta con el ritmo del corte.' },
  corta: { key: 'corta', label: 'Corta', corto: 'Corta', tone: 'amber', desc: 'Se queda abajo, pero todavía es rescatable.' },
  perdida: { key: 'perdida', label: 'No cumplida', corto: 'No cumple', tone: 'red', desc: 'Ya no se recupera en lo que queda del periodo.' }
}

export const VM_ESTADO_ORDEN = ['cumplida', 'enRitmo', 'corta', 'perdida']

export const VM_ESTATUS = {
  cumplida: {
    key: 'cumplida', label: 'Cumplen', corto: 'Cumplen', tone: 'green',
    desc: 'Ninguna variable corta y el score alcanza el umbral: el incentivo está asegurado.',
    criterio: 'Sin variables cortas y con la oferta cubierta'
  },
  enLinea: {
    key: 'enLinea', label: 'Pendientes · en línea', corto: 'En línea', tone: 'blue',
    desc: 'Llegan al umbral con lo cumplido más lo que viene en ritmo, aunque traen alguna variable corta.',
    criterio: 'Cubren la oferta con lo cumplido y lo que va en ritmo'
  },
  riesgo: {
    key: 'riesgo', label: 'Pendientes · en riesgo', corto: 'En riesgo', tone: 'amber',
    desc: 'Solo llegan si rescatan variables que hoy proyectan por debajo de su meta.',
    criterio: 'Dependen de rescatar variables cortas'
  },
  noAlcanza: {
    key: 'noAlcanza', label: 'No cumplen', corto: 'No cumplen', tone: 'red',
    desc: 'Ni rescatando todo lo abierto llegan al umbral del periodo.',
    criterio: 'Ni rescatando lo abierto cubren la oferta'
  }
}

export const VM_ESTATUS_ORDEN = ['cumplida', 'enLinea', 'riesgo', 'noAlcanza']

// Reparte el acumulado entre los tramos del periodo a partir del ritmo
// diario de cada uno (no del volumen), para que un tramo corto no
// parezca caída: S1 (1–7), S2 (8–14), S3 (15–21) y S4 (22–24, en curso).
const VM_TRAMOS = [
  { label: 'S1', dias: 7 },
  { label: 'S2', dias: 7 },
  { label: 'S3', dias: 7 },
  { label: 'S4', dias: 3 }
]

function vmTramos(acum, seed) {
  const r = [
    1,
    1 + (((seed * 11) % 21) - 10) / 40,
    1 + (((seed * 7) % 25) - 12) / 40,
    1 + (((seed * 13) % 27) - 12) / 36
  ]
  const den = VM_TRAMOS.reduce((a, t, i) => a + r[i] * t.dias, 0)
  const out = VM_TRAMOS.map((t, i) => ({ ...t, u: Math.round(acum * (r[i] * t.dias) / den) }))
  out[3].u = Math.max(0, acum - out[0].u - out[1].u - out[2].u)
  return out.map(t => ({ ...t, ritmo: +(t.u / t.dias).toFixed(1) }))
}

const VM_RITMO_LABEL = { up: 'Acelerando', flat: 'Ritmo estable', down: 'Desacelerando' }

// Qué parte de su cierre real lleva cada punto de venta al corte: los
// que el forecast puso en verde arrancaron fuerte, los de riesgo cargan
// el resultado a los últimos días del periodo.
function vmFraccionCorte(grupo, seed) {
  if (grupo === 'logran') return 0.90 + ((seed * 3) % 9) / 100      // 0.90 – 0.98
  if (grupo === 'posibles') return 0.74 + ((seed * 5) % 15) / 100   // 0.74 – 0.88
  return 0.62 + ((seed * 7) % 9) / 100                              // 0.62 – 0.70
}

// Avance de unidades por punto de venta al corte.
export const vmAvanceDealer = vmCierre.map((c, i) => {
  const frac = vmFraccionCorte(c.grupo, i + c.dealer.length)
  const acum = Math.min(c.real, Math.round(c.real * frac))
  return {
    dealer: c.dealer, zona: c.zona, rs: c.rs,
    meta: c.meta, acum,
    proy: Math.round(acum / VM_AVANCE_TIEMPO),
    faltan: Math.max(0, c.meta - acum),
    pct: c.meta ? Math.round((acum / c.meta) * 100) : 0
  }
})

// --- Resultado de cada variable de la oferta, por razón social ---
// El volumen es literalmente el avance de unidades; el resto se mueve
// alrededor de ese desempeño con una desviación determinista por
// variable, y las variables medidas traen su propio resultado.
function vmVariableResultado(v, pctUnidades, seed) {
  const cierre = VM_VAR_CIERRE[v.id] ?? 'abierta'

  if (cierre === 'medida') {
    const avance = 86 + ((seed * 17) % 27)                 // 86 – 112
    return {
      cierre, avance, proy: avance,
      estado: avance >= 100 ? 'cumplida' : 'perdida',
      nota: avance >= 100
        ? `Medición del periodo ya levantada: ${avance}% de la meta. Punto asegurado.`
        : `Medición del periodo ya levantada: cerró en ${avance}% de la meta y no se puede recuperar.`
    }
  }

  const desv = 0.88 + ((seed * 13) % 25) / 100             // 0.88 – 1.12
  const avance = v.id === 'v_vol' ? pctUnidades : Math.round(pctUnidades * desv)
  const proy = Math.round(avance / VM_AVANCE_TIEMPO)
  const estado = avance >= 100 ? 'cumplida'
    : proy >= 100 ? 'enRitmo'
      : proy >= 100 * VM_CORTE_RESCATE ? 'corta'
        : 'perdida'
  const nota = {
    cumplida: `Ya cerró la meta con ${VM_DIAS_RESTANTES} días por delante; el resto del periodo es colchón.`,
    enRitmo: `Lleva ${avance}% de la meta al corte y proyecta ${proy}%: con el ritmo actual cierra.`,
    corta: `Lleva ${avance}% y proyecta ${proy}%: se rescata subiendo el ritmo en los ${VM_DIAS_RESTANTES} días que quedan.`,
    perdida: `Lleva ${avance}% y proyecta ${proy}%: el faltante ya no se cubre en ${VM_DIAS_RESTANTES} días.`
  }[estado]
  return { cierre, avance, proy, estado, nota }
}

// Variables activas de la oferta comercial (las que definen el score).
const VM_VARS_ACTIVAS = vmPilares
  .flatMap(p => p.variables.map(v => ({ ...v, pilar: p.id, pilarNombre: p.nombre, tone: p.tone })))
  .filter(v => vmActivosDefault.includes(v.id))

export const VM_SCORE_TOTAL = VM_VARS_ACTIVAS.reduce((a, v) => a + v.peso, 0)
export const VM_BOLSA_TOTAL = VM_VARS_ACTIVAS.reduce((a, v) => a + v.bolsa, 0)

// Resultado consolidado por razón social.
export const vmResultados = vmForecastRS.map((rz, idx) => {
  const ds = vmAvanceDealer.filter(d => d.rs === rz.id)
  const meta = ds.reduce((a, d) => a + d.meta, 0)
  const acum = ds.reduce((a, d) => a + d.acum, 0)
  const proy = Math.round(acum / VM_AVANCE_TIEMPO)
  const pct = meta ? Math.round((acum / meta) * 100) : 0
  const metaRed = vmAvanceDealer.reduce((a, d) => a + d.meta, 0)
  const tramos = vmTramos(acum, idx + rz.corto.length)

  const rSem = tramos[2].ritmo ? tramos[3].ritmo / tramos[2].ritmo : 1
  const ritmo = rSem >= 1.05 ? 'up' : rSem <= 0.95 ? 'down' : 'flat'

  // Cada variable con su resultado y su bolsa prorrateada por el peso
  // que la razón social tiene dentro de la meta de la red.
  const cuota = metaRed ? meta / metaRed : 0
  const variables = VM_VARS_ACTIVAS.map((v, i) => {
    const res = vmVariableResultado(v, pct, idx * 5 + i * 7 + rz.corto.length)
    return { ...v, ...res, bolsaRS: Math.round(v.bolsa * cuota) }
  })

  const suma = (est, campo) => variables.filter(v => v.estado === est).reduce((a, v) => a + v[campo], 0)
  const scoreCumplido = suma('cumplida', 'peso')   // puntos ya asegurados
  const scoreEnRitmo = suma('enRitmo', 'peso')     // van a cerrar con el ritmo actual
  const scoreCorto = suma('corta', 'peso')         // rescatables
  const scorePerdido = suma('perdida', 'peso')     // fuera del periodo
  const scoreProyectado = scoreCumplido + scoreEnRitmo
  const scoreMax = scoreProyectado + scoreCorto

  const estatus =
    scoreMax < VM_UMBRAL_SCORE ? 'noAlcanza'
      : scoreProyectado >= VM_UMBRAL_SCORE
        ? (scoreCorto === 0 ? 'cumplida' : 'enLinea')
        : 'riesgo'

  return {
    id: rz.id, nombre: rz.nombre, corto: rz.corto, rfc: rz.rfc,
    zona: rz.zona, zonas: rz.zonas, dealers: ds,
    meta, acum, proy, pct,
    faltan: Math.max(0, meta - acum),
    // Índice de ritmo: 100 = va justo al paso que exige el periodo.
    indice: meta ? Math.round((acum / meta) / VM_AVANCE_TIEMPO * 100) : 0,
    ritmoActual: +(acum / VM_DIA_CORTE).toFixed(1),
    ritmoRequerido: +(Math.max(0, meta - acum) / VM_DIAS_RESTANTES).toFixed(1),
    tramos, ritmo, ritmoLabel: VM_RITMO_LABEL[ritmo],
    variables, estatus,
    scoreCumplido, scoreEnRitmo, scoreCorto, scorePerdido, scoreProyectado, scoreMax,
    // Bolsa: asegurada (variables ya cumplidas), en juego (en ritmo +
    // cortas) y caída (variables perdidas del periodo).
    asegurado: suma('cumplida', 'bolsaRS'),
    enJuego: suma('enRitmo', 'bolsaRS') + suma('corta', 'bolsaRS'),
    perdido: suma('perdida', 'bolsaRS'),
    bolsa: variables.reduce((a, v) => a + v.bolsaRS, 0),
    cumplidas: variables.filter(v => v.estado === 'cumplida').length,
    enRitmo: variables.filter(v => v.estado === 'enRitmo').length,
    cortas: variables.filter(v => v.estado === 'corta').length,
    perdidas: variables.filter(v => v.estado === 'perdida').length,
    variablesN: variables.length,
    dealersCerrados: ds.filter(d => d.acum >= d.meta).length
  }
})

export function vmResultadosResumen() {
  const t = (campo) => vmResultados.reduce((a, x) => a + x[campo], 0)
  const meta = t('meta'), acum = t('acum')
  const conteo = {}
  for (const k of VM_ESTATUS_ORDEN) conteo[k] = vmResultados.filter(x => x.estatus === k).length
  const ritmos = { up: 0, flat: 0, down: 0 }
  for (const x of vmResultados) ritmos[x.ritmo]++

  const tramos = VM_TRAMOS.map((tr, i) => {
    const u = vmResultados.reduce((a, x) => a + x.tramos[i].u, 0)
    return { ...tr, u, ritmo: +(u / tr.dias).toFixed(1) }
  })

  const proy = Math.round(acum / VM_AVANCE_TIEMPO)
  return {
    razones: vmResultados.length,
    puntosVenta: vmAvanceDealer.length,
    meta, acum, proy,
    faltan: t('faltan'),
    pct: meta ? Math.round((acum / meta) * 100) : 0,
    delta: proy - meta,
    indice: meta ? Math.round((acum / meta) / VM_AVANCE_TIEMPO * 100) : 0,
    ritmoActual: +(acum / VM_DIA_CORTE).toFixed(1),
    ritmoRequerido: +(t('faltan') / VM_DIAS_RESTANTES).toFixed(1),
    conteo, ritmos, tramos,
    pendientes: conteo.enLinea + conteo.riesgo,
    scoreAsegurado: Math.round(vmResultados.reduce((a, x) => a + x.scoreCumplido, 0) / vmResultados.length),
    scoreProyectado: Math.round(vmResultados.reduce((a, x) => a + x.scoreProyectado, 0) / vmResultados.length),
    asegurado: t('asegurado'), enJuego: t('enJuego'), perdido: t('perdido'), bolsa: t('bolsa'),
    dealersCerrados: vmAvanceDealer.filter(d => d.acum >= d.meta).length
  }
}

// Desempeño de la red variable por variable: cuántas razones sociales
// la tienen cumplida, pendiente o perdida, y cuánta bolsa mueve.
export function vmResultadosPorVariable() {
  return VM_VARS_ACTIVAS.map(v => {
    const filas = vmResultados.map(x => x.variables.find(y => y.id === v.id))
    const cnt = (e) => filas.filter(f => f.estado === e).length
    return {
      ...v,
      unidad: VM_VAR_UNIDAD[v.id],
      cierre: VM_VAR_CIERRE[v.id] ?? 'abierta',
      cumplidas: cnt('cumplida'), enRitmo: cnt('enRitmo'), cortas: cnt('corta'), perdidas: cnt('perdida'),
      pctCumplida: Math.round((cnt('cumplida') / filas.length) * 100),
      pctFirme: Math.round(((cnt('cumplida') + cnt('enRitmo')) / filas.length) * 100),
      avancePromedio: Math.round(filas.reduce((a, f) => a + f.avance, 0) / filas.length),
      asegurado: vmResultados.reduce((a, x) => {
        const f = x.variables.find(y => y.id === v.id)
        return a + (f.estado === 'cumplida' ? f.bolsaRS : 0)
      }, 0)
    }
  }).sort((a, b) => b.pctFirme - a.pctFirme || b.pctCumplida - a.pctCumplida)
}

// Corte por zona comercial.
export function vmResultadosPorZona() {
  const acc = {}
  for (const x of vmResultados) {
    for (const z of x.zonas) {
      if (!acc[z]) acc[z] = { zona: z, n: 0, meta: 0, acum: 0, score: 0, cumplida: 0, enLinea: 0, riesgo: 0, noAlcanza: 0 }
      const g = acc[z]
      const ds = x.dealers.filter(d => d.zona === z)
      g.n += 1
      g.score += x.scoreProyectado
      g.meta += ds.reduce((a, d) => a + d.meta, 0)
      g.acum += ds.reduce((a, d) => a + d.acum, 0)
      g[x.estatus] += 1
    }
  }
  return Object.values(acc)
    .map(z => ({
      ...z,
      pct: z.meta ? Math.round((z.acum / z.meta) * 100) : 0,
      // Índice de ritmo de la zona: 100 = va al paso que exige el periodo.
      indice: z.meta ? Math.round((z.acum / z.meta) / VM_AVANCE_TIEMPO * 100) : 0,
      score: Math.round(z.score / z.n)
    }))
    .sort((a, b) => b.indice - a.indice || b.pct - a.pct)
}

// Lectura del corte que firma KIA BRAIN.
export function vmResultadosInsights() {
  const r = vmResultadosResumen()
  const porVar = vmResultadosPorVariable()
  const peor = porVar[porVar.length - 1]
  const mejor = porVar[0]
  const riesgo = vmResultados.filter(x => x.estatus === 'riesgo')
  const fuera = vmResultados.filter(x => x.estatus === 'noAlcanza')
  const lider = [...vmResultados].sort((a, b) => b.acum - a.acum || b.pct - a.pct)[0]
  const rescatable = riesgo.reduce((a, x) => a + x.enJuego, 0)

  return [
    {
      icon: 'Trending', tone: 'ink',
      titulo: `${r.conteo.cumplida} de ${r.razones} razones sociales cumplen sin depender de rescates`,
      detalle: `Tienen cubiertas las variables que exige la oferta, entre cumplidas y en ritmo, y no traen ninguna corta. La red lleva ${r.acum.toLocaleString('es-MX')} u vendidas de ${r.meta.toLocaleString('es-MX')} de meta al día ${VM_DIA_CORTE} de ${VM_DIAS_PERIODO} (${r.pct}%, ${r.indice}% del ritmo requerido) y proyecta cerrar en ${r.proy.toLocaleString('es-MX')} u.`
    },
    {
      icon: 'Alert', tone: 'amber',
      titulo: `${riesgo.length} se juegan el periodo en ${VM_DIAS_RESTANTES} días`,
      detalle: riesgo.length
        ? `Solo cubren la oferta si rescatan variables que hoy vienen cortas: ${fmtMXN(rescatable)} de bolsa dependen de esos cierres. Es donde el empuje comercial todavía cambia el resultado.`
        : 'Ninguna razón social depende de rescatar variables cortas para llegar al umbral.'
    },
    {
      icon: 'Percent', tone: 'red',
      titulo: `${peor.nombre} es la variable que peor viene en la red`,
      detalle: peor.cierre === 'medida'
        ? `Es una variable ya medida: ${peor.perdidas} razones sociales quedaron abajo de la meta (${peor.meta}) y esa variable ya no se recupera; solo ${peor.pctFirme}% de la red la tiene a favor. En el otro extremo, ${mejor.nombre} la trae firme en ${mejor.pctFirme}% de la red.`
        : `${peor.perdidas} razones sociales ya la perdieron y ${peor.cortas} vienen cortas; solo ${peor.pctFirme}% de la red la trae cumplida o en ritmo (avance promedio ${peor.avancePromedio}% contra la meta de ${peor.meta}). En el otro extremo, ${mejor.nombre} la trae firme en ${mejor.pctFirme}% de la red.`
    },
    {
      icon: 'Cash', tone: 'green',
      titulo: `${fmtMXN(r.asegurado)} asegurados de ${fmtMXN(r.bolsa)} de la oferta`,
      detalle: `${fmtMXN(r.enJuego)} siguen en juego y ${fmtMXN(r.perdido)} ya se cayeron del periodo${fuera.length ? ` (${fuera.length} razones sociales fuera del umbral)` : ''}. ${lider.corto} encabeza la red con ${lider.acum.toLocaleString('es-MX')} u vendidas (${lider.pct}% de su meta).`
    }
  ]
}
// --- Correos del cierre (se muestran editables antes de enviar) ---

// Reporte individual que recibe cada dealer con su resultado del periodo.
export function vmCorreoDealer(c, nombre = 'Variable Margin') {
  const modelos = c.modelos
    .map(m => `  • ${m.modelo}: ${m.real} u de ${m.meta} (${m.dif >= 0 ? '+' : ''}${m.dif})`)
    .join('\n')

  const cierre = c.cumplio
    ? `Con este resultado el dealer ALCANZA el incentivo del periodo. El pago se procesa en la corrida de Finanzas del cierre.`
    : `Con este resultado el dealer NO alcanza el incentivo del periodo. El equipo comercial de zona dará seguimiento al plan de recuperación para el siguiente corte.`

  return `Estimado ${c.dealer}:

Cierre del incentivo ${nombre} correspondiente a ${VM_PERIODO}.

RESULTADO
  Meta del periodo:      ${c.meta} unidades
  Unidades reales:       ${c.real} unidades
  Cumplimiento:          ${c.pctMeta}% (${c.dif >= 0 ? '+' : ''}${c.dif} u)

DETALLE POR MODELO
${modelos}

ANÁLISIS
${c.motivo}

${cierre}

Saludos,
Incentivos KIA`
}

// Corrida del cálculo final que se manda a Finanzas.
export function vmCorreoFinanzas(res, vin, nombre = 'Variable Margin', folio = 'VM-JUN26-0428') {
  return `Finanzas KIA:

Se envía la corrida del cálculo final del incentivo ${nombre} · ${VM_PERIODO} para posteo y pago.

1) RESULTADO COMERCIAL DEL PERIODO
   Cumplimiento de metas de venta de la red. No es la base de pago.

   Dealers en la red:        ${res.dealers}
   Dealers que cumplieron:   ${res.cumplieron} (${res.pctDealers}%)
   Unidades vendidas:        ${res.real.toLocaleString('es-MX')} de ${res.meta.toLocaleString('es-MX')} de meta (${res.pctRed}%)

2) BASE DE PAGO DEL INCENTIVO
   Únicamente los VIN reclamados al incentivo y validados contra la
   oferta comercial del periodo. Es la cifra que se postea.

   VIN reclamados:           ${vin.total}
   VIN que califican:        ${vin.ok}
   VIN rechazados:           ${vin.rech}
   Monto facturado:          ${fmtMXN(vin.facturado)}
   MONTO A PAGAR:            ${fmtMXN(vin.pago)}

   Folio de la corrida:      ${folio}

El detalle por dealer y por VIN va adjunto en el archivo de la corrida.
Se solicita posteo en SAP y programación del pago conforme al calendario
del periodo.

Saludos,
Incentivos KIA`
}

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
