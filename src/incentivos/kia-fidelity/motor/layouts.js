// ============================================================
//  KIA FIDELITY · Lectura de los archivos del mes
//  Recibe libros ya leídos { [hoja]: { headers, rows } } y
//  devuelve registros tipados + errores/avisos de estructura.
// ============================================================

import { texto, numero, fecha, buscarHoja, llave } from '../../margen-variable/motor/layouts.js'

export const ARCHIVOS_FIDELITY = Object.freeze({
  contratos: { titulo: 'Contratos Fidelity', desc: 'Hojas CONTRATOS (un renglón por crédito) y CHARGE (totales del reclamo)', obligatorio: true },
  calculadora: { titulo: 'Intereses CRM (calculadora)', desc: 'Una columna por Dossier: parámetros e intereses mes a mes', obligatorio: true },
  sap: { titulo: 'SAP Fidelity', desc: 'Versión, dealer, razón social, Retail Date, Reg.Type Desc y Billing Date por VIN', obligatorio: true },
  catalogo: { titulo: 'Catálogo tasa beneficio', desc: 'Beneficio KMX por modelo y versión, con vigencia', obligatorio: true },
  pagados: { titulo: 'VINS pagados y compatibilidad', desc: 'Historial de incentivos pagados por VIN y matriz COMPAT', obligatorio: true },
  casos: { titulo: 'Casos de prueba (opcional)', desc: 'Clave de respuestas para la prueba de aceptación', obligatorio: false }
})

const norm = (s) => llave(s).replace(/\s+/g, '')
const filaVacia = (r) => !r || r.every(v => v === null || v === undefined || texto(v) === '')
export const normalizarVin = (v) => texto(v).toUpperCase().replace(/\s+/g, '')
export const normalizarDossier = (v) => {
  const n = numero(v)
  return n !== null && Number.isInteger(n) ? String(n) : texto(v)
}

/** Índice de la n-ésima columna con ese encabezado (para encabezados repetidos). */
function columna(headers, nombre, ocurrencia = 0) {
  const k = norm(nombre)
  let vistas = 0
  for (let i = 0; i < headers.length; i += 1) {
    if (norm(headers[i]) !== k) continue
    if (vistas === ocurrencia) return i
    vistas += 1
  }
  return -1
}

function lector(headers, requeridas) {
  const faltantes = requeridas.filter(([n, o = 0]) => columna(headers, n, o) === -1).map(([n]) => n)
  const get = (r, nombre, ocurrencia = 0) => {
    const i = columna(headers, nombre, ocurrencia)
    return i === -1 ? null : r[i]
  }
  return { faltantes, get }
}

const aFecha = (v) => fecha(v)

// ---------------------------------------------------------------------------

export function normalizarContratos(libro) {
  const errores = []
  const avisos = []
  const hoja = buscarHoja(libro, 'CONTRATOS')
  if (!hoja) return { contratos: [], totales: null, errores: ['El archivo de contratos no tiene la hoja CONTRATOS.'], avisos }
  const { headers, rows } = libro[hoja]
  const { faltantes, get } = lector(headers, [['Dossier'], ['Num_Serie'], ['Tasa'], ['Plazo'], ['Mto_Fin'], ['Charge'], ['Fecha_Pago']])
  if (faltantes.length) return { contratos: [], totales: null, errores: [`CONTRATOS: faltan columnas ${faltantes.join(', ')}`], avisos }
  // Hay dos columnas T_Seguro: la 1ª es el tipo de la financiera, la 2ª (junto a Modality) indica Contado / Financiado / Externa.
  const hayDosTSeguro = columna(headers, 'T_Seguro', 1) !== -1

  const contratos = rows.map((r, i) => ({ r, fila: i + 2 })).filter(({ r }) => !filaVacia(r) && texto(get(r, 'Dossier'))).map(({ r, fila }) => ({
    fila,
    dossier: normalizarDossier(get(r, 'Dossier')),
    vin: normalizarVin(get(r, 'Num_Serie')),
    tasa: numero(get(r, 'Tasa')),
    plazo: numero(get(r, 'Plazo')),
    precio: numero(get(r, 'Precio')) ?? 0,
    enganche: numero(get(r, 'Enganche')) ?? 0,
    accesorios: numero(get(r, 'Imp_Otros_Accesorios')) ?? 0,
    gap: numero(get(r, 'Importe_GAP')) ?? 0,
    planGap: texto(get(r, 'Plan_GAP')),
    mtoFinSinSeguro: numero(get(r, 'Mto_Fin_cSeg')),
    seguroFinanciado: numero(get(r, 'Mto_seg_Fin')) ?? 0,
    monto: numero(get(r, 'Mto_Fin')),
    modelo: texto(get(r, 'Modelo')).toUpperCase(),
    version: texto(get(r, 'Tipo_Auto')).toUpperCase(),
    anioModelo: texto(get(r, 'Año')),
    dealer: texto(get(r, 'Nombre_PV')),
    grupo: texto(get(r, 'Grupo')),
    mesAnio: texto(get(r, 'Mes_Año')),
    fechaPago: aFecha(get(r, 'Fecha_Pago')),
    fechaAprobacion: aFecha(get(r, 'F_Aprobación')),
    tipoSeguroFinanciera: texto(get(r, 'T_Seguro', 0)),
    tipoSeguro: texto(get(r, 'T_Seguro', hayDosTSeguro ? 1 : 0)),
    pagadaPor: texto(get(r, 'Pagada_por')),
    aseguradora: texto(get(r, 'Aseguradora')),
    modalidad: texto(get(r, 'Modality')),
    realReclamado: numero(get(r, 'Real Amortization', 0)),
    teoricoReclamado: numero(get(r, 'Theoretical Amotization', 0)),
    chargeReclamado: numero(get(r, 'Charge', 0)) ?? 0
  }))
  if (!hayDosTSeguro) avisos.push('CONTRATOS trae una sola columna T_Seguro; se usa para detectar seguro Externa.')

  let totales = null
  const hojaCharge = buscarHoja(libro, 'CHARGE')
  if (hojaCharge) {
    const { headers: h, rows: rs } = libro[hojaCharge]
    const pares = [h, ...rs].filter(x => x && texto(x[0]))
    const valor = (etq) => numero(pares.find(x => norm(x[0]) === norm(etq))?.[1])
    totales = { contratos: valor('Nb'), real: valor('Real Amortization'), teorico: valor('Theoretical Amotization'), charge: valor('Charge') }
  } else {
    errores.push('El archivo de contratos no tiene la hoja CHARGE con los totales del reclamo.')
  }
  return { contratos, totales, errores, avisos }
}

// ---------------------------------------------------------------------------

const ETIQUETAS_CALC = {
  vin: 'VIN', plazo: 'Plazo', tasaReal: 'Tasa real %', beneficio: 'Beneficio KMX %', tasaTeorica: 'Tasa teórica %',
  monto: 'Monto financiado', seguroAnio1: 'Seguro año 1', seguroAnios2a5: 'Seguro años 2-5 (anual)',
  totalReal: 'Total intereses real (AC)', totalTeorico: 'Total intereses teórico', charge: 'Charge'
}

export function normalizarCalculadora(libro) {
  const errores = []
  const hoja = buscarHoja(libro, 'Calculadora')
  if (!hoja) return { calculos: [], errores: ['La calculadora no tiene hojas.'], avisos: [] }
  const { headers, rows } = libro[hoja]
  if (norm(headers[0]) !== norm('Dossier')) return { calculos: [], errores: ['La calculadora debe tener "Dossier" en A1 y un Dossier por columna.'], avisos: [] }
  const filaDe = new Map(rows.map((r, i) => [norm(r[0]), i]))
  const faltan = Object.values(ETIQUETAS_CALC).filter(e => !filaDe.has(norm(e)))
  if (faltan.length) errores.push(`Calculadora: faltan filas ${faltan.join(', ')}`)
  const filasMes = (tipo) => rows.map((r, i) => ({ etq: texto(r[0]).toLowerCase(), i }))
    .filter(x => x.etq.startsWith('mes ') && x.etq.includes(`interés ${tipo}`))
    .map(x => x.i)
  const realIdx = filasMes('real')
  const teoIdx = filasMes('teórico')

  const calculos = []
  for (let j = 1; j < headers.length; j += 1) {
    const dossier = normalizarDossier(headers[j])
    if (!dossier) continue
    const val = (k) => {
      const i = filaDe.get(norm(ETIQUETAS_CALC[k]))
      return i === undefined ? null : rows[i][j]
    }
    const serie = (idx) => idx.map(i => numero(rows[i][j])).filter(x => x !== null)
    calculos.push({
      columna: j + 1,
      dossier,
      vin: normalizarVin(val('vin')),
      ...Object.fromEntries(['plazo', 'tasaReal', 'beneficio', 'tasaTeorica', 'monto', 'seguroAnio1', 'seguroAnios2a5', 'totalReal', 'totalTeorico', 'charge'].map(k => [k, numero(val(k))])),
      interesesReal: serie(realIdx),
      interesesTeorico: serie(teoIdx)
    })
  }
  return { calculos, errores, avisos: [] }
}

// ---------------------------------------------------------------------------

export function normalizarSap(libro) {
  const hoja = buscarHoja(libro, 'Data') ?? buscarHoja(libro, null)
  if (!hoja) return { sap: [], errores: ['El archivo SAP no tiene hojas.'], avisos: [] }
  const { headers, rows } = libro[hoja]
  const { faltantes, get } = lector(headers, [['VIN'], ['Retail Date'], ['Reg.Type Desc'], ['Billing Date']])
  if (faltantes.length) return { sap: [], errores: [`SAP: faltan columnas ${faltantes.join(', ')}`], avisos: [] }
  const sap = rows.map((r, i) => ({ r, fila: i + 2 })).filter(({ r }) => !filaVacia(r) && texto(get(r, 'VIN'))).map(({ r, fila }) => ({
    fila,
    vin: normalizarVin(get(r, 'VIN')),
    version: texto(get(r, 'Version') ?? get(r, 'LSC Description(ES)')).toUpperCase(),
    modelo: texto(get(r, 'Local Model Text')).toUpperCase(),
    anioModelo: texto(get(r, 'Model Year')),
    fechaRetail: aFecha(get(r, 'Retail Date')),
    regTypeDesc: texto(get(r, 'Reg.Type Desc')),
    usoTexto: texto(get(r, 'V.USG Text')),
    dealerCodigo: texto(get(r, 'Sold Dealer Code(SSI)')),
    dealer: texto(get(r, 'Sold Dealer Name(SSI)')),
    razonSocial: texto(get(r, 'Dealer Name')),
    fechaBilling: aFecha(get(r, 'Billing Date'))
  }))
  return { sap, errores: [], avisos: [] }
}

// ---------------------------------------------------------------------------

export function normalizarCatalogo(libro) {
  const hoja = buscarHoja(libro, 'CATALOGO_BENEFICIO') ?? buscarHoja(libro, null)
  const { headers, rows } = libro[hoja]
  const { faltantes, get } = lector(headers, [['Versión'], ['Beneficio KMX (puntos de tasa)']])
  if (faltantes.length) return { catalogo: [], errores: [`Catálogo: faltan columnas ${faltantes.join(', ')}`], avisos: [] }
  const catalogo = rows.filter(r => !filaVacia(r)).map((r, i) => {
    const b = numero(get(r, 'Beneficio KMX (puntos de tasa)'))
    return {
      fila: i + 2,
      modelo: texto(get(r, 'Modelo')).toUpperCase(),
      version: texto(get(r, 'Versión')).toUpperCase(),
      anioModelo: texto(get(r, 'Model Year')),
      // El catálogo trae 0.01 = 1 punto de tasa; la calculadora usa 1 (%).
      beneficioPct: b === null ? null : (b < 0.5 ? b * 100 : b),
      desde: aFecha(get(r, 'Vigencia desde')),
      hasta: aFecha(get(r, 'Vigencia hasta'))
    }
  })
  return { catalogo, errores: [], avisos: [] }
}

// ---------------------------------------------------------------------------

export function normalizarPagados(libro) {
  const errores = []
  const hp = buscarHoja(libro, 'VINS_PAGADOS')
  const hc = buscarHoja(libro, 'COMPAT')
  let pagos = []
  let compat = []
  if (!hp) errores.push('Falta la hoja VINS_PAGADOS.')
  else {
    const { headers, rows } = libro[hp]
    const { get } = lector(headers, [])
    pagos = rows.filter(r => !filaVacia(r)).map((r, i) => ({
      fila: i + 2,
      vin: normalizarVin(get(r, 'VIN normalizado') ?? get(r, 'Vehicle ID')),
      programa: texto(get(r, 'Program')),
      codigo: texto(get(r, 'Código (2 letras)') ?? texto(get(r, 'Incentive Program Type')).slice(0, 2)).toUpperCase(),
      periodo: texto(get(r, 'Periodo pago (AAAAMM)')) || `${texto(get(r, 'Year'))}${String(texto(get(r, 'Month'))).padStart(2, '0')}`,
      monto: numero(get(r, 'Monto redondeado')) ?? numero(get(r, 'Incentive Amount')) ?? 0,
      original: { year: get(r, 'Year'), month: get(r, 'Month'), tipo: texto(get(r, 'Incentive Program Type')), incompatibles: texto(get(r, 'Reclamos incompatibles con este pago')) }
    }))
  }
  if (!hc) errores.push('Falta la hoja COMPAT con la matriz de compatibilidad.')
  else {
    const { rows } = libro[hc]
    compat = rows.filter(r => !filaVacia(r) && texto(r[0]) && texto(r[2])).map(r => ({
      pagado: texto(r[0]).toUpperCase(), descPagado: texto(r[1]), reclamado: texto(r[2]).toUpperCase(), descReclamado: texto(r[3]),
      permitido: numero(r[4]) === 1
    }))
  }
  return { pagos, compat, errores, avisos: [] }
}

// ---------------------------------------------------------------------------

export function normalizarCasos(libro) {
  const hoja = buscarHoja(libro, 'Casos plantados') ?? buscarHoja(libro, null)
  const { headers, rows } = libro[hoja]
  const { faltantes, get } = lector(headers, [['Dossier'], ['Caso plantado']])
  if (faltantes.length) return { casos: [], errores: [`Casos: faltan columnas ${faltantes.join(', ')}`], avisos: [] }
  const casos = rows.filter(r => !filaVacia(r)).map(r => ({
    dossier: normalizarDossier(get(r, 'Dossier')), vin: normalizarVin(get(r, 'VIN')), caso: texto(get(r, 'Caso plantado')), esperado: texto(get(r, 'Resultado esperado'))
  }))
  return { casos, errores: [], avisos: [] }
}
