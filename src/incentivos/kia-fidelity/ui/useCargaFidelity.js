// Estado de la carga mensual de Kia Fidelity (5 archivos + clave opcional).
// Cuando la financiera corrige, se vuelven a subir los archivos y todo se recalcula.
import { useCallback, useMemo, useState } from 'react'
import { leerLibro } from '../../margen-variable/excel/leerLibro.js'
import {
  ARCHIVOS_FIDELITY, normalizarContratos, normalizarCalculadora, normalizarSap, normalizarCatalogo, normalizarPagados, normalizarCasos
} from '../motor/layouts.js'

const DEMO = Object.freeze({
  contratos: 'SIMULADO Contratos Fidelity Sept.xlsx',
  calculadora: 'SIMULADO Intereses CRM KIA Sept.xlsx',
  sap: 'SIMULADO SAP Fidelity Sept.xlsx',
  catalogo: 'SIMULADO Catalogo Tasa Beneficio Sept.xlsx',
  pagados: 'SIMULADO VINS PAGADOS y Compatibilidad.xlsx',
  casos: 'SIMULADO Casos de prueba (clave de respuestas).xlsx'
})

const MAX_BYTES = 40 * 1048576
const n = (x) => x.toLocaleString('es-MX')

const PROCESAR = {
  contratos: (l) => { const x = normalizarContratos(l); return { ...x, resumen: `${n(x.contratos.length)} contratos` } },
  calculadora: (l) => { const x = normalizarCalculadora(l); return { ...x, resumen: `${n(x.calculos.length)} Dossier calculados` } },
  sap: (l) => { const x = normalizarSap(l); return { ...x, resumen: `${n(x.sap.length)} registros SAP` } },
  catalogo: (l) => { const x = normalizarCatalogo(l); return { ...x, resumen: `${n(x.catalogo.length)} versiones con beneficio` } },
  pagados: (l) => { const x = normalizarPagados(l); return { ...x, resumen: `${n(x.pagos.length)} pagos previos · ${n(x.compat.length)} reglas COMPAT` } },
  casos: (l) => { const x = normalizarCasos(l); return { ...x, resumen: `${n(x.casos.length)} casos plantados` } }
}

export function useCargaFidelity() {
  const [archivos, setArchivos] = useState({})

  const cargar = useCallback(async (tipo, { nombre, tamano, obtenerBuffer }) => {
    setArchivos(a => ({ ...a, [tipo]: { nombre, tamano, estado: 'leyendo' } }))
    try {
      if (tamano > MAX_BYTES) throw new Error(`El archivo pesa más de ${MAX_BYTES / 1048576} MB.`)
      const datos = PROCESAR[tipo](await leerLibro(await obtenerBuffer()))
      setArchivos(a => ({ ...a, [tipo]: { nombre, tamano, estado: datos.errores.length ? 'error' : 'listo', ...datos } }))
    } catch (err) {
      setArchivos(a => ({ ...a, [tipo]: { nombre, tamano, estado: 'error', errores: [err instanceof Error ? err.message : 'No se pudo leer el archivo.'], avisos: [] } }))
    }
  }, [])

  const cargarArchivo = useCallback((tipo, file) => cargar(tipo, { nombre: file.name, tamano: file.size, obtenerBuffer: () => file.arrayBuffer() }), [cargar])

  const cargarDemo = useCallback(() => Promise.all(Object.entries(DEMO).map(([tipo, archivo]) => cargar(tipo, {
    nombre: archivo,
    tamano: 0,
    obtenerBuffer: async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}demo/fidelity/${encodeURIComponent(archivo)}`)
      if (!res.ok) throw new Error(`No se encontró el archivo demo ${archivo}`)
      return res.arrayBuffer()
    }
  }))), [cargar])

  const quitar = useCallback((tipo) => setArchivos(({ [tipo]: _, ...resto }) => resto), [])

  const obligatorios = Object.entries(ARCHIVOS_FIDELITY).filter(([, m]) => m.obligatorio).map(([k]) => k)
  const listos = obligatorios.every(k => archivos[k]?.estado === 'listo')
  const datos = useMemo(() => (listos ? {
    contratos: archivos.contratos.contratos, totales: archivos.contratos.totales, calculos: archivos.calculadora.calculos,
    sap: archivos.sap.sap, catalogo: archivos.catalogo.catalogo, pagos: archivos.pagados.pagos, compat: archivos.pagados.compat
  } : null), [listos, archivos])
  const casos = archivos.casos?.estado === 'listo' ? archivos.casos.casos : null
  const leyendo = Object.values(archivos).some(a => a.estado === 'leyendo')

  return { archivos, cargarArchivo, cargarDemo, quitar, datos, casos, leyendo }
}
