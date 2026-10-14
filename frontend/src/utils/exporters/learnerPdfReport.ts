import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Capacitor } from '@capacitor/core'
import { formatPercent, prettyState } from '../formatters/number'
import { saveAndShareFile } from '../mobile/fileDownloader'
import type { LearnerDetail } from '../../features/academic-tracking/types/tracking.types'

export async function exportLearnerDetailToPdf(detail: LearnerDetail) {
  // eslint-disable-next-line new-cap
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const { learner, competencies } = detail

  // Header Bar (SENA Emerald Green)
  doc.setFillColor(5, 150, 105) // emerald-600
  doc.rect(0, 0, 210, 18, 'F')

  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('SENA | REPORTE INDIVIDUAL DE JUICIOS EVALUATIVOS', 14, 12)

  // Subtitle / Date
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const emissionDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Fecha de consulta: ${emissionDate}`, 196, 12, { align: 'right' })

  // Learner Info Box
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.roundedRect(14, 24, 182, 32, 2, 2, 'FD')

  doc.setTextColor(30, 41, 59) // slate-800
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(learner.fullName.toUpperCase(), 18, 31)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text(`Documento: ${learner.documentType} ${learner.document}`, 18, 38)
  doc.text(`Estado: ${prettyState(learner.state)}`, 18, 44)
  doc.text(`Ficha: ${learner.ficha}`, 18, 50)

  const programLines = doc.splitTextToSize(`Programa: ${learner.program}`, 95)
  doc.text(programLines, 95, 38)

  // Metrics Box on the right
  doc.setFillColor(236, 253, 245) // emerald-50
  doc.setDrawColor(167, 243, 208) // emerald-200
  doc.roundedRect(14, 60, 182, 18, 2, 2, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(6, 78, 59) // emerald-900

  doc.text(`Total RAPs: ${learner.totalResults}`, 20, 71)
  doc.text(`Aprobados: ${learner.approvedResults}`, 62, 71)
  doc.text(`Por Evaluar: ${learner.pendingResults}`, 104, 71)
  doc.text(`Desaprobados: ${learner.disapprovedResults}`, 144, 71)
  doc.text(`Avance: ${formatPercent(learner.progress)}`, 174, 71)

  // Table Data Flattening
  const tableRows: Array<[string, string, string, string, string]> = []

  competencies.forEach((comp) => {
    comp.results.forEach((r) => {
      tableRows.push([
        `${comp.code} - ${comp.name}`,
        r.code,
        r.detail,
        prettyState(r.judgement),
        r.funcionario || 'No registrado',
      ])
    })
  })

  autoTable(doc, {
    startY: 84,
    head: [['COMPETENCIA', 'RAP', 'DETALLE DEL RESULTADO', 'JUICIO', 'FUNCIONARIO']],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 62 },
      3: { cellWidth: 26, fontStyle: 'bold' },
      4: { cellWidth: 34, fontSize: 7 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const text = String(data.cell.raw).toLowerCase()
        if (text.includes('aprobado')) {
          data.cell.styles.textColor = [5, 150, 105] // emerald
        } else if (text.includes('evaluar')) {
          data.cell.styles.textColor = [217, 119, 6] // amber
        } else if (text.includes('desaprobado')) {
          data.cell.styles.textColor = [225, 29, 72] // rose
        }
      }
    },
  })

  // Footer / Page numbering
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Página ${i} de ${totalPages} - Sistema de Juicios Evaluativos SENA`,
      105,
      290,
      { align: 'center' },
    )
  }

  const cleanDoc = learner.document.replace(/[^a-zA-Z0-9]/g, '')
  const fileName = `Juicios_${cleanDoc}_Ficha_${learner.ficha}.pdf`

  if (Capacitor.isNativePlatform()) {
    const dataUri = doc.output('datauristring')
    const base64 = dataUri.split(',')[1] || ''
    await saveAndShareFile(fileName, base64, 'application/pdf')
  } else {
    doc.save(fileName)
  }
}
