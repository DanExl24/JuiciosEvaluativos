import { Router } from 'express';
import { checkDbHealth, checkRoot } from '../controllers/health.controller.ts';

export const healthRouter = Router();

healthRouter.get('/', checkRoot);
healthRouter.get('/api/health/db', checkDbHealth);
