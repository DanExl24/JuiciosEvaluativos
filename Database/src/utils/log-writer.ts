import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
export const logsDirectory = path.join(projectRoot, 'logs');
export const uploadsDirectory = path.join(projectRoot, 'uploads');

export function buildLogFileName(fileName: string): string {
  const safeBaseName = path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeBaseName || 'csv-log'}-${stamp}.json`;
}

export async function writeImportLog(fileName: string, data: unknown): Promise<string> {
  await fs.mkdir(logsDirectory, { recursive: true });
  const logFileName = buildLogFileName(fileName);
  const logFilePath = path.join(logsDirectory, logFileName);
  await fs.writeFile(logFilePath, JSON.stringify(data, null, 2), 'utf-8');
  return logFileName;
}

export async function listImportLogs(): Promise<Array<{
  fileName: string;
  sourceFileName: string;
  importedAt: string;
  size: number;
}>> {
  await fs.mkdir(logsDirectory, { recursive: true });
  const files = await fs.readdir(logsDirectory);
  const logFiles = files.filter((f) => f.endsWith('.json'));

  const items = await Promise.all(
    logFiles.map(async (f) => {
      const fullPath = path.join(logsDirectory, f);
      const stat = await fs.stat(fullPath);
      let sourceFileName = f;
      let importedAt = stat.mtime.toISOString();

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.fileName) sourceFileName = parsed.fileName;
        if (parsed.importedAt) importedAt = parsed.importedAt;
      } catch {
        // Fallback to stat
      }

      return {
        fileName: f,
        sourceFileName,
        importedAt,
        size: stat.size,
      };
    })
  );

  return items.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function readImportLog(fileName: string): Promise<unknown | null> {
  const safeName = path.basename(fileName);
  const fullPath = path.join(logsDirectory, safeName);
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
