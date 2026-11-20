// ============================================================
//  MARGEN VARIABLE · Parámetros
//  La guía oficial es el archivo de cálculo de Finanzas
//  (Calculation File_MV). Todo umbral vive aquí para que el
//  motor, la UI y el Excel de Finanzas usen los mismos valores.
//
//  Regla A · Retail ≥ 100% vs MOU retail  Y  (WHS ≥ 90%  o  MOS > 2)
//            → se paga la provisión a todas las unidades (retail, demo, flota).
//  Regla B · Retail < 100%  Y  WHS ≥ 90%  Y  cumplimiento del modelo ≥ 100%
//            → se paga la provisión a las unidades de ese modelo.
//  Bono    · +50% sobre la provisión pagada cuando la unidad es Inventario
//            Nuevo, las ventas retail llegan a 110% del MOU retail y el modelo
//            no está excluido (Sonet).
//  Curtailment · los VIN de la hoja LY_CURTAILMENT se pagan en $0.
//
//  La política escrita (texto compartido por KIA) difiere en 3 puntos y
//  queda disponible como alternativa: POLITICA_ESCRITA.
// ============================================================

/** @typedef {'total' | 'retail'} BaseBono */

/** @typedef {{
 *   umbralRetail: number,
 *   umbralWhs: number,
 *   umbralMos: number,
 *   umbralModelo: number,
 *   umbralBono: number,
 *   factorBono: number,
 *   modelosSinBono: string[],
 *   modelosSinReglaB: string[],
 *   baseBono: BaseBono,
 *   comparacionInclusiva: boolean,
 *   excluirCurtailment: boolean,
 *   iva: number
 * }} ParametrosMV */

// Reglas del archivo guía (fórmula CALCULO!T: >0.899, <0.999, >0.999, >1.099).
export const PRESET_FINANZAS = Object.freeze({ baseBono: 'retail', comparacionInclusiva: true, excluirCurtailment: true })

// Texto de la política: bono sobre ventas totales vs MOU total, "mayor a" estricto, sin curtailment.
export const POLITICA_ESCRITA = Object.freeze({ baseBono: 'total', comparacionInclusiva: false, excluirCurtailment: false })

/** @type {Readonly<ParametrosMV>} */
export const PARAMETROS_DEFAULT = Object.freeze({
  umbralRetail: 1.0,   // Ventas retail / MOU retail ≥ 100%
  umbralWhs: 0.9,      // WHS ≥ 90% vs objetivo
  umbralMos: 2,        // MOS > 2
  umbralModelo: 1.0,   // Cumplimiento del modelo (regla B)
  umbralBono: 1.1,     // Ventas para bono: 110%
  factorBono: 1.5,     // Provisión × 1.5 (50% adicional)
  // Exclusiones por modelo o versión: 'SONET' (todo el modelo) o 'SONET|EX IVT' (una versión).
  modelosSinBono: Object.freeze(['SONET']),
  modelosSinReglaB: Object.freeze([]),
  // baseBono: 'retail' = retail / MOU retail (guía) · 'total' = (retail+demo+flota) / MOU total (política escrita)
  // comparacionInclusiva: true = ≥ en modelo, bono y WHS de la regla B (guía) · false = > estricto
  // excluirCurtailment: true = VIN de LY_CURTAILMENT en $0 (guía)
  ...PRESET_FINANZAS,
  iva: 0.16
})

/** ¿Los parámetros siguen las reglas de la guía de Finanzas? */
export const esPresetFinanzas = (p) => Object.entries(PRESET_FINANZAS).every(([k, v]) => p[k] === v)

// Tolerancia numérica para comparar porcentajes calculados.
export const EPS = 1e-9

// Usos del vehículo (V.USG Text del layout de ventas).
export const USO = Object.freeze({ RETAIL: 'retail', DEMO: 'demo', FLOTA: 'flota' })

export const USO_LABEL = Object.freeze({
  [USO.RETAIL]: 'Inventario nuevo',
  [USO.DEMO]: 'Demo / cortesía',
  [USO.FLOTA]: 'Flota'
})

// Categorías del MOU (hoja 4. LY_MOU) → uso.
export const CATEGORIA_MOU = Object.freeze({ Retail: USO.RETAIL, Demo: USO.DEMO, Fleet: USO.FLOTA })

/**
 * Valida y completa parámetros capturados por el usuario.
 * @param {Partial<ParametrosMV>} [entrada]
 * @returns {ParametrosMV}
 */
export function normalizarParametros(entrada = {}) {
  const p = { ...PARAMETROS_DEFAULT, ...entrada }
  const numeros = ['umbralRetail', 'umbralWhs', 'umbralMos', 'umbralModelo', 'umbralBono', 'factorBono', 'iva']
  for (const k of numeros) {
    const v = Number(p[k])
    if (!Number.isFinite(v) || v < 0) throw new Error(`Parámetro inválido: ${k} debe ser un número ≥ 0`)
    p[k] = v
  }
  if (p.baseBono !== 'total' && p.baseBono !== 'retail') throw new Error("Parámetro inválido: baseBono debe ser 'total' o 'retail'")
  const lista = (x) => (Array.isArray(x) ? x : []).map(m => String(m).trim().toUpperCase()).filter(Boolean)
  return {
    ...p,
    comparacionInclusiva: Boolean(p.comparacionInclusiva),
    excluirCurtailment: Boolean(p.excluirCurtailment),
    modelosSinBono: lista(p.modelosSinBono),
    modelosSinReglaB: lista(p.modelosSinReglaB)
  }
}

/**
 * Comparación "supera el umbral": estricta (>) según la política o
 * inclusiva (≥) para replicar las fórmulas de Finanzas.
 */
export function supera(valor, umbral, p) {
  return p.comparacionInclusiva ? valor >= umbral - EPS : valor > umbral + EPS
}
