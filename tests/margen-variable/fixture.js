// Fixture sintético de Margen Variable (periodo 202611).
// Cada dealer ejercita una regla o un caso límite. Montos esperados
// calculados a mano:
//
//  Dealer        Caso                                    Política   Réplica Finanzas
//  Kia Alfa      A + bono (total 120%), Sonet sin bono    7,500        5,500
//  Kia Beta      A por MOS > 2 (WHS 80%)                  1,600        1,600
//  Kia Gama      Retail 100% pero WHS 80% y MOS 1.5           0            0
//  Kia Delta     B: retail 80%, SELTOS 150%, WHS 95%      8,000        8,000
//  Kia Epsilon   B con WHS exactamente 90%                    0        6,000
//  Kia Zeta      B con modelo exactamente 100%                0        1,600
//  Kia Eta       Ventas exactamente 110% + curtailment    3,000        3,000
//  Kia Theta     Dealer sin catálogo ni MOU                   0            0
//  Kia Iota      B + bono (retail 60%, total 120%)        9,000        6,000
//  TOTAL                                                 29,100       31,700
//
//  Curtailment no es parte de la política: sólo la réplica de Finanzas excluye H3.

import { USO } from '../../src/incentivos/margen-variable/motor/parametros.js'

const USO_TEXTO = { [USO.RETAIL]: 'Inventario Nuevo', [USO.DEMO]: 'Auto Demo', [USO.FLOTA]: 'Flotas de Distribuidor' }
const REG = { [USO.RETAIL]: ['10', 'Dealer Retail'], [USO.DEMO]: ['11', 'Dealer Demo / SLC'], [USO.FLOTA]: ['12', 'Dealer Fleet'] }

let fila = 1
function venta(vin, dealer, familia, uso = USO.RETAIL, { mes = 11, dia = 5 } = {}) {
  fila += 1
  return {
    fila, vin, modeloCodigo: familia.slice(0, 2), lsc: `${familia} 1.6L TEST`, dealerCodigo: 'X', dealerRazon: 'X',
    customerName2: dealer, shipTo: 'X', shipToName: 'X', dealer, anioModelo: '2027',
    fechaRetail: { anio: 2026, mes, dia }, regType: REG[uso][0], regTypeDesc: REG[uso][1], usoCodigo: '02',
    usoTexto: USO_TEXTO[uso], uso, dsm: 'DSM 01', modeloLocal: familia, familia, version: 'TEST'
  }
}

const mou = (dealer, modelo, unidades, categoria = 'Retail') => ({
  anio: 2026, mes: 11, dealer, categoria, uso: { Retail: USO.RETAIL, Demo: USO.DEMO, Fleet: USO.FLOTA }[categoria],
  modelo, familia: modelo.replace(/\s+(SD|HB)$/, ''), unidades
})

export function fixture() {
  fila = 1
  const ventas = [
    // Alfa: retail 5/5 = 100%, total 6/5 = 120%
    ...['A1', 'A2', 'A3', 'A4'].map(v => venta(v, 'Kia Alfa', 'K3')),
    venta('A5', 'Kia Alfa', 'SONET'),
    venta('A6', 'Kia Alfa', 'K3', USO.FLOTA),
    venta('A7', 'Kia Alfa', 'K3', USO.RETAIL, { mes: 10 }), // fuera de periodo
    venta('A1', 'Kia Alfa', 'K3'), // duplicado
    // Beta: 2/2 = 100%
    venta('B1', 'Kia Beta', 'K4'), venta('B2', 'Kia Beta', 'K4'),
    // Gama: 2/2 = 100%
    venta('G1', 'Kia Gama', 'K3'), venta('G2', 'Kia Gama', 'K3'),
    // Delta: retail 4/5 = 80%, SELTOS 3/2 = 150%, K3 1/3
    venta('D1', 'Kia Delta', 'SELTOS'), venta('D2', 'Kia Delta', 'SELTOS'), venta('D3', 'Kia Delta', 'SELTOS'),
    venta('D4', 'Kia Delta', 'SELTOS', USO.DEMO), venta('D5', 'Kia Delta', 'K3'),
    // Epsilon: retail 3/4 = 75%, SELTOS 150%, WHS 0.90
    venta('E1', 'Kia Epsilon', 'SELTOS'), venta('E2', 'Kia Epsilon', 'SELTOS'), venta('E3', 'Kia Epsilon', 'SELTOS'),
    // Zeta: retail 2/4 = 50%, K4 2/2 = 100%
    venta('Z1', 'Kia Zeta', 'K4'), venta('Z2', 'Kia Zeta', 'K4'),
    // Eta: 11/10 = 110% (retail y total)
    ...Array.from({ length: 11 }, (_, i) => venta(`H${i + 1}`, 'Kia Eta', 'K3')),
    // Theta: sin catálogo ni MOU
    venta('T1', 'Kia Theta', 'K3'),
    // Iota: retail 3/5 = 60%, SELTOS 3/2 = 150%, total 6/5 = 120% (por flota)
    venta('I1', 'Kia Iota', 'SELTOS'), venta('I2', 'Kia Iota', 'SELTOS'), venta('I3', 'Kia Iota', 'SELTOS'),
    venta('I4', 'Kia Iota', 'K3', USO.FLOTA), venta('I5', 'Kia Iota', 'K3', USO.FLOTA), venta('I6', 'Kia Iota', 'K3', USO.FLOTA)
  ]

  const provision = [
    ...['A1', 'A2', 'A3', 'A4', 'A6'].map(vin => ({ periodo: '202611', vin, monto: 1000 })),
    { periodo: '202611', vin: 'A5', monto: 500 },
    { periodo: '202611', vin: 'B1', monto: 800 }, { periodo: '202611', vin: 'B2', monto: 800 },
    { periodo: '202611', vin: 'G1', monto: 1000 }, { periodo: '202611', vin: 'G2', monto: 1000 },
    ...['D1', 'D2', 'D3', 'D4'].map(vin => ({ periodo: '202611', vin, monto: 2000 })),
    { periodo: '202611', vin: 'D5', monto: 1000 },
    ...['E1', 'E2', 'E3'].map(vin => ({ periodo: '202611', vin, monto: 2000 })),
    { periodo: '202611', vin: 'Z1', monto: 800 }, { periodo: '202611', vin: 'Z2', monto: 800 },
    ...['H1', 'H2', 'H3'].map(vin => ({ periodo: '202611', vin, monto: 1000 })),
    { periodo: '202611', vin: 'T1', monto: 1000 },
    ...['I1', 'I2', 'I3'].map(vin => ({ periodo: '202611', vin, monto: 2000 })),
    ...['I4', 'I5', 'I6'].map(vin => ({ periodo: '202611', vin, monto: 1000 })),
    { periodo: '202611', vin: 'XPROV', monto: 999 } // provisión sin venta
  ]

  const dealers = ['Alfa', 'Beta', 'Gama', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Iota'].map((n, i) => ({
    codigo: `D${i + 1}`, dealer: `Kia ${n}`, razonSocial: i < 2 ? 'RS Uno S.A.' : `RS ${n} S.A.`, grupo: 'G1', dsm: 'DSM 01', estatus: 'ACTIVO'
  }))

  const ws = [['Alfa', 0.95], ['Beta', 0.8], ['Gama', 0.8], ['Delta', 0.95], ['Epsilon', 0.9], ['Zeta', 0.95], ['Eta', 0.95], ['Iota', 0.95]]
    .map(([n, wsPct]) => ({ periodo: '202611', dealer: `Kia ${n}`, wsPct }))
  const mos = [['Alfa', 1], ['Beta', 2.5], ['Gama', 1.5], ['Delta', 1], ['Epsilon', 1], ['Zeta', 1], ['Eta', 1], ['Iota', 1]]
    .map(([n, m]) => ({ periodo: '202611', dealer: `Kia ${n}`, mos: m }))

  return {
    ventas,
    provision,
    dealers,
    ws,
    mos,
    curtailment: [{ vin: 'H3', programa: 'K3 & K4' }],
    mou: [
      mou('Kia Alfa', 'K3 SD', 3), mou('Kia Alfa', 'K3 HB', 1), mou('Kia Alfa', 'SONET', 1),
      mou('Kia Alfa', 'K3 SD', 0, 'Demo'), mou('Kia Alfa', 'K3 SD', 0, 'Fleet'),
      mou('Kia Beta', 'K4 SD', 2),
      mou('Kia Gama', 'K3 SD', 2),
      mou('Kia Delta', 'SELTOS', 2), mou('Kia Delta', 'K3 SD', 3),
      mou('Kia Epsilon', 'SELTOS', 2), mou('Kia Epsilon', 'K3 SD', 2),
      mou('Kia Zeta', 'K4 SD', 2), mou('Kia Zeta', 'K3 SD', 2),
      mou('Kia Eta', 'K3 SD', 10),
      mou('Kia Iota', 'SELTOS', 2), mou('Kia Iota', 'K3 SD', 3),
      { ...mou('Kia Alfa', 'K3 SD', 50), mes: 12 } // otro mes: no debe sumar
    ]
  }
}

export const ESPERADO = Object.freeze({
  politica: { total: 29100, porDealer: { 'Kia Alfa': 7500, 'Kia Beta': 1600, 'Kia Gama': 0, 'Kia Delta': 8000, 'Kia Epsilon': 0, 'Kia Zeta': 0, 'Kia Eta': 3000, 'Kia Theta': 0, 'Kia Iota': 9000 } },
  finanzas: { total: 31700, porDealer: { 'Kia Alfa': 5500, 'Kia Beta': 1600, 'Kia Gama': 0, 'Kia Delta': 8000, 'Kia Epsilon': 6000, 'Kia Zeta': 1600, 'Kia Eta': 3000, 'Kia Theta': 0, 'Kia Iota': 6000 } }
})
