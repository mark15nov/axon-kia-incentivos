// ============================================================
//  CATÁLOGO DE INCENTIVOS · KIA (12 programas)
//  El Cashback al cliente tiene el flujo completo de 7 pasos.
//  El resto comparte el mismo modelo operativo (flujo en
//  configuración para esta maqueta).
// ============================================================

import { PERIODO } from './mockData.js'

// estatus: 'activo' | 'revision' | 'cerrado'
export const ESTATUS_INCENTIVO = {
  activo: { label: 'Activo', tone: 'green' },
  revision: { label: 'En revisión', tone: 'amber' },
  cerrado: { label: 'Cerrado', tone: 'gray' }
}

export const incentivos = [
  {
    id: 'variable', clave: 'VM', nombre: 'Variable Margin', icon: 'Cash',
    desc: 'Incentivos adicionales por desempeño del dealer sobre el margen variable del periodo.',
    fuente: 'SAP · Dealers', presupuesto: 765000, ejecutado: 300000,
    dealers: 6, aclaraciones: 4, estatus: 'activo', flujo: 'variable'
  },
  {
    id: 'opening', clave: 'OF', nombre: 'Opening Fee', icon: 'Invoice',
    desc: 'La financiera absorbe la comisión por apertura del crédito o emite reembolsos; KIA subvenciona su share.',
    fuente: 'KIA Finance · Inbursa', presupuesto: 1850000, ejecutado: 640000,
    dealers: 6, aclaraciones: 2, estatus: 'activo', flujo: 'opening'
  },
  {
    id: 'lowrate', clave: 'LR', nombre: 'Low Rate', icon: 'Percent',
    desc: 'Tasa preferencial de financiamiento subvencionada por KIA durante el periodo.',
    fuente: 'KIA Finance · Inbursa', presupuesto: 2450000, ejecutado: 858000,
    dealers: 6, aclaraciones: 2, estatus: 'activo', flujo: 'lowrate'
  },
  {
    id: 'floorplan', clave: 'FP', nombre: 'Floor Plan', icon: 'Layers',
    desc: 'Subsidio del costo financiero del inventario en piso (floor plan) de la red.',
    fuente: 'KIA Finance', presupuesto: 1320000, ejecutado: 512000,
    dealers: 6, aclaraciones: 3, estatus: 'activo', flujo: 'floorplan'
  },
  {
    id: 'fleetclaim', clave: 'FC', nombre: 'Fleet Claim', icon: 'Briefcase',
    desc: 'Reclamo de incentivos por ventas a flotilla validados contra la orden de compra corporativa.',
    fuente: 'SAP · Flotillas', presupuesto: 680000, ejecutado: 245000,
    dealers: 6, aclaraciones: 3, estatus: 'activo', flujo: 'fleetclaim'
  },
  {
    id: 'kiafidelity', clave: 'KF', nombre: 'KIA Fidelity', icon: 'Star',
    desc: 'Beneficio de crédito por fidelidad calculado con el monto financiado y la Oferta Comercial, validado contra el pago de Inbursa.',
    fuente: 'SAP · Inbursa', presupuesto: 1560000, ejecutado: 505000,
    dealers: 6, aclaraciones: 2, estatus: 'activo', flujo: 'kiafidelity'
  },
  {
    id: 'cashback', clave: 'CB', nombre: 'Cashback', icon: 'Cash',
    desc: 'Bono en efectivo al cliente sobre unidades seleccionadas; KIA subvenciona el monto por VIN durante el periodo.',
    fuente: 'SAP · Dealers', presupuesto: 1980000, ejecutado: 660000,
    dealers: 6, aclaraciones: 3, estatus: 'activo', flujo: 'cashback'
  },
  {
    id: 'feria', clave: 'FERIA', nombre: 'Feria de Crédito', icon: 'Percent',
    desc: 'Co-promoción KIA + Inbursa: tasa preferencial y bono de enganche durante el evento de financiamiento.',
    fuente: 'Zap · Inbursa', presupuesto: 3692000, ejecutado: 1240000,
    dealers: 6, aclaraciones: 2, estatus: 'activo', flujo: 'feria'
  },
  {
    id: 'bonoventas', clave: 'BV', nombre: 'Bono por Ventas', icon: 'Trending',
    desc: 'Bono por VIN calculado con VQM, meses de inventario y curtailment, validado contra la Monthly Commercial Offer.',
    fuente: 'SAP (VQM) · Dealers', presupuesto: 420000, ejecutado: 180000,
    dealers: 6, aclaraciones: 3, estatus: 'activo', flujo: 'bonoventas'
  }
]

export const periodoActivo = PERIODO

// Consolidado de toda la cartera de incentivos.
export function consolidadoIncentivos() {
  const presupuesto = incentivos.reduce((a, b) => a + b.presupuesto, 0)
  const ejecutado = incentivos.reduce((a, b) => a + b.ejecutado, 0)
  const aclaraciones = incentivos.reduce((a, b) => a + b.aclaraciones, 0)
  return {
    presupuesto,
    ejecutado,
    pendiente: presupuesto - ejecutado,
    pctEjecutado: presupuesto ? (ejecutado / presupuesto) * 100 : 0,
    aclaraciones,
    activos: incentivos.filter(i => i.estatus === 'activo').length,
    enRevision: incentivos.filter(i => i.estatus === 'revision').length,
    cerrados: incentivos.filter(i => i.estatus === 'cerrado').length,
    total: incentivos.length,
    dealers: 6
  }
}
