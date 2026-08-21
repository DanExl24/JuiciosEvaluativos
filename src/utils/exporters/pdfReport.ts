import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPercent, prettyState } from '../formatters/number'
import type { FormationCatalogResultLearner } from '../../types/dashboard'

export interface ResultPdfExportOptions {
  ficha: string
  competencyCode: string
  competencyName: string
  resultCode: string
  resultDetail: string
  totalLearners: number
  approvedLearners: number
  pendingLearners: number
  progress: number
  learners: FormationCatalogResultLearner[]
}

export function exportResultToPdf(options: ResultPdfExportOptions) {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF()

  // Título
  doc.setFontSize(18)
  doc.text('Reporte de Resultado de Aprendizaje', 14, 22)

  // Cabecera
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Ficha: ${options.ficha}`, 14, 30)

  const compText = `Competencia: ${options.competencyCode} - ${options.competencyName.toUpperCase()}`
  const compLines = doc.splitTextToSize(compText, 180)
  doc.text(compLines, 14, 36)

  let currentY = 36 + compLines.length * 5 + 4

  doc.text(`Resultado: ${options.resultCode}`, 14, currentY)
  currentY += 6

  doc.setFontSize(10)
  const detailLines = doc.splitTextToSize(options.resultDetail.toUpperCase(), 180)
  doc.text(detailLines, 14, currentY)
  currentY += detailLines.length * 5 + 10

  // Estadísticas
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Estadísticas:', 14, currentY)
  currentY += 7

  doc.setFontSize(10)
  doc.text(`Total Aprendices: ${options.totalLearners}`, 14, currentY)
  currentY += 6
  doc.text(`Aprobados: ${options.approvedLearners}`, 14, currentY)
  currentY += 6
  doc.text(`Pendientes: ${options.pendingLearners}`, 14, currentY)
  currentY += 6
  doc.text(`Avance: ${formatPercent(options.progress)}`, 14, currentY)
  currentY += 10

  // Tabla
  autoTable(doc, {
    startY: currentY,
    head: [['NOMBRE DEL APRENDIZ', 'DOCUMENTO', 'ESTADO FORMACIÓN', 'JUICIO EVALUATIVO']],
    body: options.learners.map((l) => [
      l.fullName,
      `${l.documentType} ${l.document}`,
      prettyState(l.state),
      prettyState(l.judgement),
    ]),
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save(`Resultado_${options.resultCode}_Ficha_${options.ficha}.pdf`)
}
