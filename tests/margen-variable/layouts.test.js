import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizarVentas, normalizarLayoutMV, fecha, numero, usoVehiculo, familiaModelo, periodo, LAYOUT_VENTAS
} from '../../src/incentivos/margen-variable/motor/layouts.js'
import { USO } from '../../src/incentivos/margen-variable/motor/parametros.js'

describe('conversores', () => {
  test('fecha acepta Date, serial de Excel y texto', () => {
    assert.deepEqual(fecha(new Date(Date.UTC(2026, 2, 13))), { anio: 2026, mes: 3, dia: 13 })
    assert.deepEqual(fecha(46094), { anio: 2026, mes: 3, dia: 13 })
    assert.deepEqual(fecha('13.03.2026'), { anio: 2026, mes: 3, dia: 13 })
    assert.deepEqual(fecha('2026-03-13'), { anio: 2026, mes: 3, dia: 13 })
    assert.equal(fecha('no es fecha'), null)
  })

  test('numero acepta porcentajes, comas y resultado de fórmula', () => {
    assert.equal(numero('95%'), 0.95)
    assert.equal(numero('1,234.5'), 1234.5)
    assert.equal(numero({ formula: 'A1', result: 3 }), 3)
    assert.equal(numero(''), null)
    assert.equal(numero('abc'), null)
  })

  test('uso del vehículo desde V.USG Text con respaldo en Reg.Type', () => {
    assert.equal(usoVehiculo('Inventario Nuevo'), USO.RETAIL)
    assert.equal(usoVehiculo('Flotas de Distribuidor'), USO.FLOTA)
    assert.equal(usoVehiculo('Auto de Cortesía'), USO.DEMO)
    assert.equal(usoVehiculo('', '12'), USO.FLOTA)
    assert.equal(usoVehiculo('???', ''), null)
  })

  test('familia agrupa SD/HB y periodo se normaliza', () => {
    assert.equal(familiaModelo('K3 HB'), 'K3')
    assert.equal(familiaModelo('sportage hev'), 'SPORTAGE HEV')
    assert.equal(periodo(202603), '202603')
    assert.equal(periodo('2026-03'), '202603')
    assert.equal(periodo('2026'), null)
  })
})

describe('normalizarVentas', () => {
  const fila = ['VIN1', '8X', 'SONET 1.5L', 'C1', 'RS', 'Kia A', 'S1', 'RS', 'Kia A', '2027', new Date(Date.UTC(2026, 10, 3)),
    '10', 'Dealer Retail', '02', 'Inventario Nuevo', 'DSM 01', 'SONET', 'EX']

  test('lee el layout con encabezados en cualquier orden de mayúsculas', () => {
    const headers = LAYOUT_VENTAS.columnas.map(c => c.toUpperCase())
    const { registros, errores } = normalizarVentas({ Data: { headers, rows: [fila, [null, null]] } })
    assert.deepEqual(errores, [])
    assert.equal(registros.length, 1)
    assert.equal(registros[0].dealer, 'Kia A')
    assert.equal(registros[0].uso, USO.RETAIL)
    assert.equal(registros[0].familia, 'SONET')
    assert.equal(registros[0].fila, 2)
  })

  test('falla con mensaje claro si faltan columnas obligatorias', () => {
    const { errores } = normalizarVentas({ Data: { headers: ['VIN'], rows: [] } })
    assert.match(errores[0], /Sold Dealer Name\(SSI\)/)
  })
})

describe('normalizarLayoutMV', () => {
  const libro = {
    '1. LY_PROVISION_VIN': { headers: ['PERIODO', 'VIN', 'MONTO_PROVISION'], rows: [['202603', 'v1', 10], ['202603', 'v2', null]] },
    '2. LY_MOS_DEALER': { headers: ['PERIODO', 'DEALER', 'MOS'], rows: [['202603', 'Kia A', 2.1]] },
    '3. LY_WS_DEALER': { headers: ['PERIODO', 'DEALER', 'WS_PCT'], rows: [['202603', 'Kia A', 0.95]] },
    '4. LY_MOU': { headers: ['ANIO', 'MES', 'DEALER', 'CATEGORIA', 'MODELO', 'MOU_UNIDADES'], rows: [[2026, 3, 'Kia A', 'Fleet', 'K3 SD', 4]] },
    CAT_DEALERS: { headers: ['COD_DEALER', 'DEALER', 'RAZON_SOCIAL', 'GRUPO', 'DSM', 'ESTATUS'], rows: [['D1', 'Kia A', 'RS', 'G', 'DSM', 'ACTIVO']] }
  }

  test('encuentra hojas con prefijo, tipa valores y omite provisión sin monto', () => {
    const { tablas, errores, avisos } = normalizarLayoutMV(libro)
    assert.deepEqual(errores, [])
    assert.equal(tablas.provision.length, 1)
    assert.equal(tablas.provision[0].vin, 'V1')
    assert.equal(tablas.mou[0].uso, USO.FLOTA)
    assert.equal(tablas.mou[0].familia, 'K3')
    assert.deepEqual(tablas.curtailment, [])
    assert.match(avisos[0], /1 filas de provisión/)
  })

  test('reporta hojas obligatorias faltantes', () => {
    const { errores } = normalizarLayoutMV({ CAT_DEALERS: libro.CAT_DEALERS })
    assert.equal(errores.length, 4)
  })
})

describe('categoría de MOU', () => {
  test('acepta mayúsculas/minúsculas y Flota como Fleet', async () => {
    const { categoriaMou } = await import('../../src/incentivos/margen-variable/motor/layouts.js')
    assert.equal(categoriaMou('RETAIL'), 'Retail')
    assert.equal(categoriaMou('flota'), 'Fleet')
    assert.equal(categoriaMou('Otra'), 'Otra')
  })
})

describe('abrirZipSeguro', () => {
  test('rechaza archivos que no son zip y los que exceden el límite', async () => {
    const { abrirZipSeguro } = await import('../../src/incentivos/margen-variable/excel/limiteZip.js')
    const { default: JSZip } = await import('jszip')
    await assert.rejects(abrirZipSeguro(new Uint8Array([1, 2, 3])), /no es un \.xlsx/)
    const zip = new JSZip()
    zip.file('a.txt', 'x'.repeat(5000))
    const buf = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    await assert.rejects(abrirZipSeguro(buf, 1000), /máximo/)
    await assert.doesNotReject(abrirZipSeguro(buf))
  })
})
