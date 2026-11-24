// Corre el motor de Kia Fidelity sobre una carpeta con los 6 archivos SIMULADO.
// Uso: node scripts/correr-fidelity.mjs [carpeta] [--detalle] [--excel=salida.xlsx]
import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { cargarDatosFidelity } from '../tests/kia-fidelity/cargar.js'
import { calcularFidelity } from '../src/incentivos/kia-fidelity/motor/calculo.js'
import { evaluarAceptacion } from '../src/incentivos/kia-fidelity/motor/aceptacion.js'
import { correoFinanciera } from '../src/incentivos/kia-fidelity/motor/correo.js'

const args = process.argv.slice(2)
const carpeta = args.find(a => !a.startsWith('--')) ?? '.'
const { datos, casos, avisos } = await cargarDatosFidelity(carpeta)
if (avisos.length) console.log('avisos:', avisos)
const r = calcularFidelity(datos)
console.log('periodo', r.periodo, '· cuadre', r.cuadre.cuadra, r.cuadre.chequeos.map(c => `${c.ok ? '✓' : '✗'} ${c.texto}`))
console.log('pago', r.resumen.pago)
console.log('debito', r.resumen.debito)
console.table(r.porRazonSocial)
if (args.includes('--detalle')) {
  for (const c of r.contratos) {
    console.log(c.dossier, c.vin, c.estatusPago, c.chargeReclamado, '→', c.montoPagar, '|', c.estatusDebito, c.montoDebito,
      [...c.observaciones.map(o => `A:${o.codigo}`), ...c.motivos.map(m => `B:${m.codigo}: ${m.texto}`), ...c.notas.map(n => `N:${n.codigo}`), ...c.porRevisar.map(n => `R:${n.codigo}`)].join(' · '))
  }
  console.log(correoFinanciera(r).cuerpo)
}
if (casos.length) {
  const a = evaluarAceptacion(r, casos)
  console.log(`\nAceptación: ${a.detectados}/${a.total}`)
  a.filas.filter(f => !f.ok).forEach(f => console.log('  ✗', f.dossier, f.caso, '→', f.detalle))
}
const salida = args.find(a => a.startsWith('--excel='))?.slice(8)
if (salida) {
  const { generarExcelFidelity } = await import('../src/incentivos/kia-fidelity/excel/reporteFidelity.js')
  fs.writeFileSync(path.resolve(salida), Buffer.from(await generarExcelFidelity({ resultado: r, datos }, { ExcelJS })))
  console.log('Excel:', salida)
}
