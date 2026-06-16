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
    id: 'cashback', clave: 'CB', nombre: 'Cashback al Cliente', icon: 'Cash',
    desc: 'Bonificación directa al cliente por modelo facturado y entregado en el mes.',
    fuente: 'SAP · Dealers', presupuesto: 765000, ejecutado: 300000,
    dealers: 6, aclaraciones: 4, estatus: 'activo', flujo: true
  },
  {
    id: 'volumen', clave: 'VOL', nombre: 'Bono por Volumen', icon: 'Trending',
    desc: 'Bono escalonado al concesionario por superar el objetivo de unidades del periodo.',
    fuente: 'SAP', presupuesto: 420000, ejecutado: 180000,
    dealers: 6, aclaraciones: 1, estatus: 'activo', flujo: false
  },
  {
    id: 'demo', clave: 'DEMO', nombre: 'Bono de Demostradoras', icon: 'Box',
    desc: 'Apoyo por unidades demo en piso de exhibición y pruebas de manejo.',
    fuente: 'Dealers', presupuesto: 168000, ejecutado: 96000,
    dealers: 5, aclaraciones: 0, estatus: 'activo', flujo: false
  },
  {
    id: 'inventario', clave: 'FLOOR', nombre: 'Apoyo a Inventario', icon: 'Layers',
    desc: 'Subsidio de piso (floor plan) sobre el costo financiero del inventario en patio.',
    fuente: 'KIA Finance', presupuesto: 512000, ejecutado: 410000,
    dealers: 6, aclaraciones: 2, estatus: 'revision', flujo: false
  },
  {
    id: 'financiamiento', clave: 'FIN', nombre: 'Penetración de Financiamiento', icon: 'Percent',
    desc: 'Bono por porcentaje de ventas colocadas con crédito KIA Finance.',
    fuente: 'KIA Finance', presupuesto: 345000, ejecutado: 152000,
    dealers: 6, aclaraciones: 1, estatus: 'activo', flujo: false
  },
  {
    id: 'lealtad', clave: 'LOY', nombre: 'Lealtad y Recompra', icon: 'Star',
    desc: 'Incentivo por clientes de recompra y conquista de marca competidora.',
    fuente: 'CRM · Dealers', presupuesto: 210000, ejecutado: 74000,
    dealers: 4, aclaraciones: 0, estatus: 'activo', flujo: false
  },
  {
    id: 'coop', clave: 'COOP', nombre: 'Apoyo Publicitario Co-op', icon: 'Megaphone',
    desc: 'Reembolso de inversión publicitaria local aprobada bajo lineamiento de marca.',
    fuente: 'Marketing', presupuesto: 288000, ejecutado: 130000,
    dealers: 5, aclaraciones: 3, estatus: 'revision', flujo: false
  },
  {
    id: 'posventa', clave: 'PV', nombre: 'Bono de Posventa', icon: 'Wrench',
    desc: 'Incentivo por cumplimiento de metas de servicio, refacciones y retención de taller.',
    fuente: 'Posventa', presupuesto: 196000, ejecutado: 88000,
    dealers: 6, aclaraciones: 0, estatus: 'activo', flujo: false
  },
  {
    id: 'csi', clave: 'CSI', nombre: 'Índice de Satisfacción', icon: 'Users',
    desc: 'Bono por resultado de encuestas CSI/NPS de venta y servicio por encima del umbral.',
    fuente: 'Calidad', presupuesto: 144000, ejecutado: 144000,
    dealers: 6, aclaraciones: 0, estatus: 'cerrado', flujo: false
  },
  {
    id: 'seguros', clave: 'SEG', nombre: 'Penetración de Seguros', icon: 'Shield',
    desc: 'Bono por porcentaje de unidades vendidas con póliza KIA Seguros contratada.',
    fuente: 'Seguros', presupuesto: 132000, ejecutado: 48000,
    dealers: 5, aclaraciones: 1, estatus: 'activo', flujo: false
  },
  {
    id: 'accesorios', clave: 'ACC', nombre: 'Accesorios Originales', icon: 'Gift',
    desc: 'Apoyo por venta de paquetes de accesorios genuinos al momento de la entrega.',
    fuente: 'Refacciones', presupuesto: 98000, ejecutado: 31000,
    dealers: 4, aclaraciones: 0, estatus: 'activo', flujo: false
  },
  {
    id: 'desempeno', clave: 'PERF', nombre: 'Bono Trimestral de Desempeño', icon: 'Briefcase',
    desc: 'Bono integral por cumplimiento conjunto de ventas, posventa y satisfacción del trimestre.',
    fuente: 'Dirección Comercial', presupuesto: 600000, ejecutado: 0,
    dealers: 6, aclaraciones: 0, estatus: 'revision', flujo: false
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
