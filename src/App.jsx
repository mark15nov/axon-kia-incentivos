import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import CashbackFlow from './incentivos/CashbackFlow.jsx'
import FeriaCreditoFlow from './incentivos/feria/FeriaCreditoFlow.jsx'
import BonoVentasFlow from './incentivos/bono/BonoVentasFlow.jsx'
import IncentivoShell from './incentivos/IncentivoShell.jsx'
import { incentivos } from './data/incentivos.js'

// Incentivos con flujo propio construido.
const FLUJOS = {
  cashback: CashbackFlow,
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
    return <Flujo onBack={volver} />
  }

  // El resto comparte el modelo operativo (página de consolidado).
  return <IncentivoShell incentivo={incentivo} onBack={volver} />
}
