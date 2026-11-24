// ============================================================
//  KIA FIDELITY · Parte A · Validación del pago a la financiera
//  Por Dossier: cuadre, duplicados, VIN, datos de captura, tasa
//  de beneficio, recálculo independiente del Charge y seguro.
//  Efecto de cada observación:
//    retiene → no se paga este mes; la financiera corrige y reenvía
//    ajusta  → se paga el Charge recalculado
//    informa → sólo se reporta
// ============================================================

import { chargeRecalculado, round2 } from './amortizacion.js'
import { dentroDe } from './fechas.js'

export const ESTATUS_PAGO = Object.freeze({ PROCEDE: 'PROCEDE', AJUSTE: 'AJUSTE', RETENIDO: 'RETENIDO' })

import { pesos as $, puntos } from './formato.js'
const suma = (xs) => xs.reduce((a, x) => a + x, 0)
const obs = (codigo, efecto, texto) => ({ codigo, efecto, texto })

/** Beneficio del catálogo vigente para la versión y fecha del contrato. */
export function beneficioCatalogo(catalogo, version, anioModelo, fechaContrato) {
  const candidatos = catalogo.filter(c => c.version === version && (!c.anioModelo || !anioModelo || c.anioModelo === anioModelo))
  if (!candidatos.length) return { estado: 'sin_version' }
  const vigente = candidatos.find(c => fechaContrato && dentroDe(fechaContrato, c.desde, c.hasta))
  if (!vigente) return { estado: 'sin_vigencia', candidatos }
  return { estado: 'ok', beneficio: vigente.beneficioPct, registro: vigente }
}

function validarCaptura(c, calc, sapRow, tol) {
  const out = []
  if (calc.vin && calc.vin !== c.vin) out.push(obs('CAPTURA_VIN', 'retiene', `VIN distinto: contrato ${c.vin}, calculadora ${calc.vin}`))
  if (calc.plazo !== c.plazo) out.push(obs('CAPTURA_PLAZO', 'retiene', `Plazo distinto: contrato ${c.plazo} meses, calculadora ${calc.plazo} meses`))
  if (Math.abs((calc.tasaReal ?? NaN) - c.tasa) > 1e-6 || calc.tasaReal === null) out.push(obs('CAPTURA_TASA', 'retiene', `Tasa distinta: contrato ${c.tasa}%, calculadora ${calc.tasaReal ?? 's/d'}%`))
  if (Math.abs((calc.monto ?? NaN) - c.monto) > tol || calc.monto === null) out.push(obs('CAPTURA_MONTO', 'retiene', `Monto financiado distinto: contrato ${$(c.monto)}, calculadora ${calc.monto === null ? 's/d' : $(calc.monto)}`))
  if (c.mtoFinSinSeguro !== null) {
    const esperado = c.precio - c.enganche + c.accesorios + c.gap
    if (Math.abs(esperado - c.mtoFinSinSeguro) > tol) {
      out.push(obs('CAPTURA_ACCESORIOS_GAP', 'retiene', `Monto sin seguro ${$(c.mtoFinSinSeguro)} ≠ precio − enganche + accesorios ${$(c.accesorios)} + GAP ${$(c.gap)} = ${$(esperado)}`))
    }
    if (c.monto !== null && Math.abs(c.mtoFinSinSeguro + c.seguroFinanciado - c.monto) > tol) {
      out.push(obs('CAPTURA_MONTO_FIN', 'retiene', `Monto financiado ${$(c.monto)} ≠ monto sin seguro ${$(c.mtoFinSinSeguro)} + seguro financiado ${$(c.seguroFinanciado)}`))
    }
  }
  if (sapRow && c.version && sapRow.version && sapRow.version !== c.version) {
    out.push(obs('CAPTURA_VERSION', 'retiene', `Versión distinta: contrato ${c.version}, SAP ${sapRow.version}`))
  }
  return out
}

function validarCalculadora(c, calc, beneficio, tol) {
  const out = []
  if (calc.tasaTeorica !== null && calc.tasaReal !== null && calc.beneficio !== null && Math.abs(calc.tasaTeorica - (calc.tasaReal + calc.beneficio)) > 1e-6) {
    out.push(obs('TASA_TEORICA_DIF', 'ajusta', `Tasa teórica ${calc.tasaTeorica}% ≠ tasa real ${calc.tasaReal}% + beneficio ${calc.beneficio}%`))
  }
  if (beneficio !== null && calc.beneficio !== null && Math.abs(calc.beneficio - beneficio) > 1e-6) {
    out.push(obs('BENEFICIO_DIF', 'ajusta', `Beneficio aplicado ${puntos(calc.beneficio)}; catálogo ${c.version} = ${puntos(beneficio)}`))
  }
  const sumaReal = suma(calc.interesesReal)
  if (calc.interesesReal.length && calc.totalReal !== null && Math.abs(sumaReal - calc.totalReal) > tol) {
    out.push(obs('INTERES_REAL_AC', 'ajusta',
      `Total intereses reales (AC) ${$(calc.totalReal)} no cuadra con el detalle mensual ${$(sumaReal)} (dif ${$(calc.totalReal - sumaReal)}). ` +
      'Revisar la amortización real: posible seguro del año 1 aplicado a todo el plazo en lugar del de años 2 a 5.'))
  }
  const sumaTeo = suma(calc.interesesTeorico)
  if (calc.interesesTeorico.length && calc.totalTeorico !== null && Math.abs(sumaTeo - calc.totalTeorico) > tol) {
    out.push(obs('INTERES_TEO_TOTAL', 'ajusta', `Total intereses teóricos ${$(calc.totalTeorico)} no cuadra con el detalle mensual ${$(sumaTeo)}`))
  }
  if (calc.charge !== null && Math.abs(calc.charge - c.chargeReclamado) > tol) {
    out.push(obs('CHARGE_CONTRATO_VS_CALC', 'informa', `Charge en contratos ${$(c.chargeReclamado)} ≠ Charge en calculadora ${$(calc.charge)}`))
  }
  return out
}

/**
 * Valida un contrato.
 * @returns {{ estatusPago, montoPagar, ajuste, retenido, chargeRecalculado, beneficioCatalogo, observaciones }}
 */
export function validarContrato(c, ctx) {
  const { calc, sapRow, sapFilas, dossierRepetido, otrosDossiers, catalogo, p } = ctx
  const tol = p.toleranciaCentavos
  const o = []

  if (dossierRepetido) o.push(obs('DOSSIER_DUP', 'retiene', `Dossier ${c.dossier} repetido en el reclamo`))
  if (!calc) o.push(obs('SIN_CALCULADORA', 'retiene', `Dossier ${c.dossier} no existe en la calculadora de intereses`))
  if (c.vin.length !== p.longitudVin) o.push(obs('VIN_LONGITUD', 'retiene', `VIN ${c.vin || '(vacío)'} tiene ${c.vin.length} caracteres (deben ser ${p.longitudVin})`))
  else if (!sapFilas.length) o.push(obs('VIN_NO_SAP', 'retiene', `VIN ${c.vin} no existe en SAP Fidelity`))
  if (otrosDossiers.length) o.push(obs('VIN_MULTI_DOSSIER', 'retiene', `VIN ${c.vin} también en Dossier ${otrosDossiers.join(', ')}: confirmar cuál contrato es válido`))
  if (/externa/i.test(c.tipoSeguro)) {
    o.push(obs('SEGURO_EXTERNA', 'retiene', `Seguro Externa${c.modalidad ? '' : ' sin modalidad'}: póliza con otra aseguradora (${c.aseguradora || 's/aseguradora'})`))
  }
  if (calc) o.push(...validarCaptura(c, calc, sapRow, tol))

  const version = c.version || sapRow?.version || ''
  const cat = beneficioCatalogo(catalogo, version, c.anioModelo || sapRow?.anioModelo, c.fechaPago)
  if (cat.estado === 'sin_version') o.push(obs('BENEFICIO_SIN_CATALOGO', 'retiene', `Versión ${version || '(vacía)'} no está en el catálogo de beneficio`))
  if (cat.estado === 'sin_vigencia') o.push(obs('BENEFICIO_SIN_VIGENCIA', 'retiene', `Versión ${version} sin beneficio vigente a la fecha del contrato`))
  const beneficio = cat.estado === 'ok' ? cat.beneficio : null
  if (calc) o.push(...validarCalculadora(c, calc, beneficio, tol))

  let recalc = null
  if (beneficio !== null && c.monto > 0 && c.plazo > 0 && c.tasa !== null) {
    recalc = chargeRecalculado({ monto: c.monto, tasaReal: c.tasa, beneficio, plazo: c.plazo })
    const dif = c.chargeReclamado - recalc.charge
    if (Math.abs(dif) > tol) {
      o.push(obs('CHARGE_DIF', 'ajusta', `Charge reclamado ${$(c.chargeReclamado)} vs recalculado ${$(recalc.charge)} (dif ${$(dif)})`))
    }
  }

  const retiene = o.some(x => x.efecto === 'retiene')
  const ajusta = !retiene && o.some(x => x.efecto === 'ajusta')
  // Si hay algo que ajustar pero no se pudo recalcular, no se inventa el monto: se retiene.
  const sinRecalculo = ajusta && !recalc
  const estatusPago = retiene || sinRecalculo ? ESTATUS_PAGO.RETENIDO : ajusta ? ESTATUS_PAGO.AJUSTE : ESTATUS_PAGO.PROCEDE
  const montoPagar = estatusPago === ESTATUS_PAGO.RETENIDO ? 0 : estatusPago === ESTATUS_PAGO.AJUSTE ? round2(recalc.charge) : round2(c.chargeReclamado)
  return {
    estatusPago,
    montoPagar,
    ajuste: estatusPago === ESTATUS_PAGO.AJUSTE ? round2(montoPagar - c.chargeReclamado) : 0,
    retenido: estatusPago === ESTATUS_PAGO.RETENIDO ? round2(c.chargeReclamado) : 0,
    chargeRecalculado: recalc ? round2(recalc.charge) : null,
    interesRealRecalculado: recalc ? round2(recalc.real) : null,
    interesTeoricoRecalculado: recalc ? round2(recalc.teorico) : null,
    beneficioCatalogo: beneficio,
    observaciones: o
  }
}

/** Cuadre del reclamo completo: contratos ↔ calculadora ↔ hoja CHARGE. */
export function cuadreReclamo(contratos, calculos, totales, tol) {
  const enCalc = new Set(calculos.map(x => x.dossier))
  const enContratos = new Set(contratos.map(x => x.dossier))
  const totalReclamado = round2(suma(contratos.map(c => c.chargeReclamado)))
  const out = {
    contratos: contratos.length,
    dossiersSinCalculadora: [...enContratos].filter(d => !enCalc.has(d)),
    calculadoraSinContrato: [...enCalc].filter(d => !enContratos.has(d)),
    totalReclamado,
    totalHojaCharge: totales?.charge ?? null,
    nHojaCharge: totales?.contratos ?? null,
    realReclamado: round2(suma(contratos.map(c => c.realReclamado ?? 0))),
    teoricoReclamado: round2(suma(contratos.map(c => c.teoricoReclamado ?? 0)))
  }
  const chequeos = [
    { ok: !out.dossiersSinCalculadora.length, texto: out.dossiersSinCalculadora.length ? `${out.dossiersSinCalculadora.length} Dossier sin calculadora: ${out.dossiersSinCalculadora.join(', ')}` : 'Todos los Dossier existen en la calculadora' },
    { ok: !out.calculadoraSinContrato.length, texto: out.calculadoraSinContrato.length ? `${out.calculadoraSinContrato.length} Dossier en la calculadora que no vienen en CONTRATOS: ${out.calculadoraSinContrato.join(', ')}` : 'La calculadora no trae Dossier de más' },
    { ok: totales?.charge !== undefined && totales?.charge !== null && Math.abs(totales.charge - totalReclamado) <= tol, texto: `Suma del Charge ${$(totalReclamado)} vs hoja CHARGE ${totales?.charge === null || totales?.charge === undefined ? 's/d' : $(totales.charge)}` },
    { ok: totales?.contratos === null || totales?.contratos === undefined || totales.contratos === contratos.length, texto: `${contratos.length} contratos vs Nb ${totales?.contratos ?? 's/d'} en hoja CHARGE` }
  ]
  return { ...out, chequeos, cuadra: chequeos.every(c => c.ok) }
}
