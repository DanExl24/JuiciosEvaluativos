import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled Application Error:', err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor.';
  res.status(500).json({
    ok: false,
    error: message,
  });
}
