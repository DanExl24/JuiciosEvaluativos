import cors from 'cors';
import express, { type Application } from 'express';
import { errorHandler } from './middlewares/errorHandler.ts';
import { requestLogger } from './middlewares/logger.ts';
import { appRouter } from './routes/index.ts';

export function createApp(): Application {
  const app = express();

  // Core Middlewares
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(requestLogger);

  // Application Routes
  app.use(appRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
