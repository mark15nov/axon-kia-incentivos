// ============================================================
//  Lector ligero del archivo de cálculo de Finanzas
//  ("Calculation File_MV"). El archivo real pesa >10 MB y trae
//  13 hojas; cargarlo completo con ExcelJS usa ~800 MB de
//  memoria. Aquí se abre el .xlsx como zip y sólo se parsea la
//  hoja CALCULO (VIN, PROVIS, MONTO A PAGAR) usando los valores
//  ya calculados por Excel.
// ============================================================

import { abrirZipSeguro } from './limiteZip.js'

const HOJA = 'CALCULO'
const COLS = { vin: 'VIN', provision: 'PROVIS', monto: 'MONTO A PAGAR' }

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decodificar = (s) => s
  .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTIDADES[e])
  .replace(/&#(x?)([0-9a-fA-F]+);/g, (_, x, n) => String.fromCodePoint(parseInt(n, x ? 16 : 10)))

const textoDe = (xml) => {
  let out = ''
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += m[1]
  return decodificar(out)
}

const atributo = (attrs, nombre) => attrs.match(new RegExp(`\\b${nombre}="([^"]*)"`))?.[1] ?? null

/** Índice 0-based de una letra de columna (A → 0, AA → 26). */
const columna = (letras) => [...letras].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1

async function rutaHoja(zip, nombre) {
  const wbXml = await zip.file('xl/workbook.xml')?.async('string')
  const relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string')
  if (!wbXml || !relsXml) throw new Error('El archivo no parece un .xlsx válido.')
  const hoja = [...wbXml.matchAll(/<sheet\b([^>]*)\/?>/g)]
    .map(m => ({ name: decodificar(atributo(m[1], 'name') ?? ''), rid: atributo(m[1], 'r:id') }))
    .find(s => s.name.trim().toUpperCase() === nombre)
  if (!hoja) throw new Error(`El archivo de Finanzas no tiene la hoja ${nombre}.`)
  const rel = [...relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)]
    .map(m => ({ id: atributo(m[1], 'Id'), target: atributo(m[1], 'Target') }))
    .find(r => r.id === hoja.rid)
  if (!rel) throw new Error(`No se encontró la relación de la hoja ${nombre}.`)
  return rel.target.startsWith('/') ? rel.target.slice(1) : `xl/${rel.target.replace(/^\.\//, '')}`
}

async function cadenasCompartidas(zip) {
  const xml = await zip.file('xl/sharedStrings.xml')?.async('string')
  if (!xml) return []
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => textoDe(m[1]))
}

function valor(attrs, cuerpo, compartidas) {
  const t = atributo(attrs, 't')
  if (t === 'inlineStr') return textoDe(cuerpo)
  const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/)?.[1]
  if (v === undefined) return null
  if (t === 's') return compartidas[Number(v)] ?? null
  if (t === 'str' || t === 'e') return t === 'e' ? null : decodificar(v)
  const n = Number(v)
  return Number.isFinite(n) ? n : decodificar(v)
}

/**
 * Lee el cálculo de Finanzas: VIN → { provision, monto }.
 * @param {ArrayBuffer | Uint8Array} buffer
 * @returns {Promise<{ porVin: Map<string, { provision: number, monto: number }>, filas: number }>}
 */
export async function leerCalculoFinanzas(buffer) {
  const zip = await abrirZipSeguro(buffer)
  const ruta = await rutaHoja(zip, HOJA)
  const archivoHoja = zip.file(ruta)
  if (!archivoHoja) throw new Error(`El archivo de Finanzas declara la hoja ${HOJA} pero no la contiene.`)
  const [xml, compartidas] = await Promise.all([archivoHoja.async('string'), cadenasCompartidas(zip)])

  let idx = null
  const porVin = new Map()
  for (const fila of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const celdas = {}
    for (const c of fila[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = atributo(c[1], 'r')
      if (!ref) continue
      celdas[columna(ref.replace(/\d+/g, ''))] = valor(c[1], c[2] ?? '', compartidas)
    }
    if (!idx) {
      const enc = Object.entries(celdas).map(([i, v]) => [Number(i), String(v ?? '').trim().toUpperCase()])
      const buscar = (nombre) => enc.find(([, v]) => v === nombre)?.[0]
      idx = { vin: buscar(COLS.vin), provision: buscar(COLS.provision), monto: buscar(COLS.monto) }
      if (idx.vin === undefined || idx.monto === undefined) throw new Error(`La hoja ${HOJA} no tiene las columnas ${COLS.vin} y ${COLS.monto}.`)
      continue
    }
    const vin = String(celdas[idx.vin] ?? '').trim().toUpperCase()
    if (!vin) continue
    const monto = Number(celdas[idx.monto])
    const provision = Number(celdas[idx.provision])
    porVin.set(vin, { provision: Number.isFinite(provision) ? provision : 0, monto: Number.isFinite(monto) ? monto : 0 })
  }
  if (!idx) throw new Error(`La hoja ${HOJA} está vacía.`)
  return { porVin, filas: porVin.size }
}
