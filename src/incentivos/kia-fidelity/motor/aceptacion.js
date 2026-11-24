// Prueba de aceptación: cruza la clave de "Casos plantados" contra lo
// que detectó el motor. Cada caso de la clave se traduce a la(s)
// detección(es) esperada(s) por palabras clave.

import { ESTATUS_PAGO } from './pagoFinanciera.js'
import { ESTATUS_DEBITO } from './debitosDealer.js'

const codigos = (c) => new Set([...c.observaciones, ...c.motivos, ...c.notas, ...c.porRevisar].map(x => x.codigo))
const limpio = (c) => c.estatusPago === ESTATUS_PAGO.PROCEDE && c.estatusDebito === ESTATUS_DEBITO.SIN_DEBITO

const REGLAS = [
  { clave: /duplicad/, verificar: (c) => codigos(c).has('VIN_MULTI_DOSSIER') && codigos(c).has('DUPLICADO'), detalle: 'VIN en 2 Dossier (pago retenido y débito)' },
  { clave: /fidelity ya pagado/, verificar: (c) => codigos(c).has('YA_PAGADO'), detalle: 'Débito: Fidelity ya pagado' },
  { clave: /incompatible/, verificar: (c) => codigos(c).has('INCOMPATIBLE'), detalle: 'Débito: incentivo incompatible' },
  { clave: /compatible.*procede/, verificar: (c) => codigos(c).has('COMPATIBLE') && c.estatusDebito === ESTATUS_DEBITO.SIN_DEBITO, detalle: 'Compatible: sin débito' },
  { clave: /demo.*insuficiente/, verificar: (c) => codigos(c).has('DEMO'), detalle: 'Débito: demo con antigüedad insuficiente' },
  { clave: /demo.*suficiente/, verificar: (c) => codigos(c).has('DEMO_OK') && c.estatusDebito === ESTATUS_DEBITO.SIN_DEBITO, detalle: 'Demo suficiente: sin débito' },
  { clave: /externa/, verificar: (c) => codigos(c).has('SEGURO_EXTERNA'), detalle: 'Seguro Externa marcado' },
  { clave: /columna ac|seguro año 1/, verificar: (c) => codigos(c).has('INTERES_REAL_AC') && c.estatusPago === ESTATUS_PAGO.AJUSTE, detalle: 'Error de amortización real: Charge ajustado' },
  { clave: /no existe en sap/, verificar: (c) => codigos(c).has('VIN_NO_SAP'), detalle: 'VIN inexistente en SAP' },
  { clave: /fuera de plazo|n-rule/, verificar: (c) => codigos(c).has('FUERA_PLAZO'), detalle: 'Débito: retail fuera de plazo' },
  { clave: /tasa de beneficio/, verificar: (c) => codigos(c).has('BENEFICIO_DIF') && c.estatusPago === ESTATUS_PAGO.AJUSTE, detalle: 'Beneficio distinto al catálogo: Charge ajustado' },
  { clave: /captura|plazo\)/, verificar: (c) => codigos(c).has('CAPTURA_PLAZO'), detalle: 'Plazo distinto vs calculadora' },
  { clave: /longitud/, verificar: (c) => codigos(c).has('VIN_LONGITUD'), detalle: 'VIN con longitud inválida' },
  { clave: /^normal$/, verificar: limpio, detalle: 'Procede sin débito' }
]

/** Orden importa: "insuficiente" antes que "suficiente", "incompatible" antes que "compatible". */
export function evaluarAceptacion(resultado, casos) {
  const porDossier = new Map(resultado.contratos.map(c => [c.dossier, c]))
  const filas = casos.map(caso => {
    const c = porDossier.get(caso.dossier)
    const texto = caso.caso.toLowerCase()
    const regla = REGLAS.find(r => r.clave.test(texto))
    if (!c) return { ...caso, ok: false, detalle: 'Dossier no encontrado en el reclamo' }
    if (!regla) return { ...caso, ok: false, detalle: 'Caso sin regla de verificación (por revisar)' }
    return { ...caso, ok: regla.verificar(c), detalle: regla.detalle, estatusPago: c.estatusPago, estatusDebito: c.estatusDebito }
  })
  return { filas, total: filas.length, detectados: filas.filter(f => f.ok).length, ok: filas.every(f => f.ok) }
}
