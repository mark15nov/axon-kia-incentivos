// ============================================================
//  DASHBOARD · Puerta de entrada (Centro de Incentivos)
//  KPIs financieros por incentivo (pagado / por pagar / rechazado),
//  seguimiento por zona (gerentes de zona · dealers retrasados) y
//  motor de alertas que se detonan cuando un KPI cae bajo umbral.
//  Todo es data mock para la maqueta.
// ============================================================

import { incentivos } from './incentivos.js'

// --- KPIs por incentivo (mock). pagado + porPagar ≈ ejecutado. ---
export const KPIS = {
  variable:    { pagado: 210000, porPagar: 90000,  rechazado: 48000,  quick: 'Rechazo por soporte SAP incompleto; pago al corriente.' },
  opening:     { pagado: 470000, porPagar: 170000, rechazado: 60000,  quick: 'Avance en línea; sin observaciones críticas.' },
  lowrate:     { pagado: 610000, porPagar: 248000, rechazado: 90000,  quick: 'Ejecución estable; rechazo dentro de rango.' },
  floorplan:   { pagado: 360000, porPagar: 152000, rechazado: 70000,  quick: 'Rechazo al límite por documentación de inventario.' },
  fleetclaim:  { pagado: 165000, porPagar: 120000, rechazado: 62000,  quick: 'Rechazo y backlog altos; órdenes de compra sin validar.' },
  kiafidelity: { pagado: 360000, porPagar: 145000, rechazado: 55000,  quick: 'Avance saludable; validación contra Inbursa al día.' },
  cashback:    { pagado: 455000, porPagar: 260000, rechazado: 135000, quick: 'Rechazo alto por VIN fuera de periodo; pago rezagado.' },
  feria:       { pagado: 890000, porPagar: 420000, rechazado: 130000, quick: 'Volumen alto; ejecución conforme al evento.' },
  bonoventas:  { pagado: 120000, porPagar: 90000,  rechazado: 55000,  quick: 'Rechazo elevado por VQM; requiere revisión.' }
}

// Umbrales que detonan alertas.
export const UMBRALES = {
  tasaRechazo: 0.12,   // rechazado / procesado
  backlogPago: 0.35    // porPagar / (pagado + porPagar)
}

// Deriva los KPIs (montos + %) de un incentivo.
export function kpisIncentivo(inc) {
  const k = KPIS[inc.id] || { pagado: 0, porPagar: 0, rechazado: 0, quick: '' }
  const p = inc.presupuesto || 1
  const procesado = k.pagado + k.porPagar + k.rechazado
  const tasaRechazo = procesado ? k.rechazado / procesado : 0
  const backlogPago = (k.pagado + k.porPagar) ? k.porPagar / (k.pagado + k.porPagar) : 0
  return {
    ...k,
    procesado,
    pctPagado: (k.pagado / p) * 100,
    pctPorPagar: (k.porPagar / p) * 100,
    pctRechazado: (k.rechazado / p) * 100,
    tasaRechazo,
    backlogPago,
    alertaRechazo: tasaRechazo >= UMBRALES.tasaRechazo,
    alertaPago: backlogPago >= UMBRALES.backlogPago
  }
}

// Consolidado de toda la cartera para la fila de KPIs superior.
export function consolidadoKpis() {
  let pagado = 0, porPagar = 0, rechazado = 0, presupuesto = 0
  incentivos.forEach(inc => {
    const k = KPIS[inc.id] || { pagado: 0, porPagar: 0, rechazado: 0 }
    pagado += k.pagado; porPagar += k.porPagar; rechazado += k.rechazado
    presupuesto += inc.presupuesto
  })
  const procesado = pagado + porPagar + rechazado
  return {
    presupuesto, pagado, porPagar, rechazado, procesado,
    pctPagado: (pagado / presupuesto) * 100,
    pctPorPagar: (porPagar / presupuesto) * 100,
    pctRechazado: (rechazado / presupuesto) * 100,
    tasaRechazo: procesado ? rechazado / procesado : 0
  }
}

// --- Zonas · gerentes de zona y dealers retrasados por incentivo ---
export const zonas = [
  {
    id: 'centro', nombre: 'Centro', gerente: 'Laura Méndez',
    dealers: [
      { id: 'D01', nombre: 'KIA Polanco', ciudad: 'CDMX', avance: 88, retrasos: [] },
      { id: 'D04', nombre: 'KIA Puebla Angelópolis', ciudad: 'Puebla', avance: 52, retrasos: [
        { incentivo: 'cashback', dias: 6, motivo: 'Facturas PDF pendientes' },
        { incentivo: 'variable', dias: 4, motivo: 'Soporte SAP incompleto' }
      ] }
    ]
  },
  {
    id: 'norte', nombre: 'Norte', gerente: 'Jorge Salinas',
    dealers: [
      { id: 'D02', nombre: 'KIA Monterrey Valle', ciudad: 'Monterrey', avance: 61, retrasos: [
        { incentivo: 'fleetclaim', dias: 7, motivo: 'Órdenes de compra sin validar' }
      ] }
    ]
  },
  {
    id: 'occidente', nombre: 'Occidente', gerente: 'Diana Rocha',
    dealers: [
      { id: 'D03', nombre: 'KIA Guadalajara Sur', ciudad: 'Guadalajara', avance: 74, retrasos: [
        { incentivo: 'bonoventas', dias: 3, motivo: 'VQM sin conciliar' }
      ] }
    ]
  },
  {
    id: 'bajio', nombre: 'Bajío', gerente: 'Marco Treviño',
    dealers: [
      { id: 'D05', nombre: 'KIA Querétaro', ciudad: 'Querétaro', avance: 45, retrasos: [
        { incentivo: 'cashback', dias: 8, motivo: 'Sin entrega registrada' },
        { incentivo: 'lowrate', dias: 5, motivo: 'Contratos incompletos' }
      ] }
    ]
  },
  {
    id: 'sureste', nombre: 'Sureste', gerente: 'Paola Uc',
    dealers: [
      { id: 'D06', nombre: 'KIA Mérida', ciudad: 'Mérida', avance: 83, retrasos: [] }
    ]
  }
]

// Deriva métricas de una zona (avance promedio, dealers/retrasos, retraso máx.).
export function zonaResumen(z) {
  const avance = Math.round(z.dealers.reduce((a, d) => a + d.avance, 0) / z.dealers.length)
  const dealersRetrasados = z.dealers.filter(d => d.retrasos.length > 0)
  const retrasos = z.dealers.flatMap(d => d.retrasos)
  const diasMax = retrasos.reduce((a, r) => Math.max(a, r.dias), 0)
  return { avance, dealersRetrasados, totalDealers: z.dealers.length, retrasos, diasMax, alerta: diasMax >= 5 || avance < 60 }
}

// --- Motor de alertas: se detonan cuando un KPI cae ---
export function alertas() {
  const out = []
  incentivos.forEach(inc => {
    const k = kpisIncentivo(inc)
    if (k.alertaRechazo) out.push({
      tipo: 'incentivo', severidad: 'alta', contexto: inc.nombre,
      titulo: `Rechazo alto en ${inc.nombre}`,
      detalle: `${Math.round(k.tasaRechazo * 100)}% de lo procesado fue rechazado (umbral ${Math.round(UMBRALES.tasaRechazo * 100)}%).`
    })
    if (k.alertaPago) out.push({
      tipo: 'incentivo', severidad: 'media', contexto: inc.nombre,
      titulo: `Pago rezagado en ${inc.nombre}`,
      detalle: `${Math.round(k.backlogPago * 100)}% del monto validado sigue por pagar (umbral ${Math.round(UMBRALES.backlogPago * 100)}%).`
    })
  })
  zonas.forEach(z => {
    const r = zonaResumen(z)
    if (r.alerta) out.push({
      tipo: 'zona', severidad: r.diasMax >= 7 ? 'alta' : 'media', contexto: `Zona ${z.nombre}`,
      titulo: `Zona ${z.nombre} con dealers retrasados`,
      detalle: `${r.dealersRetrasados.length} dealer(s) con retraso · avance ${r.avance}% · hasta ${r.diasMax} días de atraso (Gerente: ${z.gerente}).`
    })
  })
  const orden = { alta: 0, media: 1, baja: 2 }
  return out.sort((a, b) => orden[a.severidad] - orden[b.severidad])
}
