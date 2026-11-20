// ============================================================
//  Construye el paquete demo de Margen Variable (marzo 2026)
//  en el formato EXACTO de los layouts de carga mensual.
//
//  Por qué: los layouts de ejemplo del repo no cruzan entre sí
//  (la provisión es de 202603 y las ventas de nov-2026, sin VIN
//  en común). El archivo de cálculo de Finanzas de marzo sí es
//  consistente, así que de ahí se toman ventas, provisión, MOS,
//  WHS, MOU retail y curtailment. MOU Demo/Fleet y CAT_DEALERS se
//  toman del Layout_Carga_MV (el cálculo de Finanzas no los trae).
//
//  Uso:  node scripts/construir-demo-mv.mjs
//  Lee:  ./Calculation File_MV Axon.xlsx, ./Layout_Carga_MV.xlsx
//  Crea: ./public/demo/MV_Ventas_202603.xlsx
//        ./public/demo/MV_Layout_202603.xlsx
//        ./public/demo/MV_CalculoFinanzas_202603.xlsx
// ============================================================

import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { leerLibro, valorCelda } from '../src/incentivos/margen-variable/excel/leerLibro.js'
import { LAYOUT_VENTAS } from '../src/incentivos/margen-variable/motor/layouts.js'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const CALC = path.join(RAIZ, 'Calculation File_MV Axon.xlsx')
const LAYOUT = path.join(RAIZ, 'Layout_Carga_MV.xlsx')
const SALIDA = path.join(RAIZ, 'public', 'demo')
const PERIODO = '202603'
const ANIO = 2026
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function filas(ws, filaEncabezado = 1) {
  const enc = ws.getRow(filaEncabezado)
  const headers = []
  enc.eachCell({ includeEmpty: true }, (c, i) => { headers[i - 1] = String(valorCelda(c.value) ?? '').trim() })
  const out = []
  ws.eachRow((row, n) => {
    if (n <= filaEncabezado) return
    out.push(headers.map((_, i) => valorCelda(row.getCell(i + 1).value)))
  })
  return { headers, rows: out }
}

const col = (headers, nombre) => {
  const i = headers.findIndex(h => h.replace(/\s+/g, ' ').trim() === nombre)
  if (i === -1) throw new Error(`Columna no encontrada: ${nombre}`)
  return i
}

async function escribir(nombre, hojas) {
  const wb = new ExcelJS.Workbook()
  for (const { hoja, headers, rows } of hojas) {
    const ws = wb.addWorksheet(hoja)
    ws.addRow(headers).font = { bold: true }
    rows.forEach(r => ws.addRow(r))
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    headers.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(10, Math.min(28, h.length + 4)) })
  }
  const destino = path.join(SALIDA, nombre)
  await wb.xlsx.writeFile(destino)
  console.log(`✓ ${path.relative(RAIZ, destino)} (${hojas.map(h => `${h.hoja}: ${h.rows.length}`).join(', ')})`)
}

async function main() {
  for (const f of [CALC, LAYOUT]) if (!fs.existsSync(f)) throw new Error(`No existe ${f}`)
  fs.mkdirSync(SALIDA, { recursive: true })

  const calc = new ExcelJS.Workbook()
  await calc.xlsx.readFile(CALC)
  const layout = await leerLibro(fs.readFileSync(LAYOUT), { ExcelJS })

  // 1) Ventas → Layout Carga Ventas
  const sales = filas(calc.getWorksheet('SALES'))
  const idxVentas = LAYOUT_VENTAS.columnas.map(c => col(sales.headers, c))
  const ventas = sales.rows.filter(r => r[idxVentas[0]]).map(r => idxVentas.map(i => r[i]))

  // 2) Provisión y cálculo de referencia ← CALCULO
  const calculo = filas(calc.getWorksheet('CALCULO'))
  const c = (n) => col(calculo.headers, n)
  const iVin = c('VIN')
  const conVin = calculo.rows.filter(r => r[iVin])
  const provision = conVin.map(r => [PERIODO, r[iVin], r[c('PROVIS')]])
  const refCols = ['MODEL', 'VIN', 'Local Mode', 'LSC Descri', 'V.USG Text', 'Sold Dealer Name (SSI)', 'PROVIS', 'MOS', '%WHS', '% SALES', '% MODEL', 'MONTO A PAGAR']
  const referencia = conVin.map(r => refCols.map(n => r[c(n)]))

  // 3) MOS (hoja MOS, encabezado en fila 3, col F) y WHS (hoja WHS, col AP = Avance WHS+Crédito %)
  const mosWs = calc.getWorksheet('MOS')
  const mos = []
  mosWs.eachRow((row, n) => {
    const dealer = valorCelda(row.getCell(2).value)
    if (n > 3 && dealer) mos.push([PERIODO, String(dealer).trim(), Number(valorCelda(row.getCell(6).value)) || 0])
  })
  const whsWs = calc.getWorksheet('WHS')
  const ws = []
  whsWs.eachRow((row, n) => {
    const dealer = valorCelda(row.getCell(1).value)
    const v = Number(valorCelda(row.getCell(42).value))
    if (n > 3 && dealer && Number.isFinite(v)) ws.push([PERIODO, String(dealer).trim(), Math.round(v * 10000) / 10000])
  })

  // 4) MOU: Retail ← "MOU 2026" del cálculo; Demo/Fleet ← Layout_Carga_MV
  const mouCalc = filas(calc.getWorksheet('MOU 2026'))
  const iD = col(mouCalc.headers, 'DEALER')
  const iM = col(mouCalc.headers, 'Modelo')
  const mou = []
  for (const r of mouCalc.rows) {
    const dealer = String(r[iD] ?? '').trim()
    const modelo = String(r[iM] ?? '').trim()
    if (!dealer || !modelo || modelo === 'Total' || dealer.endsWith('Total')) continue
    MESES.forEach((m, k) => mou.push([ANIO, k + 1, dealer, 'Retail', modelo, Number(r[col(mouCalc.headers, m)]) || 0]))
  }
  const lyMou = layout['4. LY_MOU']
  for (const r of lyMou.rows) if (r[3] === 'Demo' || r[3] === 'Fleet') mou.push(r)

  const cat = layout.CAT_DEALERS

  // 5) Curtailment (hoja opcional propuesta) ← hoja "Curtailment" del cálculo
  const curt = filas(calc.getWorksheet('Curtailment'))
  const curtailment = curt.rows.filter(r => r[0]).map(r => [String(r[0]).trim(), String(r[2] ?? '').trim()])

  await escribir(`MV_Ventas_${PERIODO}.xlsx`, [{ hoja: 'Data', headers: LAYOUT_VENTAS.columnas, rows: ventas }])
  await escribir(`MV_Layout_${PERIODO}.xlsx`, [
    { hoja: '1. LY_PROVISION_VIN', headers: ['PERIODO', 'VIN', 'MONTO_PROVISION'], rows: provision },
    { hoja: '2. LY_MOS_DEALER', headers: ['PERIODO', 'DEALER', 'MOS'], rows: mos },
    { hoja: '3. LY_WS_DEALER', headers: ['PERIODO', 'DEALER', 'WS_PCT'], rows: ws },
    { hoja: '4. LY_MOU', headers: lyMou.headers, rows: mou },
    { hoja: 'CAT_DEALERS', headers: cat.headers, rows: cat.rows },
    { hoja: '5. LY_CURTAILMENT', headers: ['VIN', 'PROGRAMA'], rows: curtailment }
  ])
  await escribir(`MV_CalculoFinanzas_${PERIODO}.xlsx`, [{ hoja: 'CALCULO', headers: refCols, rows: referencia }])
}

main().catch(err => { console.error(err); process.exit(1) })
