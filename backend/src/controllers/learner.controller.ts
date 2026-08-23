import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import { getLearnerDetail } from '../services/dashboard.ts';

export async function getLearner(req: Request, res: Response): Promise<void> {
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
}
