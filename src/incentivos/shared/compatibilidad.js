// ============================================================
//  Compatibilidad entre incentivos (regla general de la plataforma)
//  Cualquier incentivo que se cargue valida que el mismo VIN no
//  tenga ya pagado otro incentivo no compatible, según la matriz
//  COMPAT: 1º = incentivo ya pagado, 2º = el que se reclama;
//  1 = permitido, 0 = no permitido. Si la pareja no está en la
//  matriz, el caso queda "por revisar" (no se inventa criterio).
// ============================================================

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "202607" → "jul-26" */
export const periodoCorto = (p) => (p && /^\d{6}$/.test(p) ? `${MESES[Number(p.slice(4)) - 1]}-${p.slice(2, 4)}` : p || 's/periodo')

/**
 * @param {{ pagado: string, reclamado: string, permitido: boolean, descPagado?: string, descReclamado?: string }[]} filas
 */
export function construirMatriz(filas) {
  const permitido = new Map()
  const nombres = new Map()
  for (const f of filas) {
    permitido.set(`${f.pagado}|${f.reclamado}`, f.permitido)
    if (f.descPagado) nombres.set(f.pagado, f.descPagado)
    if (f.descReclamado) nombres.set(f.reclamado, f.descReclamado)
  }
  return {
    /** true / false, o null si la pareja no está en la matriz */
    permitido: (pagado, reclamado) => (permitido.has(`${pagado}|${reclamado}`) ? permitido.get(`${pagado}|${reclamado}`) : null),
    nombre: (codigo) => nombres.get(codigo) ?? codigo,
    /** Códigos que ya no se pueden reclamar después de pagar `codigo`. */
    incompatiblesDespues: (codigo) => [...permitido].filter(([k, v]) => k.startsWith(`${codigo}|`) && v === false).map(([k]) => k.split('|')[1]).sort()
  }
}

/**
 * Evalúa un reclamo contra el historial de pagos del VIN.
 * @param {{ codigo: string, programa: string, periodo: string, monto: number }[]} pagosDelVin
 * @returns {{ yaPagado: object[], incompatibles: object[], compatibles: object[], sinRegla: object[] }}
 */
export function evaluarCompatibilidad(pagosDelVin, codigoReclamado, matriz) {
  const out = { yaPagado: [], incompatibles: [], compatibles: [], sinRegla: [] }
  for (const p of pagosDelVin) {
    const pago = { ...p, nombre: matriz.nombre(p.codigo), periodoTxt: periodoCorto(p.periodo) }
    if (p.codigo === codigoReclamado) { out.yaPagado.push(pago); continue }
    const ok = matriz.permitido(p.codigo, codigoReclamado)
    if (ok === null) out.sinRegla.push(pago)
    else if (ok) out.compatibles.push(pago)
    else out.incompatibles.push(pago)
  }
  return out
}
