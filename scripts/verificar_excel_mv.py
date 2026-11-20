"""Verifica que las fórmulas del Excel de Finanzas reproduzcan el cálculo de la plataforma.

Recalcula el libro con el motor de fórmulas de `formulas` (sin Excel) y compara,
VIN por VIN, CALCULO!T (MONTO A PAGAR, fórmula) y CALCULO!Y (REGLA, fórmula) contra
CALCULO!Z (MONTO PLATAFORMA, valor). También revisa que MONTHLY cuadre con el
Resumen de Pago.

Uso:
    pip install --user formulas
    MV_EXCEL_OUT=/ruta node --test tests/margen-variable/excel.test.js
    python3 scripts/verificar_excel_mv.py /ruta/fixture_guia.xlsx [...]
"""
import sys

import formulas
import openpyxl


def indexar(sol: dict) -> dict:
    """Llaves de `formulas` ("'[libro.xlsx]HOJA'!A1") → "HOJA!A1"."""
    out = {}
    for k, v in sol.items():
        llave = k.replace("'", "").split("]")[-1].upper()
        out[llave] = v.value[0][0] if hasattr(v, "value") else v
    return out


def verificar(ruta: str) -> bool:
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    calc = wb["CALCULO"]
    filas = calc.max_row
    monthly = next(n for n in wb.sheetnames if n.startswith("MONTHLY"))
    iva = next(r[2] for r in wb["PARAMETROS"].iter_rows(values_only=True) if r[1] == "IVA")
    sol = indexar(formulas.ExcelModel().loads(ruta).finish().calculate())

    errores = []
    total_excel = total_plataforma = 0.0
    for r in range(2, filas + 1):
        vin = calc[f"B{r}"].value
        regla = str(sol[f"CALCULO!Y{r}"])
        monto = float(sol[f"CALCULO!T{r}"])
        plataforma = float(calc[f"Z{r}"].value)
        regla_plat = calc[f"Y{r}"].value
        total_excel += monto
        total_plataforma += plataforma
        if abs(monto - plataforma) > 0.005 or regla != str(regla_plat):
            errores.append(f"  {vin}: Excel {regla} {monto:,.2f} vs plataforma {regla_plat} {plataforma:,.2f}")

    con_iva = float(sol[f"{monthly.upper()}!C11"])
    cuadra = bool(sol[f"{monthly.upper()}!D11"])
    if abs(con_iva - total_plataforma * (1 + iva)) > 0.05:
        errores.append(f"  MONTHLY C11 {con_iva:,.2f} ≠ plataforma con IVA {total_plataforma * (1 + iva):,.2f}")
    if not cuadra:
        errores.append("  MONTHLY D11: el control no cuadra con el Resumen de Pago")
    print(f"{ruta}: {filas - 1} VIN · total Excel {total_excel:,.2f} · plataforma {total_plataforma:,.2f} · "
          f"MONTHLY con IVA {con_iva:,.2f} · cuadra con Resumen de Pago: {cuadra}")
    for e in errores:
        print(e)
    return not errores


if __name__ == "__main__":
    ok = all([verificar(p) for p in sys.argv[1:]])
    print("OK: las fórmulas reproducen el cálculo de la plataforma" if ok else "ERROR: hay diferencias")
    sys.exit(0 if ok else 1)
