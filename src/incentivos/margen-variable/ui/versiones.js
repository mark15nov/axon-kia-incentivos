// Dos versiones del flujo de Margen Variable para comparar:
//  · plataforma   → la plataforma es la única que calcula: 2 layouts, reglas de la guía.
//  · conciliacion → además se sube el Calculation File de Finanzas para conciliar
//                   VIN por VIN y se puede comparar contra la política escrita.

export const VERSION = Object.freeze({ PLATAFORMA: 'plataforma', CONCILIACION: 'conciliacion' })

export const VERSIONES = Object.freeze({
  [VERSION.PLATAFORMA]: {
    label: 'Cálculo en plataforma',
    sub: '2 layouts · sin archivo de Finanzas',
    archivos: ['ventas', 'mv'],
    conciliacion: false
  },
  [VERSION.CONCILIACION]: {
    label: 'Con conciliación',
    sub: '+ Calculation File de Finanzas',
    archivos: ['ventas', 'mv', 'finanzas'],
    conciliacion: true
  }
})
