import type { LearnerSummary } from '../../dashboard/types/dashboard.types'

export interface LearnerResultDetail {
  code: string
  codigo_juicio: string
  codigo_proyecto: string
  detail: string
  judgement: string
  registeredAt: string | null
  funcionario: string
  statusProgress: number
}

export interface LearnerCompetencyDetail {
  code: string
  codigo_juicio: string
  codigo_proyecto: string
  name: string
  totalResults: number
  approvedResults: number
  pendingResults: number
  disapprovedResults: number
  progress: number
  results: LearnerResultDetail[]
}

export interface LearnerDetail {
  learner: Omit<LearnerSummary, 'pendingCompetencies'>
  competencies: LearnerCompetencyDetail[]
}

export interface FormationCatalogResultLearner {
  id: number
  fullName: string
  document: string
  documentType: string
  state: string
  judgement: string
}

export interface FormationCatalogResult {
  code: string
  codigo_juicio: string
  codigo_proyecto: string
  detail: string
  totalLearners: number
  approvedLearners: number
  pendingLearners: number
  disapprovedLearners: number
  progress: number
  learners: FormationCatalogResultLearner[]
}

export interface FormationCatalogCompetency {
  ficha: string
  program: string
  code: string
  codigo_juicio: string
  codigo_proyecto: string
  name: string
  totalResults: number
  totalLearners: number
  approvedLearners: number
  pendingLearners: number
  disapprovedLearners: number
  progress: number
  results: FormationCatalogResult[]
}
