// ============================================================
//  KIA FIDELITY · Parte B · Débitos al distribuidor
//  Motivo específico por VIN. Independiente del pago a la
//  financiera: el débito no se resta del pago.
// ============================================================

import { evaluarCompatibilidad } from '../../shared/compatibilidad.js'
import { CODIGO_FIDELITY } from './parametros.js'
import { diasEntre, mesesEntre, fechaCorta } from './fechas.js'

export const ESTATUS_DEBITO = Object.freeze({ DEBITO: 'DEBITO', POR_REVISAR: 'POR_REVISAR', SIN_DEBITO: 'SIN_DEBITO' })

export const MOTIVO_LABEL = Object.freeze({
  YA_PAGADO: 'Ya pagado',
  INCOMPATIBLE: 'Incompatible',
  DUPLICADO: 'Duplicado',
  FUERA_PLAZO: 'Fuera de plazo (N-rule)',
  DEMO: 'Demo'
})

import { pesos } from './formato.js'

const $ = (x) => pesos(x, 'auto')
const item = (codigo, texto) => ({ codigo, texto })

function reglasDeFecha(c, sapRow, p, motivos, notas, porRevisar) {
  const reg = sapRow.regTypeDesc.toLowerCase()
  const esDemo = reg.includes('demo')
  const esRetail = reg.includes('retail')
  if (!esDemo && !esRetail) {
    porRevisar.push(item('USO_NO_CUBIERTO', `Reg.Type "${sapRow.regTypeDesc || 'vacío'}" no está cubierto por las reglas de Fidelity`))
    return
  }
  if (!c.fechaPago) {
    porRevisar.push(item('SIN_FECHA_CONTRATO', 'El contrato no trae Fecha_Pago para comparar'))
    return
  }
  if (sapRow.fechaRetail) {
    const meses = mesesEntre(sapRow.fechaRetail, c.fechaPago)
    if (meses > p.nRuleMeses) {
      motivos.push(item('FUERA_PLAZO', `Retail ${fechaCorta(sapRow.fechaRetail)}, contrato ${fechaCorta(c.fechaPago)}: fuera de plazo (N-${meses}; permitido hasta N-${p.nRuleMeses})`))
    } else if (meses < 0) {
      porRevisar.push(item('RETAIL_POSTERIOR', `Retail ${fechaCorta(sapRow.fechaRetail)} posterior al mes del contrato ${fechaCorta(c.fechaPago)}`))
    }
  } else {
    porRevisar.push(item('SIN_RETAIL', 'SAP no trae Retail Date'))
  }
  if (esDemo) {
    if (!sapRow.fechaBilling) {
      porRevisar.push(item('DEMO_SIN_ALTA', 'Demo sin Billing Date (fecha de alta) en SAP'))
      return
    }
    const dias = diasEntre(sapRow.fechaBilling, c.fechaPago)
    const texto = `Alta demo ${fechaCorta(sapRow.fechaBilling)}, contrato ${fechaCorta(c.fechaPago)}: ${dias} días`
    if (dias < p.demoMinDias) motivos.push(item('DEMO', `${texto} (mínimo ${p.demoMinDias})`))
    else notas.push(item('DEMO_OK', `${texto}: antigüedad suficiente, procede`))
  }
}

/**
 * @returns {{ estatusDebito, montoDebito, motivos, notas, porRevisar }}
 */
export function evaluarDebito(c, ctx) {
  const { sapRow, sapFilas, pagosDelVin, matriz, otrosDossiers, montoBase, p } = ctx
  const motivos = []
  const notas = []
  const porRevisar = []

  const compat = evaluarCompatibilidad(pagosDelVin, CODIGO_FIDELITY, matriz)
  compat.yaPagado.forEach(x => motivos.push(item('YA_PAGADO', `${x.nombre} ya pagado en ${x.periodoTxt} por ${$(x.monto)}`)))
  compat.incompatibles.forEach(x => motivos.push(item('INCOMPATIBLE', `Ya se pagó ${x.nombre} en ${x.periodoTxt} por ${$(x.monto)}`)))
  compat.compatibles.forEach(x => notas.push(item('COMPATIBLE', `${x.nombre} pagado en ${x.periodoTxt} por ${$(x.monto)} es compatible: procede`)))
  compat.sinRegla.forEach(x => porRevisar.push(item('COMPAT_SIN_REGLA', `${x.nombre} (${x.codigo}) pagado en ${x.periodoTxt}: la matriz COMPAT no define si es compatible con Fidelity`)))

  if (otrosDossiers.length) motivos.push(item('DUPLICADO', `VIN también en Dossier ${otrosDossiers.join(', ')}`))

  if (!sapRow) {
    porRevisar.push(item('SIN_SAP', c.vin.length !== p.longitudVin ? `VIN inválido (${c.vin.length} caracteres): no se puede validar retail ni demo` : 'VIN sin registro en SAP: no se puede validar retail ni demo'))
  } else {
    if (sapFilas.length > 1) notas.push(item('SAP_DUPLICADO', `VIN con ${sapFilas.length} registros en SAP; se usa el del dealer ${sapRow.dealer}`))
    reglasDeFecha(c, sapRow, p, motivos, notas, porRevisar)
  }

  const estatusDebito = motivos.length ? ESTATUS_DEBITO.DEBITO : porRevisar.length ? ESTATUS_DEBITO.POR_REVISAR : ESTATUS_DEBITO.SIN_DEBITO
  return { estatusDebito, montoDebito: estatusDebito === ESTATUS_DEBITO.DEBITO ? montoBase : 0, motivos, notas, porRevisar }
}
