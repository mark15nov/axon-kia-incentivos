import VariableStepMonthly from './VariableStepMonthly.jsx'

// Etapa 3 · Variable Margin. MONTHLY: cierre del periodo, resumen de
// cumplimiento por dealer y envío del reporte a la red y de la corrida
// del cálculo final a Finanzas.
export default function VariableStepPagoFinanzas() {
  return <VariableStepMonthly nombre="Variable Margin" folio="VM-JUN26-0428" />
}
