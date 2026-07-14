import OfertaComercialUpload from '../shared/OfertaComercialUpload.jsx'
import VariableStep1 from './VariableStep1Conceptos.jsx'

// Paso 1 · Variable Margin. S02 del diagrama: se carga a SAP (ZASDI10000) el PDF
// de la oferta comercial aprobada del mes. Debajo, el constructor de oferta.
export default function VariableStep1DefinirOferta() {
  return (
    <div className="space-y-6">
      <OfertaComercialUpload
        titulo="Cargar oferta comercial aprobada a SAP"
        subtitulo="Monthly Commercial Offer (PDF) · Daniel Silis → SAP ZASDI10000"
        defaultName="oferta_variable_margin_junio_2026.pdf"
      />
      <VariableStep1 />
    </div>
  )
}
