import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import MargenVariableFlow from './incentivos/margen-variable/ui/MargenVariableFlow.jsx'
import OpeningFeeFlow from './incentivos/opening/OpeningFeeFlow.jsx'
import FeriaCreditoFlow from './incentivos/feria/FeriaCreditoFlow.jsx'
import BonoVentasFlow from './incentivos/bono/BonoVentasFlow.jsx'
import FleetClaimFlow from './incentivos/fleet/FleetClaimFlow.jsx'
import KiaFidelityFlow from './incentivos/fidelity/KiaFidelityFlow.jsx'
import FidelityFlow from './incentivos/kia-fidelity/ui/FidelityFlow.jsx'
import CashbackMarginFlow from './incentivos/cashback/CashbackMarginFlow.jsx'
import IncentivoShell from './incentivos/IncentivoShell.jsx'
import { incentivos, esActivo } from './data/incentivos.js'

// Incentivos con flujo propio construido.
const FLUJOS = {
  margenVariable: MargenVariableFlow,
  opening: OpeningFeeFlow,
  lowrate: OpeningFeeFlow,
  floorplan: OpeningFeeFlow,
  fleetclaim: FleetClaimFlow,
  kiafidelity: KiaFidelityFlow,
  kiaFidelity: FidelityFlow,
  cashback: CashbackMarginFlow,
  feria: FeriaCreditoFlow,
  bonoventas: BonoVentasFlow
}

export default function App() {
  // vista: 'home' (consolidado) | id de un incentivo
  const [vista, setVista] = useState('home')

  if (vista === 'home') {
    return <Dashboard onOpen={setVista} />
  }

  const incentivo = incentivos.find(i => i.id === vista)
  const volver = () => setVista('home')

  // Los programas desactivados no se abren.
  if (!incentivo || !esActivo(incentivo)) {
    return <Dashboard onOpen={setVista} />
  }

  // Incentivos con flujo completo construido (Cashback, Feria de Crédito).
  const Flujo = FLUJOS[incentivo?.flujo]
  if (Flujo) {
    return <Flujo incentivo={incentivo} onBack={volver} />
  }

  // El resto comparte el modelo operativo (página de consolidado).
  return <IncentivoShell incentivo={incentivo} onBack={volver} />
}
