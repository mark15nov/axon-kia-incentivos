// ============================================================
//  Excel de Finanzas · Margen Variable
//  Mismo formato que la guía (Calculation File_MV):
//    MONTHLY MV {MES} {AA} · MV {MES} por Modelo · CALCULO ·
//    Resumen de Pago · BC · SALES · PROVISION · MOS · WHS · MOU ·
//    DEALERS · Curtailment · PARAMETROS
//  Todo formulado: Finanzas puede auditar cada número, cambiar un
//  parámetro y ver el recálculo.
// ============================================================

import { esPresetFinanzas } from '../motor/parametros.js'
import { cargarExcelJS } from './leerLibro.js'
import { hojaParametros, hojasBase } from './hojasBase.js'
import { hojaModelo, hojaCalculo, vinsCalculo, familiasDe } from './hojasCalculo.js'
import { COLOR, FMT, rango, col, f, ref } from './estilos.js'

const MES3 = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const META_DEFAULT = Object.freeze({ tipoCambio: 19.8, centroCosto: 'K8200' })

export const nombrePeriodo = (periodo) => `${MESES[Number(periodo.slice(4)) - 1]} ${periodo.slice(0, 4)}`
const mes3 = (periodo) => MES3[Number(periodo.slice(4)) - 1]
const esForecast = (r) => r.escenario.supuestoInventario || r.escenario.factorRunRate > 1

/** Nombres de hoja del libro (los de la guía). */
export function nombresHojas(periodo) {
  const mes = mes3(periodo)
  return {
    monthly: `MONTHLY MV ${mes} ${periodo.slice(2, 4)}`, modelo: `MV ${mes} por Modelo`, calculo: 'CALCULO',
    pago: 'Resumen de Pago', bc: 'BC', ventas: 'SALES', provision: 'PROVISION', mos: 'MOS', ws: 'WHS', mou: 'MOU',
    dealers: 'DEALERS', curtailment: 'Curtailment', parametros: 'PARAMETROS'
  }
}

export function nombreArchivoFinanzas(resultado) {
  return `Calculation File_MV ${mes3(resultado.periodo)} ${resultado.periodo.slice(2, 4)}${esForecast(resultado) ? ' Forecast' : ''}.xlsx`
}

const COLOR_HOJA = { monthly: COLOR.rojo, modelo: COLOR.rojo, calculo: COLOR.negro, pago: COLOR.rojo, bc: COLOR.negro, parametros: COLOR.negro }

/** Encabezado + filas en una posición libre de la hoja (varias tablas por hoja). */
function bloqueTabla(ws, filaEnc, colIni, columnas, filas) {
  columnas.forEach((c, i) => {
    const celda = ws.getCell(filaEnc, colIni + i)
    celda.value = c.titulo
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.negro } }
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    ws.getColumn(colIni + i).width = c.ancho ?? 14
  })
  ws.getRow(filaEnc).height = 30
  filas.forEach((valores, k) => valores.forEach((v, i) => {
    const celda = ws.getCell(filaEnc + 1 + k, colIni + i)
    celda.value = v
    if (columnas[i]?.fmt) celda.numFmt = columnas[i].fmt
  }))
  const ft = filaEnc + filas.length + 1
  ws.getCell(ft, colIni).value = 'TOTAL'
  columnas.forEach((c, i) => {
    if (!c.sumar) return
    const L = col(colIni + i)
    const celda = ws.getCell(ft, colIni + i)
    celda.value = f(`SUM(${L}${filaEnc + 1}:${L}${Math.max(filaEnc + 1, filaEnc + filas.length)})`)
    celda.numFmt = c.fmt ?? FMT.dinero
  })
  ws.getRow(ft).font = { bold: true }
  return { filaIni: filaEnc + 1, filaFin: filaEnc + filas.length, filaTotal: ft }
}

const tituloBloque = (ws, fila, c, texto) => {
  const celda = ws.getCell(fila, c)
  celda.value = texto
  celda.font = { bold: true, size: 11, color: { argb: COLOR.rojo } }
}

function hojaResumenPago(ws, nombres, resultado, nCalculo, familias) {
  const C = (c) => rango(nombres.calculo, c, nCalculo)
  const dealers = resultado.dealers.filter(d => d.unidadesProvision > 0)
    .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial) || a.dealer.localeCompare(b.dealer))
  const razones = [...new Set(dealers.map(d => d.razonSocial))].sort()
  const nf = familias.length
  const FILA = 5
  const famCols = familias.map(t => ({ titulo: t, fmt: FMT.dinero, sumar: true }))
  const totales = [{ titulo: 'MONTO TOTAL (sin IVA)', fmt: FMT.dinero, sumar: true, ancho: 17 }, { titulo: 'MONTO TOTAL (con IVA)', fmt: FMT.dinero, sumar: true, ancho: 17 }]

  // 1) Por modelo / dealer / razón social
  const c1 = 2
  const colFam = (k) => col(c1 + 2 + k)
  const cSin = col(c1 + 2 + nf)
  const t1 = bloqueTabla(ws, FILA, c1, [{ titulo: 'RAZÓN SOCIAL', ancho: 32 }, { titulo: 'DISTRIBUIDOR', ancho: 24 }, ...famCols, ...totales],
    dealers.map((d, i) => {
      const r = FILA + 1 + i
      return [d.razonSocial, d.dealer, ...familias.map((_, k) => f(`SUMIFS(${C('T')},${C('J')},$${col(c1 + 1)}${r},${C('A')},${colFam(k)}$${FILA})`)),
        f(`SUM(${colFam(0)}${r}:${colFam(nf - 1)}${r})`, d.monto), f(`${cSin}${r}*(1+IVA)`)]
    }))
  tituloBloque(ws, 2, c1, 'RESUMEN DE PAGO POR MODELO / DEALER / RAZÓN SOCIAL')

  // 2) Por razón social
  const c2 = c1 + nf + 5
  const rangoT1 = (k) => `$${col(c1 + k)}$${t1.filaIni}:$${col(c1 + k)}$${Math.max(t1.filaIni, t1.filaFin)}`
  const t2 = bloqueTabla(ws, FILA, c2, [{ titulo: 'RAZÓN SOCIAL', ancho: 32 }, ...famCols, ...totales],
    razones.map((rs, i) => {
      const r = FILA + 1 + i
      return [rs, ...Array.from({ length: nf + 2 }, (_, k) => f(`SUMIF(${rangoT1(0)},$${col(c2)}${r},${rangoT1(2 + k)})`))]
    }))
  tituloBloque(ws, 2, c2, 'RESUMEN DE PAGO POR MODELO / RAZÓN SOCIAL')

  // 3) Tablas para BC por dealer, en MXN y USD
  const c3 = c2 + nf + 4
  bloqueTabla(ws, FILA, c3, [{ titulo: 'DEALER', ancho: 24 }, ...famCols, { titulo: 'TOTAL', fmt: FMT.dinero, sumar: true }],
    dealers.map((_, i) => {
      const r = FILA + 1 + i
      return [f(`${col(c1 + 1)}${r}`), ...familias.map((__, k) => f(`${colFam(k)}${r}`)), f(`${cSin}${r}`)]
    }))
  tituloBloque(ws, 2, c3, 'TABLA PARA BC (MXN)')
  const c4 = c3 + nf + 3
  bloqueTabla(ws, FILA, c4, [{ titulo: 'DEALER', ancho: 24 }, ...famCols, { titulo: 'TOTAL', fmt: FMT.dinero, sumar: true }],
    dealers.map((_, i) => {
      const r = FILA + 1 + i
      return [f(`${col(c3)}${r}`), ...Array.from({ length: nf + 1 }, (__, k) => f(`${col(c3 + 1 + k)}${r}/TIPO_CAMBIO`))]
    }))
  tituloBloque(ws, 2, c4, 'TABLA PARA BC (USD)')
  ws.getCell(3, c4).value = 'Tipo de cambio'
  ws.getCell(3, c4 + 1).value = f('TIPO_CAMBIO')

  return {
    razonSocial: `${ref(nombres.pago)}!$${col(c2)}$${t2.filaIni}:$${col(c2 + nf + 2)}$${Math.max(t2.filaIni, t2.filaFin)}`,
    idxConIva: nf + 3,
    totalConIva: `${ref(nombres.pago)}!$${col(c1 + 3 + nf)}$${t1.filaTotal}`,
    razones
  }
}

function hojaMonthly(ws, resultado, pago) {
  const mes = mes3(resultado.periodo)
  const anio = resultado.periodo.slice(0, 4)
  const fecha = new Date(Date.UTC(Number(anio), Number(resultado.periodo.slice(4)) - 1, 1))
  ws.getColumn(1).width = 3
  ;[['B', 14], ['C', 18], ['D', 18], ['E', 14], ['F', 36], ['G', 14], ['H', 18], ['I', 14]].forEach(([c, w]) => { ws.getColumn(c).width = w })
  const lineas = [
    [2, ' MONTHLY EXPENSES_FEE CONTROL'],
    [3, '1. Program name / Service received'],
    [4, `2. Contract :  YES            NO                   Period : VARIABLE MARGIN ${mes} ${anio}`],
    [5, '3. Contract Amount : '],
    [6, '4. Contract Party : KMM and Dealers'],
    [7, '5. Payment due date : According to KMM Policies'],
    [8, `6. Main Activities : VARIABLE MARGIN ${mes} ${anio}`],
    [9, `7. Monthly Request of Approval : Variable Margin Bonus ${MESES[fecha.getUTCMonth()]} ${anio}`]
  ]
  lineas.forEach(([r, t]) => { ws.getCell(`B${r}`).value = t })
  ws.getCell('B2').font = { bold: true, size: 14 }
  ws.getCell('C5').value = f('TEXT(C11,"$#,##0.00")&" MXN ("&TEXT(C11/TIPO_CAMBIO,"$#,##0.00")&" USD)"')
  ws.getCell('H6').value = 'Cost Center :'
  ws.getCell('I6').value = f('CENTRO_COSTO')

  const ultima = 12 + Math.max(1, pago.razones.length)
  ws.getCell('B11').value = fecha
  ws.getCell('B11').numFmt = 'mmm-yy'
  ws.getCell('C11').value = f(`SUM(C13:C${ultima})`, Math.round(resultado.resumen.montoConIva * 100) / 100)
  ws.getCell('C11').numFmt = FMT.dinero
  ws.getCell('C11').font = { bold: true, color: { argb: COLOR.rojo } }
  ws.getCell('D11').value = f(`ROUND(C11-${pago.totalConIva},2)=0`, true)
  ;['Date', 'Invoice Amount', 'Accu Amount', 'Invoice No', 'Vendor Name', 'PIC', ' Sales Finance Approval', 'G/L Account'].forEach((t, i) => {
    const c = ws.getCell(12, 2 + i)
    c.value = t
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.negro } }
  })
  pago.razones.forEach((rs, i) => {
    const r = 13 + i
    ws.getCell(`B${r}`).value = f('$B$11')
    ws.getCell(`B${r}`).numFmt = FMT.fecha
    ws.getCell(`C${r}`).value = f(`IFERROR(VLOOKUP(F${r},${pago.razonSocial},${pago.idxConIva},0),0)`)
    ws.getCell(`D${r}`).value = f(i === 0 ? `C${r}` : `C${r}+D${r - 1}`)
    ws.getCell(`F${r}`).value = rs
    ;['C', 'D'].forEach(c => { ws.getCell(`${c}${r}`).numFmt = FMT.dinero })
  })
}

function hojaBC(ws, nombres, n, nCalculo, familias) {
  const S = (c) => rango(nombres.ventas, c, n.ventas)
  const M = (c) => rango(nombres.mou, c, n.mou)
  const C = (c) => rango(nombres.calculo, c, nCalculo)
  tituloBloque(ws, 2, 2, 'RESUMEN POR RETAIL & MOU · COMPARACIÓN ENTRE PROVISIONES Y MV')
  bloqueTabla(ws, 4, 2, [
    { titulo: 'MODEL', ancho: 12 }, { titulo: 'RETAIL (units)', fmt: FMT.entero, sumar: true }, { titulo: 'MOU (units)', fmt: FMT.entero, sumar: true },
    { titulo: '% RT/MOU', fmt: FMT.pct }, { titulo: 'PROVIS ($)', fmt: FMT.dinero, sumar: true, ancho: 16 },
    { titulo: 'VARIABLE MARGIN ($)', fmt: FMT.dinero, sumar: true, ancho: 18 }, { titulo: '∆ ($)', fmt: FMT.dinero, sumar: true, ancho: 16 }, { titulo: '%', fmt: FMT.pct }
  ], familias.map((fam, i) => {
    const r = 5 + i
    return [fam,
      f(`SUMIFS(${S('W')},${S('V')},$B${r},${S('U')},"Retail")`),
      f(`SUMIFS(${M('F')},${M('H')},$B${r},${M('D')},"Retail",${M('A')},ANIO,${M('B')},MES)`),
      f(`IFERROR(C${r}/D${r},0)`),
      f(`SUMIF(${C('A')},$B${r},${C('O')})`),
      f(`SUMIF(${C('A')},$B${r},${C('T')})`),
      f(`G${r}-F${r}`),
      f(`IFERROR(H${r}/F${r},0)`)]
  }))
}

/**
 * Genera el Excel formulado para Finanzas con el formato de la guía.
 * @param {{ datos: object, resultado: object, meta?: { archivos?: string[], generado?: string, tipoCambio?: number, centroCosto?: string } }} entrada
 * @param {{ ExcelJS?: unknown }} [opciones]
 * @returns {Promise<ArrayBuffer>}
 */
export async function generarExcelFinanzas({ datos, resultado, meta = {} }, opciones = {}) {
  const ExcelJS = opciones.ExcelJS ?? await cargarExcelJS()
  const m = { ...META_DEFAULT, ...meta }
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Axon · Centro de Incentivos KIA'
  wb.created = new Date()
  wb.calcProperties.fullCalcOnLoad = true
  const nombres = nombresHojas(resultado.periodo)
  const hojas = Object.fromEntries(Object.entries(nombres).map(([id, nombre]) =>
    [id, wb.addWorksheet(nombre, { properties: { tabColor: { argb: COLOR_HOJA[id] ?? COLOR.gris } } })]))

  const n = hojasBase(hojas, datos, resultado)
  hojaParametros(wb, hojas.parametros, resultado, m)
  hojas.parametros.getCell('B4').value = `Interpretación: ${esPresetFinanzas(resultado.parametros) ? 'reglas de la guía (Calculation File_MV)' : 'política escrita'}` +
    `${esForecast(resultado) ? ' · FORECAST' : ''} · Generado ${m.generado ?? new Date().toISOString().slice(0, 16).replace('T', ' ')}`
  const vins = vinsCalculo(resultado)
  const familias = familiasDe(vins)
  const modelo = hojaModelo(hojas.modelo, nombres, resultado, n, vins.length, familias, mes3(resultado.periodo))
  hojaCalculo(hojas.calculo, nombres, resultado, datos, n, modelo)
  const pago = hojaResumenPago(hojas.pago, nombres, resultado, vins.length, familias)
  hojaMonthly(hojas.monthly, resultado, pago)
  hojaBC(hojas.bc, nombres, n, vins.length, familias)
  return wb.xlsx.writeBuffer()
}
