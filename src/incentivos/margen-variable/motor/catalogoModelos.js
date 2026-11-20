// ============================================================
//  Catálogo de modelos y versiones Kia México
//  Familias y versiones tal como vienen en el layout de ventas
//  (Local Model Text + Version). Se armó con las ventas de
//  marzo y noviembre 2026; las versiones nuevas que lleguen en
//  un layout se agregan solas (catalogoConVentas).
//
//  Las exclusiones de la política se guardan como llaves:
//    "SONET"            → todo el modelo
//    "SONET|EX IVT"     → sólo esa versión
// ============================================================

export const CATALOGO_MODELOS = Object.freeze([
  { familia: 'K3', nombre: 'K3 Sedán / Hatchback', versiones: ['L T/M SDN', 'L T/A SDN', 'LX T/M SDN', 'LX T/A SDN', 'LX T/M HB', 'EX T/A SDN', 'EX T/A HB', 'EX PACK T/A SDN', 'EX PACK T/A HB', 'GT-LINE T/A SDN', 'GT-LINE T/A HB'] },
  { familia: 'K4', nombre: 'K4 Sedán / Hatchback', versiones: ['L IVT SDN', 'LX T/M SDN', 'LX IVT SDN', 'EX IVT SDN', 'EX IVT HB', 'GT-LINE IVT SDN', 'GT-LINE IVT HB', 'GT-LINE TURBO T/A SDN', 'GT-LINE TURBO T/A HB'] },
  { familia: 'SONET', nombre: 'Sonet', versiones: ['LX T/M', 'LX IVT', 'EX IVT', 'SX IVT'] },
  { familia: 'SELTOS', nombre: 'Seltos', versiones: ['LX IVT', 'EX IVT', 'EX PACK IVT', 'EX PACK T/A', 'SX IVT', 'SX T/A', 'SXL DCT'] },
  { familia: 'SELTOS HEV', nombre: 'Seltos Híbrida', versiones: ['SXL DCT', 'X-LINE DCT'] },
  { familia: 'SPORTAGE', nombre: 'Sportage', versiones: ['EX T/A', 'EX PACK T/A', 'SX T/A', 'SXL T/A', 'X-LINE T/A'] },
  { familia: 'SPORTAGE HEV', nombre: 'Sportage Híbrida', versiones: ['EX PACK T/A', 'X-LINE T/A'] },
  { familia: 'SORENTO', nombre: 'Sorento', versiones: ['EX T/A', 'EX PACK T/A', 'SXL DCT'] },
  { familia: 'NIRO', nombre: 'Niro Híbrida', versiones: ['EX DCT'] },
  { familia: 'TELLURIDE', nombre: 'Telluride', versiones: ['SX T/A'] },
  { familia: 'CARNIVAL', nombre: 'Carnival', versiones: [] },
  { familia: 'TASMAN', nombre: 'Tasman', versiones: [] },
  { familia: 'EV3', nombre: 'EV3', versiones: ['SXL EV'] },
  { familia: 'EV6', nombre: 'EV6', versiones: ['GT EV'] },
  { familia: 'EV9', nombre: 'EV9', versiones: [] }
].map(m => Object.freeze({ ...m, versiones: Object.freeze(m.versiones) })))

export const llaveModelo = (familia, version) => (version ? `${familia}|${version}` : familia)

/** ¿El modelo (o su versión) está en la lista de exclusión? */
export function excluido(lista, familia, version) {
  return lista.includes(familia) || (Boolean(version) && lista.includes(llaveModelo(familia, version)))
}

/** Catálogo + versiones/familias que vengan en las ventas cargadas y no estén registradas. */
export function catalogoConVentas(ventas = []) {
  const extra = new Map()
  for (const v of ventas) {
    if (!v.familia) continue
    const version = (v.version ?? '').toUpperCase()
    extra.set(v.familia, new Set([...(extra.get(v.familia) ?? []), ...(version ? [version] : [])]))
  }
  const base = CATALOGO_MODELOS.map(m => ({
    ...m,
    versiones: [...m.versiones, ...[...(extra.get(m.familia) ?? [])].filter(x => !m.versiones.includes(x)).sort()],
    nuevas: [...(extra.get(m.familia) ?? [])].filter(x => !m.versiones.includes(x)).length
  }))
  const conocidas = new Set(CATALOGO_MODELOS.map(m => m.familia))
  const nuevas = [...extra].filter(([f]) => !conocidas.has(f))
    .map(([familia, versiones]) => ({ familia, nombre: familia, versiones: [...versiones].sort(), nuevas: versiones.size, nuevo: true }))
  return [...base, ...nuevas]
}
