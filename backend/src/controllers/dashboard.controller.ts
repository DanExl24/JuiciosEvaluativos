import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import { getDashboardData } from '../services/dashboard.ts';
import type { DashboardFilters } from '../types.ts';

export function readFilters(query: Record<string, unknown>): DashboardFilters {
  const filters: DashboardFilters = {};

  if (typeof query.estado === 'string') filters.estado = query.estado;
  if (typeof query.ficha === 'string') filters.ficha = query.ficha;
  if (typeof query.juicio === 'string') filters.juicio = query.juicio;
  if (typeof query.competencia === 'string') filters.competencia = query.competencia;
  if (typeof query.resultado === 'string') filters.resultado = query.resultado;
  if (typeof query.aprendiz === 'string') filters.aprendiz = query.aprendiz;

  return filters;
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const dashboard = await getDashboardData(pool, readFilters(req.query));
    res.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el dashboard.';
    res.status(500).json({ error: message });
  }
}
