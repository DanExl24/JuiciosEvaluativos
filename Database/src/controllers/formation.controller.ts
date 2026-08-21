import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import { getFormationCompetencyCatalog } from '../services/dashboard.ts';
import { deleteFormationByFicha } from '../services/formations.ts';
import { readFilters } from './dashboard.controller.ts';

export async function getFormationCompetencies(req: Request, res: Response): Promise<void> {
  try {
    const catalog = await getFormationCompetencyCatalog(pool, readFilters(req.query));
    res.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cargar el catalogo de competencias y resultados.';
    res.status(500).json({ error: message });
  }
}

export async function deleteFormation(req: Request, res: Response): Promise<void> {
  const rawFicha = req.params.ficha;
  const ficha = typeof rawFicha === 'string' ? rawFicha.trim() : (Array.isArray(rawFicha) ? rawFicha[0]?.trim() : '');

  if (!ficha) {
    res.status(400).json({ error: 'Debes indicar la ficha a eliminar.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await deleteFormationByFicha(client, ficha);
    await client.query('COMMIT');
    res.json({ ok: true, result });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : 'No se pudo eliminar la ficha.';
    res.status(500).json({ error: message });
  } finally {
    client.release();
  }
}
