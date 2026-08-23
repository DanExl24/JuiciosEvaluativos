export interface ProjectData {
  id_proyecto: number
  codigo_proyecto: string
  proyecto_nombre: string
  tiempo_ejecucion: string
  regional: string
  centro_formacion: string
  id_programa: number
  programa_codigo: string
  programa_nombre: string
}

export interface DesertedLearner {
  nombre: string
  documento: string
  estado: string
  ultima_fecha: string | null
  juicio_estado: string
  competencia_codigo: string
  competencia_nombre: string
  resultado_codigo: string
  resultado_detalle: string
}

export interface PhaseLearnerStat {
  id_fase: number
  nombre: string
  approvedResults: number
  pendingResults: number
  expectedResults: number
  desertedCount: number
  trasladoCount: number
  voluntarioCount: number
  desertedLearners: DesertedLearner[]
  progressPercentage: number
}

export interface ProjectFicha {
  id_formacion: number
  ficha_caracterizacion: string
}
