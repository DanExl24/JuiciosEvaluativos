import * as XLSX from 'xlsx'
import { prettyState } from '../formatters/number'
import type { FormationCatalogResultLearner } from '../../features/academic-tracking/types/tracking.types'

export interface ResultExportOptions {
  ficha: string
  competencyCode: string
  competencyName: string
  resultCode: string
  resultDetail: string
  learners: FormationCatalogResultLearner[]
}

export function exportResultToExcel(options: ResultExportOptions) {
  const now = new Date().toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })

  const header = [
    ['SISTEMA DE GESTIÓN ACADÉMICA - JUICIOS EVALUATIVOS'],
    ['REPORTE DE SEGUIMIENTO DETALLADO POR RESULTADO'],
    [''],
    ['DATOS GENERALES'],
    ['Ficha de Caracterización:', options.ficha],
    ['Competencia:', `${options.competencyCode} - ${options.competencyName.toUpperCase()}`],
    ['Resultado de Aprendizaje:', `${options.resultCode} - ${options.resultDetail.toUpperCase()}`],
    ['Fecha de Generación:', now],
    [''],
    ['LISTADO DE EVALUACIÓN'],
    ['NOMBRE DEL APRENDIZ', 'DOCUMENTO', 'ESTADO FORMACIÓN', 'JUICIO EVALUATIVO'],
  ]

  const data = options.learners.map((learner) => [
    learner.fullName,
    `${learner.documentType} ${learner.document}`,
    prettyState(learner.state),
    prettyState(learner.judgement),
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([...header, ...data])
  worksheet['!cols'] = [{ wch: 55 }, { wch: 25 }, { wch: 25 }, { wch: 25 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

  XLSX.writeFile(workbook, `Reporte_Seguimiento_${options.resultCode}_Ficha_${options.ficha}.xlsx`)
}
