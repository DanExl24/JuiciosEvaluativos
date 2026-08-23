import { Router } from 'express';
import { getLearner } from '../controllers/learner.controller.ts';

export const learnerRouter = Router();

learnerRouter.get('/learners/:learnerId', getLearner);
