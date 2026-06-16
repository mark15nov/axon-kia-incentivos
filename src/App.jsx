import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import CashbackFlow from './incentivos/CashbackFlow.jsx'
import IncentivoShell from './incentivos/IncentivoShell.jsx'
import { incentivos } from './data/incentivos.js'

export default function App() {
  // vista: 'home' (consolidado) | id de un incentivo
  const [vista, setVista] = useState('home')

  if (vista === 'home') {
    return <Dashboard onOpen={setVista} />
  }

  const incentivo = incentivos.find(i => i.id === vista)
  const volver = () => setVista('home')

  // El Cashback tiene el flujo completo de 7 pasos.
  if (incentivo?.flujo) {
    return <CashbackFlow onBack={volver} />
  }

  // El resto comparte el modelo operativo (página de consolidado).
  return <IncentivoShell incentivo={incentivo} onBack={volver} />
}
