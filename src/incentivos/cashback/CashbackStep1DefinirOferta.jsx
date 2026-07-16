import { useState } from 'react'
import OfertaComercialUpload from '../shared/OfertaComercialUpload.jsx'
import CashbackOfertaConstructor from './CashbackOfertaConstructor.jsx'

// Paso 1 · Cashback. S02 del diagrama: se carga a SAP (ZASDI10000) el PDF de la
// oferta comercial aprobada. Al soltar el PDF, las variables de la oferta
// (Modelo, Año, Versión, Bolsa de pagos) se cargan automáticamente para validar
// o ajustar.
export default function CashbackStep1DefinirOferta() {
  const [cargado, setCargado] = useState(false)

  return (
    <div className="space-y-6">
      <OfertaComercialUpload
        titulo="Cargar oferta comercial aprobada a SAP"
        subtitulo="Monthly Commercial Offer (PDF) · Daniel Silis → SAP ZASDI10000"
        defaultName="oferta_cashback_junio_2026.pdf"
        simulable
        onLoaded={() => setCargado(true)}
        onReset={() => setCargado(false)}
      />
      <CashbackOfertaConstructor cargado={cargado} />
    </div>
  )
}
