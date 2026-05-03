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
