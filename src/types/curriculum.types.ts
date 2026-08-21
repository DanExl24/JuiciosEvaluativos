/**
 * Contrato Canónico Curricular Global
 * Define la estructura unificada y obligatoria para Resultados de Aprendizaje,
 * Competencias, Actividades y Fases de Proyecto formativo.
 */

export interface CurricularOutcome {
  id_resultado: number
  id_competencia: number
  id_actividad: number
  codigo: string
  codigo_juicio: string
  codigo_proyecto: string
  detalle: string
  isApproved?: boolean
  approvedCount?: number
  totalCount?: number
}

export interface CurricularCompetency {
  id_competencia: number
  id_programa: number
  codigo: string
  codigo_juicio: string
  codigo_proyecto: string
  nombre: string
  learningOutcomes: CurricularOutcome[]
  totalResults: number
  approvedResults: number
  isApproved: boolean
}

export interface CurricularActivity {
  id_actividad: number
  id_fase: number
  numero: number
  descripcion: string
  competencies: CurricularCompetency[]
}

export interface CurricularPhase {
  id_fase: number
  id_programa: number
  nombre: 'ANALISIS' | 'PLANEACION' | 'EJECUCION' | 'EVALUACION' | string
  actividad: string
  actividades: CurricularActivity[]
  competencies: CurricularCompetency[]
  totalExpectedResults: number
  totalApprovedResults: number
  totalPendingResults: number
}

export interface DualCodeBadgeInfo {
  juicio: string
  proyecto: string
}
