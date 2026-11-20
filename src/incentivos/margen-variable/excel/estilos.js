// Estilos y utilidades compartidas del Excel de Finanzas.

export const COLOR = Object.freeze({
  negro: 'FF05141F',
  rojo: 'FFBB162B',
  gris: 'FF64748B',
  linea: 'FFE6E9EC',
  fondo: 'FFF6F7F8',
  ayuda: 'FFFFF7E6', // columnas auxiliares calculadas por la plataforma
  verde: 'FF047857'
})

export const FMT = Object.freeze({
  dinero: '#,##0.00',
  entero: '#,##0',
  pct: '0.0%',
  pct2: '0.00%',
  decimal: '0.00',
  fecha: 'dd/mm/yyyy'
})

/** Letra de columna (1 → A, 27 → AA). */
export function col(n) {
  let s = ''
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s
  return s
}

/** Nombre de hoja para fórmulas: con comillas si tiene espacios ('MV MAR por Modelo'). */
export const ref = (hoja) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(hoja) ? hoja : `'${hoja.replace(/'/g, "''")}'`)

/** Rango absoluto de una columna de datos: HOJA!$C$2:$C$n (datos desde la fila `desde`). */
export function rango(hoja, letra, filas, desde = 2) {
  return `${ref(hoja)}!$${letra}$${desde}:$${letra}$${Math.max(desde, filas + desde - 1)}`
}

/** Bloque absoluto de varias columnas: HOJA!$B$2:$C$n. */
export function bloque(hoja, desdeCol, hastaCol, filas, desde = 2) {
  return `${ref(hoja)}!$${desdeCol}$${desde}:$${hastaCol}$${Math.max(desde, filas + desde - 1)}`
}

/**
 * Agrega una tabla con encabezado estilizado.
 * @param {import('exceljs').Worksheet} ws
 * @param {{ titulo: string, ancho?: number, fmt?: string, ayuda?: boolean }[]} columnas
 * @param {unknown[][]} filas  valores o { formula, result }
 * @param {{ filaEncabezado?: number }} [opciones]
 */
export function tabla(ws, columnas, filas, { filaEncabezado = 1 } = {}) {
  const enc = ws.getRow(filaEncabezado)
  columnas.forEach((c, i) => {
    const celda = enc.getCell(i + 1)
    celda.value = c.titulo
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.ayuda ? COLOR.gris : COLOR.negro } }
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    ws.getColumn(i + 1).width = c.ancho ?? Math.max(10, Math.min(30, c.titulo.length + 4))
  })
  enc.height = 30
  filas.forEach((valores, k) => {
    const row = ws.getRow(filaEncabezado + 1 + k)
    valores.forEach((v, i) => {
      const celda = row.getCell(i + 1)
      celda.value = v
      const c = columnas[i]
      if (c?.fmt) celda.numFmt = c.fmt
      if (c?.ayuda) celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.ayuda } }
    })
  })
  ws.views = [{ state: 'frozen', ySplit: filaEncabezado }]
  if (filas.length) {
    ws.autoFilter = { from: { row: filaEncabezado, column: 1 }, to: { row: filaEncabezado + filas.length, column: columnas.length } }
  }
}

/** Fórmula con resultado en caché (se ve aun sin recalcular). */
export const f = (formula, result) => ({ formula, result: result === undefined ? null : result })

/** Título de hoja (fila 1-2) para hojas de reporte. */
export function titulo(ws, texto, subtitulo) {
  ws.getCell('B2').value = texto
  ws.getCell('B2').font = { bold: true, size: 16, color: { argb: COLOR.negro } }
  if (subtitulo) {
    ws.getCell('B3').value = subtitulo
    ws.getCell('B3').font = { size: 10, color: { argb: COLOR.gris } }
  }
  ws.getColumn(1).width = 3
}

/** Etiqueta en negritas con fondo gris claro. */
export function etiqueta(celda, texto) {
  celda.value = texto
  celda.font = { bold: true, size: 10, color: { argb: COLOR.negro } }
  celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.fondo } }
}
