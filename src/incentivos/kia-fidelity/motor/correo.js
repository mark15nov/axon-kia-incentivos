// Correo a la financiera con el resultado de la validación (Parte A).
// Sólo incluye el pago; los débitos a dealers son internos de Kia.

import { ESTATUS_PAGO } from './pagoFinanciera.js'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
import { pesos as $ } from './formato.js'

export function correoFinanciera(resultado, { financiera = 'Financiera', remitente = 'Incentivos KIA México' } = {}) {
  const { resumen: { pago }, contratos, cuadre, periodo } = resultado
  const mes = periodo ? `${MESES[Number(periodo.slice(4)) - 1]} ${periodo.slice(0, 4)}` : 'el periodo'
  const ajustados = contratos.filter(c => c.estatusPago === ESTATUS_PAGO.AJUSTE)
  const retenidos = contratos.filter(c => c.estatusPago === ESTATUS_PAGO.RETENIDO)
  const lineas = (xs, fn) => xs.map(fn).join('\n')
  const motivos = (c) => c.observaciones.filter(o => o.efecto !== 'informa').map(o => `     · ${o.texto}`).join('\n')

  const asunto = `Fidelity ${mes} · Resultado de la validación del reclamo`
  const cuerpo = [
    `Estimado equipo de ${financiera}:`,
    '',
    `Compartimos el resultado de la validación del reclamo Fidelity de ${mes}.`,
    '',
    `  Monto reclamado:       ${$(pago.reclamado)} (${pago.contratos} contratos)`,
    `  Ajustes:               ${$(pago.ajustes)} (${pago.ajustados} contratos)`,
    `  Retenido por aclarar:  ${$(pago.retenido)} (${pago.retenidos} contratos)`,
    `  Monto a pagar:         ${$(pago.aPagar)}`,
    '',
    ...(cuadre.cuadra ? [] : ['Cuadre del reclamo:', lineas(cuadre.chequeos.filter(c => !c.ok), c => `  · ${c.texto}`), '']),
    ...(ajustados.length ? ['Contratos con ajuste (se paga el Charge recalculado):', lineas(ajustados, c =>
      `  - Dossier ${c.dossier} · VIN ${c.vin}: reclamado ${$(c.chargeReclamado)}, a pagar ${$(c.montoPagar)} (ajuste ${$(c.ajuste)})\n${motivos(c)}`), ''] : []),
    ...(retenidos.length ? ['Contratos retenidos (se pagarán al recibir la corrección):', lineas(retenidos, c =>
      `  - Dossier ${c.dossier} · VIN ${c.vin || '(vacío)'}: ${$(c.chargeReclamado)}\n${motivos(c)}`), ''] : []),
    'Les pedimos enviar los archivos corregidos para volver a cargarlos en la plataforma.',
    '',
    'Saludos,',
    remitente
  ].join('\n')
  return { asunto, cuerpo }
}
