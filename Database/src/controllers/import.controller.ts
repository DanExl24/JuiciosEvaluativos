import type { Request, Response } from 'express';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { pool } from '../config/db.ts';
import { importCsvPayload } from '../services/csvImport.ts';
import type { CsvImportPayload } from '../types.ts';
import { listImportLogs, readImportLog, writeImportLog } from '../utils/log-writer.ts';

const execAsync = promisify(exec);

export async function importCsv(req: Request, res: Response): Promise<void> {
  const payload = req.body as Partial<CsvImportPayload>;

  if (!payload.fileName || !payload.metadata || !Array.isArray(payload.rows) || !payload.summary) {
    res.status(400).json({ error: 'El archivo enviado no contiene la estructura esperada para la importacion.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await importCsvPayload(client, payload as CsvImportPayload);
    await client.query('COMMIT');

    const logFileName = await writeImportLog(payload.fileName, {
      ...payload,
      importedAt: new Date().toISOString(),
      importResult: result,
    });

    res.json({
      ok: true,
      ...result,
      result,
      logFileName,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo guardar la informacion en la base de datos.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
}

export async function extractProjectPdf(req: Request, res: Response): Promise<void> {
  const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : undefined);
  if (!uploadedFile) {
    res.status(400).json({ error: 'Debes adjuntar un archivo PDF.' });
    return;
  }

  const tempPath = uploadedFile.path;
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), 'parse_pdf.py'),
      path.resolve(process.cwd(), '..', 'parse_pdf.py'),
      path.resolve(__dirname, '..', '..', '..', 'parse_pdf.py'),
      path.resolve(__dirname, '..', '..', 'parse_pdf.py'),
    ];

    let scriptToRun = '';
    for (const p of candidatePaths) {
      try {
        await fs.access(p);
        scriptToRun = p;
        break;
      } catch {
        // Continue searching
      }
    }

    if (!scriptToRun) {
      throw new Error('No se encontro el script extractor parse_pdf.py en el sistema.');
    }

    const { stdout, stderr } = await execAsync(`python "${scriptToRun}" "${tempPath}"`, {
      maxBuffer: 15 * 1024 * 1024,
    });

    if (stderr && !stdout) {
      throw new Error(`Error en el extractor Python: ${stderr}`);
    }

    const parsedJson = JSON.parse(stdout);
    res.json(parsedJson);
  } catch (error) {
    console.error('Error extractProjectPdf:', error);
    const message = error instanceof Error ? error.message : 'No se pudo procesar el archivo PDF.';
    res.status(500).json({ error: message });
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

export async function getLogs(_req: Request, res: Response): Promise<void> {
  try {
    const logs = await listImportLogs();
    res.json(logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron listar los logs.';
    res.status(500).json({ error: message });
  }
}

export async function getLogByFileName(req: Request, res: Response): Promise<void> {
  const fileName = String(req.params.fileName || '');
  if (!fileName) {
    res.status(400).json({ error: 'Nombre de archivo invalido.' });
    return;
  }

  try {
    const data = await readImportLog(fileName);
    if (!data) {
      res.status(404).json({ error: 'Log no encontrado.' });
      return;
    }
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo leer el archivo de log.';
    res.status(500).json({ error: message });
  }
}
