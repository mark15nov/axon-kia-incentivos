import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import VariableMarginFlow from './incentivos/variable/VariableMarginFlow.jsx'
import OpeningFeeFlow from './incentivos/opening/OpeningFeeFlow.jsx'
import FeriaCreditoFlow from './incentivos/feria/FeriaCreditoFlow.jsx'
import BonoVentasFlow from './incentivos/bono/BonoVentasFlow.jsx'
import FleetClaimFlow from './incentivos/fleet/FleetClaimFlow.jsx'
import KiaFidelityFlow from './incentivos/fidelity/KiaFidelityFlow.jsx'
import CashbackMarginFlow from './incentivos/cashback/CashbackMarginFlow.jsx'
import IncentivoShell from './incentivos/IncentivoShell.jsx'
import { incentivos } from './data/incentivos.js'

// Incentivos con flujo propio construido.
const FLUJOS = {
  variable: VariableMarginFlow,
  opening: OpeningFeeFlow,
  lowrate: OpeningFeeFlow,
  floorplan: OpeningFeeFlow,
  fleetclaim: FleetClaimFlow,
  kiafidelity: KiaFidelityFlow,
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

  // Incentivos con flujo completo construido (Cashback, Feria de Crédito).
  const Flujo = FLUJOS[incentivo?.flujo]
  if (Flujo) {
    return <Flujo incentivo={incentivo} onBack={volver} />
  }

  // El resto comparte el modelo operativo (página de consolidado).
  return <IncentivoShell incentivo={incentivo} onBack={volver} />
}
