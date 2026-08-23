import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';

export async function checkRoot(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      databaseTime: result.rows[0]?.now ?? null,
      apiPort: process.env.PORT || 3000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar la base de datos.';
    res.status(500).json({ ok: false, error: message });
  }
}

export async function checkDbHealth(_req: Request, res: Response): Promise<void> {
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
}
