import OfertaComercialUpload from '../shared/OfertaComercialUpload.jsx'
import VariableStep1 from '../variable/VariableStep1Conceptos.jsx'

// Paso 1 · Cashback. S02 del diagrama: se carga a SAP (ZASDI10000) el PDF de la
// oferta comercial aprobada del mes. Debajo se conserva el constructor de oferta.
export default function CashbackStep1DefinirOferta() {
  return (
    <div className="space-y-6">
      <OfertaComercialUpload
        titulo="Cargar oferta comercial aprobada a SAP"
        subtitulo="Monthly Commercial Offer (PDF) · Daniel Silis → SAP ZASDI10000"
        defaultName="oferta_cashback_junio_2026.pdf"
      />
      <VariableStep1 />
    </div>
  )
}
