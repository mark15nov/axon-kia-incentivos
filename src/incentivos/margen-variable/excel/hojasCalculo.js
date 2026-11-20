// ============================================================
//  Excel de Finanzas · hojas de cálculo con el formato de la guía
//  (Calculation File_MV):
//    "MV {MES} por Modelo" → cumplimiento por dealer y por modelo
//    "CALCULO"             → una fila por VIN con la fórmula de pago
//  Las columnas grises son auxiliares de la plataforma (base del bono,
//  regla aplicada, monto calculado por la plataforma para cuadrar).
// ============================================================

import { REGLA, REGLA_LABEL } from '../motor/calculo.js'
import { USO_EXCEL } from './hojasBase.js'
import { FMT, tabla, rango, bloque, col, f, ref, COLOR } from './estilos.js'

const ORDEN_FAMILIAS = ['K3', 'K4', 'SONET', 'SELTOS', 'EV6']
const FILA_ENC_MODELO = 3
const FILA_DATOS_MODELO = 4

/** Familias con provisión, en el orden de la guía (K3, K4, SONET, SELTOS, EV6, …). */
export function familiasDe(vins) {
  const set = new Set(vins.map(v => v.familia))
  return [...ORDEN_FAMILIAS.filter(x => set.has(x)), ...[...set].filter(x => !ORDEN_FAMILIAS.includes(x)).sort()]
}

/** VIN con provisión (universo de pago) ordenados por dealer y familia. */
export function vinsCalculo(resultado) {
  return resultado.vins
    .filter(v => v.regla !== REGLA.SIN_PROVISION)
    .sort((a, b) => a.dealer.localeCompare(b.dealer) || a.familia.localeCompare(b.familia) || a.vin.localeCompare(b.vin))
}

/** Posición de cada columna de "MV {MES} por Modelo" según el número de familias. */
export function layoutModelo(nFamilias) {
  const comentarios = 9 + 3 * nFamilias
  const a = comentarios + 1
  const aux = ['MOU_DEMO', 'MOU_FLOTA', 'MOU_TOTAL', 'SALES_DEMO', 'SALES_FLOTA', 'SALES_TOTAL', 'PCT_TOTAL', 'PCT_BONO',
    'CUMPLE_WHS', 'CUMPLE_MOS', 'CUMPLE_INV', 'CUMPLE_RETAIL', 'SUPERA_BONO', 'WHS_B']
  const L = { DEALER: 2, MOU: 3, SALES: 4, ACHIEVE: 5, MISSING: 6, WHS: 7, MOS: 8, COMENTARIOS: comentarios, familia: (k) => 9 + 3 * k }
  aux.forEach((k, i) => { L[k] = a + i })
  L.FIN_BUSQUEDA = a + aux.length - 1
  L.UNID_PROV = a + aux.length
  L.PROVISION = L.UNID_PROV + 1
  L.UNID_PAGADAS = L.UNID_PROV + 2
  L.MONTO = L.UNID_PROV + 3
  return L
}

export function hojaModelo(ws, nombres, resultado, n, nCalculo, familias, mes) {
  const L = layoutModelo(familias.length)
  const S = (c) => rango(nombres.ventas, c, n.ventas)
  const M = (c) => rango(nombres.mou, c, n.mou)
  const C = (c) => rango(nombres.calculo, c, nCalculo)
  const mou = (cat, r, fam) => `SUMIFS(${M('F')},${M('G')},$B${r},${M('D')},"${cat}",${M('A')},ANIO,${M('B')},MES${fam ? `,${M('H')},${fam}` : ''})`
  const ventas = (uso, r, fam) => `SUMIFS(${S('W')},${S('S')},$B${r},${S('U')},"${uso}"${fam ? `,${S('V')},${fam}` : ''})`
  const buscar = (hoja, filas, r) => `IFERROR(INDEX(${rango(hoja, 'C', filas)},MATCH($B${r},${rango(hoja, 'D', filas)},0)),"")`
  const pct = (num, den) => `IFERROR(ROUND(${num}*FACTOR_RUNRATE/${den},9),0)`
  const c = (k, r) => `${col(L[k])}${r}`

  const filas = resultado.dealers.map((d, i) => {
    const r = FILA_DATOS_MODELO + i
    const porModelo = new Map(d.modelos.map(m => [m.familia, m]))
    const fila = [i + 1, d.dealer,
      f(mou('Retail', r), d.mouRetail), f(ventas('Retail', r), d.ventasRetail), f(pct(`D${r}`, `C${r}`), d.pctRetail),
      f(`IF(C${r}-D${r}<0,0,C${r}-D${r})`, Math.max(0, d.mouRetail - d.ventasRetail)),
      f(buscar(nombres.ws, n.ws, r), d.ws ?? ''), f(buscar(nombres.mos, n.mos, r), d.mos ?? '')]
    familias.forEach((fam, k) => {
      const m = porModelo.get(fam)
      const titulo = `${col(L.familia(k))}$2`
      const cMou = `${col(L.familia(k))}${r}`
      const cVta = `${col(L.familia(k) + 1)}${r}`
      fila.push(f(mou('Retail', r, titulo), m?.mouRetail ?? 0), f(ventas('Retail', r, titulo), m?.ventasRetail ?? 0), f(pct(cVta, cMou), m?.pct ?? 0))
    })
    fila.push(REGLA_LABEL[d.reglaDealer])
    fila.push(
      f(mou('Demo', r), d.mouDemo), f(mou('Fleet', r), d.mouFlota), f(`C${r}+${c('MOU_DEMO', r)}+${c('MOU_FLOTA', r)}`, d.mouTotal),
      f(ventas('Demo', r), d.ventasDemo), f(ventas('Flota', r), d.ventasFlota), f(`D${r}+${c('SALES_DEMO', r)}+${c('SALES_FLOTA', r)}`, d.ventasTotal),
      f(pct(c('SALES_TOTAL', r), c('MOU_TOTAL', r)), d.pctTotal),
      f(`IF(BASE_BONO="retail",E${r},${c('PCT_TOTAL', r)})`, d.pctBono),
      f(`IF(ISNUMBER(G${r}),G${r}>=UMBRAL_WHS,FALSE)`, d.cumpleWhs),
      f(`IF(ISNUMBER(H${r}),H${r}>UMBRAL_MOS,FALSE)`, d.cumpleMos),
      f(`OR(SUPUESTO_INV,${c('CUMPLE_WHS', r)},${c('CUMPLE_MOS', r)})`, d.cumpleInventario),
      f(`E${r}>=UMBRAL_RETAIL`, d.cumpleRetail),
      f(`IF(INCLUSIVO,${c('PCT_BONO', r)}>=UMBRAL_BONO,${c('PCT_BONO', r)}>UMBRAL_BONO)`, d.superaBono),
      f(`OR(SUPUESTO_INV,IF(ISNUMBER(G${r}),IF(INCLUSIVO,G${r}>=UMBRAL_WHS,G${r}>UMBRAL_WHS),FALSE))`, d.whsReglaB),
      // Pago por dealer: fuera del rango de búsqueda de CALCULO para no crear referencias circulares.
      f(`COUNTIF(${C('J')},$B${r})`, d.unidadesProvision),
      f(`SUMIF(${C('J')},$B${r},${C('O')})`, d.provision),
      f(`COUNTIFS(${C('J')},$B${r},${C('V')},">0")`, d.unidadesPagadas),
      f(`SUMIF(${C('J')},$B${r},${C('T')})`, d.monto))
    return fila
  })

  const famCols = familias.flatMap(() => [{ titulo: 'MOU', fmt: FMT.entero, ancho: 8 }, { titulo: 'SALES', fmt: FMT.entero, ancho: 8 }, { titulo: '% ACHIEVE', fmt: FMT.pct, ancho: 10 }])
  const ayuda = (titulo, fmt) => ({ titulo, fmt, ayuda: true, ancho: 12 })
  tabla(ws, [
    { titulo: '#', ancho: 5 }, { titulo: 'DEALER', ancho: 24 }, { titulo: `${mes} MOU`, fmt: FMT.entero }, { titulo: `${mes} SALES`, fmt: FMT.entero },
    { titulo: 'ACHIEVE', fmt: FMT.pct }, { titulo: 'MISSING', fmt: FMT.entero }, { titulo: '% WHS', fmt: FMT.pct }, { titulo: 'MOS', fmt: FMT.decimal },
    ...famCols, { titulo: 'COMMENTS', ancho: 24 },
    ayuda('MOU DEMO', FMT.entero), ayuda('MOU FLEET', FMT.entero), ayuda('MOU TOTAL', FMT.entero), ayuda('SALES DEMO', FMT.entero),
    ayuda('SALES FLEET', FMT.entero), ayuda('SALES TOTAL', FMT.entero), ayuda('% TOTAL', FMT.pct), ayuda('% BASE BONO', FMT.pct),
    ayuda('CUMPLE WHS'), ayuda('CUMPLE MOS'), ayuda('CUMPLE INVENTARIO'), ayuda('CUMPLE RETAIL'), ayuda('SUPERA BONO'), ayuda('WHS REGLA B'),
    { titulo: 'UNID. CON PROVISIÓN', fmt: FMT.entero }, { titulo: 'PROVISIÓN', fmt: FMT.dinero, ancho: 15 },
    { titulo: 'UNID. PAGADAS', fmt: FMT.entero }, { titulo: 'MONTO A PAGAR', fmt: FMT.dinero, ancho: 16 }
  ], filas, { filaEncabezado: FILA_ENC_MODELO })

  // Fila 2: título del bloque y nombre de cada modelo (CALCULO lo usa con MATCH).
  ws.getCell('B2').value = 'RESUME'
  ws.getCell('B2').font = { bold: true, size: 12 }
  familias.forEach((fam, k) => {
    const celda = ws.getCell(2, L.familia(k))
    celda.value = fam
    celda.font = { bold: true, color: { argb: COLOR.rojo } }
    celda.alignment = { horizontal: 'center' }
  })

  // Fila de totales (como la fila 119 de la guía).
  const fin = FILA_DATOS_MODELO + filas.length - 1
  const tot = ws.getRow(fin + 1)
  tot.getCell(2).value = 'TOTAL'
  const sumar = [3, 4, 6, ...familias.flatMap((_, k) => [L.familia(k), L.familia(k) + 1]),
    L.MOU_DEMO, L.MOU_FLOTA, L.MOU_TOTAL, L.SALES_DEMO, L.SALES_FLOTA, L.SALES_TOTAL, L.UNID_PROV, L.PROVISION, L.UNID_PAGADAS, L.MONTO]
  sumar.forEach(k => { tot.getCell(k).value = f(`SUM(${col(k)}${FILA_DATOS_MODELO}:${col(k)}${Math.max(FILA_DATOS_MODELO, fin)})`) })
  tot.getCell(5).value = f(`IFERROR(D${fin + 1}/C${fin + 1},0)`)
  tot.getCell(5).numFmt = FMT.pct
  tot.getCell(L.PROVISION).numFmt = FMT.dinero
  tot.getCell(L.MONTO).numFmt = FMT.dinero
  tot.font = { bold: true }
  return { filas: filas.length, L }
}

export function hojaCalculo(ws, nombres, resultado, datos, n, modelo) {
  const { L, filas: nDealers } = modelo
  const MV = bloque(nombres.modelo, 'B', col(L.FIN_BUSQUEDA), nDealers, FILA_DATOS_MODELO)
  const TITULOS = `${ref(nombres.modelo)}!$B$2:$${col(L.FIN_BUSQUEDA)}$2`
  const PROV = bloque(nombres.provision, 'B', 'C', n.provision)
  const CURT = bloque(nombres.curtailment, 'A', 'B', n.curtailment)
  const idx = (k) => L[k] - 1 // índice de VLOOKUP contando desde la columna B
  const ventaPorFila = new Map(datos.ventas.map(v => [v.fila, v]))
  const dealerPor = new Map(resultado.dealers.map(d => [d.dealer, d]))
  const fechaExcel = (fr) => (fr ? new Date(Date.UTC(fr.anio, fr.mes - 1, fr.dia)) : null)

  const filas = vinsCalculo(resultado).map((v, i) => {
    const r = i + 2
    const venta = ventaPorFila.get(v.fila) ?? {}
    const d = dealerPor.get(v.dealer)
    const reglaExcel = v.regla === REGLA.SIN_DEALER ? REGLA.NO_CUMPLE : v.regla
    const llave = `$A${r}&"|"&$AC${r}`
    const bono = `AND($W${r}="Retail",IF(INCLUSIVO,X${r}>=UMBRAL_BONO,X${r}>UMBRAL_BONO),ISNA(MATCH($A${r},MODELOS_SIN_BONO,0)),ISNA(MATCH(${llave},MODELOS_SIN_BONO,0)))`
    const conReglaB = `ISNA(MATCH($A${r},MODELOS_SIN_REGLA_B,0)),ISNA(MATCH(${llave},MODELOS_SIN_REGLA_B,0))`
    const inv = `IFERROR(VLOOKUP($J${r},${MV},${idx('CUMPLE_INV')},0),FALSE)`
    const whsB = `IFERROR(VLOOKUP($J${r},${MV},${idx('WHS_B')},0),FALSE)`
    const modeloOk = `IF(INCLUSIVO,S${r}>=UMBRAL_MODELO,S${r}>UMBRAL_MODELO)`
    return [
      v.familia, v.vin, venta.modeloLocal ?? '', v.lsc, venta.regTypeDesc ?? '', v.usoTexto, fechaExcel(v.fechaRetail), venta.anioModelo ?? '',
      venta.dealerCodigo ?? '', v.dealer, venta.shipTo ?? '', venta.shipToName ?? '', venta.dealerRazon ?? '', venta.customerName2 ?? '',
      f(`IFERROR(VLOOKUP($B${r},${PROV},2,0),0)`, v.provision),
      f(`IFERROR(VLOOKUP($J${r},${MV},${idx('MOS')},0),"NA")`, v.mos ?? 'NA'),
      f(`IFERROR(VLOOKUP($J${r},${MV},${idx('WHS')},0),"NA")`, v.ws ?? 'NA'),
      f(`IFERROR(VLOOKUP($J${r},${MV},${idx('ACHIEVE')},0),0)`, v.pctRetail),
      f(`IFERROR(VLOOKUP($J${r},${MV},MATCH($A${r},${TITULOS},0)+2,0),0)`, v.pctModelo),
      f(`ROUND(O${r}*V${r},2)`, v.monto),
      f(`IFERROR(VLOOKUP($B${r},${CURT},2,0),"NA")`, v.regla === REGLA.EXCLUIDO ? (v.motivo.match(/\((.*)\)/)?.[1] ?? '') : 'NA'),
      f(`IF(OR(Y${r}="${REGLA.A_BONO}",Y${r}="${REGLA.B_BONO}"),FACTOR_BONO,IF(OR(Y${r}="${REGLA.A}",Y${r}="${REGLA.B}"),1,0))`, v.factor),
      USO_EXCEL[v.uso] ?? '',
      f(`IFERROR(VLOOKUP($J${r},${MV},${idx('PCT_BONO')},0),0)`, d?.pctBono ?? 0),
      f(`IF(AND(EXCLUIR_CURTAILMENT,U${r}<>"NA"),"${REGLA.EXCLUIDO}",IF(AND(R${r}>=UMBRAL_RETAIL,${inv}),IF(${bono},"${REGLA.A_BONO}","${REGLA.A}"),IF(AND(R${r}<UMBRAL_RETAIL,${whsB},${modeloOk},${conReglaB}),IF(${bono},"${REGLA.B_BONO}","${REGLA.B}"),"${REGLA.NO_CUMPLE}")))`, reglaExcel),
      v.monto,
      f(`ROUND(T${r}-Z${r},2)`, 0),
      v.motivo,
      v.version
    ]
  })
  const ayuda = (titulo, fmt, ancho = 13) => ({ titulo, fmt, ayuda: true, ancho })
  tabla(ws, [
    { titulo: 'MODEL', ancho: 9 }, { titulo: 'VIN', ancho: 21 }, { titulo: 'Local Model', ancho: 12 }, { titulo: 'LSC Description', ancho: 26 },
    { titulo: 'Reg.Type Desc', ancho: 16 }, { titulo: 'V.USG Text', ancho: 18 }, { titulo: 'Retail Date', fmt: FMT.fecha, ancho: 12 }, { titulo: 'Model Year', ancho: 10 },
    { titulo: 'Dealer', ancho: 12 }, { titulo: 'Sold Dealer Name (SSI)', ancho: 22 }, { titulo: 'Ship-to', ancho: 12 }, { titulo: 'Ship-to Name', ancho: 18 },
    { titulo: 'Dealer Name', ancho: 18 }, { titulo: 'Customer Name 2', ancho: 18 },
    { titulo: 'PROVIS', fmt: FMT.dinero }, { titulo: 'MOS', fmt: FMT.decimal, ancho: 8 }, { titulo: '%WHS', fmt: FMT.pct, ancho: 9 },
    { titulo: '% SALES', fmt: FMT.pct, ancho: 9 }, { titulo: '% MODEL', fmt: FMT.pct, ancho: 9 }, { titulo: 'MONTO A PAGAR', fmt: FMT.dinero, ancho: 15 },
    { titulo: 'Curtailment', ancho: 14 }, { titulo: 'Comp', fmt: FMT.decimal, ancho: 7 },
    ayuda('USO'), ayuda('% BASE BONO', FMT.pct), ayuda('REGLA'), ayuda('MONTO PLATAFORMA', FMT.dinero, 16), ayuda('DIFERENCIA', FMT.dinero), ayuda('MOTIVO (PLATAFORMA)', undefined, 60), ayuda('VERSIÓN', undefined, 18)
  ], filas)
  return filas.length
}
