import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import {
  getProjects,
  getProjectPhases,
  getUnassignedCompetencies,
  assignCompetencyToPhase,
  unassignCompetency,
  getPhaseLearnerStats,
  getFichasByProject,
  deleteProject as deleteProjectService,
  importProject as importProjectService,
} from '../services/projects.ts';
import type { ProjectImportPayload } from '../types.ts';

export async function listProjects(_req: Request, res: Response): Promise<void> {
  try {
    const projects = await getProjects(pool);
    res.json(projects);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron consultar los proyectos formativos.';
    res.status(500).json({ error: message });
  }
}

export async function getPhases(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const rawFicha = req.query.fichaId ?? req.query.ficha;
  let fichaId: number | undefined;

  if (rawFicha) {
    const formRes = await pool.query(
      'SELECT id_formacion FROM formacion WHERE id_formacion::text = $1 OR ficha_caracterizacion = $1 LIMIT 1',
      [String(rawFicha)]
    );
    if (formRes.rowCount && formRes.rowCount > 0) {
      fichaId = formRes.rows[0].id_formacion;
    }
  }

  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ error: 'Identificador de proyecto invalido.' });
    return;
  }

  try {
    const phases = await getProjectPhases(pool, projectId, fichaId);
    res.json(phases);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las fases del proyecto.';
    res.status(500).json({ error: message });
  }
}

export async function getProjectLearnerStats(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  const rawFicha = req.query.fichaId ?? req.query.ficha;
  let fichaId: number | undefined;

  if (rawFicha) {
    const formRes = await pool.query(
      'SELECT id_formacion FROM formacion WHERE id_formacion::text = $1 OR ficha_caracterizacion = $1 LIMIT 1',
      [String(rawFicha)]
    );
    if (formRes.rowCount && formRes.rowCount > 0) {
      fichaId = formRes.rows[0].id_formacion;
    }
  }

  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ error: 'Identificador de proyecto invalido.' });
    return;
  }

  try {
    const stats = await getPhaseLearnerStats(pool, projectId, fichaId);
    res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las estadisticas de aprendices por fase.';
    res.status(500).json({ error: message });
  }
}

export async function getProjectFichas(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ error: 'Identificador de proyecto invalido.' });
    return;
  }

  try {
    const fichas = await getFichasByProject(pool, projectId);
    res.json(fichas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las fichas asociadas al proyecto.';
    res.status(500).json({ error: message });
  }
}

export async function getUnassigned(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ error: 'Identificador de proyecto invalido.' });
    return;
  }

  try {
    const unassigned = await getUnassignedCompetencies(pool, projectId);
    res.json(unassigned);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las competencias sin asignar.';
    res.status(500).json({ error: message });
  }
}

export async function assignCompetency(req: Request, res: Response): Promise<void> {
  const phaseId = Number(req.params.phaseId ?? req.body?.phaseId);
  const competencyId = Number(req.params.competencyId ?? req.body?.competencyId);

  if (!Number.isInteger(phaseId) || !Number.isInteger(competencyId)) {
    res.status(400).json({ error: 'Identificadores invalidos.' });
    return;
  }

  try {
    const result = await assignCompetencyToPhase(pool, competencyId, phaseId);
    res.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo asignar la competencia.';
    res.status(500).json({ error: message });
  }
}

export async function unassign(req: Request, res: Response): Promise<void> {
  const phaseId = Number(req.params.phaseId ?? req.body?.phaseId);
  const competencyId = Number(req.params.competencyId ?? req.body?.competencyId);

  if (!Number.isInteger(phaseId) || !Number.isInteger(competencyId)) {
    res.status(400).json({ error: 'Identificadores invalidos.' });
    return;
  }

  try {
    const result = await unassignCompetency(pool, competencyId, phaseId);
    res.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo desasignar la competencia.';
    res.status(500).json({ error: message });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ error: 'Identificador de proyecto invalido.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await deleteProjectService(client, projectId);
    await client.query('COMMIT');
    res.json({ ok: true, result });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo eliminar el proyecto formativo.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
}

export async function importProject(req: Request, res: Response): Promise<void> {
  const payload = req.body as Partial<ProjectImportPayload>;

  if (!payload.projectCode || !payload.projectName || !payload.phases || !Array.isArray(payload.phases)) {
    res.status(400).json({ error: 'El archivo de proyecto extraido no contiene los campos obligatorios.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await importProjectService(client, payload as ProjectImportPayload);
    await client.query('COMMIT');
    res.json({
      ok: true,
      ...result,
      result,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo importar el proyecto formativo.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
}
