import { Router } from 'express';
import { healthRouter } from './health.routes.ts';
import { dashboardRouter } from './dashboard.routes.ts';
import { learnerRouter } from './learner.routes.ts';
import { formationRouter } from './formation.routes.ts';
import { projectRouter } from './project.routes.ts';
import { importRouter } from './import.routes.ts';

export const appRouter = Router();

// Root health route
appRouter.use('/', healthRouter);

// Domain API routes
appRouter.use('/api', dashboardRouter);
appRouter.use('/api', learnerRouter);
appRouter.use('/api', formationRouter);
appRouter.use('/api', projectRouter);
appRouter.use('/api', importRouter);
