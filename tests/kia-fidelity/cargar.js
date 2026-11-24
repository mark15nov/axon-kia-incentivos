// Carga los archivos SIMULADO de Fidelity desde una carpeta (Node).
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { leerLibro } from '../../src/incentivos/margen-variable/excel/leerLibro.js'
import {
  normalizarContratos, normalizarCalculadora, normalizarSap, normalizarCatalogo, normalizarPagados, normalizarCasos
} from '../../src/incentivos/kia-fidelity/motor/layouts.js'

export const ARCHIVOS_SIMULADO = Object.freeze({
  contratos: 'SIMULADO Contratos Fidelity Sept.xlsx',
  calculadora: 'SIMULADO Intereses CRM KIA Sept.xlsx',
  sap: 'SIMULADO SAP Fidelity Sept.xlsx',
  catalogo: 'SIMULADO Catalogo Tasa Beneficio Sept.xlsx',
  pagados: 'SIMULADO VINS PAGADOS y Compatibilidad.xlsx',
  casos: 'SIMULADO Casos de prueba (clave de respuestas).xlsx'
})

export async function cargarDatosFidelity(carpeta, archivos = ARCHIVOS_SIMULADO) {
  const libro = async (k) => leerLibro(fs.readFileSync(path.join(carpeta, archivos[k])), { ExcelJS })
  const c = normalizarContratos(await libro('contratos'))
  const k = normalizarCalculadora(await libro('calculadora'))
  const s = normalizarSap(await libro('sap'))
  const g = normalizarCatalogo(await libro('catalogo'))
  const v = normalizarPagados(await libro('pagados'))
  const casos = fs.existsSync(path.join(carpeta, archivos.casos)) ? normalizarCasos(await libro('casos')).casos : []
  const errores = [c, k, s, g, v].flatMap(x => x.errores)
  if (errores.length) throw new Error(errores.join(' | '))
  return {
    datos: { contratos: c.contratos, totales: c.totales, calculos: k.calculos, sap: s.sap, catalogo: g.catalogo, pagos: v.pagos, compat: v.compat },
    casos,
    avisos: [c, k, s, g, v].flatMap(x => x.avisos)
  }
}
