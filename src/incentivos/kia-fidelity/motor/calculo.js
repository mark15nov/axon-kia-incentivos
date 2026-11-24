// ============================================================
//  KIA FIDELITY · Motor de reglas (orquestador)
//  Todo se calcula con código: la IA sólo ejecuta y explica.
//  Cada monto es rastreable hasta el Dossier y el VIN.
// ============================================================

import { construirMatriz } from '../../shared/compatibilidad.js'
import { llave } from '../../margen-variable/motor/layouts.js'
import { normalizarParametros, CODIGO_FIDELITY } from './parametros.js'
import { validarContrato, cuadreReclamo, ESTATUS_PAGO } from './pagoFinanciera.js'
import { evaluarDebito, ESTATUS_DEBITO } from './debitosDealer.js'
import { round2 } from './amortizacion.js'
import { periodoDeMesAnio, periodoDeFecha } from './fechas.js'

const suma = (xs) => xs.reduce((a, x) => a + x, 0)
const agrupar = (xs, k) => xs.reduce((m, x) => m.set(x[k], [...(m.get(x[k]) ?? []), x]), new Map())

function detectarPeriodo(contratos) {
  const c = new Map()
  for (const x of contratos) {
    const p = periodoDeMesAnio(x.mesAnio) ?? periodoDeFecha(x.fechaPago)
    if (p) c.set(p, (c.get(p) ?? 0) + 1)
  }
  return [...c].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

/** Fila de SAP para el contrato: si el VIN viene repetido, la del mismo dealer. */
function filaSap(c, filas) {
  if (filas.length <= 1) return filas[0] ?? null
  return filas.find(s => llave(s.dealer) === llave(c.dealer)) ?? filas[0]
}

/**
 * @param {{ contratos, totales, calculos, sap, catalogo, pagos, compat }} datos
 * @param {{ parametros?: object }} [opciones]
 */
export function calcularFidelity(datos, opciones = {}) {
  const p = normalizarParametros(opciones.parametros)
  const matriz = construirMatriz(datos.compat)
  const calcPor = new Map()
  for (const x of datos.calculos) if (!calcPor.has(x.dossier)) calcPor.set(x.dossier, x)
  const sapPor = agrupar(datos.sap, 'vin')
  const pagosPor = agrupar(datos.pagos, 'vin')
  const dossiersPorVin = agrupar(datos.contratos, 'vin')
  const vistos = new Set()

  const contratos = datos.contratos.map(c => {
    const sapFilas = sapPor.get(c.vin) ?? []
    const sapRow = filaSap(c, sapFilas)
    const otrosDossiers = (dossiersPorVin.get(c.vin) ?? []).map(x => x.dossier).filter(d => d !== c.dossier)
    const dossierRepetido = vistos.has(c.dossier)
    vistos.add(c.dossier)

    const pago = validarContrato(c, {
      calc: calcPor.get(c.dossier) ?? null, sapRow, sapFilas, dossierRepetido, otrosDossiers, catalogo: datos.catalogo, p
    })
    const montoBase = p.baseDebito === 'recalculado' && pago.chargeRecalculado !== null ? pago.chargeRecalculado : round2(c.chargeReclamado)
    const debito = evaluarDebito(c, { sapRow, sapFilas, pagosDelVin: pagosPor.get(c.vin) ?? [], matriz, otrosDossiers, montoBase, p })
    return {
      ...c,
      chargeReclamado: round2(c.chargeReclamado),
      dealerSap: sapRow?.dealer ?? '',
      razonSocial: sapRow?.razonSocial || `(sin SAP) ${c.grupo || c.dealer}`,
      sap: sapRow,
      ...pago,
      ...debito
    }
  })

  const periodo = detectarPeriodo(datos.contratos)
  const cuadre = cuadreReclamo(datos.contratos, datos.calculos, datos.totales, p.toleranciaCentavos)
  return {
    periodo,
    parametros: p,
    cuadre,
    contratos,
    resumen: resumir(contratos),
    porRazonSocial: porRazonSocial(contratos),
    observaciones: observacionesFinanciera(contratos, cuadre),
    vinsPagadosNuevos: vinsPagadosNuevos(contratos, periodo, matriz)
  }
}

function resumir(contratos) {
  const de = (e) => contratos.filter(c => c.estatusPago === e)
  const reclamado = round2(suma(contratos.map(c => c.chargeReclamado)))
  const ajustes = round2(suma(de(ESTATUS_PAGO.AJUSTE).map(c => c.ajuste)))
  const retenido = round2(suma(de(ESTATUS_PAGO.RETENIDO).map(c => c.retenido)))
  const aPagar = round2(suma(contratos.map(c => c.montoPagar)))
  const debitos = contratos.filter(c => c.estatusDebito === ESTATUS_DEBITO.DEBITO)
  return {
    pago: {
      contratos: contratos.length, reclamado, ajustes, retenido, aPagar,
      procede: de(ESTATUS_PAGO.PROCEDE).length, ajustados: de(ESTATUS_PAGO.AJUSTE).length, retenidos: de(ESTATUS_PAGO.RETENIDO).length,
      cuadra: Math.abs(reclamado + ajustes - retenido - aPagar) < 0.01
    },
    debito: {
      vins: debitos.length,
      total: round2(suma(debitos.map(c => c.montoDebito))),
      porRevisar: contratos.filter(c => c.estatusDebito === ESTATUS_DEBITO.POR_REVISAR).length,
      porMotivo: Object.entries(debitos.flatMap(c => c.motivos.map(m => m.codigo)).reduce((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {}))
    }
  }
}

function porRazonSocial(contratos) {
  return [...agrupar(contratos, 'razonSocial')].map(([razonSocial, xs]) => ({
    razonSocial,
    contratos: xs.length,
    reclamado: round2(suma(xs.map(c => c.chargeReclamado))),
    aPagar: round2(suma(xs.map(c => c.montoPagar))),
    retenido: round2(suma(xs.map(c => c.retenido))),
    vinsDebito: xs.filter(c => c.estatusDebito === ESTATUS_DEBITO.DEBITO).length,
    debito: round2(suma(xs.map(c => c.montoDebito)))
  })).sort((a, b) => a.razonSocial.localeCompare(b.razonSocial))
}

/** Observaciones para la financiera (sólo Parte A: lo que ajusta o retiene el pago). */
function observacionesFinanciera(contratos, cuadre) {
  const generales = cuadre.chequeos.filter(c => !c.ok).map(c => ({ dossier: '', vin: '', efecto: 'informa', texto: c.texto }))
  const porContrato = contratos.filter(c => c.estatusPago !== ESTATUS_PAGO.PROCEDE || c.observaciones.length).flatMap(c =>
    c.observaciones.filter(o => o.efecto !== 'informa' || c.estatusPago !== ESTATUS_PAGO.PROCEDE).map(o => ({
      dossier: c.dossier, vin: c.vin, estatus: c.estatusPago, codigo: o.codigo, efecto: o.efecto, texto: o.texto,
      reclamado: c.chargeReclamado, aPagar: c.montoPagar
    })))
  return [...generales, ...porContrato]
}

/** Renglones a agregar a VINS_PAGADOS al cierre (contratos con pago a la financiera). */
function vinsPagadosNuevos(contratos, periodo, matriz) {
  const incompatibles = `|${matriz.incompatiblesDespues(CODIGO_FIDELITY).join('|')}|`
  return contratos.filter(c => c.montoPagar > 0).map(c => ({
    year: Number(periodo?.slice(0, 4)), month: Number(periodo?.slice(4)), programa: 'Fidelity', vin: c.vin,
    monto: c.montoPagar, tipo: `${CODIGO_FIDELITY}01`, codigo: CODIGO_FIDELITY, periodo, incompatibles, dossier: c.dossier
  }))
}
