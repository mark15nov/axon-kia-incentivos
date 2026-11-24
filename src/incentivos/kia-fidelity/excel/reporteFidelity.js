// ============================================================
//  KIA FIDELITY · Excel de cierre
//  RESUMEN (dos columnas: pago a la financiera y débito al
//  dealer) · PAGO_FINANCIERA · DEBITOS_DEALER · POR_RAZON_SOCIAL
//  · OBSERVACIONES. Los totales son fórmulas sobre el detalle.
//  Aparte: VINS_PAGADOS actualizado (mismo formato del archivo
//  de entrada, listo para el siguiente incentivo).
// ============================================================

import { cargarExcelJS } from '../../margen-variable/excel/leerLibro.js'
import { COLOR, FMT, tabla, rango, f, titulo, etiqueta } from '../../margen-variable/excel/estilos.js'
import { ESTATUS_DEBITO, MOTIVO_LABEL } from '../motor/debitosDealer.js'
import { fechaIso } from '../motor/fechas.js'

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const sufijo = (periodo) => (periodo ? `${MESES[Number(periodo.slice(4)) - 1]} ${periodo.slice(2, 4)}` : '')
export const nombreReporteFidelity = (r) => `Fidelity ${sufijo(r.periodo)} - Cierre.xlsx`
export const nombreVinsPagados = (r) => `VINS PAGADOS y Compatibilidad - actualizado ${sufijo(r.periodo)}.xlsx`

const textoLista = (xs) => xs.map(x => x.texto).join(' · ')

function hojaPago(ws, r) {
  const filas = r.contratos.map(c => [
    c.dossier, c.vin, c.dealer, c.razonSocial, c.version, c.plazo, c.tasa / 100, c.beneficioCatalogo === null ? '' : c.beneficioCatalogo / 100,
    c.monto, c.chargeReclamado, c.chargeRecalculado ?? '', c.ajuste, c.retenido, c.montoPagar, c.estatusPago,
    textoLista(c.observaciones)
  ])
  tabla(ws, [
    { titulo: 'DOSSIER', ancho: 13 }, { titulo: 'VIN', ancho: 21 }, { titulo: 'DEALER (PV)', ancho: 18 }, { titulo: 'RAZÓN SOCIAL', ancho: 32 },
    { titulo: 'VERSIÓN', ancho: 18 }, { titulo: 'PLAZO', fmt: FMT.entero, ancho: 8 }, { titulo: 'TASA REAL', fmt: FMT.pct2, ancho: 10 },
    { titulo: 'BENEFICIO CATÁLOGO', fmt: FMT.pct, ancho: 11 }, { titulo: 'MONTO FINANCIADO', fmt: FMT.dinero, ancho: 15 },
    { titulo: 'CHARGE RECLAMADO', fmt: FMT.dinero, ancho: 15 }, { titulo: 'CHARGE RECALCULADO', fmt: FMT.dinero, ancho: 15 },
    { titulo: 'AJUSTE', fmt: FMT.dinero, ancho: 13 }, { titulo: 'RETENIDO', fmt: FMT.dinero, ancho: 13 }, { titulo: 'A PAGAR', fmt: FMT.dinero, ancho: 14 },
    { titulo: 'ESTATUS', ancho: 11 }, { titulo: 'OBSERVACIONES', ancho: 90 }
  ], filas)
  return filas.length
}

function hojaDebitos(ws, r) {
  const xs = r.contratos.filter(c => c.estatusDebito !== ESTATUS_DEBITO.SIN_DEBITO || c.notas.length)
  const filas = xs.map(c => [
    c.dossier, c.vin, c.dealerSap || c.dealer, c.razonSocial,
    c.motivos.map(m => MOTIVO_LABEL[m.codigo] ?? m.codigo).join(' · '),
    textoLista([...c.motivos, ...c.porRevisar, ...c.notas]),
    c.montoDebito, c.estatusDebito === ESTATUS_DEBITO.POR_REVISAR ? 'POR REVISAR' : c.estatusDebito === ESTATUS_DEBITO.DEBITO ? 'DÉBITO' : 'PROCEDE'
  ])
  tabla(ws, [
    { titulo: 'DOSSIER', ancho: 13 }, { titulo: 'VIN', ancho: 21 }, { titulo: 'DEALER', ancho: 18 }, { titulo: 'RAZÓN SOCIAL', ancho: 32 },
    { titulo: 'MOTIVO', ancho: 22 }, { titulo: 'COMENTARIO', ancho: 80 }, { titulo: 'MONTO DÉBITO', fmt: FMT.dinero, ancho: 15 }, { titulo: 'ESTATUS', ancho: 13 }
  ], filas)
  return filas.length
}

function hojaRazonSocial(ws, r, nPago, nDeb) {
  const P = (c) => rango('PAGO_FINANCIERA', c, nPago)
  const D = (c) => rango('DEBITOS_DEALER', c, nDeb)
  const filas = r.porRazonSocial.map((x, i) => {
    const k = i + 2
    return [x.razonSocial,
      f(`COUNTIF(${P('D')},$A${k})`, x.contratos), f(`SUMIF(${P('D')},$A${k},${P('J')})`, x.reclamado),
      f(`SUMIF(${P('D')},$A${k},${P('M')})`, x.retenido), f(`SUMIF(${P('D')},$A${k},${P('N')})`, x.aPagar),
      f(`COUNTIFS(${D('D')},$A${k},${D('H')},"DÉBITO")`, x.vinsDebito), f(`SUMIF(${D('D')},$A${k},${D('G')})`, x.debito)]
  })
  tabla(ws, [
    { titulo: 'RAZÓN SOCIAL', ancho: 36 }, { titulo: 'CONTRATOS', fmt: FMT.entero }, { titulo: 'RECLAMADO', fmt: FMT.dinero, ancho: 15 },
    { titulo: 'RETENIDO', fmt: FMT.dinero, ancho: 15 }, { titulo: 'PAGO A FINANCIERA', fmt: FMT.dinero, ancho: 17 },
    { titulo: 'VIN CON DÉBITO', fmt: FMT.entero }, { titulo: 'DÉBITO AL DEALER', fmt: FMT.dinero, ancho: 17 }
  ], filas)
  const t = ws.getRow(filas.length + 2)
  t.getCell(1).value = 'TOTAL'
  ;['B', 'C', 'D', 'E', 'F', 'G'].forEach((c, i) => {
    const celda = t.getCell(i + 2)
    celda.value = f(`SUM(${c}2:${c}${Math.max(2, filas.length + 1)})`)
    celda.numFmt = c === 'B' || c === 'F' ? FMT.entero : FMT.dinero
  })
  t.font = { bold: true }
}

function hojaResumen(ws, r, nPago, nDeb) {
  const P = (c) => rango('PAGO_FINANCIERA', c, nPago)
  const D = (c) => rango('DEBITOS_DEALER', c, nDeb)
  titulo(ws, `Kia Fidelity · ${sufijo(r.periodo)}`, 'Subsidio de tasa · Charge = intereses a tasa teórica − intereses a tasa real. El débito al dealer NO se resta del pago a la financiera.')
  etiqueta(ws.getCell('B5'), 'Pago a la financiera')
  etiqueta(ws.getCell('C5'), '')
  etiqueta(ws.getCell('E5'), 'Débito al distribuidor')
  etiqueta(ws.getCell('F5'), '')
  const pago = [
    ['Contratos reclamados', f(`COUNTA(${P('A')})`, r.resumen.pago.contratos), FMT.entero],
    ['Monto reclamado', f(`SUM(${P('J')})`, r.resumen.pago.reclamado), FMT.dinero],
    ['Ajustes', f(`SUM(${P('L')})`, r.resumen.pago.ajustes), FMT.dinero],
    ['Retenido por aclarar', f(`SUM(${P('M')})`, r.resumen.pago.retenido), FMT.dinero],
    ['Monto a pagar', f(`SUM(${P('N')})`, r.resumen.pago.aPagar), FMT.dinero],
    ['Cuadre (reclamado + ajustes − retenido − a pagar)', f('ROUND(C7+C8-C9-C10,2)', 0), FMT.dinero]
  ]
  const deb = [
    ['VIN con débito', f(`COUNTIF(${D('H')},"DÉBITO")`, r.resumen.debito.vins), FMT.entero],
    ['Monto a debitar', f(`SUM(${D('G')})`, r.resumen.debito.total), FMT.dinero],
    ['VIN por revisar', f(`COUNTIF(${D('H')},"POR REVISAR")`, r.resumen.debito.porRevisar), FMT.entero]
  ]
  pago.forEach(([k, v, fmt], i) => { ws.getCell(6 + i, 2).value = k; ws.getCell(6 + i, 3).value = v; ws.getCell(6 + i, 3).numFmt = fmt })
  deb.forEach(([k, v, fmt], i) => { ws.getCell(6 + i, 5).value = k; ws.getCell(6 + i, 6).value = v; ws.getCell(6 + i, 6).numFmt = fmt })
  ws.getCell('C10').font = { bold: true, color: { argb: COLOR.rojo }, size: 12 }
  ws.getCell('F7').font = { bold: true, color: { argb: COLOR.rojo }, size: 12 }
  etiqueta(ws.getCell('B14'), 'Cuadre del reclamo')
  r.cuadre.chequeos.forEach((c, i) => { ws.getCell(15 + i, 2).value = `${c.ok ? '✓' : '✗'} ${c.texto}` })
  const p = r.parametros
  etiqueta(ws.getCell('B21'), 'Parámetros')
  ;[[`N-rule: retail hasta N-${p.nRuleMeses} meses del contrato (pendiente de confirmar)`], [`Antigüedad mínima demo: ${p.demoMinDias} días (pendiente de confirmar)`],
    [`Tolerancia del recálculo: $${p.toleranciaCentavos}`], [`Monto del débito: Charge ${p.baseDebito}`]].forEach(([t], i) => { ws.getCell(22 + i, 2).value = t })
  ws.getColumn(2).width = 48
  ws.getColumn(3).width = 18
  ws.getColumn(4).width = 4
  ws.getColumn(5).width = 24
  ws.getColumn(6).width = 18
}

function hojaObservaciones(ws, r) {
  tabla(ws, [{ titulo: 'DOSSIER', ancho: 13 }, { titulo: 'VIN', ancho: 21 }, { titulo: 'EFECTO', ancho: 10 }, { titulo: 'OBSERVACIÓN', ancho: 110 }, { titulo: 'RECLAMADO', fmt: FMT.dinero, ancho: 14 }, { titulo: 'A PAGAR', fmt: FMT.dinero, ancho: 14 }],
    r.observaciones.map(o => [o.dossier, o.vin, o.efecto, o.texto, o.reclamado ?? '', o.aPagar ?? '']))
}

/** Excel de cierre del mes. */
export async function generarExcelFidelity({ resultado }, opciones = {}) {
  const ExcelJS = opciones.ExcelJS ?? await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Axon · Centro de Incentivos KIA'
  wb.calcProperties.fullCalcOnLoad = true
  const hojas = Object.fromEntries(['RESUMEN', 'PAGO_FINANCIERA', 'DEBITOS_DEALER', 'POR_RAZON_SOCIAL', 'OBSERVACIONES']
    .map((n, i) => [n, wb.addWorksheet(n, { properties: { tabColor: { argb: i < 1 ? COLOR.rojo : COLOR.negro } } })]))
  const nPago = hojaPago(hojas.PAGO_FINANCIERA, resultado)
  const nDeb = hojaDebitos(hojas.DEBITOS_DEALER, resultado)
  hojaRazonSocial(hojas.POR_RAZON_SOCIAL, resultado, nPago, nDeb)
  hojaObservaciones(hojas.OBSERVACIONES, resultado)
  hojaResumen(hojas.RESUMEN, resultado, nPago, nDeb)
  return wb.xlsx.writeBuffer()
}

/** VINS_PAGADOS + COMPAT con los pagos del mes agregados (mismo formato del archivo de entrada). */
export async function generarVinsPagadosActualizado({ datos, resultado }, opciones = {}) {
  const ExcelJS = opciones.ExcelJS ?? await cargarExcelJS()
  const wb = new ExcelJS.Workbook()
  const enc = ['Year', 'Month', 'Program', 'Vehicle ID', 'Incentive Amount', 'Incentive Program Type', 'VIN normalizado',
    'Código (2 letras)', 'Periodo pago (AAAAMM)', 'Monto redondeado', 'Reclamos incompatibles con este pago']
  const previos = datos.pagos.map(p => [p.original?.year ?? Number(p.periodo.slice(0, 4)), p.original?.month ?? Number(p.periodo.slice(4)), p.programa, p.vin, p.monto,
    p.original?.tipo || `${p.codigo}01`, p.vin, p.codigo, Number(p.periodo), p.monto, p.original?.incompatibles ?? ''])
  const nuevos = resultado.vinsPagadosNuevos.map(n => [n.year, n.month, n.programa, n.vin, n.monto, n.tipo, n.vin, n.codigo, Number(n.periodo), n.monto, n.incompatibles])
  const ws = wb.addWorksheet('VINS_PAGADOS')
  tabla(ws, enc.map(t => ({ titulo: t, ancho: Math.max(12, Math.min(28, t.length + 2)) })), [...previos, ...nuevos])
  nuevos.forEach((_, i) => ws.getRow(previos.length + 2 + i).eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.ayuda } } }))
  const wc = wb.addWorksheet('COMPAT')
  tabla(wc, ['Incentive Program Type 2 Digit (1º = ya pagado)', 'Program Type Description', 'Incentive Program Type 2 Digit (2º = el que se reclama)', 'Program Type Description', '1:Allowed, 0:Not Allowed', 'Llave']
    .map(t => ({ titulo: t, ancho: 22 })), datos.compat.map(c => [c.pagado, c.descPagado, c.reclamado, c.descReclamado, c.permitido ? 1 : 0, `${c.pagado}|${c.reclamado}`]))
  const nota = wb.addWorksheet('NOTA')
  nota.getCell('A1').value = `Actualizado al cierre de Fidelity ${sufijo(resultado.periodo)}: ${nuevos.length} pagos agregados (filas amarillas). Fecha de generación ${fechaIso({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1, dia: new Date().getDate() })}.`
  return wb.xlsx.writeBuffer()
}
