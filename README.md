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

## Margen Variable (incentivo activo)

Es el único programa activo; el resto aparece como **Desactivado** en el dashboard
(no se abre ni suma a KPIs, alertas o zonas). Código en `src/incentivos/margen-variable/`:

```
motor/      parametros.js · layouts.js · calculo.js · conciliacion.js   ← lógica pura, sin React
excel/      leerLibro.js · leerCalculoFinanzas.js · reporteFinanzas.js  ← lectura y Excel formulado
ui/         MargenVariableFlow.jsx + un archivo por paso
```

**Guía oficial:** el archivo de cálculo de Finanzas (`Calculation File_MV`). La plataforma
replica sus reglas y entrega el Excel con su mismo formato; el archivo no se sube cada mes.

**Dos versiones** (selector en el menú lateral del programa):
- **Cálculo en plataforma** (default): se suben 2 Excel, `Layout Carga Ventas` (hoja Data) y
  `Layout_Carga_MV` (LY_PROVISION_VIN, LY_MOS_DEALER, LY_WS_DEALER, LY_MOU, CAT_DEALERS y LY_CURTAILMENT).
- **Con conciliación**: además se sube un `Calculation File_MV` para comparar VIN por VIN, y se
  puede comparar contra la política escrita.

**Reglas de la guía** (umbrales editables en el paso 1):
- **A** · Retail ≥ 100% vs MOU retail y (WHS ≥ 90% o MOS > 2) → provisión a todas las unidades.
- **B** · Retail < 100%, WHS ≥ 90% y modelo ≥ 100% → provisión a las unidades de ese modelo.
- **Bono** · +50% si es inventario nuevo, ventas retail ≥ 110% del MOU retail y el modelo no es Sonet.
- **Curtailment** · los VIN de la hoja LY_CURTAILMENT se pagan en $0.
- **Modelos y versiones** · catálogo Kia México (`motor/catalogoModelos.js`) con exclusiones por modelo o versión para la regla B y para el bono (`modelosSinReglaB`, `modelosSinBono`; llaves `SONET` o `SONET|EX IVT`). Las versiones nuevas del layout de ventas se agregan solas.
- La **política escrita** difiere en 3 puntos (bono sobre ventas totales, ">" estricto, sin curtailment)
  y está disponible como alternativa (`POLITICA_ESCRITA`). Con la guía, marzo 2026 coincide con
  Finanzas en 8,113 de 8,114 VIN ($25.39 M); con la política escrita serían $21.92 M.

**Excel para Finanzas** (`Calculation File_MV {MES} {AA}.xlsx`), mismo formato que la guía:
MONTHLY MV, MV {MES} por Modelo, CALCULO, Resumen de Pago (MXN y USD), BC, las bases
(SALES, PROVISION, MOS, WHS, MOU, DEALERS, Curtailment) y PARAMETROS con celdas nombradas
(umbrales, tipo de cambio 19.8 y centro de costo K8200). Todo formulado.

```bash
npm test                       # pruebas del motor y del Excel
npm run mv:demo                # regenera public/demo/* desde "Calculation File_MV Axon.xlsx"
npm run mv:correr -- <ventas.xlsx> <layout_mv.xlsx> [calculo_finanzas.xlsx] [--finanzas] [--excel=salida.xlsx]
python3 scripts/verificar_excel_mv.py <libro.xlsx>   # recalcula fórmulas y cuadra contra la plataforma (pip install formulas)
```

El paquete demo (`public/demo/`, marzo 2026) se arma desde el archivo de cálculo de Finanzas
porque los layouts de ejemplo no cruzan entre sí (provisión 202603 vs. ventas nov-2026).

---
Maqueta de demostración · datos ficticios.

## Kia Fidelity (incentivo activo)

Kia paga a la financiera un subsidio de tasa por crédito: **Charge = intereses a tasa teórica − intereses a tasa real**.
Cada mes se responden dos preguntas por separado (el débito al dealer **no** se resta del pago):

- **A · Pago a la financiera**: cuadre (Dossier en calculadora, suma vs hoja CHARGE), duplicados, VIN válido (17 caracteres y en SAP),
  datos de captura (plazo, tasa, monto, accesorios + GAP, versión), tasa de beneficio vs catálogo vigente, recálculo independiente
  del Charge al centavo (detecta el total de intereses reales "AC" que no cuadra con la amortización mensual) y seguro Externa.
  Resultado por Dossier: **Procede** (se paga lo reclamado), **Ajuste** (se paga el recalculado) o **Retenido** (hasta la corrección).
- **B · Débitos al distribuidor** con motivo por VIN: ya pagado, incompatible (matriz COMPAT), duplicado, fuera de plazo (N-rule) y demo.
  Lo que las reglas no cubren queda **por revisar** (no se inventan criterios).

Código en `src/incentivos/kia-fidelity/` (`motor/` reglas puras, `excel/` cierre, `ui/` flujo). La compatibilidad entre incentivos
es general para la plataforma: `src/incentivos/shared/compatibilidad.js`.

Entregables: resumen en dos columnas, detalle por VIN, subtotales por razón social, correo a la financiera listo para enviar,
Excel de cierre (totales con fórmulas) y **VINS PAGADOS actualizado** (mismo formato de entrada, para validar incentivos futuros).

Parámetros por confirmar con KIA (configurables en el paso 1): N-rule (default N-1 meses) y antigüedad mínima de demo (default 90 días).

```bash
npm run fidelity:correr -- --detalle          # corre el motor con los SIMULADO de public/demo/fidelity
```

Prueba de aceptación: con los archivos SIMULADO el motor detecta los 30 casos de "Casos plantados" (`tests/kia-fidelity/`).
