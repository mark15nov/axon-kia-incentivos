// ============================================================
//  Estado de la carga mensual de Margen Variable.
//  Tres archivos: Ventas (obligatorio), Layout MV (obligatorio)
//  y el cálculo manual de Finanzas (opcional, para conciliar).
// ============================================================

import { useCallback, useState } from 'react'
import { leerLibro } from '../excel/leerLibro.js'
import { leerCalculoFinanzas } from '../excel/leerCalculoFinanzas.js'
import { normalizarVentas, normalizarLayoutMV } from '../motor/layouts.js'

export const ARCHIVOS = Object.freeze({
  ventas: { titulo: 'Layout Carga Ventas', desc: 'Ventas del mes por VIN (hoja Data)', obligatorio: true },
  mv: { titulo: 'Layout Carga MV', desc: 'Provisión por VIN, MOS, WHS, MOU y catálogo de dealers', obligatorio: true },
  finanzas: { titulo: 'Cálculo de Finanzas', desc: 'Opcional · Calculation File_MV para conciliar VIN por VIN', obligatorio: false }
})

const DEMO = Object.freeze({
  ventas: 'demo/MV_Ventas_202603.xlsx',
  mv: 'demo/MV_Layout_202603.xlsx',
  finanzas: 'demo/MV_CalculoFinanzas_202603.xlsx'
})

const MAX_BYTES = 40 * 1048576

async function procesar(tipo, buffer) {
  if (tipo === 'finanzas') {
    const { porVin, filas } = await leerCalculoFinanzas(buffer)
    return { porVin, resumen: `${filas.toLocaleString('es-MX')} VIN en CALCULO`, errores: [], avisos: [] }
  }
  const libro = await leerLibro(buffer)
  if (tipo === 'ventas') {
    const { registros, errores, avisos } = normalizarVentas(libro)
    return { registros, errores, avisos, resumen: `${registros.length.toLocaleString('es-MX')} ventas` }
  }
  const { tablas, errores, avisos } = normalizarLayoutMV(libro)
  const resumen = `${tablas.provision.length.toLocaleString('es-MX')} provisiones · ${tablas.dealers.length} dealers · ${tablas.mou.length.toLocaleString('es-MX')} filas MOU`
  return { tablas, errores, avisos, resumen }
}

export function useCargaMV() {
  const [archivos, setArchivos] = useState({})

  const cargar = useCallback(async (tipo, { nombre, tamano, obtenerBuffer }) => {
    setArchivos(a => ({ ...a, [tipo]: { nombre, tamano, estado: 'leyendo' } }))
    try {
      if (tamano > MAX_BYTES) throw new Error(`El archivo pesa más de ${MAX_BYTES / 1048576} MB.`)
      const datos = await procesar(tipo, await obtenerBuffer())
      const estado = datos.errores.length ? 'error' : 'listo'
      setArchivos(a => ({ ...a, [tipo]: { nombre, tamano, estado, ...datos } }))
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo leer el archivo.'
      setArchivos(a => ({ ...a, [tipo]: { nombre, tamano, estado: 'error', errores: [mensaje], avisos: [] } }))
    }
  }, [])

  const cargarArchivo = useCallback((tipo, file) => cargar(tipo, {
    nombre: file.name, tamano: file.size, obtenerBuffer: () => file.arrayBuffer()
  }), [cargar])

  const cargarDemo = useCallback((tipos = Object.keys(DEMO)) => Promise.all(Object.entries(DEMO).filter(([tipo]) => tipos.includes(tipo)).map(([tipo, ruta]) => cargar(tipo, {
    nombre: ruta.split('/').pop(),
    tamano: 0,
    obtenerBuffer: async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}${ruta}`)
      if (!res.ok) throw new Error(`No se encontró el archivo demo ${ruta}`)
      return res.arrayBuffer()
    }
  }))), [cargar])

  const quitar = useCallback((tipo) => setArchivos(({ [tipo]: _, ...resto }) => resto), [])

  const listos = archivos.ventas?.estado === 'listo' && archivos.mv?.estado === 'listo'
  const datos = listos ? { ventas: archivos.ventas.registros, ...archivos.mv.tablas } : null
  const referencia = archivos.finanzas?.estado === 'listo' ? archivos.finanzas.porVin : null
  const leyendo = Object.values(archivos).some(a => a.estado === 'leyendo')

  return { archivos, cargarArchivo, cargarDemo, quitar, datos, referencia, leyendo }
}
