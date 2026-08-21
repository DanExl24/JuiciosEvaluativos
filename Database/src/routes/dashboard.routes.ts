import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.ts';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', getDashboard);
