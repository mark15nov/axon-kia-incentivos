// Formatos de texto para observaciones, motivos y el correo.

/** -28358.32 → "-$28,358.32"; decimales: 2 fijos o 'auto' (24000 → "$24,000"). */
export function pesos(x, decimales = 2) {
  const n = Number(x) || 0
  const opts = decimales === 'auto' ? { minimumFractionDigits: 0, maximumFractionDigits: 2 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('es-MX', opts)}`
}

/** 1 → "1.0 puntos", 1.5 → "1.5 puntos" */
export const puntos = (x) => `${Number(x).toFixed(1)} ${Number(x) === 1 ? 'punto' : 'puntos'}`
