import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { fixture } from './fixture.js'
import { calcularMargenVariable } from '../../src/incentivos/margen-variable/motor/calculo.js'
import { PRESET_FINANZAS, POLITICA_ESCRITA } from '../../src/incentivos/margen-variable/motor/parametros.js'
import { generarExcelFinanzas, nombreArchivoFinanzas } from '../../src/incentivos/margen-variable/excel/reporteFinanzas.js'
import { leerLibro } from '../../src/incentivos/margen-variable/excel/leerLibro.js'
import { leerCalculoFinanzas } from '../../src/incentivos/margen-variable/excel/leerCalculoFinanzas.js'

// Si se define MV_EXCEL_OUT, deja los libros generados ahí para verificarlos
// recalculando las fórmulas (scripts/verificar_excel_mv.py).
const OUT = process.env.MV_EXCEL_OUT

async function generar(parametros, escenario) {
  const datos = fixture()
  const resultado = calcularMargenVariable(datos, { parametros, escenario })
  const buf = await generarExcelFinanzas({ datos, resultado, meta: { archivos: ['fixture'], generado: '2026-11-19 10:00' } }, { ExcelJS })
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf)
  return { resultado, buf, wb }
}

describe('generarExcelFinanzas', () => {
  test('crea las hojas con los nombres de la guía', async () => {
    const { wb } = await generar()
    assert.deepEqual(wb.worksheets.map(w => w.name), ['MONTHLY MV NOV 26', 'MV NOV por Modelo', 'CALCULO', 'Resumen de Pago', 'BC',
      'SALES', 'PROVISION', 'MOS', 'WHS', 'MOU', 'DEALERS', 'Curtailment', 'PARAMETROS'])
  })

  test('CALCULO usa las columnas de la guía', async () => {
    const { wb } = await generar()
    const enc = wb.getWorksheet('CALCULO').getRow(1).values.slice(1, 23)
    assert.deepEqual(enc.slice(0, 2), ['MODEL', 'VIN'])
    assert.deepEqual(enc.slice(14), ['PROVIS', 'MOS', '%WHS', '% SALES', '% MODEL', 'MONTO A PAGAR', 'Curtailment', 'Comp'])
  })

  test('MV por Modelo trae MOU, SALES, ACHIEVE, MISSING, % WHS y MOS por dealer', async () => {
    const { wb } = await generar()
    const ws = wb.getWorksheet('MV NOV por Modelo')
    assert.deepEqual(ws.getRow(3).values.slice(2, 9), ['DEALER', 'NOV MOU', 'NOV SALES', 'ACHIEVE', 'MISSING', '% WHS', 'MOS'])
    assert.equal(ws.getCell('I2').value, 'K3')
  })

  test('CALCULO está formulado y trae el resultado de la plataforma en caché', async () => {
    const { wb, resultado } = await generar()
    const ws = wb.getWorksheet('CALCULO')
    const t2 = ws.getCell('T2').value
    assert.equal(t2.formula, 'ROUND(O2*V2,2)')
    assert.match(ws.getCell('Y2').value.formula, /UMBRAL_RETAIL/)
    const conProvision = resultado.vins.filter(v => v.regla !== 'SIN_PROVISION').length
    assert.equal(ws.actualRowCount, conProvision + 1)
  })

  test('define los parámetros como nombres', async () => {
    const { wb } = await generar()
    const nombres = new Set(wb.definedNames.model.map(n => n.name))
    for (const n of ['UMBRAL_RETAIL', 'UMBRAL_WHS', 'UMBRAL_BONO', 'BASE_BONO', 'INCLUSIVO', 'MODELOS_SIN_BONO', 'FACTOR_RUNRATE', 'TIPO_CAMBIO', 'CENTRO_COSTO']) {
      assert.ok(nombres.has(n), `falta el nombre ${n}`)
    }
  })

  test('SALES marca las filas no consideradas con su motivo', async () => {
    const { buf } = await generar()
    const libro = await leerLibro(buf, { ExcelJS })
    const { headers, rows } = libro.SALES
    const iVin = headers.indexOf('VIN')
    const iCuenta = headers.indexOf('CONSIDERADA')
    const iObs = headers.indexOf('OBSERVACION')
    const obs = rows.filter(r => r[iCuenta] === 0).map(r => `${r[iVin]}:${r[iObs]}`)
    assert.deepEqual(obs.sort(), ['A1:VIN duplicado', 'A7:Fuera de periodo'])
  })

  test('el lector ligero de Finanzas lee CALCULO de un libro generado', async () => {
    const { buf, resultado } = await generar(PRESET_FINANZAS)
    const { porVin } = await leerCalculoFinanzas(buf)
    assert.equal(porVin.get('H1').monto, 1500)
    assert.equal(porVin.size, resultado.resumen.unidadesConProvision)
  })

  test('nombre de archivo distingue cierre y forecast', () => {
    assert.equal(nombreArchivoFinanzas({ periodo: '202611', escenario: { supuestoInventario: false, factorRunRate: 1 } }), 'Calculation File_MV NOV 26.xlsx')
    assert.equal(nombreArchivoFinanzas({ periodo: '202611', escenario: { supuestoInventario: true, factorRunRate: 1 } }), 'Calculation File_MV NOV 26 Forecast.xlsx')
  })

  test('escribe los libros para verificación externa (opcional)', { skip: !OUT }, async () => {
    fs.mkdirSync(OUT, { recursive: true })
    const casos = [['guia', {}, {}], ['politica', POLITICA_ESCRITA, {}], ['forecast', {}, { supuestoInventario: true, factorRunRate: 30 / 28 }],
      ['exclusiones', { ...POLITICA_ESCRITA, modelosSinBono: ['SONET', 'K3|TEST'], modelosSinReglaB: ['SELTOS'] }, {}]]
    for (const [nombre, parametros, escenario] of casos) {
      const { buf } = await generar(parametros, escenario)
      fs.writeFileSync(path.join(OUT, `fixture_${nombre}.xlsx`), Buffer.from(buf))
    }
  })
})
