// Protección contra "zip bombs": un .xlsx es un zip; antes de descomprimirlo se
// revisa el tamaño declarado de sus entradas para no tumbar la pestaña.

export const MAX_DESCOMPRIMIDO = 400 * 1048576

/**
 * Abre el zip (sólo lee el directorio, no descomprime) y valida el tamaño total.
 * @returns {Promise<import('jszip')>} el zip ya abierto, para reutilizarlo
 */
export async function abrirZipSeguro(buffer, max = MAX_DESCOMPRIMIDO) {
  const { default: JSZip } = await import('jszip')
  let zip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new Error('El archivo no es un .xlsx válido.')
  }
  let total = 0
  zip.forEach((_, entrada) => { total += entrada._data?.uncompressedSize ?? 0 })
  if (total > max) throw new Error(`El archivo descomprimido pesaría ${Math.round(total / 1048576)} MB (máximo ${max / 1048576} MB).`)
  return zip
}
