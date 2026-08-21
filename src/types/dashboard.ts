export interface DashboardOverview {
  programCount: number
  fichaCount: number
  learnerCount: number
  inTrainingCount: number
  retiredCount: number
  transferredCount: number
  approvedJudgements: number
  pendingJudgements: number
  disapprovedJudgements: number
  averageProgress: number
}

export interface ProgramSummary {
  programCode: string
  programName: string
  fichaCount: number
  learnerCount: number
  approvedCount: number
  pendingCount: number
  progress: number
}

export interface LearnerSummary {
  id: number
  fullName: string
  document: string
  documentType: string
  state: string
  ficha: string
  program: string
  totalResults: number
  approvedResults: number
  pendingResults: number
  disapprovedResults: number
  progress: number
  pendingCompetencies: string[]
}

export interface CompetencySummary {
  code: string
  codigo_juicio: string
  codigo_proyecto: string
  name: string
  program: string
  ficha: string
  total: number
  approved: number
  pending: number
  disapproved: number
  approvalRate: number
}

export interface PendingLearnerSummary extends LearnerSummary {}

export interface RecentJudgement {
  learner: string
  document: string
  ficha: string
  program: string
  competencia: string
  competencia_codigo: string
  competencia_codigo_juicio: string
  competencia_codigo_proyecto: string
  resultado: string
  resultado_codigo: string
  resultado_codigo_juicio: string
  resultado_codigo_proyecto: string
  judgement: string
  registeredAt: string
  funcionario: string
}

export interface FilterOption {
  codigo: string
  codigo_juicio: string
  codigo_proyecto: string
  nombre: string
  ficha: string
}

export interface ResultOption {
  codigo: string
  codigo_juicio: string
  codigo_proyecto: string
  detalle: string
  competencia_codigo: string
  ficha: string
}

export interface LearnerOption {
  id: number
  nombre: string
  documento: string
  ficha: string
  estado: string
}

export interface FichaOption {
  codigo: string
  nombre: string
}

export interface DashboardOptions {
  estados: string[]
  fichas: string[]
  fichasDetalle: FichaOption[]
  juicios: string[]
  competencias: FilterOption[]
  resultados: ResultOption[]
  aprendices: LearnerOption[]
}

export interface DashboardPayload {
  overview: DashboardOverview
  programs: ProgramSummary[]
  learners: LearnerSummary[]
  competencies: CompetencySummary[]
  pendingLearners: PendingLearnerSummary[]
  recentJudgements: RecentJudgement[]
  options: DashboardOptions
}

export interface DashboardFilters {
  estado: string
  ficha: string
  juicio: string
  competencia: string
  resultado: string
  aprendiz: string
}

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

export interface FormationCatalogResultLearner {
  id: number
  fullName: string
  document: string
  documentType: string
  state: string
  judgement: string
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
