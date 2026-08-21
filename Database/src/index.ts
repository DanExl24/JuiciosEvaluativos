import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

import { pool } from './config/db.ts';
import { importCsvPayload } from './services/csvImport.ts';
import { getDashboardData, getFormationCompetencyCatalog, getLearnerDetail } from './services/dashboard.ts';
import { deleteFormationByFicha } from './services/formations.ts';
import { importProject, getProjects, getProjectPhases, getUnassignedCompetencies, assignCompetencyToPhase, unassignCompetency, getPhaseLearnerStats, getFichasByProject, deleteProject } from './services/projects.ts';
import type { CsvImportPayload, DashboardFilters, ProjectImportPayload } from './types.ts';

const execAsync = promisify(exec);

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const logsDirectory = path.join(projectRoot, 'logs');
const uploadsDirectory = path.join(projectRoot, 'uploads');
const apiPort = Number(process.env.PORT) || 4000;

const upload = multer({ dest: uploadsDirectory });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

async function ensureSchemaCompatibility() {
  await pool.query(`
    DROP TABLE IF EXISTS importacion_archivo
  `);

  await pool.query(`
    ALTER TABLE programa
    ALTER COLUMN nombre TYPE TEXT
  `);

  await pool.query(`
    ALTER TABLE competencia
    ALTER COLUMN nombre TYPE TEXT
  `);

  await pool.query(`
    ALTER TABLE aprendiz
    DROP CONSTRAINT IF EXISTS aprendiz_documento_key
  `);

  await pool.query(`
    ALTER TABLE competencia
    DROP CONSTRAINT IF EXISTS competencia_codigo_key
  `);

  await pool.query(`
    ALTER TABLE resultados_aprendizaje
    DROP CONSTRAINT IF EXISTS resultados_aprendizaje_codigo_key
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'aprendiz_documento_formacion_key'
      ) THEN
        ALTER TABLE aprendiz
        ADD CONSTRAINT aprendiz_documento_formacion_key UNIQUE (documento, id_formacion);
      END IF;
    END
    $$;
  `);

  await pool.query(`
    ALTER TABLE fases DROP CONSTRAINT IF EXISTS unique_nombre_fase;
    
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fases_nombre_programa_key'
      ) THEN
        ALTER TABLE fases
        ADD CONSTRAINT fases_nombre_programa_key UNIQUE (nombre, id_programa);
      END IF;
    END
    $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'competencia' AND column_name = 'id_programa'
      ) THEN
        -- Add id_programa column
        ALTER TABLE competencia ADD COLUMN id_programa INTEGER REFERENCES programa(id_programa) ON DELETE CASCADE;
        
        -- Migrate data
        UPDATE competencia c
        SET id_programa = f.id_programa
        FROM formacion f
        WHERE c.id_formacion = f.id_formacion;
        
        -- Make it NOT NULL after migration
        ALTER TABLE competencia ALTER COLUMN id_programa SET NOT NULL;
        
        -- Drop old constraints and column
        ALTER TABLE competencia DROP CONSTRAINT IF EXISTS competencia_codigo_formacion_key;
        ALTER TABLE competencia DROP COLUMN IF EXISTS id_formacion;
        
        -- Add new unique constraint
        ALTER TABLE competencia ADD CONSTRAINT competencia_codigo_programa_key UNIQUE (codigo, id_programa);
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS proyecto_formativo (
        id_proyecto SERIAL PRIMARY KEY,
        codigo_proyecto VARCHAR(50) NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        tiempo_ejecucion VARCHAR(100),
        regional VARCHAR(100),
        centro_formacion VARCHAR(200),
        id_programa INTEGER NOT NULL REFERENCES programa(id_programa) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fase_competencia (
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      id_competencia INTEGER NOT NULL REFERENCES competencia(id_competencia) ON DELETE CASCADE,
      PRIMARY KEY (id_fase, id_competencia)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fase_resultado (
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      id_resultado INTEGER NOT NULL REFERENCES resultados_aprendizaje(id_resultado) ON DELETE CASCADE,
      PRIMARY KEY (id_fase, id_resultado)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fase_actividad (
      id_actividad SERIAL PRIMARY KEY,
      id_fase INTEGER NOT NULL REFERENCES fases(id_fase) ON DELETE CASCADE,
      numero INTEGER,
      descripcion TEXT NOT NULL,
      CONSTRAINT uq_fase_actividad UNIQUE (id_fase, descripcion)
    );
  `);

  // Migrate legacy id_fase if column exists
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'competencia' AND column_name = 'id_fase'
      ) THEN
        INSERT INTO fase_competencia (id_fase, id_competencia)
        SELECT c.id_fase, c.id_competencia
        FROM competencia c
        WHERE c.id_fase IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        ALTER TABLE competencia DROP COLUMN id_fase;
      END IF;
    END
    $$;
  `);
}

function buildLogFileName(fileName: string) {
  const safeBaseName = path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeBaseName || 'csv-log'}-${stamp}.json`;
}

function readFilters(query: Record<string, unknown>): DashboardFilters {
  const filters: DashboardFilters = {};

  if (typeof query.estado === 'string') {
    filters.estado = query.estado;
  }
  if (typeof query.ficha === 'string') {
    filters.ficha = query.ficha;
  }
  if (typeof query.juicio === 'string') {
    filters.juicio = query.juicio;
  }
  if (typeof query.competencia === 'string') {
    filters.competencia = query.competencia;
  }
  if (typeof query.resultado === 'string') {
    filters.resultado = query.resultado;
  }
  if (typeof query.aprendiz === 'string') {
    filters.aprendiz = query.aprendiz;
  }

  return filters;
}

app.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      databaseTime: result.rows[0]?.now ?? null,
      apiPort,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar la base de datos.';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/health/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      databaseTime: result.rows[0]?.now ?? null,
      database: process.env.DB_NAME ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo conectar a la base de datos.';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const dashboard = await getDashboardData(pool, readFilters(req.query));
    res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el dashboard.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/learners/:learnerId', async (req, res) => {
  const learnerId = Number(req.params.learnerId);

  if (!Number.isInteger(learnerId) || learnerId <= 0) {
    res.status(400).json({ error: 'El identificador del aprendiz no es valido.' });
    return;
  }

  try {
    const detail = await getLearnerDetail(pool, learnerId);
    if (!detail) {
      res.status(404).json({ error: 'No se encontro el aprendiz solicitado.' });
      return;
    }

    res.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar el detalle del aprendiz.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/formations/competencies', async (req, res) => {
  try {
    const catalog = await getFormationCompetencyCatalog(pool, readFilters(req.query));
    res.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar el catalogo de competencias y resultados.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/import/csv', async (req, res) => {
  const payload = req.body as Partial<CsvImportPayload>;

  if (!payload?.fileName || !payload?.summary || !Array.isArray(payload?.rows) || !payload?.metadata) {
    res.status(400).json({ error: 'El payload JSON no tiene la estructura esperada para importar el CSV.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const summary = await importCsvPayload(client, payload as CsvImportPayload);
    await client.query('COMMIT');
    res.status(201).json({
      ok: true,
      ...summary,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo importar el CSV a la base de datos.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
});

app.post('/api/import/project', async (req, res) => {
  const payload = req.body as Partial<ProjectImportPayload>;

  if (!payload?.projectCode || !payload?.programCode || !payload?.phases) {
    res.status(400).json({ error: 'El payload JSON no tiene la estructura esperada para importar el proyecto.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await importProject(client, payload as ProjectImportPayload);
    await client.query('COMMIT');
    res.status(201).json({ ok: true, ...result });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo importar el proyecto a la base de datos.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const projectId = Number(req.params.id);
  if (!projectId) {
    res.status(400).json({ error: 'ID de proyecto no valido.' });
    return;
  }

  try {
    const success = await deleteProject(pool, projectId);
    if (success) {
      res.json({ message: 'Proyecto eliminado correctamente.' });
    } else {
      res.status(404).json({ error: 'No se encontró el proyecto.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el proyecto.' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getProjects(pool);
    res.json(projects);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los proyectos formativos.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/projects/:id/phases', async (req, res) => {
  const projectId = Number(req.params.id);
  const fichaId = req.query.fichaId ? Number(req.query.fichaId) : undefined;
  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ error: 'ID de proyecto no valido.' });
    return;
  }

  try {
    const details = await getProjectPhases(pool, projectId, fichaId);
    res.json(details);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las fases del proyecto.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/projects/:id/unassigned', async (req, res) => {
  const projectId = Number(req.params.id);
  if (!Number.isInteger(projectId)) {
    res.status(400).json({ error: 'ID de proyecto no valido.' });
    return;
  }

  try {
    const competencies = await getUnassignedCompetencies(pool, projectId);
    res.json(competencies);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener competencias sin asignar.' });
  }
});

app.post('/api/competencies/:id/assign', async (req, res) => {
  const competencyId = Number(req.params.id);
  const { phaseId } = req.body;

  if (!competencyId || !phaseId) {
    res.status(400).json({ error: 'Faltan datos para la asignación.' });
    return;
  }

  try {
    const success = await assignCompetencyToPhase(pool, competencyId, phaseId);
    if (success) {
      res.json({ message: 'Competencia asignada correctamente.' });
    } else {
      res.status(404).json({ error: 'No se encontró la competencia o la fase.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar la competencia.' });
  }
});

app.post('/api/competencies/:id/unassign', async (req, res) => {
  const competencyId = Number(req.params.id);
  const { phaseId } = req.body;
  if (!competencyId) {
    res.status(400).json({ error: 'ID de competencia no valido.' });
    return;
  }
  if (!Number.isInteger(Number(phaseId)) || Number(phaseId) <= 0) {
    res.status(400).json({ error: 'ID de fase no valido.' });
    return;
  }

  try {
    const success = await unassignCompetency(pool, competencyId, Number(phaseId));
    if (success) {
      res.json({ message: 'Competencia desasignada correctamente.' });
    } else {
      res.status(404).json({ error: 'No se encontró la competencia.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al desasignar la competencia.' });
  }
});

app.get('/api/projects/:id/phase-learner-stats', async (req, res) => {
  const projectId = Number(req.params.id);
  const fichaId = req.query.fichaId ? Number(req.query.fichaId) : undefined;
  if (!projectId) {
    res.status(400).json({ error: 'ID de proyecto no valido.' });
    return;
  }

  try {
    const stats = await getPhaseLearnerStats(pool, projectId, fichaId);
    res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ error: `Error al obtener estadísticas: ${message}` });
  }
});

app.get('/api/projects/:id/fichas', async (req, res) => {
  const projectId = Number(req.params.id);
  if (!projectId) {
    res.status(400).json({ error: 'ID de proyecto no valido.' });
    return;
  }

  try {
    const fichas = await getFichasByProject(pool, projectId);
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener fichas del proyecto.' });
  }
});

app.delete('/api/formations/:ficha', async (req, res) => {
  const ficha = decodeURIComponent(req.params.ficha ?? '').trim();

  if (!ficha) {
    res.status(400).json({ error: 'La ficha a eliminar no es valida.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await deleteFormationByFicha(client, ficha);

    if (!result.deleted) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'No se encontro la ficha solicitada.' });
      return;
    }

    await client.query('COMMIT');
    res.json({ ok: true, ficha });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo eliminar la ficha seleccionada.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
});

app.post('/api/csv/logs', async (req, res) => {
  const payload = req.body as Partial<CsvImportPayload>;

  if (!payload?.fileName || !payload?.summary || !Array.isArray(payload?.rows)) {
    res.status(400).json({ error: 'El payload JSON no tiene la estructura esperada.' });
    return;
  }

  try {
    await fs.mkdir(logsDirectory, { recursive: true });

    const fileName = buildLogFileName(payload.fileName);
    const absolutePath = path.join(logsDirectory, fileName);
    const content = JSON.stringify(payload, null, 2);

    await fs.writeFile(absolutePath, content, 'utf8');

    res.status(201).json({
      fileName,
      savedAt: absolutePath,
      bytes: Buffer.byteLength(content, 'utf8'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el log.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/extract/project', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se ha subido ningún archivo PDF.' });
    return;
  }

  const pdfPath = req.file.path;
  const scriptPath = path.join(projectRoot, 'parse_pdf.py');

  try {
    // Run the python script
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${pdfPath}"`);
    
    if (stderr && !stdout) {
       console.error('Python Error:', stderr);
       throw new Error('Error al procesar el PDF con Python.');
    }

    const result = JSON.parse(stdout);
    if (result.error) {
      throw new Error(result.error);
    }

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno al procesar el PDF.';
    res.status(500).json({ error: message });
  } finally {
    // Cleanup temporary file
    await fs.unlink(pdfPath).catch(console.error);
  }
});

async function startServer() {
  try {
    await ensureSchemaCompatibility();
    await fs.mkdir(uploadsDirectory, { recursive: true });
    await pool.query('SELECT NOW()');
    app.listen(apiPort, () => {
      console.log(`Servidor corriendo en http://localhost:${apiPort}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al conectar la base de datos.';
    console.error('No se pudo iniciar el backend por un fallo de conexion a la base de datos.');
    console.error(message);
    process.exit(1);
  }
}

void startServer();
