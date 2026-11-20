// ============================================================
//  Lectura de .xlsx → { [hoja]: { headers, rows } }
//  ExcelJS se carga bajo demanda para no inflar el bundle
//  inicial de la maqueta.
// ============================================================

import { abrirZipSeguro } from './limiteZip.js'

let excelJsPromise = null

/** Carga ExcelJS una sola vez (import dinámico). */
export function cargarExcelJS() {
  if (!excelJsPromise) excelJsPromise = import('exceljs').then(m => m.default ?? m)
  return excelJsPromise
}

/** Valor "plano" de una celda de ExcelJS. */
export function valorCelda(v) {
  if (v === null || v === undefined) return null
  if (v instanceof Date || typeof v !== 'object') return v
  if ('result' in v) return valorCelda(v.result)
  if ('richText' in v) return v.richText.map(t => t.text).join('')
  if ('text' in v) return v.text
  if ('error' in v) return null
  return null
}

/**
 * Lee un libro de Excel.
 * @param {ArrayBuffer} buffer
 * @param {{ ExcelJS?: unknown }} [opciones] ExcelJS inyectable (pruebas en Node).
 * @returns {Promise<Record<string, { headers: string[], rows: unknown[][] }>>}
 */
export async function leerLibro(buffer, opciones = {}) {
  await abrirZipSeguro(buffer)
  const ExcelJS = opciones.ExcelJS ?? await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(buffer)
  } catch (err) {
    throw new Error(`No se pudo leer el archivo como Excel (.xlsx): ${err instanceof Error ? err.message : 'formato inválido'}`)
  }
  const libro = {}
  wb.eachSheet(ws => {
    const headerRow = ws.getRow(1)
    const ancho = Math.max(headerRow.cellCount, ws.actualColumnCount)
    const headers = Array.from({ length: ancho }, (_, i) => {
      const v = valorCelda(headerRow.getCell(i + 1).value)
      return v === null ? '' : String(v).trim()
    })
    const rows = []
    ws.eachRow({ includeEmpty: false }, (row, n) => {
      if (n === 1) return
      rows.push(Array.from({ length: ancho }, (_, i) => valorCelda(row.getCell(i + 1).value)))
    })
    libro[ws.name] = { headers, rows }
  })
  return libro
}
