// ============================================================
//  Excel de Finanzas · PARAMETROS y bases de datos
//  (SALES, PROVISION, MOS, WHS, MOU, DEALERS, Curtailment)
//  Las bases son exactamente lo que el motor consideró. Las
//  columnas *_MV (fondo amarillo) son auxiliares de la plataforma:
//  dealer homologado, uso, familia de modelo y si la venta cuenta.
// ============================================================

import { LAYOUT_VENTAS, llave } from '../motor/layouts.js'
import { USO } from '../motor/parametros.js'
import { FMT, tabla, titulo, etiqueta, COLOR } from './estilos.js'

export const USO_EXCEL = Object.freeze({ [USO.RETAIL]: 'Retail', [USO.DEMO]: 'Demo', [USO.FLOTA]: 'Flota' })

// Celdas con nombre en PARAMETROS (columna C).
const PARAMS = [
  ['ANIO', 'Año del periodo', (r) => Number(r.periodo.slice(0, 4)), FMT.entero],
  ['MES', 'Mes del periodo', (r) => Number(r.periodo.slice(4)), FMT.entero],
  ['UMBRAL_RETAIL', 'Ventas retail / MOU retail mínimo (regla A)', (r) => r.parametros.umbralRetail, FMT.pct],
  ['UMBRAL_WHS', 'WHS vs objetivo mínimo', (r) => r.parametros.umbralWhs, FMT.pct],
  ['UMBRAL_MOS', 'MOS debe ser mayor a', (r) => r.parametros.umbralMos, FMT.decimal],
  ['UMBRAL_MODELO', 'Cumplimiento del modelo (regla B) mayor a', (r) => r.parametros.umbralModelo, FMT.pct],
  ['UMBRAL_BONO', 'Ventas para bono deben superar', (r) => r.parametros.umbralBono, FMT.pct],
  ['FACTOR_BONO', 'Factor sobre provisión con bono', (r) => r.parametros.factorBono, FMT.decimal],
  ['BASE_BONO', 'Base del bono: "total" (retail+demo+flota vs MOU total) o "retail"', (r) => r.parametros.baseBono],
  ['INCLUSIVO', 'VERDADERO = umbrales "mayor a" se evalúan con ≥ (réplica Finanzas)', (r) => r.parametros.comparacionInclusiva],
  ['EXCLUIR_CURTAILMENT', 'VERDADERO = VIN de la hoja Curtailment se pagan en $0 (como en la guía)', (r) => r.parametros.excluirCurtailment],
  ['IVA', 'IVA', (r) => r.parametros.iva, FMT.pct],
  ['SUPUESTO_INV', 'Forecast: asumir WHS ≥ 90% / MOS > 2 cumplido', (r) => r.escenario.supuestoInventario],
  ['FACTOR_RUNRATE', 'Forecast: factor de proyección a cierre de mes', (r) => r.escenario.factorRunRate, FMT.decimal],
  ['TIPO_CAMBIO', 'Tipo de cambio MXN/USD (tabla en dólares y hoja MONTHLY)', (r, m) => m.tipoCambio, FMT.decimal],
  ['CENTRO_COSTO', 'Centro de costo (hoja MONTHLY)', (r, m) => m.centroCosto]
]

const FILA_PARAM_INICIO = 6

/** Hoja PARAMETROS con celdas nombradas. */
export function hojaParametros(wb, ws, resultado, meta) {
  titulo(ws, 'Parámetros de la política', 'Las fórmulas de CALCULO, MV por Modelo y Resumen de Pago usan estos nombres. Cambia un valor y el libro se recalcula.')
  ;['Nombre', 'Valor', 'Descripción'].forEach((t, i) => etiqueta(ws.getCell(FILA_PARAM_INICIO - 1, i + 2), t))
  PARAMS.forEach(([nombre, desc, valor, fmt], i) => {
    const fila = FILA_PARAM_INICIO + i
    ws.getCell(fila, 2).value = nombre
    ws.getCell(fila, 2).font = { bold: true, size: 10 }
    const c = ws.getCell(fila, 3)
    c.value = valor(resultado, meta)
    if (fmt) c.numFmt = fmt
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.ayuda } }
    ws.getCell(fila, 4).value = desc
    wb.definedNames.add(`PARAMETROS!$C$${fila}`, nombre)
  })
  // Listas de exclusión: modelo ("SONET") o modelo|versión ("SONET|EX IVT").
  const filaModelos = FILA_PARAM_INICIO + PARAMS.length + 1
  ;[['MODELOS_SIN_BONO', resultado.parametros.modelosSinBono, 2], ['MODELOS_SIN_REGLA_B', resultado.parametros.modelosSinReglaB, 4]].forEach(([nombre, lista, c]) => {
    etiqueta(ws.getCell(filaModelos, c), nombre)
    const valores = lista.length ? lista : ['']
    valores.forEach((m, i) => { ws.getCell(filaModelos + 1 + i, c).value = m })
    const L = c === 2 ? 'B' : 'D'
    wb.definedNames.add(`PARAMETROS!$${L}$${filaModelos + 1}:$${L}$${filaModelos + valores.length}`, nombre)
  })
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 14
  ws.getColumn(4).width = 70
}

const fechaExcel = (f) => (f ? new Date(Date.UTC(f.anio, f.mes - 1, f.dia)) : null)

/** Motivo por el que una fila de ventas no se consideró. */
function observacion(v, anio, mes, vistos) {
  if (!v.fechaRetail || v.fechaRetail.anio !== anio || v.fechaRetail.mes !== mes) return 'Fuera de periodo'
  if (vistos.has(v.vin)) return 'VIN duplicado'
  if (!v.uso) return 'Uso no reconocido'
  return ''
}

/** Escribe las hojas de bases y devuelve el número de filas de cada una. */
export function hojasBase(hojas, datos, resultado) {
  const anio = Number(resultado.periodo.slice(0, 4))
  const mes = Number(resultado.periodo.slice(4))
  const nombrePorLlave = new Map(resultado.dealers.map(d => [llave(d.dealer), d.dealer]))
  const canon = (x) => nombrePorLlave.get(llave(x)) ?? x
  const consideradas = new Set(resultado.vins.map(v => v.fila))

  // SALES · columnas del layout + auxiliares
  const vistos = new Set()
  const ventas = datos.ventas.map(v => {
    const cuenta = consideradas.has(v.fila)
    const obs = cuenta ? '' : observacion(v, anio, mes, vistos)
    if (cuenta) vistos.add(v.vin)
    return [v.vin, v.modeloCodigo, v.lsc, v.dealerCodigo, v.dealerRazon, v.customerName2, v.shipTo, v.shipToName,
      v.dealer, v.anioModelo, fechaExcel(v.fechaRetail), v.regType, v.regTypeDesc, v.usoCodigo, v.usoTexto, v.dsm,
      v.modeloLocal, v.version, canon(v.dealer), v.fechaRetail ? `${v.fechaRetail.anio}${String(v.fechaRetail.mes).padStart(2, '0')}` : '',
      USO_EXCEL[v.uso] ?? '', v.familia, cuenta ? 1 : 0, obs]
  })
  tabla(hojas.ventas, [
    ...LAYOUT_VENTAS.columnas.map(t => ({ titulo: t, fmt: t === 'Retail Date' ? FMT.fecha : undefined })),
    { titulo: 'DEALER_MV', ayuda: true, ancho: 24 }, { titulo: 'PERIODO_MV', ayuda: true },
    { titulo: 'USO_MV', ayuda: true }, { titulo: 'FAMILIA_MV', ayuda: true },
    { titulo: 'CONSIDERADA', ayuda: true }, { titulo: 'OBSERVACION', ayuda: true, ancho: 20 }
  ], ventas)

  tabla(hojas.provision, [{ titulo: 'PERIODO' }, { titulo: 'VIN', ancho: 22 }, { titulo: 'MONTO_PROVISION', fmt: FMT.dinero }],
    datos.provision.map(p => [p.periodo, p.vin, p.monto]))

  const mos = datos.mos.filter(m => m.periodo === resultado.periodosFuente.mos)
  tabla(hojas.mos, [{ titulo: 'PERIODO' }, { titulo: 'DEALER', ancho: 24 }, { titulo: 'MOS', fmt: FMT.decimal }, { titulo: 'DEALER_MV', ayuda: true, ancho: 24 }],
    mos.map(m => [m.periodo, m.dealer, m.mos, canon(m.dealer)]))

  const ws = datos.ws.filter(w => w.periodo === resultado.periodosFuente.ws)
  tabla(hojas.ws, [{ titulo: 'PERIODO' }, { titulo: 'DEALER', ancho: 24 }, { titulo: 'WS_PCT', fmt: FMT.pct }, { titulo: 'DEALER_MV', ayuda: true, ancho: 24 }],
    ws.map(w => [w.periodo, w.dealer, w.wsPct, canon(w.dealer)]))

  const mou = datos.mou.filter(m => m.anio === anio && m.mes === mes)
  tabla(hojas.mou, [{ titulo: 'ANIO' }, { titulo: 'MES' }, { titulo: 'DEALER', ancho: 24 }, { titulo: 'CATEGORIA' },
    { titulo: 'MODELO' }, { titulo: 'MOU_UNIDADES', fmt: FMT.entero }, { titulo: 'DEALER_MV', ayuda: true, ancho: 24 }, { titulo: 'FAMILIA_MV', ayuda: true }],
  mou.map(m => [m.anio, m.mes, m.dealer, m.categoria, m.modelo, m.unidades, canon(m.dealer), m.familia]))

  tabla(hojas.dealers, [{ titulo: 'COD_DEALER' }, { titulo: 'DEALER', ancho: 24 }, { titulo: 'RAZON_SOCIAL', ancho: 34 },
    { titulo: 'GRUPO' }, { titulo: 'DSM' }, { titulo: 'ESTATUS' }],
  datos.dealers.map(d => [d.codigo, d.dealer, d.razonSocial, d.grupo, d.dsm, d.estatus]))

  const curt = datos.curtailment ?? []
  tabla(hojas.curtailment, [{ titulo: 'VIN', ancho: 22 }, { titulo: 'PROGRAMA', ancho: 30 }], curt.map(c => [c.vin, c.programa]))

  return { ventas: ventas.length, provision: datos.provision.length, mos: mos.length, ws: ws.length, mou: mou.length, dealers: datos.dealers.length, curtailment: curt.length }
}
