// Fechas { anio, mes, dia } (las produce layouts.fecha).

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MS_DIA = 86400000

const utc = (f) => Date.UTC(f.anio, f.mes - 1, f.dia)

/** Días de `desde` a `hasta` (positivo si `hasta` es posterior). */
export const diasEntre = (desde, hasta) => Math.round((utc(hasta) - utc(desde)) / MS_DIA)

/** Meses calendario de `desde` a `hasta` (sep vs may = 4). */
export const mesesEntre = (desde, hasta) => (hasta.anio * 12 + hasta.mes) - (desde.anio * 12 + desde.mes)

/** "20-may" */
export const fechaCorta = (f) => (f ? `${String(f.dia).padStart(2, '0')}-${MESES[f.mes - 1]}` : 's/fecha')

/** "2026-09-05" */
export const fechaIso = (f) => (f ? `${f.anio}-${String(f.mes).padStart(2, '0')}-${String(f.dia).padStart(2, '0')}` : '')

export const dentroDe = (f, desde, hasta) => (!desde || utc(f) >= utc(desde)) && (!hasta || utc(f) <= utc(hasta))

/** "Sep-26" / "sep-2026" → "202609" */
export function periodoDeMesAnio(txt) {
  const m = String(txt ?? '').trim().toLowerCase().match(/^([a-zé]{3})[a-zé]*[-/ ](\d{2}|\d{4})$/)
  if (!m) return null
  const idx = Math.max(MESES.indexOf(m[1]), MESES_EN.indexOf(m[1]))
  if (idx === -1) return null
  const anio = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2])
  return `${anio}${String(idx + 1).padStart(2, '0')}`
}

export const periodoDeFecha = (f) => (f ? `${f.anio}${String(f.mes).padStart(2, '0')}` : null)
