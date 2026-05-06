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

export interface LogPayload {
  fileName: string;
  metadata: CsvMetadata;
  rows: CsvRow[];
  summary: CsvSummary;
  generatedAt: string;
}

export interface LogResponse {
  fileName: string;
  savedAt: string;
  bytes: number;
}

export interface ImportHistoryEntry {
  id: number;
  fileName: string;
  ficha: string;
  rowCount: number;
  importedAt: string;
  metadata: CsvMetadata | null;
  summary: CsvSummary | null;
  previewRows: CsvRow[] | null;
}
