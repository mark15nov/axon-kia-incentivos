import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { cargarDatosFidelity } from './cargar.js'
import { calcularFidelity } from '../../src/incentivos/kia-fidelity/motor/calculo.js'
import { evaluarAceptacion } from '../../src/incentivos/kia-fidelity/motor/aceptacion.js'
import { correoFinanciera } from '../../src/incentivos/kia-fidelity/motor/correo.js'
import { interesesMensuales, chargeRecalculado } from '../../src/incentivos/kia-fidelity/motor/amortizacion.js'
import { mesesEntre, diasEntre, periodoDeMesAnio } from '../../src/incentivos/kia-fidelity/motor/fechas.js'
import { construirMatriz, evaluarCompatibilidad } from '../../src/incentivos/shared/compatibilidad.js'
import { normalizarParametros } from '../../src/incentivos/kia-fidelity/motor/parametros.js'
import { generarExcelFidelity, generarVinsPagadosActualizado } from '../../src/incentivos/kia-fidelity/excel/reporteFidelity.js'
import { leerLibro } from '../../src/incentivos/margen-variable/excel/leerLibro.js'
import { normalizarPagados } from '../../src/incentivos/kia-fidelity/motor/layouts.js'

const CARPETA = 'public/demo/fidelity'
let datos
let casos
let r
const dossier = (d) => r.contratos.find(c => c.dossier === d)
const codigos = (c) => [...c.observaciones, ...c.motivos, ...c.notas, ...c.porRevisar].map(x => x.codigo)

before(async () => {
  ({ datos, casos } = await cargarDatosFidelity(CARPETA))
  r = calcularFidelity(datos)
})

describe('prueba de aceptación (archivos SIMULADO)', () => {
  test('detecta todos los casos plantados', () => {
    const a = evaluarAceptacion(r, casos)
    assert.deepEqual(a.filas.filter(f => !f.ok).map(f => `${f.dossier} ${f.caso}`), [])
    assert.equal(a.detectados, 30)
  })

  test('cuadre: todos los Dossier en la calculadora y suma del Charge = hoja CHARGE', () => {
    assert.equal(r.cuadre.cuadra, true)
    assert.equal(r.cuadre.totalHojaCharge.toFixed(2), '445185.35')
  })

  test('resumen de dos columnas separadas que cuadra', () => {
    const { pago, debito } = r.resumen
    assert.equal(pago.cuadra, true)
    assert.equal(pago.aPagar, 351229.74)
    assert.equal(pago.ajustes, -28358.32)
    assert.equal(pago.retenido, 65597.3)
    assert.equal(debito.vins, 6)
    assert.equal(debito.total, 77251.09)
  })

  test('subtotales por razón social cuadran con el resumen', () => {
    const s = (k) => Math.round(r.porRazonSocial.reduce((a, x) => a + x[k], 0) * 100) / 100
    assert.equal(s('aPagar'), r.resumen.pago.aPagar)
    assert.equal(s('debito'), r.resumen.debito.total)
  })

  test('comentarios por VIN con el formato pedido', () => {
    assert.match(dossier('9300000106').motivos[0].texto, /^Fidelity ya pagado en jul-26 por \$3,860\.78$/)
    assert.match(dossier('9300000108').motivos[0].texto, /^Ya se pagó Cashback en jul-26 por \$24,000$/)
    assert.match(dossier('9300000103').motivos[0].texto, /VIN también en Dossier 9300000104/)
    assert.match(dossier('9300000120').motivos[0].texto, /^Retail 20-may, contrato 05-sep: fuera de plazo/)
    assert.match(dossier('9300000111').motivos[0].texto, /^Alta demo 04-sep, contrato 24-sep: 20 días/)
  })

  test('Charge recalculado al centavo y ajustes conocidos', () => {
    assert.equal(dossier('9300000116').montoPagar, 27931)
    assert.ok(codigos(dossier('9300000116')).includes('INTERES_REAL_AC'))
    assert.equal(dossier('9300000122').montoPagar, 7512.23)
    assert.equal(dossier('9300000100').chargeRecalculado, dossier('9300000100').chargeReclamado)
  })

  test('el débito al dealer no se resta del pago a la financiera', () => {
    const c = dossier('9300000106')
    assert.equal(c.estatusPago, 'PROCEDE')
    assert.equal(c.montoPagar, 21735.64)
    assert.equal(c.estatusDebito, 'DEBITO')
  })

  test('VIN sin SAP queda "por revisar" en el débito (no se inventa criterio)', () => {
    assert.equal(dossier('9300000118').estatusDebito, 'POR_REVISAR')
    assert.equal(dossier('9300000126').estatusDebito, 'POR_REVISAR')
  })

  test('VINS_PAGADOS al cierre agrega sólo los contratos pagados con su matriz', () => {
    assert.equal(r.vinsPagadosNuevos.length, r.contratos.filter(c => c.montoPagar > 0).length)
    assert.equal(r.vinsPagadosNuevos[0].incompatibles, '|CB|CT|DF|FD|')
    assert.equal(r.vinsPagadosNuevos[0].periodo, '202609')
  })

  test('el correo a la financiera lista ajustes y retenidos (sin débitos a dealers)', () => {
    const { asunto, cuerpo } = correoFinanciera(r)
    assert.match(asunto, /septiembre 2026/)
    assert.match(cuerpo, /Monto a pagar:\s+\$351,229\.74/)
    assert.match(cuerpo, /Dossier 9300000124/)
    assert.doesNotMatch(cuerpo, /Cashback/)
  })
})

describe('parámetros configurables', () => {
  test('N-rule más amplia deja de debitar el retail de mayo', () => {
    const r2 = calcularFidelity(datos, { parametros: { nRuleMeses: 6 } })
    assert.equal(r2.contratos.find(c => c.dossier === '9300000120').estatusDebito, 'SIN_DEBITO')
  })
  test('antigüedad de demo menor deja pasar el demo de 20 días', () => {
    const r2 = calcularFidelity(datos, { parametros: { demoMinDias: 15 } })
    assert.equal(r2.contratos.find(c => c.dossier === '9300000111').estatusDebito, 'SIN_DEBITO')
  })
  test('rechaza parámetros inválidos', () => {
    assert.throws(() => normalizarParametros({ nRuleMeses: -1 }), /nRuleMeses/)
    assert.throws(() => normalizarParametros({ baseDebito: 'x' }), /baseDebito/)
  })
})

describe('piezas del motor', () => {
  test('amortización: interés del mes 1 = monto × tasa/12', () => {
    assert.equal(interesesMensuales(331330, 8.95, 36)[0].toFixed(6), (331330 * 0.0895 / 12).toFixed(6))
    assert.equal(chargeRecalculado({ monto: 331330, tasaReal: 8.95, beneficio: 1, plazo: 36 }).charge.toFixed(2), '5573.31')
  })
  test('fechas y periodo', () => {
    assert.equal(mesesEntre({ anio: 2026, mes: 5, dia: 20 }, { anio: 2026, mes: 9, dia: 5 }), 4)
    assert.equal(diasEntre({ anio: 2026, mes: 9, dia: 4 }, { anio: 2026, mes: 9, dia: 24 }), 20)
    assert.equal(periodoDeMesAnio('Sep-26'), '202609')
    assert.equal(periodoDeMesAnio('ene-2027'), '202701')
  })
  test('compatibilidad: pareja sin regla queda por revisar', () => {
    const m = construirMatriz([{ pagado: 'CB', reclamado: 'FD', permitido: false }, { pagado: 'FB', reclamado: 'FD', permitido: true }])
    const e = evaluarCompatibilidad([{ codigo: 'CB', monto: 1, periodo: '202607' }, { codigo: 'FB', monto: 1, periodo: '202607' }, { codigo: 'ZZ', monto: 1, periodo: '202607' }], 'FD', m)
    assert.equal(e.incompatibles.length, 1)
    assert.equal(e.compatibles.length, 1)
    assert.equal(e.sinRegla.length, 1)
  })
  test('uso flota no cubierto queda por revisar', () => {
    const sap = datos.sap.map(s => (s.vin === '3KPFC4AAXT7000000' ? { ...s, regTypeDesc: 'Dealer Fleet' } : s))
    const r2 = calcularFidelity({ ...datos, sap })
    assert.equal(r2.contratos.find(c => c.dossier === '9300000100').estatusDebito, 'POR_REVISAR')
  })
})

describe('Excel de cierre', () => {
  test('genera hojas del cierre y VINS_PAGADOS reutilizable', async () => {
    const buf = await generarExcelFidelity({ resultado: r, datos }, { ExcelJS })
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buf)
    assert.deepEqual(wb.worksheets.map(w => w.name), ['RESUMEN', 'PAGO_FINANCIERA', 'DEBITOS_DEALER', 'POR_RAZON_SOCIAL', 'OBSERVACIONES'])
    assert.equal(wb.getWorksheet('RESUMEN').getCell('C10').value.result, 351229.74)

    const vp = await generarVinsPagadosActualizado({ resultado: r, datos }, { ExcelJS })
    const { pagos, compat, errores } = normalizarPagados(await leerLibro(vp, { ExcelJS }))
    assert.deepEqual(errores, [])
    assert.equal(pagos.length, datos.pagos.length + r.vinsPagadosNuevos.length)
    assert.equal(compat.length, datos.compat.length)
    // Re-procesar con el historial actualizado: todo lo pagado este mes ya aparece como "ya pagado".
    const r2 = calcularFidelity({ ...datos, pagos })
    assert.equal(r2.contratos.find(c => c.dossier === '9300000100').motivos[0].codigo, 'YA_PAGADO')
  })
})
