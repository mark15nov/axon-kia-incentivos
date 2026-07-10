// ============================================================
//  OPENING FEE · KIA
//  Paso 1 (Definir Oferta) y Paso 2 (Forecast) reutilizan el
//  modelo de Variable Margin. El Paso 3 compara el forecast de
//  KIA contra el forecast de la financiera (Inbursa): cuando el
//  monto de KIA es mayor al forecasteado por la financiera hay
//  una diferencia en contra y se envía un correo para analizarla.
// ============================================================

export { fmtMXN } from './mockData.js'

export const OF_PERIODO = 'Junio 2026'
export const OF_FINANCIERA = 'Inbursa'
export const OF_CORREO_FINANCIERA = 'forecast.auto@inbursa.com.mx'

// Forecast por dealer: monto proyectado por KIA vs monto forecasteado
// por la financiera. diferencia = kia - inbursa (positiva = en contra).
export const ofForecastInbursa = [
  { id: 'D01', dealer: 'KIA Polanco',            zona: 'Centro',    kia: 132000, inbursa: 132000 },
  { id: 'D02', dealer: 'KIA Monterrey Valle',    zona: 'Norte',     kia: 118000, inbursa: 110000 },
  { id: 'D03', dealer: 'KIA Guadalajara Sur',    zona: 'Occidente', kia: 96000,  inbursa: 96000 },
  { id: 'D04', dealer: 'KIA Puebla Angelópolis', zona: 'Sur',       kia: 88000,  inbursa: 79000 },
  { id: 'D05', dealer: 'KIA Querétaro',          zona: 'Bajío',     kia: 74000,  inbursa: 74000 },
  { id: 'D06', dealer: 'KIA Mérida',             zona: 'Sureste',   kia: 61000,  inbursa: 66000 }
]

// Una fila está "en contra" cuando el monto de KIA supera el forecast de la financiera.
export function ofDiferencia(f) {
  const diferencia = f.kia - f.inbursa
  return { diferencia, enContra: diferencia > 0 }
}

// Dealers a los que aplica el Opening Fee este periodo (subconjunto de la red).
export const ofDealersAplican = ofForecastInbursa.map(f => ({ id: f.id, dealer: f.dealer, zona: f.zona }))

// Base propuesta del comunicado a dealers (editable por el usuario).
export const ofComunicadoBase = {
  asunto: `Opening Fee · Comisión por apertura sin costo — ${OF_PERIODO}`,
  cuerpo: `Estimado concesionario:

Como parte del programa Opening Fee de KIA, durante ${OF_PERIODO} la comisión por apertura del crédito será absorbida por la financiera o reembolsada al cliente, según la modalidad aplicable. KIA subvenciona su share conforme a la oferta definida para el periodo.

Comuniquen esta condición en piso y refléjenla en la cotización de financiamiento. Cualquier diferencia contra el forecast de la financiera se revisará antes de la liberación del pago.

Saludos,
Centro de Incentivos KIA`
}

// Totales del comparativo.
export function ofForecastTotales() {
  let kia = 0, inbursa = 0, enContra = 0, montoEnContra = 0
  ofForecastInbursa.forEach(f => {
    const d = ofDiferencia(f)
    kia += f.kia
    inbursa += f.inbursa
    if (d.enContra) { enContra += 1; montoEnContra += d.diferencia }
  })
  return { kia, inbursa, diferencia: kia - inbursa, enContra, montoEnContra, dealers: ofForecastInbursa.length }
}

// ============================================================
//  ETAPA 1 · PASO 1 · CONSTRUCTOR DE OFERTA (Opening Fee)
//  El monto financiado se calcula con precio, enganche, accesorios
//  y localizador opcional. El enganche se valida contra el mínimo
//  de Inbursa del baremo seleccionado. El incentivo = base de
//  subsidio × factor de retención × share KMX. Los shares KMX y
//  dealer se toman del PDF comercial de Inbursa.
// ============================================================
export const OF_PRESUPUESTO = 1850000
export const OF_EJECUTADO = 640000

// Shares de pago del incentivo (origen: PDF comercial de Inbursa).
export const OF_KMX_SHARE = 0.60
export const OF_DEALER_SHARE = 0.40

// Baremos de Inbursa: plazo, tasa, enganche mínimo, retención y % de subsidio.
export const ofBaremos = [
  { id: 'A', nombre: 'Baremo A', plazo: 24, tasa: 9.9,  minEnganchePct: 0.30, retencion: 0.92, subsidioPct: 0.028 },
  { id: 'B', nombre: 'Baremo B', plazo: 36, tasa: 11.5, minEnganchePct: 0.25, retencion: 0.86, subsidioPct: 0.034 },
  { id: 'C', nombre: 'Baremo C', plazo: 48, tasa: 12.9, minEnganchePct: 0.20, retencion: 0.80, subsidioPct: 0.040 },
  { id: 'D', nombre: 'Baremo D', plazo: 60, tasa: 13.9, minEnganchePct: 0.15, retencion: 0.74, subsidioPct: 0.045 }
]

// Precios de referencia por modelo (precio del vehículo).
export const ofModelosPrecio = [
  { modelo: 'Sonet', precio: 389000 },
  { modelo: 'K3', precio: 392000 },
  { modelo: 'Seltos', precio: 468000 },
  { modelo: 'Sportage', precio: 545000 },
  { modelo: 'Sportage Híbrida', precio: 612000 },
  { modelo: 'Sorento', precio: 798000 }
]

// ---- Paso 1 (Opening Fee) · comisión por apertura por VIN ----
//  La comisión se calcula con el monto financiado y la Oferta
//  Comercial en SAP; el aporte de KMX = comisión × KMX share.
//  Validaciones SAP: no pagar doble el mismo VIN, validar contra el
//  Inbursa Requested Payment y validar el KMX Share.
export const OF_COMISION_PCT = 0.02   // % comisión por apertura (Oferta Comercial · SAP)

// VINs con monto financiado desde SAP.
// flags: duplicado (ya pagado), shareMismatch (KMX Share no coincide con el PDF).
export const ofOfertaVins = [
  { vin: '3KPA24AD1PE530041', dealer: 'KIA Santa Fe',      modelo: 'Sportage', financiado: 545000, inbursaPago: 6540, duplicado: false, shareMismatch: false },
  { vin: 'KNAD5813XP6531207', dealer: 'KIA Valle Oriente', modelo: 'Sonet',    financiado: 362000, inbursaPago: 4300, duplicado: false, shareMismatch: false },
  { vin: '3KPC24AD7PE097820', dealer: 'KIA Patria',        modelo: 'K3',       financiado: 396000, inbursaPago: 5200, duplicado: false, shareMismatch: false },
  { vin: 'KNADE163BP7743901', dealer: 'KIA Querétaro',     modelo: 'Seltos',   financiado: 472000, inbursaPago: 5664, duplicado: false, shareMismatch: false },
  { vin: '3KPA24AD9PE530515', dealer: 'KIA Tijuana',       modelo: 'Sportage', financiado: 541000, inbursaPago: 6492, duplicado: true,  shareMismatch: false },
  { vin: 'KNAD5813XP6531440', dealer: 'KIA Mérida',        modelo: 'Sonet',    financiado: 354000, inbursaPago: 4248, duplicado: false, shareMismatch: false },
  { vin: '3KPC24AD7PE097955', dealer: 'KIA Culiacán',      modelo: 'K3',       financiado: 392000, inbursaPago: 5100, duplicado: false, shareMismatch: true  },
  { vin: 'KNADE163BP7744120', dealer: 'KIA Cancún',        modelo: 'Seltos',   financiado: 468000, inbursaPago: 5616, duplicado: false, shareMismatch: false },
  { vin: '3KPA24AD1PE530688', dealer: 'KIA Interlomas',    modelo: 'Sportage', financiado: 545000, inbursaPago: 6100, duplicado: false, shareMismatch: false },
  { vin: 'KNAD5813XP6531662', dealer: 'KIA Chihuahua',     modelo: 'Sonet',    financiado: 358000, inbursaPago: 4296, duplicado: false, shareMismatch: false }
]

export function ofCalcOfertaVin(v, comisionPct, kmxShare) {
  const comision = Math.round(v.financiado * comisionPct)
  const aporteKmx = Math.round(comision * kmxShare)
  const delta = aporteKmx - v.inbursaPago
  let estatus = 'ok'
  if (v.duplicado) estatus = 'duplicado'
  else if (v.shareMismatch) estatus = 'share'
  else if (Math.abs(delta) > Math.max(300, v.inbursaPago * 0.08)) estatus = 'diferencia'
  const pagable = !v.duplicado && !v.shareMismatch
  return { comision, aporteKmx, delta, estatus, pagable, pagoFinal: pagable ? aporteKmx : 0 }
}

export function ofOfertaTotales(comisionPct, kmxShare) {
  let financiado = 0, comision = 0, aporteKmx = 0, inbursa = 0, aPagar = 0, duplicados = 0, shares = 0, diferencias = 0
  ofOfertaVins.forEach(v => {
    const c = ofCalcOfertaVin(v, comisionPct, kmxShare)
    financiado += v.financiado
    comision += c.comision
    aporteKmx += c.aporteKmx
    inbursa += v.inbursaPago
    aPagar += c.pagoFinal
    if (c.estatus === 'duplicado') duplicados += 1
    if (c.estatus === 'share') shares += 1
    if (c.estatus === 'diferencia') diferencias += 1
  })
  return { vins: ofOfertaVins.length, financiado, comision, aporteKmx, inbursa, aPagar, duplicados, shares, diferencias }
}

// Cálculo de la oferta a partir de los insumos de la operación.
export function ofCalcOferta({ precio, enganche, accesorios, localizador, baremo }) {
  const financiado = Math.max(0, precio + accesorios + localizador - enganche)
  const engancheMin = Math.round(precio * baremo.minEnganchePct)
  const engancheOk = enganche >= engancheMin
  const subsidioBase = Math.round(financiado * baremo.subsidioPct)
  const subsidioNeto = Math.round(subsidioBase * baremo.retencion)
  const incentivoKmx = Math.round(subsidioNeto * OF_KMX_SHARE)
  const pagoDealer = Math.round(subsidioNeto * OF_DEALER_SHARE)
  return { financiado, engancheMin, engancheOk, subsidioBase, subsidioNeto, incentivoKmx, pagoDealer }
}

export const ofPilares = [
  {
    id: 'penetracion', nombre: 'Penetración de Financiamiento', icon: 'Percent', tone: 'red',
    desc: 'Colocación de unidades con crédito contratado.',
    variables: [
      { id: 'p_credito', nombre: 'Contratos con crédito', desc: 'Unidades vendidas con financiamiento contratado', meta: '65%', peso: 24, bolsa: 480000 },
      { id: 'p_marca', nombre: 'Financiamiento marca propia', desc: 'Penetración de KIA Finance sobre lo colocado', meta: '40%', peso: 14, bolsa: 300000 },
      { id: 'p_modelos', nombre: 'Modelos en financiamiento', desc: 'Modelos que aplican a la comisión por apertura', meta: 'Lineup', peso: 12, bolsa: 220000 }
    ]
  },
  {
    id: 'comision', nombre: 'Estructura de Comisión', icon: 'Sliders', tone: 'ink',
    desc: 'Cómo se absorbe o reembolsa la comisión por apertura.',
    variables: [
      { id: 'c_absorbe', nombre: 'Comisión absorbida', desc: 'Comisión por apertura absorbida por la financiera', meta: '100%', peso: 20, bolsa: 360000 },
      { id: 'c_reembolso', nombre: 'Reembolso al cliente', desc: 'Reembolso de la comisión emitido al cliente', meta: '≤ 30 d', peso: 13, bolsa: 240000 },
      { id: 'c_share', nombre: 'Share de la financiera', desc: 'Participación de la financiera sobre la comisión', meta: '50%', peso: 8, bolsa: 150000 }
    ]
  },
  {
    id: 'experiencia', nombre: 'Experiencia de Financiamiento', icon: 'Star', tone: 'blue',
    desc: 'Calidad del proceso de crédito para el cliente.',
    variables: [
      { id: 'e_tiempo', nombre: 'Tiempo de aprobación', desc: 'Tiempo de respuesta de la financiera al cliente', meta: '≤ 24 h', peso: 16, bolsa: 180000 },
      { id: 'e_csi', nombre: 'CSI de financiamiento', desc: 'Satisfacción del cliente en el proceso de crédito', meta: '≥ 90 pts', peso: 15, bolsa: 140000 },
      { id: 'e_retencion', nombre: 'Retención de cartera', desc: 'Clientes que renuevan o recompran con crédito', meta: '≥ 60%', peso: 6, bolsa: 90000 }
    ]
  }
]

// Selección inicial (sus pesos suman 100%).
export const ofActivosDefault = ['p_credito', 'p_modelos', 'c_absorbe', 'c_reembolso', 'e_tiempo', 'e_csi']

// Lineup KIA que aplica a la comisión por apertura.
export const OF_MODELOS_KIA = ['Sonet', 'Seltos', 'Sportage', 'Sportage Híbrida', 'Sorento', 'K3', 'K4', 'Carnival', 'Telluride']
export const ofModelosDefault = ['Sonet', 'Seltos', 'Sportage', 'K3', 'K4']

// ============================================================
//  ETAPA 1 · PASO 2 · FORECAST POR DEALER  (KIA BRAIN)
//  Estima, por dealer y modelo, cuántas unidades se financiarán
//  y cumplirán la meta de crédito del periodo.
// ============================================================
export const OF_UMBRAL_META = 65

// [ nombre, zona, base (u financiadas/periodo), tendencia ]
const OF_DEALERS_BASE = [
  ['KIA Santa Fe', 'Centro', 172, 'up'],
  ['KIA Polanco', 'Centro', 158, 'flat'],
  ['KIA Interlomas', 'Metropolitana', 150, 'up'],
  ['KIA Satélite', 'Metropolitana', 128, 'flat'],
  ['KIA Valle Oriente', 'Norte', 162, 'up'],
  ['KIA Sendero', 'Norte', 138, 'down'],
  ['KIA Chihuahua', 'Norte', 116, 'flat'],
  ['KIA Patria', 'Occidente', 156, 'up'],
  ['Dalton KIA Country', 'Occidente', 140, 'flat'],
  ['KIA Puerto Vallarta', 'Occidente', 98, 'up'],
  ['KIA Tijuana', 'Noroeste', 144, 'up'],
  ['KIA Culiacán', 'Noroeste', 130, 'flat'],
  ['KIA Hermosillo', 'Noroeste', 108, 'down'],
  ['KIA Querétaro', 'Bajío', 146, 'up'],
  ['KIA Bajío', 'Bajío', 134, 'flat'],
  ['KIA San Luis Potosí', 'Bajío', 104, 'up'],
  ['KIA Angelópolis', 'Sur', 126, 'down'],
  ['KIA Cuernavaca', 'Sur', 112, 'flat'],
  ['KIA Veracruz', 'Sureste', 132, 'up'],
  ['KIA Mérida', 'Sureste', 124, 'up'],
  ['KIA Cancún', 'Sureste', 140, 'flat'],
  ['KIA Villahermosa', 'Sureste', 96, 'down']
]

const OF_MODELOS_FC = ['Sportage', 'Sonet', 'K3', 'Seltos']
const OF_RATIOS_FC = [0.28, 0.31, 0.22, 0.19]

function ofGenModelos(base, tend, idx) {
  const tf = tend === 'up' ? 1.11 : tend === 'down' ? 0.90 : 1.0
  return OF_MODELOS_FC.map((modelo, i) => {
    const meta = Math.max(8, Math.round(base * OF_RATIOS_FC[i]))
    const jit1 = ((idx * 17 + i * 5) % 3) - 1
    const estimado = Math.max(0, Math.round(meta * tf) + jit1)
    const ratio = estimado / meta
    const jit2 = ((idx * 29 + i * 19) % 13) - 6
    const prob = Math.max(40, Math.min(98, Math.round(64 + (ratio - 1) * 210 + jit2)))
    return { modelo, meta, estimado, prob }
  })
}

function ofRazon(tend, hist, est, meta, prob) {
  if (tend === 'up') return `Financia ${hist} u/periodo con originación al alza; junio suma +11% por cierre de tasa, así que estimo ${est} contratos y ${prob}% de superar las ${meta} de meta.`
  if (tend === 'down') return `La contratación de crédito viene a la baja y menor mezcla financiable arrastra el pronóstico a ${est} unidades, ${prob}% de alcanzar las ${meta} de meta.`
  return `Originación estable en ${hist} u sin cambio de tasa; el pronóstico queda en ${est} unidades, ${prob}% de alcanzar las ${meta} de meta.`
}

export const ofForecast = OF_DEALERS_BASE.map(([dealer, zona, base, tend], idx) => {
  const modelos = ofGenModelos(base, tend, idx)
  const meta = modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = modelos.reduce((a, m) => a + m.estimado, 0)
  const prob = Math.round(modelos.reduce((a, m) => a + m.prob, 0) / modelos.length)
  const hist = Math.round(base * (0.96 + ((idx % 4) * 0.018)))
  const confianza = 79 + ((idx * 9) % 17)
  return { dealer, zona, hist, tendencia: tend, confianza, razon: ofRazon(tend, hist, estimado, meta, prob), modelos }
})

export const ofBrainMetodologia = [
  'Tomé 24 meses de originación de crédito por dealer y modelo desde el core de la financiera + VQM.',
  'Ajusté por estacionalidad de financiamiento: junio concentra +11% de contratos por cierre de tasa.',
  'Ponderé la penetración de crédito de los últimos 6 meses al doble que los meses previos.',
  'Descarté 3 campañas de tasa especial de 2024 que inflaban la originación puntual.',
  'Estimé la probabilidad de meta con una regresión sobre la contratación histórica de crédito.'
]

export function ofForecastDealer(d) {
  const meta = d.modelos.reduce((a, m) => a + m.meta, 0)
  const estimado = d.modelos.reduce((a, m) => a + m.estimado, 0)
  const paresMeta = d.modelos.filter(m => m.prob >= OF_UMBRAL_META).length
  const prob = Math.round(d.modelos.reduce((a, m) => a + m.prob, 0) / d.modelos.length)
  return { meta, estimado, prob, paresMeta, pares: d.modelos.length, enMeta: prob >= OF_UMBRAL_META }
}

export function ofForecastResumen() {
  let meta = 0, estimado = 0, pares = 0, paresMeta = 0, dealersMeta = 0, conf = 0
  for (const d of ofForecast) {
    const r = ofForecastDealer(d)
    meta += r.meta; estimado += r.estimado; pares += r.pares; paresMeta += r.paresMeta
    if (r.enMeta) dealersMeta += 1
    conf += d.confianza
  }
  return {
    meta, estimado, pares, paresMeta,
    dealers: ofForecast.length, dealersMeta,
    confianza: Math.round(conf / ofForecast.length),
    delta: estimado - meta
  }
}

// ============================================================
//  ETAPA 2 · VALIDACIÓN DE VIN (Opening Fee)
//  De cada factura se extrae el VIN y se cruza contra el contrato
//  de crédito y la oferta. Los válidos generan el reembolso de la
//  comisión por apertura; los que no, se rechazan con motivo.
// ============================================================
export const OF_VIN_TOTAL = 126

// Comisión por apertura reembolsada por unidad, según modelo.
const OF_COMISION_MODELO = { Sportage: 9000, Sonet: 5000, K3: 5500, Seltos: 7000 }

const OF_VIN_MOTIVOS = [
  'Contrato sin comisión por apertura',
  'Crédito no originado en el periodo',
  'Financiera no participante',
  'VIN sin contrato de crédito',
  'Comisión ya reembolsada',
  'Información incompleta',
  'CFDI del reembolso inválido',
  'Modalidad fuera de la oferta',
  'Monto de comisión por debajo del mínimo'
]

// Cola larga de motivos por rechazo (índices refieren a OF_VIN_MOTIVOS).
const OF_REJECT_SEQ = [3, 5, 0, 3, 1, 5, 3, 2, 0, 5, 3, 6, 3, 0, 1, 4, 3, 8, 5, 7, 3]

const OF_VIN_DEALERS = [
  'KIA Santa Fe', 'KIA Valle Oriente', 'KIA Patria', 'KIA Querétaro',
  'KIA Tijuana', 'KIA Veracruz', 'KIA Interlomas', 'KIA Culiacán',
  'KIA Mérida', 'KIA Cancún', 'KIA San Luis Potosí', 'KIA Chihuahua'
]
const OF_VIN_MODELOS = ['Sportage', 'Sonet', 'K3', 'Seltos']
const OF_VIN_PREFIX = { Sportage: '3KPA', Sonet: 'KNAD5', K3: '3KPC2', Seltos: 'KNADE' }
const OF_VIN_BASE = { Sportage: 545000, Sonet: 358000, K3: 392000, Seltos: 468000 }
const OF_VIN_ALPH = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'

function ofVinStr(modelo, i) {
  let s = OF_VIN_PREFIX[modelo]
  let x = ((i + 3) * 2246822519) % 2147483647
  while (s.length < 17) {
    x = (x * 40503) % 2147483647
    s += OF_VIN_ALPH[x % OF_VIN_ALPH.length]
  }
  return s.slice(0, 17)
}

export const ofVins = Array.from({ length: OF_VIN_TOTAL }, (_, i) => {
  const dealer = OF_VIN_DEALERS[i % OF_VIN_DEALERS.length]
  const modelo = OF_VIN_MODELOS[(i * 2 + 1) % OF_VIN_MODELOS.length]
  const montoFactura = OF_VIN_BASE[modelo] + (((i * 5) % 11) - 5) * 4000
  const rechazado = i % 6 === 3 // ~21 rechazos repartidos entre los 12 dealers
  const ord = rechazado ? (i - 3) / 6 : -1
  const motivo = rechazado ? OF_VIN_MOTIVOS[OF_REJECT_SEQ[ord]] : null
  return {
    vin: ofVinStr(modelo, i),
    folio: `OF-${(5200 + i).toString()}`,
    dealer, modelo, montoFactura,
    bono: OF_COMISION_MODELO[modelo],
    estatus: rechazado ? 'rechazado' : 'ok',
    motivo
  }
})

export function ofVinResumen() {
  const ok = ofVins.filter(v => v.estatus === 'ok')
  const rech = ofVins.filter(v => v.estatus === 'rechazado')
  const pago = ok.reduce((a, v) => a + v.bono, 0)
  const facturado = ofVins.reduce((a, v) => a + v.montoFactura, 0)
  return {
    total: ofVins.length, ok: ok.length, rech: rech.length,
    pago, facturado, pctOk: Math.round((ok.length / ofVins.length) * 100)
  }
}

export function ofVinMotivos() {
  const acc = {}
  for (const v of ofVins) if (v.estatus === 'rechazado') acc[v.motivo] = (acc[v.motivo] || 0) + 1
  return Object.entries(acc).map(([motivo, n]) => ({ motivo, n })).sort((a, b) => b.n - a.n)
}

export function ofVinRechazosPorDealer() {
  const acc = {}
  for (const v of ofVins) if (v.estatus === 'rechazado') {
    if (!acc[v.dealer]) acc[v.dealer] = { dealer: v.dealer, vins: [] }
    acc[v.dealer].vins.push(v)
  }
  return Object.values(acc).sort((a, b) => b.vins.length - a.vins.length)
}

function ofHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000
  return h
}

export function ofDealerCompliance() {
  const acc = {}
  for (const v of ofVins) {
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
    const h = ofHash(d.dealer)
    const tasaHist = Math.max(0.02, Math.min(0.42, (h % 18) / 100 + 0.05))
    const tendencia = tasaActual > tasaHist + 0.02 ? 'up' : tasaActual < tasaHist - 0.02 ? 'down' : 'flat'
    const reincidencia = 28 + (h % 42)
    const motivoTop = Object.entries(d.motivos).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    return { ...d, tasaActual, tasaHist, tendencia, reincidencia, motivoTop }
  }).sort((a, b) => b.tasaActual - a.tasaActual || b.rech - a.rech)
}

export const OF_BRAIN_RECHAZOS_METODO = [
  'Crucé los VIN rechazados del periodo contra 12 meses de reembolsos previos por dealer.',
  'Calculé la tasa de rechazo histórica de comisión y la comparé con la del periodo para la tendencia.',
  'Identifiqué reincidencia: rechazos por un motivo de crédito que el dealer ya había presentado.',
  'Detecté comisiones ya reembolsadas cruzando el catálogo histórico de contratos incentivados.',
  'Ordené a los dealers por severidad de incumplimiento para priorizar el seguimiento con la financiera.'
]
