import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { fixture, ESPERADO } from './fixture.js'
import { calcularMargenVariable, REGLA, detectarPeriodo, avanceDelMes } from '../../src/incentivos/margen-variable/motor/calculo.js'
import { PRESET_FINANZAS, POLITICA_ESCRITA, normalizarParametros } from '../../src/incentivos/margen-variable/motor/parametros.js'
import { conciliar } from '../../src/incentivos/margen-variable/motor/conciliacion.js'

const porDealer = (r) => Object.fromEntries(r.dealers.map(d => [d.dealer, d.monto]))
const vin = (r, id) => r.vins.find(v => v.vin === id)

describe('calcularMargenVariable · política escrita', () => {
  const r = calcularMargenVariable(fixture(), { parametros: POLITICA_ESCRITA })

  test('detecta el periodo por la fecha de retail más frecuente', () => {
    assert.equal(r.periodo, '202611')
  })

  test('total y monto por dealer coinciden con lo calculado a mano', () => {
    assert.equal(r.resumen.montoTotal, ESPERADO.politica.total)
    assert.deepEqual(porDealer(r), ESPERADO.politica.porDealer)
  })

  test('regla A con bono: retail no-Sonet ×1.5; Sonet y flota sin bono', () => {
    assert.equal(vin(r, 'A1').regla, REGLA.A_BONO)
    assert.equal(vin(r, 'A1').monto, 1500)
    assert.equal(vin(r, 'A5').regla, REGLA.A)
    assert.match(vin(r, 'A5').motivo, /excluido del bono/)
    assert.equal(vin(r, 'A6').regla, REGLA.A)
    assert.equal(vin(r, 'A6').monto, 1000)
  })

  test('regla A se cumple por MOS > 2 aunque WHS < 90%', () => {
    assert.equal(vin(r, 'B1').regla, REGLA.A)
  })

  test('retail ≥ 100% sin WHS ni MOS no paga y explica el motivo', () => {
    assert.equal(vin(r, 'G1').regla, REGLA.NO_CUMPLE)
    assert.match(vin(r, 'G1').motivo, /WHS 80\.0% < 90\.0% y MOS 1\.5 ≤ 2/)
  })

  test('regla B paga todas las unidades del modelo que cumple (incluida demo)', () => {
    assert.equal(vin(r, 'D4').regla, REGLA.B)
    assert.equal(vin(r, 'D4').monto, 2000)
    assert.equal(vin(r, 'D5').regla, REGLA.NO_CUMPLE)
  })

  test('umbrales estrictos: WHS = 90%, modelo = 100% y ventas = 110% no califican', () => {
    assert.equal(vin(r, 'E1').regla, REGLA.NO_CUMPLE)
    assert.equal(vin(r, 'Z1').regla, REGLA.NO_CUMPLE)
    assert.equal(vin(r, 'H1').regla, REGLA.A)
  })

  test('curtailment no es parte de la política: la unidad se paga', () => {
    assert.equal(vin(r, 'H3').regla, REGLA.A)
    assert.equal(vin(r, 'H3').monto, 1000)
  })

  test('el bono también aplica a unidades pagadas por regla B', () => {
    assert.equal(vin(r, 'I1').regla, REGLA.B_BONO)
    assert.equal(vin(r, 'I1').monto, 3000)
    assert.equal(vin(r, 'I4').regla, REGLA.NO_CUMPLE)
  })

  test('ventas sin provisión no pagan y se reportan', () => {
    assert.equal(vin(r, 'H5').regla, REGLA.SIN_PROVISION)
    assert.ok(r.incidencias.some(i => i.tipo === 'venta_sin_provision'))
  })

  test('dealer sin catálogo ni MOU no paga y se reporta', () => {
    assert.equal(vin(r, 'T1').regla, REGLA.SIN_DEALER)
    assert.deepEqual(r.incidencias.find(i => i.tipo === 'dealer_sin_catalogo').ejemplos, ['Kia Theta'])
  })

  test('reporta fuera de periodo, duplicados y provisión sin venta', () => {
    const tipos = Object.fromEntries(r.incidencias.map(i => [i.tipo, i]))
    assert.deepEqual(tipos.venta_fuera_periodo.ejemplos, ['A7'])
    assert.deepEqual(tipos.vin_duplicado.ejemplos, ['A1'])
    assert.deepEqual(tipos.provision_sin_venta.ejemplos, ['XPROV'])
  })

  test('el MOU de otro mes no se suma', () => {
    const alfa = r.dealers.find(d => d.dealer === 'Kia Alfa')
    assert.equal(alfa.mouRetail, 5)
    assert.equal(alfa.pctRetail, 1)
  })

  test('resumen con IVA y por razón social', () => {
    assert.equal(r.resumen.montoConIva, 29100 * 1.16)
    const uno = r.resumen.porRazonSocial.find(x => x.clave === 'RS Uno S.A.')
    assert.equal(uno.monto, 7500 + 1600)
  })
})

describe('calcularMargenVariable · reglas de la guía (default)', () => {
  const r = calcularMargenVariable(fixture())

  test('el default son las reglas de la guía', () => {
    assert.deepEqual(calcularMargenVariable(fixture(), { parametros: PRESET_FINANZAS }).resumen, r.resumen)
  })

  test('total y montos por dealer', () => {
    assert.equal(r.resumen.montoTotal, ESPERADO.finanzas.total)
    assert.deepEqual(porDealer(r), ESPERADO.finanzas.porDealer)
  })

  test('bono sobre retail (no total) y con ≥', () => {
    assert.equal(vin(r, 'A1').regla, REGLA.A)
    assert.equal(vin(r, 'H1').regla, REGLA.A_BONO)
  })

  test('curtailment excluye la unidad aunque el dealer cumpla', () => {
    assert.equal(vin(r, 'H3').regla, REGLA.EXCLUIDO)
    assert.equal(vin(r, 'H3').monto, 0)
  })

  test('sin bono en regla B cuando la base es retail', () => {
    assert.equal(vin(r, 'I1').regla, REGLA.B)
  })

  test('regla B con ≥ en WHS y modelo', () => {
    assert.equal(vin(r, 'E1').regla, REGLA.B)
    assert.equal(vin(r, 'Z1').regla, REGLA.B)
  })
})

describe('forecast', () => {
  test('supuesto de inventario hace cumplir WHS/MOS por default', () => {
    const r = calcularMargenVariable(fixture(), { escenario: { supuestoInventario: true } })
    assert.equal(vin(r, 'G1').regla, REGLA.A)
    assert.equal(vin(r, 'E1').regla, REGLA.B)
  })

  test('run-rate proyecta el cumplimiento y el monto', () => {
    const r = calcularMargenVariable(fixture(), { escenario: { factorRunRate: 2 } })
    const delta = r.dealers.find(d => d.dealer === 'Kia Delta')
    assert.equal(delta.pctRetail, 8 / 5)
    assert.equal(r.resumen.montoProyectado, Math.round(r.resumen.montoTotal * 2 * 100) / 100)
  })

  test('avanceDelMes calcula el factor con el último día con ventas', () => {
    const a = avanceDelMes(fixture().ventas, '202611')
    assert.deepEqual(a, { diasMes: 30, ultimoDia: 5, factorRunRate: 6 })
  })
})

describe('parámetros y errores', () => {
  test('rechaza parámetros inválidos', () => {
    assert.throws(() => normalizarParametros({ umbralWhs: -1 }), /umbralWhs/)
    assert.throws(() => normalizarParametros({ baseBono: 'otro' }), /baseBono/)
  })

  test('sin fechas de retail no hay periodo', () => {
    assert.equal(detectarPeriodo([{ fechaRetail: null }]), null)
    assert.throws(() => calcularMargenVariable({ ...fixture(), ventas: [] }), /periodo/)
  })

  test('usa MOS/WS del último periodo disponible y avisa', () => {
    const d = fixture()
    const r = calcularMargenVariable({ ...d, ws: d.ws.map(w => ({ ...w, periodo: '202610' })) })
    assert.equal(r.periodosFuente.ws, '202610')
    assert.ok(r.incidencias.some(i => i.tipo === 'periodo_ws'))
  })
})

describe('conciliar', () => {
  test('compara VIN por VIN contra el cálculo de Finanzas', () => {
    const r = calcularMargenVariable(fixture(), { parametros: POLITICA_ESCRITA })
    const ref = new Map(r.vins.filter(v => v.regla !== REGLA.SIN_PROVISION).map(v => [v.vin, { provision: v.provision, monto: v.monto }]))
    ref.set('A1', { provision: 1000, monto: 1000 })
    ref.set('ZZZ', { provision: 1, monto: 1 })
    ref.delete('B1')
    const c = conciliar(r, ref)
    assert.equal(c.difieren.length, 1)
    assert.equal(c.difieren[0].diferencia, 500)
    assert.deepEqual(c.soloFinanzas.map(x => x.vin), ['ZZZ'])
    assert.deepEqual(c.soloPlataforma.map(x => x.vin), ['B1'])
  })
})

describe('consistencia con el Excel (revisión de código)', () => {
  test('MOS/WS duplicados: gana la primera fila y se avisa', () => {
    const d = fixture()
    const ws = [{ periodo: '202611', dealer: 'Kia Gama', wsPct: 0.95 }, ...d.ws]
    const r = calcularMargenVariable({ ...d, ws }, { parametros: POLITICA_ESCRITA })
    assert.equal(r.dealers.find(x => x.dealer === 'Kia Gama').ws, 0.95)
    assert.ok(r.incidencias.some(i => i.tipo === 'ws_duplicado'))
  })

  test('redondeo a centavos igual que ROUND de Excel', () => {
    const d = fixture()
    const provision = d.provision.map(p => (p.vin === 'A1' ? { ...p, monto: 1000.05 } : p))
    const r = calcularMargenVariable({ ...d, provision }, { parametros: POLITICA_ESCRITA })
    assert.equal(vin(r, 'A1').monto, 1500.08)
  })

  test('provisión negativa (reversa) se suma al total como en el Excel', () => {
    const d = fixture()
    const provision = d.provision.map(p => (p.vin === 'B1' ? { ...p, monto: -800 } : p))
    const r = calcularMargenVariable({ ...d, provision }, { parametros: POLITICA_ESCRITA })
    assert.equal(r.resumen.montoTotal, ESPERADO.politica.total - 1600)
  })
})

describe('exclusiones por modelo y versión', () => {
  test('modelo excluido de la regla B no paga aunque cumpla y lo explica', () => {
    const r = calcularMargenVariable(fixture(), { parametros: { modelosSinReglaB: ['SELTOS'] } })
    assert.equal(vin(r, 'D1').regla, REGLA.NO_CUMPLE)
    assert.match(vin(r, 'D1').motivo, /excluido de la regla B/)
    assert.equal(vin(r, 'Z1').regla, REGLA.B) // K4 sigue aplicando
  })

  test('una versión excluida del bono no afecta a las demás del modelo', async () => {
    const { catalogoConVentas } = await import('../../src/incentivos/margen-variable/motor/catalogoModelos.js')
    const d = fixture()
    const ventas = d.ventas.map(v => (v.vin === 'A2' ? { ...v, version: 'GT-LINE' } : v))
    const r = calcularMargenVariable({ ...d, ventas }, { parametros: { ...POLITICA_ESCRITA, modelosSinBono: ['SONET', 'K3|GT-LINE'] } })
    assert.equal(vin(r, 'A1').regla, REGLA.A_BONO)
    assert.equal(vin(r, 'A2').regla, REGLA.A)
    assert.match(vin(r, 'A2').motivo, /K3 GT-LINE excluido del bono/)
    const k3 = catalogoConVentas(ventas).find(m => m.familia === 'K3')
    assert.ok(k3.versiones.includes('GT-LINE') && k3.versiones.includes('TEST'))
  })
})
