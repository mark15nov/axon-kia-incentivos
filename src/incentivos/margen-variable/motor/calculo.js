// ============================================================
//  MARGEN VARIABLE · Motor de cálculo
//  Función pura: recibe las tablas normalizadas de los layouts
//  y devuelve el cumplimiento por dealer / modelo, el monto a
//  pagar por VIN y las incidencias de cruce. Es la misma lógica
//  que se escribe como fórmulas en el Excel de Finanzas.
// ============================================================

import { EPS, USO, normalizarParametros, supera } from './parametros.js'
import { llave, periodoDe } from './layouts.js'
import { excluido } from './catalogoModelos.js'

export const REGLA = Object.freeze({
  A: 'A',                     // Retail ≥ 100% y (WHS ≥ 90% o MOS > 2)
  A_BONO: 'A_BONO',           // Regla A + 50% adicional
  B: 'B',                     // Retail < 100%, WHS > 90% y modelo > 100%
  B_BONO: 'B_BONO',           // Regla B + 50% adicional
  NO_CUMPLE: 'NO_CUMPLE',
  EXCLUIDO: 'EXCLUIDO',       // VIN con curtailment
  SIN_PROVISION: 'SIN_PROVISION',
  SIN_DEALER: 'SIN_DEALER'
})

export const REGLA_LABEL = Object.freeze({
  [REGLA.A]: 'Regla A · Retail ≥ 100%',
  [REGLA.A_BONO]: 'Regla A + bono 50%',
  [REGLA.B]: 'Regla B · Modelo > 100%',
  [REGLA.B_BONO]: 'Regla B + bono 50%',
  [REGLA.NO_CUMPLE]: 'No cumple',
  [REGLA.EXCLUIDO]: 'Excluido · curtailment',
  [REGLA.SIN_PROVISION]: 'Sin provisión',
  [REGLA.SIN_DEALER]: 'Dealer sin datos'
})

const pctTxt = (x) => (x === null || x === undefined ? 's/d' : `${(x * 100).toFixed(1)}%`)
// Redondeo a 9 decimales: igual que ROUND(...,9) en el Excel, para que el run-rate no
// genere diferencias de punto flotante entre plataforma y fórmulas.
const ratio = (v, mou) => (mou > 0 ? Math.round((v / mou) * 1e9) / 1e9 : 0)
const suma = (arr, fn) => arr.reduce((a, x) => a + fn(x), 0)

/** Periodo (YYYYMM) más frecuente en las fechas de retail. */
export function detectarPeriodo(ventas) {
  const c = new Map()
  for (const v of ventas) {
    if (!v.fechaRetail) continue
    const p = periodoDe(v.fechaRetail.anio, v.fechaRetail.mes)
    c.set(p, (c.get(p) ?? 0) + 1)
  }
  let mejor = null
  for (const [p, n] of c) if (!mejor || n > mejor.n) mejor = { p, n }
  return mejor?.p ?? null
}

/** Último día con venta en el periodo y días del mes (para el run-rate del forecast). */
export function avanceDelMes(ventas, periodo) {
  const anio = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(4))
  const diasMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  let ultimoDia = 0
  for (const v of ventas) {
    const f = v.fechaRetail
    if (f && f.anio === anio && f.mes === mes) ultimoDia = Math.max(ultimoDia, f.dia)
  }
  return { diasMes, ultimoDia, factorRunRate: ultimoDia > 0 ? diasMes / ultimoDia : 1 }
}

function incidencia(tipo, severidad, titulo, detalle, ejemplos = []) {
  return { tipo, severidad, titulo, detalle, n: ejemplos.length, ejemplos: ejemplos.slice(0, 8) }
}

/** Selecciona las filas de MOS/WS del periodo; si no hay, usa el último periodo disponible. */
function tablaDelPeriodo(filas, periodo, nombre, incidencias) {
  const delPeriodo = filas.filter(f => f.periodo === periodo)
  if (delPeriodo.length || !filas.length) {
    if (!filas.length) incidencias.push(incidencia(`sin_${nombre}`, 'error', `Sin datos de ${nombre.toUpperCase()}`, `El layout no trae filas de ${nombre.toUpperCase()}.`))
    return { filas: delPeriodo, periodoUsado: periodo }
  }
  const ultimo = filas.map(f => f.periodo).filter(Boolean).sort().at(-1)
  if (!ultimo) {
    incidencias.push(incidencia(`periodo_${nombre}`, 'error', `${nombre.toUpperCase()} sin periodo válido`, `Ninguna fila de ${nombre.toUpperCase()} trae PERIODO en formato YYYYMM.`))
    return { filas: [], periodoUsado: periodo }
  }
  incidencias.push(incidencia(`periodo_${nombre}`, 'aviso', `${nombre.toUpperCase()} de otro periodo`,
    `No hay ${nombre.toUpperCase()} para ${periodo}; se usa el último disponible (${ultimo}).`))
  return { filas: filas.filter(f => f.periodo === ultimo), periodoUsado: ultimo }
}

/** Mapa dealer → valor tomando la PRIMERA fila (igual que INDEX/MATCH en el Excel). */
function primeroPorDealer(filas, valor, nombre, incidencias) {
  const mapa = new Map()
  const dup = []
  for (const f of filas) {
    const k = llave(f.dealer)
    if (mapa.has(k)) dup.push(f.dealer)
    else mapa.set(k, valor(f))
  }
  if (dup.length) incidencias.push(incidencia(`${nombre}_duplicado`, 'aviso', `${nombre.toUpperCase()} duplicado por dealer`,
    `${dup.length} dealer(s) con más de una fila de ${nombre.toUpperCase()}; se toma la primera.`, dup))
  return mapa
}

/**
 * Evalúa una unidad contra la política. Exportada para pruebas.
 * @returns {{ regla: string, factor: number, motivo: string }}
 */
export function evaluarUnidad({ uso, familia, version = '', dealer: d, pctModelo }, p) {
  const nombre = version ? `${familia} ${version}` : familia
  const reglaA = d.cumpleRetail && d.cumpleInventario
  const modeloCumple = !d.cumpleRetail && d.whsReglaB && supera(pctModelo, p.umbralModelo, p)
  const sinReglaB = excluido(p.modelosSinReglaB, familia, version)
  const reglaB = modeloCumple && !sinReglaB
  if (reglaA || reglaB) {
    const motivoBase = reglaA
      ? `Retail ${pctTxt(d.pctRetail)} ≥ ${pctTxt(p.umbralRetail)}`
      : `Retail ${pctTxt(d.pctRetail)} < 100%, pero modelo ${familia} ${pctTxt(pctModelo)} y WHS ${pctTxt(d.ws)}`
    const sinBono = excluido(p.modelosSinBono, familia, version)
    const bono = uso === USO.RETAIL && d.superaBono && !sinBono
    if (bono) {
      const base = p.baseBono === 'retail' ? 'retail' : 'ventas totales'
      return { regla: reglaA ? REGLA.A_BONO : REGLA.B_BONO, factor: p.factorBono, motivo: `${motivoBase} · ${base} ${pctTxt(d.pctBono)} sobre ${pctTxt(p.umbralBono)}: bono` }
    }
    let motivo = motivoBase
    if (uso === USO.RETAIL && d.superaBono) motivo += ` · ${p.modelosSinBono.includes(familia) ? familia : nombre} excluido del bono`
    else if (uso !== USO.RETAIL && d.superaBono) motivo += ' · bono sólo aplica a inventario nuevo'
    return { regla: reglaA ? REGLA.A : REGLA.B, factor: 1, motivo }
  }
  if (modeloCumple && sinReglaB) {
    return { regla: REGLA.NO_CUMPLE, factor: 0, motivo: `Modelo ${familia} ${pctTxt(pctModelo)}, pero ${p.modelosSinReglaB.includes(familia) ? familia : nombre} está excluido de la regla B` }
  }
  if (d.cumpleRetail) {
    return { regla: REGLA.NO_CUMPLE, factor: 0, motivo: `Retail ${pctTxt(d.pctRetail)} ≥ 100%, pero WHS ${pctTxt(d.ws)} < ${pctTxt(p.umbralWhs)} y MOS ${d.mos ?? 's/d'} ≤ ${p.umbralMos}` }
  }
  const causa = d.whsReglaB ? `modelo ${familia} ${pctTxt(pctModelo)} ≤ ${pctTxt(p.umbralModelo)}` : `WHS ${pctTxt(d.ws)} ≤ ${pctTxt(p.umbralWhs)}`
  return { regla: REGLA.NO_CUMPLE, factor: 0, motivo: `Retail ${pctTxt(d.pctRetail)} < ${pctTxt(p.umbralRetail)} y ${causa}` }
}

/** Índices de MOU del mes por dealer (por uso) y por dealer×familia (retail). */
function indexarMou(mou, anio, mes) {
  const porDealer = new Map()
  const porModelo = new Map()
  for (const m of mou) {
    if (m.anio !== anio || m.mes !== mes || !m.uso) continue
    const k = llave(m.dealer)
    const d = porDealer.get(k) ?? { nombre: m.dealer, [USO.RETAIL]: 0, [USO.DEMO]: 0, [USO.FLOTA]: 0 }
    porDealer.set(k, { ...d, [m.uso]: d[m.uso] + m.unidades })
    if (m.uso === USO.RETAIL) {
      const km = `${k}|${m.familia}`
      porModelo.set(km, (porModelo.get(km) ?? 0) + m.unidades)
    }
  }
  return { porDealer, porModelo }
}

/** Depura ventas del periodo: fuera de periodo, VIN duplicado, uso desconocido. */
function depurarVentas(ventas, anio, mes, incidencias) {
  const fuera = []
  const duplicados = []
  const sinUso = []
  const vistos = new Set()
  const validas = []
  for (const v of ventas) {
    if (!v.fechaRetail || v.fechaRetail.anio !== anio || v.fechaRetail.mes !== mes) { fuera.push(v.vin); continue }
    if (vistos.has(v.vin)) { duplicados.push(v.vin); continue }
    vistos.add(v.vin)
    if (!v.uso) { sinUso.push(v.vin); continue }
    validas.push(v)
  }
  if (fuera.length) incidencias.push(incidencia('venta_fuera_periodo', 'aviso', 'Ventas fuera del periodo', `${fuera.length} VIN con fecha de retail fuera del periodo o sin fecha; no se consideran.`, fuera))
  if (duplicados.length) incidencias.push(incidencia('vin_duplicado', 'error', 'VIN duplicado en ventas', `${duplicados.length} VIN aparecen más de una vez; se toma la primera fila.`, duplicados))
  if (sinUso.length) incidencias.push(incidencia('uso_desconocido', 'error', 'Uso del vehículo no reconocido', `${sinUso.length} VIN sin V.USG Text / Reg.Type reconocible; no se consideran.`, sinUso))
  return validas
}

/** Provisión por VIN; reporta duplicados y periodos distintos. */
function indexarProvision(provision, periodo, incidencias) {
  const mapa = new Map()
  const dup = []
  const otroPeriodo = new Set()
  for (const p of provision) {
    if (mapa.has(p.vin)) { dup.push(p.vin); continue }
    mapa.set(p.vin, p.monto)
    if (p.periodo && p.periodo !== periodo) otroPeriodo.add(p.periodo)
  }
  if (dup.length) incidencias.push(incidencia('provision_duplicada', 'error', 'Provisión duplicada', `${dup.length} VIN con más de una provisión; se toma la primera.`, dup))
  if (otroPeriodo.size) incidencias.push(incidencia('periodo_provision', 'aviso', 'Provisión de otro periodo', `La provisión trae periodo ${[...otroPeriodo].join(', ')} y las ventas son de ${periodo}.`))
  return mapa
}

/** Cumplimiento de un dealer (antes de evaluar sus unidades). */
function cumplimientoDealer({ nombre, cat, mouD, ventasD, ws, mos }, p, esc) {
  const f = esc.factorRunRate
  const cuenta = (uso) => ventasD.filter(v => v.uso === uso).length
  const ventasRetail = cuenta(USO.RETAIL)
  const ventasDemo = cuenta(USO.DEMO)
  const ventasFlota = cuenta(USO.FLOTA)
  const ventasTotal = ventasRetail + ventasDemo + ventasFlota
  const mouRetail = mouD?.[USO.RETAIL] ?? 0
  const mouDemo = mouD?.[USO.DEMO] ?? 0
  const mouFlota = mouD?.[USO.FLOTA] ?? 0
  const mouTotal = mouRetail + mouDemo + mouFlota
  const pctRetail = ratio(ventasRetail * f, mouRetail)
  const pctTotal = ratio(ventasTotal * f, mouTotal)
  const cumpleWhs = ws !== null && ws >= p.umbralWhs - EPS
  const cumpleMos = mos !== null && mos > p.umbralMos + EPS
  const supuesto = esc.supuestoInventario
  const pctBono = p.baseBono === 'retail' ? pctRetail : pctTotal
  return {
    dealer: nombre,
    codigo: cat?.codigo ?? '',
    razonSocial: cat?.razonSocial ?? '',
    grupo: cat?.grupo ?? '',
    dsm: cat?.dsm ?? '',
    enCatalogo: Boolean(cat),
    mouRetail, mouDemo, mouFlota, mouTotal,
    ventasRetail, ventasDemo, ventasFlota, ventasTotal,
    pctRetail, pctTotal, pctBono, ws, mos, cumpleWhs, cumpleMos,
    cumpleRetail: pctRetail >= p.umbralRetail - EPS,
    cumpleInventario: supuesto || cumpleWhs || cumpleMos,
    superaBono: supera(pctBono, p.umbralBono, p),
    whsReglaB: supuesto || (ws !== null && supera(ws, p.umbralWhs, p)),
    supuestoInventario: supuesto
  }
}

/**
 * Calcula el Margen Variable del periodo.
 * @param {{ ventas: object[], provision: object[], mos: object[], ws: object[], mou: object[], dealers: object[] }} datos
 * @param {{ periodo?: string, parametros?: object, escenario?: { supuestoInventario?: boolean, factorRunRate?: number } }} [opciones]
 */
export function calcularMargenVariable(datos, opciones = {}) {
  const p = normalizarParametros(opciones.parametros)
  const esc = {
    supuestoInventario: Boolean(opciones.escenario?.supuestoInventario),
    factorRunRate: Math.max(1, Number(opciones.escenario?.factorRunRate) || 1)
  }
  const incidencias = []
  const periodo = opciones.periodo ?? detectarPeriodo(datos.ventas)
  if (!periodo) throw new Error('No se pudo determinar el periodo: las ventas no traen Retail Date válida.')
  const anio = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(4))

  const ventas = depurarVentas(datos.ventas, anio, mes, incidencias)
  const provision = indexarProvision(datos.provision, periodo, incidencias)
  const { porDealer: mouDealer, porModelo: mouModelo } = indexarMou(datos.mou, anio, mes)
  if (!mouDealer.size) incidencias.push(incidencia('sin_mou', 'error', 'Sin MOU del periodo', `El layout no trae MOU para ${periodo}.`))
  const mosT = tablaDelPeriodo(datos.mos, periodo, 'mos', incidencias)
  const wsT = tablaDelPeriodo(datos.ws, periodo, 'ws', incidencias)
  const mosPorDealer = primeroPorDealer(mosT.filas, m => m.mos, 'mos', incidencias)
  const wsPorDealer = primeroPorDealer(wsT.filas, w => w.wsPct, 'ws', incidencias)
  const wsFueraDeRango = wsT.filas.filter(w => w.wsPct !== null && w.wsPct > 5).map(w => w.dealer)
  if (wsFueraDeRango.length) incidencias.push(incidencia('ws_fuera_rango', 'aviso', 'WHS capturado como porcentaje entero',
    `${wsFueraDeRango.length} dealer(s) traen WS_PCT mayor a 500%; ¿se capturó 90 en lugar de 0.9?`, wsFueraDeRango))
  const catalogo = new Map(datos.dealers.map(d => [llave(d.dealer), d]))
  const curtailment = new Map((datos.curtailment ?? []).map(c => [c.vin, c.programa]))

  // Ventas agrupadas por dealer (Sold Dealer Name SSI).
  const ventasPorDealer = new Map()
  for (const v of ventas) {
    const k = llave(v.dealer)
    ventasPorDealer.set(k, [...(ventasPorDealer.get(k) ?? []), v])
  }
  const universo = new Set([...ventasPorDealer.keys(), ...[...mouDealer].filter(([, m]) => m.retail + m.demo + m.flota > 0).map(([k]) => k)])

  const dealersRes = []
  const vins = []
  for (const k of universo) {
    const ventasD = ventasPorDealer.get(k) ?? []
    const nombre = catalogo.get(k)?.dealer ?? mouDealer.get(k)?.nombre ?? ventasD[0]?.dealer ?? k
    const d = cumplimientoDealer({
      nombre, cat: catalogo.get(k), mouD: mouDealer.get(k), ventasD,
      ws: wsPorDealer.get(k) ?? null, mos: mosPorDealer.get(k) ?? null
    }, p, esc)

    // Cumplimiento por familia de modelo (retail vs MOU retail del modelo).
    const familias = new Set([...ventasD.map(v => v.familia), ...[...mouModelo.keys()].filter(km => km.startsWith(`${k}|`)).map(km => km.split('|')[1])])
    const modelos = [...familias].sort().map(fam => {
      const mouRetail = mouModelo.get(`${k}|${fam}`) ?? 0
      const ventasRetail = ventasD.filter(v => v.familia === fam && v.uso === USO.RETAIL).length
      const pct = ratio(ventasRetail * esc.factorRunRate, mouRetail)
      return { familia: fam, mouRetail, ventasRetail, pct, cumple: supera(pct, p.umbralModelo, p) }
    })
    const pctModelo = new Map(modelos.map(m => [m.familia, m.pct]))

    const vinsD = ventasD.map(v => {
      const base = {
        vin: v.vin, dealer: d.dealer, razonSocial: d.razonSocial, familia: v.familia, version: (v.version ?? '').toUpperCase(), lsc: v.lsc,
        uso: v.uso, usoTexto: v.usoTexto, fechaRetail: v.fechaRetail, fila: v.fila,
        pctRetail: d.pctRetail, pctTotal: d.pctTotal, pctModelo: pctModelo.get(v.familia) ?? 0, ws: d.ws, mos: d.mos
      }
      if (!provision.has(v.vin)) return { ...base, provision: 0, regla: REGLA.SIN_PROVISION, factor: 0, monto: 0, motivo: 'VIN sin provisión en el layout MV' }
      const prov = provision.get(v.vin)
      if (p.excluirCurtailment && curtailment.has(v.vin)) return { ...base, provision: prov, regla: REGLA.EXCLUIDO, factor: 0, monto: 0, motivo: `Unidad con curtailment${curtailment.get(v.vin) ? ` (${curtailment.get(v.vin)})` : ''}` }
      if (!d.enCatalogo && d.mouTotal === 0) return { ...base, provision: prov, regla: REGLA.SIN_DEALER, factor: 0, monto: 0, motivo: 'Dealer sin catálogo ni MOU' }
      const ev = evaluarUnidad({ uso: v.uso, familia: v.familia, version: base.version, dealer: d, pctModelo: base.pctModelo }, p)
      return { ...base, provision: prov, ...ev, monto: round2(prov * ev.factor) }
    })
    vins.push(...vinsD)

    const conProv = vinsD.filter(v => v.regla !== REGLA.SIN_PROVISION)
    const pagados = conProv.filter(v => v.factor > 0)
    dealersRes.push({
      ...d,
      modelos,
      reglaDealer: d.cumpleRetail && d.cumpleInventario ? REGLA.A : (!d.cumpleRetail && d.whsReglaB && modelos.some(m => m.cumple) ? REGLA.B : REGLA.NO_CUMPLE),
      bonoElegible: d.superaBono && conProv.some(v => v.regla === REGLA.A_BONO || v.regla === REGLA.B_BONO),
      unidadesProvision: conProv.length,
      provision: round2(suma(conProv, v => v.provision)),
      unidadesPagadas: pagados.length,
      unidadesBono: pagados.filter(conBono).length,
      monto: round2(suma(conProv, v => v.monto))
    })
  }

  registrarIncidenciasDeCruce({ ventas, vins, provision, dealersRes, incidencias })
  dealersRes.sort((a, b) => b.monto - a.monto || a.dealer.localeCompare(b.dealer))

  return {
    periodo,
    parametros: p,
    escenario: esc,
    periodosFuente: { mos: mosT.periodoUsado, ws: wsT.periodoUsado },
    dealers: dealersRes,
    vins,
    resumen: resumir(vins, dealersRes, p, esc),
    incidencias
  }
}

function registrarIncidenciasDeCruce({ ventas, vins, provision, dealersRes, incidencias }) {
  const vendidos = new Set(ventas.map(v => v.vin))
  const sinVenta = [...provision.keys()].filter(vin => !vendidos.has(vin))
  if (sinVenta.length) incidencias.push(incidencia('provision_sin_venta', provision.size === sinVenta.length ? 'error' : 'aviso',
    'Provisión sin venta en el periodo', `${sinVenta.length} de ${provision.size} VIN con provisión no aparecen en las ventas del periodo.`, sinVenta))
  const sinProv = vins.filter(v => v.regla === REGLA.SIN_PROVISION).map(v => v.vin)
  if (sinProv.length) incidencias.push(incidencia('venta_sin_provision', 'info', 'Ventas sin provisión',
    `${sinProv.length} VIN vendidos no traen provisión (modelos fuera del programa o pendientes); no generan pago.`, sinProv))
  const sinCat = dealersRes.filter(d => !d.enCatalogo && d.ventasTotal > 0).map(d => d.dealer)
  if (sinCat.length) incidencias.push(incidencia('dealer_sin_catalogo', 'error', 'Dealer no está en CAT_DEALERS',
    `${sinCat.length} dealer(s) con ventas no existen en el catálogo; revisa el nombre en "Sold Dealer Name(SSI)".`, sinCat))
  const sinMou = dealersRes.filter(d => d.ventasTotal > 0 && d.mouRetail === 0).map(d => d.dealer)
  if (sinMou.length) incidencias.push(incidencia('dealer_sin_mou', 'aviso', 'Dealer con ventas y MOU retail en cero',
    `${sinMou.length} dealer(s) venden sin objetivo retail; su cumplimiento se toma como 0%.`, sinMou))
  const sinWs = dealersRes.filter(d => d.unidadesProvision > 0 && d.ws === null).map(d => d.dealer)
  if (sinWs.length) incidencias.push(incidencia('dealer_sin_ws', 'aviso', 'Dealer sin WHS', `${sinWs.length} dealer(s) con provisión sin dato de WHS.`, sinWs))
  const sinMos = dealersRes.filter(d => d.unidadesProvision > 0 && d.mos === null).map(d => d.dealer)
  if (sinMos.length) incidencias.push(incidencia('dealer_sin_mos', 'aviso', 'Dealer sin MOS', `${sinMos.length} dealer(s) con provisión sin dato de MOS.`, sinMos))
}

function resumir(vins, dealers, p, esc) {
  const conProv = vins.filter(v => v.regla !== REGLA.SIN_PROVISION)
  const pagados = conProv.filter(v => v.factor > 0)
  const montoTotal = round2(suma(conProv, v => v.monto))
  const porRegla = Object.fromEntries(Object.values(REGLA).map(r => {
    const xs = vins.filter(v => v.regla === r)
    return [r, { unidades: xs.length, provision: round2(suma(xs, v => v.provision)), monto: round2(suma(xs, v => v.monto)) }]
  }))
  const agrupar = (clave) => {
    const m = new Map()
    for (const v of conProv) {
      const k = v[clave] || '(sin dato)'
      const a = m.get(k) ?? { clave: k, unidades: 0, unidadesPagadas: 0, provision: 0, monto: 0 }
      m.set(k, { ...a, unidades: a.unidades + 1, unidadesPagadas: a.unidadesPagadas + (v.factor > 0 ? 1 : 0), provision: a.provision + v.provision, monto: a.monto + v.monto })
    }
    return [...m.values()].map(x => ({ ...x, provision: round2(x.provision), monto: round2(x.monto) })).sort((a, b) => b.monto - a.monto)
  }
  return {
    unidadesVendidas: vins.length,
    unidadesConProvision: conProv.length,
    provisionTotal: round2(suma(conProv, v => v.provision)),
    unidadesPagadas: pagados.length,
    unidadesBono: pagados.filter(conBono).length,
    montoBono: round2(suma(pagados.filter(conBono), v => v.monto - v.provision)),
    montoTotal,
    montoConIva: round2(montoTotal * (1 + p.iva)),
    montoProyectado: round2(montoTotal * esc.factorRunRate),
    dealersTotal: dealers.length,
    dealersConPago: dealers.filter(d => d.monto > 0).length,
    porRegla,
    porFamilia: agrupar('familia'),
    porRazonSocial: agrupar('razonSocial')
  }
}

// Igual que ROUND(x,2) de Excel: se corrige el ruido binario (1000.05*1.5 = 1500.0749999…)
// antes de redondear a centavos.
const conBono = (v) => v.regla === REGLA.A_BONO || v.regla === REGLA.B_BONO

function round2(x) {
  return Math.round(Number((x * 100).toPrecision(15))) / 100
}
