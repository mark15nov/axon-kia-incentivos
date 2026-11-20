// Corre el motor de Margen Variable sobre archivos locales (diagnóstico).
// Uso: node scripts/correr-mv.mjs <ventas.xlsx> <layout_mv.xlsx> [calculo_finanzas.xlsx] [--finanzas] [--excel=salida.xlsx]
import fs from 'node:fs'
import ExcelJS from 'exceljs'
import { leerLibro } from '../src/incentivos/margen-variable/excel/leerLibro.js'
import { leerCalculoFinanzas } from '../src/incentivos/margen-variable/excel/leerCalculoFinanzas.js'
import { normalizarVentas, normalizarLayoutMV } from '../src/incentivos/margen-variable/motor/layouts.js'
import { calcularMargenVariable } from '../src/incentivos/margen-variable/motor/calculo.js'
import { conciliar } from '../src/incentivos/margen-variable/motor/conciliacion.js'
import { PRESET_FINANZAS } from '../src/incentivos/margen-variable/motor/parametros.js'
import { generarExcelFinanzas } from '../src/incentivos/margen-variable/excel/reporteFinanzas.js'

const args = process.argv.slice(2)
const [fVentas, fMv, fRef] = args.filter(a => !a.startsWith('--'))
const parametros = args.includes('--finanzas') ? PRESET_FINANZAS : {}
const v = normalizarVentas(await leerLibro(fs.readFileSync(fVentas), { ExcelJS }))
const mv = normalizarLayoutMV(await leerLibro(fs.readFileSync(fMv), { ExcelJS }))
console.log('errores', [...v.errores, ...mv.errores], 'avisos', [...v.avisos, ...mv.avisos])
const datos = { ventas: v.registros, ...mv.tablas }
const r = calcularMargenVariable(datos, { parametros })
const { porFamilia, porRazonSocial, ...res } = r.resumen
console.log('periodo', r.periodo, res)
console.log('incidencias', r.incidencias.map(i => `${i.severidad} ${i.tipo} ${i.detalle}`))
if (fRef) {
  const ref = await leerCalculoFinanzas(fs.readFileSync(fRef))
  const c = conciliar(r, ref.porVin)
  console.log('conciliacion', { ...c, difieren: c.difieren.slice(0, 3), difierenPorDealer: c.difierenPorDealer.slice(0, 10), soloPlataforma: c.soloPlataforma.length, soloFinanzas: c.soloFinanzas.length, ndif: c.difieren.length })
}
const salida = args.find(a => a.startsWith('--excel='))?.slice(8)
if (salida) {
  const buf = await generarExcelFinanzas({ datos, resultado: r, meta: { archivos: [fVentas, fMv] } }, { ExcelJS })
  fs.writeFileSync(salida, Buffer.from(buf))
  console.log('Excel de Finanzas:', salida)
}
