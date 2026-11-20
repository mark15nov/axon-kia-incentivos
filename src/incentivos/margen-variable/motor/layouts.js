// ============================================================
//  MARGEN VARIABLE · Layouts de carga mensual
//  Define las hojas/columnas esperadas de cada Excel y convierte
//  las filas crudas (ya leídas del .xlsx) en registros tipados.
//  No depende de ninguna librería de Excel: recibe
//    { [nombreHoja]: { headers: string[], rows: unknown[][] } }
// ============================================================

import { USO, CATEGORIA_MOU } from './parametros.js'

export const LAYOUT_VENTAS = Object.freeze({
  id: 'ventas',
  nombre: 'Layout Carga Ventas',
  hoja: null, // primera hoja del libro (en el layout se llama "Data")
  columnas: ['VIN', 'Model', 'LSC Description(ES)', 'Dealer', 'Dealer Name', 'Customer Name 2', 'Ship-to',
    'Ship-to Name', 'Sold Dealer Name(SSI)', 'Model Year', 'Retail Date', 'Reg.Type', 'Reg.Type Desc',
    'Vehicle Usage', 'V.USG Text', 'DSM', 'Local Model Text', 'Version'],
  requeridas: ['VIN', 'Sold Dealer Name(SSI)', 'Retail Date', 'V.USG Text', 'Local Model Text']
})

export const LAYOUT_MV = Object.freeze({
  id: 'mv',
  nombre: 'Layout Carga MV',
  hojas: Object.freeze({
    provision: { clave: 'LY_PROVISION_VIN', columnas: ['PERIODO', 'VIN', 'MONTO_PROVISION'] },
    mos: { clave: 'LY_MOS_DEALER', columnas: ['PERIODO', 'DEALER', 'MOS'] },
    ws: { clave: 'LY_WS_DEALER', columnas: ['PERIODO', 'DEALER', 'WS_PCT'] },
    mou: { clave: 'LY_MOU', columnas: ['ANIO', 'MES', 'DEALER', 'CATEGORIA', 'MODELO', 'MOU_UNIDADES'] },
    dealers: { clave: 'CAT_DEALERS', columnas: ['COD_DEALER', 'DEALER', 'RAZON_SOCIAL', 'GRUPO', 'DSM', 'ESTATUS'] },
    // Opcional: VIN con curtailment (Finanzas los paga en 0). Propuesta de hoja nueva.
    curtailment: { clave: 'LY_CURTAILMENT', columnas: ['VIN', 'PROGRAMA'], opcional: true }
  })
})

// ---------- utilidades de normalización ----------

const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Texto limpio para mostrar. */
export function texto(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && 'richText' in v) return v.richText.map(t => t.text).join('').trim()
  if (typeof v === 'object' && 'result' in v) return texto(v.result)
  return String(v).replace(/\s+/g, ' ').trim()
}

/** Llave de cruce: sin acentos, minúsculas, espacios colapsados. */
export function llave(v) {
  return sinAcentos(texto(v)).toLowerCase()
}

/** Número o null. Acepta "1,234.5", "95%" y celdas de fórmula con resultado. */
export function numero(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'object' && 'result' in v) return numero(v.result)
  const s = texto(v).replace(/[$,\s]/g, '')
  if (!s) return null
  const pct = s.endsWith('%')
  const n = Number(pct ? s.slice(0, -1) : s)
  if (!Number.isFinite(n)) return null
  return pct ? n / 100 : n
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)
const MS_DIA = 86400000

/** Fecha → { anio, mes, dia } (o null). Acepta Date, serial de Excel y texto. */
export function fecha(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null
    return { anio: v.getUTCFullYear(), mes: v.getUTCMonth() + 1, dia: v.getUTCDate() }
  }
  if (typeof v === 'number') return fecha(new Date(EXCEL_EPOCH_UTC + Math.round(v) * MS_DIA))
  const s = texto(v)
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return valida(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (m) return valida(+m[3], +m[2], +m[1])
  return null
}

function valida(anio, mes, dia) {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  return { anio, mes, dia }
}

/** Periodo "YYYYMM" a partir de año/mes. */
export const periodoDe = (anio, mes) => `${anio}${String(mes).padStart(2, '0')}`

/** Normaliza un periodo capturado como 202603, "202603" o "2026-03". */
export function periodo(v) {
  const s = texto(v).replace(/[^0-9]/g, '')
  return /^\d{6}$/.test(s) ? s : null
}

/** Uso del vehículo a partir de V.USG Text (respaldo: Reg.Type 10/11/12). */
export function usoVehiculo(usgText, regType) {
  const t = llave(usgText)
  if (t === 'inventario nuevo') return USO.RETAIL
  if (t.includes('flota')) return USO.FLOTA
  if (t.includes('demo') || t.includes('cortesia')) return USO.DEMO
  const r = texto(regType)
  if (r === '10') return USO.RETAIL
  if (r === '11') return USO.DEMO
  if (r === '12') return USO.FLOTA
  return null
}

/** Familia de modelo (K3 SD / K3 HB → K3). */
export function familiaModelo(v) {
  return texto(v).toUpperCase().replace(/\s+(SD|HB)$/, '')
}

/** Categoría de MOU homologada (retail/RETAIL → Retail, fleet/Flota → Fleet). */
export function categoriaMou(v) {
  const t = llave(v)
  if (t === 'retail') return 'Retail'
  if (t === 'demo') return 'Demo'
  if (t === 'fleet' || t === 'flota') return 'Fleet'
  return texto(v)
}

// ---------- lectura de hojas ----------

/** Busca una hoja por nombre exacto o que contenga la clave (p.ej. "1. LY_PROVISION_VIN"). */
export function buscarHoja(libro, clave) {
  const nombres = Object.keys(libro)
  if (!clave) return nombres.length ? nombres[0] : null
  const k = clave.toLowerCase()
  return nombres.find(n => n.toLowerCase() === k) ?? nombres.find(n => n.toLowerCase().includes(k)) ?? null
}

/** Mapea encabezados → índice de columna (tolerante a mayúsculas/espacios). */
function indiceColumnas(headers, columnas) {
  const norm = headers.map(h => llave(h).replace(/\s+/g, ''))
  const idx = {}
  const faltantes = []
  for (const c of columnas) {
    const i = norm.indexOf(llave(c).replace(/\s+/g, ''))
    if (i === -1) faltantes.push(c)
    else idx[c] = i
  }
  return { idx, faltantes }
}

const filaVacia = (r) => !r || r.every(v => v === null || v === undefined || texto(v) === '')

/**
 * Convierte el libro de ventas en registros.
 * @returns {{ registros: object[], errores: string[], avisos: string[] }}
 */
export function normalizarVentas(libro) {
  const errores = []
  const avisos = []
  const nombreHoja = buscarHoja(libro, LAYOUT_VENTAS.hoja)
  if (!nombreHoja) return { registros: [], errores: ['El archivo de ventas no tiene hojas.'], avisos }
  const { headers, rows } = libro[nombreHoja]
  const { idx, faltantes } = indiceColumnas(headers, LAYOUT_VENTAS.columnas)
  const faltanReq = faltantes.filter(c => LAYOUT_VENTAS.requeridas.includes(c))
  if (faltanReq.length) {
    errores.push(`Faltan columnas obligatorias en ventas: ${faltanReq.join(', ')}`)
    return { registros: [], errores, avisos }
  }
  if (faltantes.length) avisos.push(`Columnas no encontradas en ventas (se dejan vacías): ${faltantes.join(', ')}`)

  const get = (r, c) => (idx[c] === undefined ? null : r[idx[c]])
  const registros = []
  rows.forEach((r, i) => {
    if (filaVacia(r)) return
    const fila = i + 2
    const vin = texto(get(r, 'VIN')).toUpperCase()
    const f = fecha(get(r, 'Retail Date'))
    const uso = usoVehiculo(get(r, 'V.USG Text'), get(r, 'Reg.Type'))
    registros.push({
      fila,
      vin,
      modeloCodigo: texto(get(r, 'Model')),
      lsc: texto(get(r, 'LSC Description(ES)')),
      dealerCodigo: texto(get(r, 'Dealer')),
      dealerRazon: texto(get(r, 'Dealer Name')),
      customerName2: texto(get(r, 'Customer Name 2')),
      shipTo: texto(get(r, 'Ship-to')),
      shipToName: texto(get(r, 'Ship-to Name')),
      dealer: texto(get(r, 'Sold Dealer Name(SSI)')),
      anioModelo: texto(get(r, 'Model Year')),
      fechaRetail: f,
      regType: texto(get(r, 'Reg.Type')),
      regTypeDesc: texto(get(r, 'Reg.Type Desc')),
      usoCodigo: texto(get(r, 'Vehicle Usage')),
      usoTexto: texto(get(r, 'V.USG Text')),
      uso,
      dsm: texto(get(r, 'DSM')),
      modeloLocal: texto(get(r, 'Local Model Text')).toUpperCase(),
      familia: familiaModelo(get(r, 'Local Model Text')),
      version: texto(get(r, 'Version'))
    })
  })
  return { registros, errores, avisos }
}

const LECTORES_MV = {
  provision: (g) => ({ periodo: periodo(g('PERIODO')), vin: texto(g('VIN')).toUpperCase(), monto: numero(g('MONTO_PROVISION')) }),
  mos: (g) => ({ periodo: periodo(g('PERIODO')), dealer: texto(g('DEALER')), mos: numero(g('MOS')) }),
  ws: (g) => ({ periodo: periodo(g('PERIODO')), dealer: texto(g('DEALER')), wsPct: numero(g('WS_PCT')) }),
  mou: (g) => ({
    anio: numero(g('ANIO')), mes: numero(g('MES')), dealer: texto(g('DEALER')),
    categoria: categoriaMou(g('CATEGORIA')), uso: CATEGORIA_MOU[categoriaMou(g('CATEGORIA'))] ?? null,
    modelo: texto(g('MODELO')).toUpperCase(), familia: familiaModelo(g('MODELO')),
    unidades: numero(g('MOU_UNIDADES')) ?? 0
  }),
  dealers: (g) => ({
    codigo: texto(g('COD_DEALER')), dealer: texto(g('DEALER')), razonSocial: texto(g('RAZON_SOCIAL')),
    grupo: texto(g('GRUPO')), dsm: texto(g('DSM')), estatus: texto(g('ESTATUS'))
  }),
  curtailment: (g) => ({ vin: texto(g('VIN')).toUpperCase(), programa: texto(g('PROGRAMA')) })
}

/**
 * Convierte el libro del Layout MV en tablas tipadas.
 * @returns {{ tablas: Record<string, object[]>, errores: string[], avisos: string[] }}
 */
export function normalizarLayoutMV(libro) {
  const errores = []
  const avisos = []
  const tablas = {}
  for (const [id, spec] of Object.entries(LAYOUT_MV.hojas)) {
    const nombreHoja = buscarHoja(libro, spec.clave)
    if (!nombreHoja && spec.opcional) {
      tablas[id] = []
      continue
    }
    if (!nombreHoja) {
      errores.push(`No se encontró la hoja ${spec.clave} en el Layout MV.`)
      tablas[id] = []
      continue
    }
    const { headers, rows } = libro[nombreHoja]
    const { idx, faltantes } = indiceColumnas(headers, spec.columnas)
    if (faltantes.length) {
      errores.push(`Hoja ${nombreHoja}: faltan columnas ${faltantes.join(', ')}`)
      tablas[id] = []
      continue
    }
    tablas[id] = rows
      .map((r, i) => ({ r, fila: i + 2 }))
      .filter(({ r }) => !filaVacia(r))
      .map(({ r, fila }) => ({ fila, ...LECTORES_MV[id](c => r[idx[c]]) }))
  }
  const sinMonto = (tablas.provision ?? []).filter(p => p.monto === null || !p.vin)
  if (sinMonto.length) avisos.push(`${sinMonto.length} filas de provisión sin VIN o sin monto válido (se ignoran).`)
  tablas.provision = (tablas.provision ?? []).filter(p => p.monto !== null && p.vin)
  tablas.curtailment = (tablas.curtailment ?? []).filter(c => c.vin)
  const sinCategoria = (tablas.mou ?? []).filter(m => !m.uso)
  if (sinCategoria.length) avisos.push(`${sinCategoria.length} filas de MOU con CATEGORIA no reconocida (se esperan Retail, Demo o Fleet); se ignoran.`)
  return { tablas, errores, avisos }
}
