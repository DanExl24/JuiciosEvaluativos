export type CsvRow = Record<string, string>;
export type CsvMetadata = Record<string, string>;

export interface CsvSummary {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  metadataCount: number;
  columns: string[];
}

export interface CsvImportPayload {
  fileName: string;
  metadata: CsvMetadata;
  rows: CsvRow[];
  summary: CsvSummary;
  generatedAt: string;
}

export interface DashboardFilters {
  estado?: string;
  ficha?: string;
  juicio?: string;
  competencia?: string;
  resultado?: string;
  aprendiz?: string;
}

export interface ProjectPhaseMapping {
  activity: string;
  competencyCode?: string;
  competencyName?: string;
  resultCode?: string;
  resultName?: string;
}

export interface ProjectPhase {
  name: string;
  activity: string;
  activities?: string[];
  mappings?: ProjectPhaseMapping[];
  rawText: string;
  competencyCodes: string[];
  resultCodes: string[];
}

export interface ProjectImportPayload {
  projectCode: string;
  projectName: string;
  executionTime: string;
  regional: string;
  center: string;
  programCode: string;
  phases: ProjectPhase[];
}
