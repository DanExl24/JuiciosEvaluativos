import { Router } from 'express';
import { deleteFormation, getFormationCompetencies } from '../controllers/formation.controller.ts';

export const formationRouter = Router();

formationRouter.get('/formations/competencies', getFormationCompetencies);
formationRouter.delete('/formations/:ficha', deleteFormation);
