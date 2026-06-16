# KIA · Cashback — Maqueta del flujo de incentivos

Maqueta **funcional e interactiva** del programa de incentivos *Cashback* de KIA.
Recorre los **7 pasos** del proceso, desde las condiciones en SAP hasta el pago al dealer,
con datos simulados realistas. Pensada para demostrar el alcance y la funcionalidad a KIA,
y para seguir desarrollándola en Cursor.

## Stack

- **React 18** + **Vite 5** (arranque y build ultrarrápidos)
- **Tailwind CSS 3** (tema KIA: negro / blanco / rojo, look enterprise)
- Iconos SVG propios — sin librerías de UI, sin estética genérica de IA
- 100% front-end, datos mock (sin backend)

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Los 7 pasos del flujo

| # | Paso | De dónde viene la info |
|---|------|------------------------|
| 1 | **Condiciones y Forecast** | SAP (condiciones del incentivo + forecast del periodo) |
| 2 | **Carga de archivos** | Dealers: Excel de unidades + PDF de facturas. Faltantes → próximo mes |
| 3 | **Matriz VIN × Ofertas** | Motor de cruce. VINs por dealer (vertical) × ofertas (horizontal). Genera reportes de aclaración (datos incorrectos / duplicados) |
| 4 | **Validación de pago** | Consolida Paso 1 + Paso 3 → reporte estándar |
| 5 | **Circulares a dealers** | Automatizado: circular de aprobación por dealer |
| 6 | **Factura automatizada** | Verifica circular aprobada → genera factura |
| 7 | **Pago** | Tesorería libera el pago. Cierre del ciclo |

## Estructura

```
src/
  App.jsx                 ← layout, sidebar y navegación de los 7 pasos
  data/mockData.js        ← datos simulados (dealers, VINs, ofertas, lógica de consolidación)
  components/
    icons.jsx             ← set de iconos SVG propios
    ui.jsx                ← Card, Kpi, Pill, Button, ProgressBar, SectionTitle
  steps/
    Step1Condiciones.jsx
    Step2Archivos.jsx
    Step3Matriz.jsx
    Step4Validacion.jsx
    Step5Circulares.jsx
    Step6Factura.jsx
    Step7Pago.jsx
```

## Notas para desarrollo

- Toda la "lógica de negocio" simulada vive en `src/data/mockData.js`
  (incluida la función `consolidarPago()` que cruza la matriz validada con las condiciones).
- Para conectar a datos reales, sustituir los imports de `mockData.js` por llamadas a tu API/SAP.
- El estilo de marca está centralizado en `tailwind.config.js` (`colors.kia`).

---
Maqueta de demostración · datos ficticios.
