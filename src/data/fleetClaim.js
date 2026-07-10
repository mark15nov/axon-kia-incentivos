// ============================================================
//  FLEET CLAIM · KIA
//  Paso 1 (Definir Oferta) propio: el plan de incentivo de
//  flotilla se crea en SAP incluyendo modelos, versiones (trims),
//  descuento y el cálculo del subsidio.
// ============================================================

export { fmtMXN } from './mockData.js'

export const FC_PERIODO = 'Junio 2026'

// % del descuento de flotilla que subvenciona KMX.
export const FC_SUBSIDIO_SHARE = 0.5

// Plan de flotilla (origen: SAP): modelo, versión, precio, descuento y volumen.
export const fcPlan = [
  { id: 'sp-lx', modelo: 'Sportage', trim: 'LX', precio: 545000, descuentoPct: 6, unidades: 40 },
  { id: 'sp-ex', modelo: 'Sportage', trim: 'EX', precio: 592000, descuentoPct: 7, unidades: 28 },
  { id: 'sp-sx', modelo: 'Sportage', trim: 'SX', precio: 648000, descuentoPct: 8, unidades: 14 },
  { id: 'se-lx', modelo: 'Seltos',   trim: 'LX', precio: 448000, descuentoPct: 5, unidades: 34 },
  { id: 'se-ex', modelo: 'Seltos',   trim: 'EX', precio: 496000, descuentoPct: 6, unidades: 22 },
  { id: 'k3-l',  modelo: 'K3',       trim: 'L',  precio: 372000, descuentoPct: 5, unidades: 30 },
  { id: 'k3-lx', modelo: 'K3',       trim: 'LX', precio: 412000, descuentoPct: 6, unidades: 18 },
  { id: 'so-ex', modelo: 'Sorento',  trim: 'EX', precio: 798000, descuentoPct: 8, unidades: 10 },
  { id: 'so-sx', modelo: 'Sorento',  trim: 'SX', precio: 872000, descuentoPct: 9, unidades: 6 },
  { id: 'sn-lx', modelo: 'Sonet',    trim: 'LX', precio: 389000, descuentoPct: 4, unidades: 26 }
]

// Versiones incluidas por defecto en el plan.
export const fcActivosDefault = ['sp-lx', 'sp-ex', 'se-lx', 'se-ex', 'k3-l', 'so-ex', 'sn-lx']

// Cálculo del subsidio por versión.
//  descuento = precio × descuento%
//  subsidio unitario = descuento × share KMX
//  subsidio total = subsidio unitario × unidades del plan
export function fcCalcFila(f, descuentoPct, subsidioShare) {
  const descuento = Math.round(f.precio * (descuentoPct / 100))
  const subsidioUnidad = Math.round(descuento * subsidioShare)
  const subsidioTotal = subsidioUnidad * f.unidades
  return { descuento, subsidioUnidad, subsidioTotal }
}

// ---- Paso 2 · Mail a dealers ----
export const fcDealersAplican = [
  { id: 'D01', dealer: 'KIA Santa Fe',      zona: 'Centro' },
  { id: 'D02', dealer: 'KIA Valle Oriente', zona: 'Norte' },
  { id: 'D03', dealer: 'KIA Patria',        zona: 'Occidente' },
  { id: 'D04', dealer: 'KIA Interlomas',    zona: 'Metropolitana' },
  { id: 'D05', dealer: 'KIA Querétaro',     zona: 'Bajío' },
  { id: 'D06', dealer: 'KIA Mérida',        zona: 'Sureste' }
]

export const fcComunicadoBase = {
  asunto: `Plan de Incentivo de Flotilla · ${FC_PERIODO}`,
  cuerpo: `Estimado concesionario:

Se publica el plan de incentivo de flotilla de ${FC_PERIODO}, con los modelos, versiones y descuentos autorizados y el subsidio de KMX correspondiente. Envíen su plan de flotilla con las condiciones propuestas (cliente, volumen comprometido y descuento) para su validación contra las políticas de KIA.

Los planes recibidos se revisan y se confirma su aceptación antes de generar el forecast de la oferta.

Saludos,
Centro de Incentivos KIA`
}

// ---- Paso 3 · Recepción de planes de dealers ----
// Política de KIA: descuento máximo autorizado y volumen mínimo por plan.
export const FC_POLITICA = { descuentoMax: 9, volumenMin: 8 }

export const fcPlanesDealers = [
  { id: 'P01', dealer: 'KIA Santa Fe',      cliente: 'Corporativo Alfa',      modelo: 'Sportage', unidades: 24, descuentoPct: 8,  plazo: 30 },
  { id: 'P02', dealer: 'KIA Valle Oriente', cliente: 'Grupo Logístico Norte', modelo: 'Seltos',   unidades: 18, descuentoPct: 9,  plazo: 45 },
  { id: 'P03', dealer: 'KIA Patria',        cliente: 'Renta Occidente',       modelo: 'K3',       unidades: 6,  descuentoPct: 7,  plazo: 30 },
  { id: 'P04', dealer: 'KIA Interlomas',    cliente: 'Flotillas MX',          modelo: 'Sportage', unidades: 30, descuentoPct: 11, plazo: 60 },
  { id: 'P05', dealer: 'KIA Querétaro',     cliente: 'Bajío Rent',            modelo: 'Sonet',    unidades: 14, descuentoPct: 6,  plazo: 30 },
  { id: 'P06', dealer: 'KIA Mérida',        cliente: 'Peninsular Corp',       modelo: 'Seltos',   unidades: 10, descuentoPct: 9,  plazo: 45 }
]

export function fcValidaPlan(p, politica = FC_POLITICA) {
  const excedeDescuento = p.descuentoPct > politica.descuentoMax
  const bajoVolumen = p.unidades < politica.volumenMin
  return { excedeDescuento, bajoVolumen, dentro: !excedeDescuento && !bajoVolumen }
}
