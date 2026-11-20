// Formatos de la UI de Margen Variable.

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const mxn2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ent = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })

export const pesos = (n) => mxn.format(n || 0)
export const pesos2 = (n) => mxn2.format(n || 0)
export const entero = (n) => ent.format(n || 0)
export const pct = (x, dec = 1) => (x === null || x === undefined || x === '' ? '—' : `${(x * 100).toFixed(dec)}%`)
export const millones = (n) => `$${((n || 0) / 1e6).toFixed(2)} M`
export const tamano = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const nombrePeriodo = (p) => (p ? `${MESES[Number(p.slice(4)) - 1]} ${p.slice(0, 4)}` : '—')
