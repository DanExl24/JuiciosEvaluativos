import { Router } from 'express';
import { getLearner, getLearnerByDocument } from '../controllers/learner.controller.ts';

export const learnerRouter = Router();

learnerRouter.get('/learners/by-document/:documento', getLearnerByDocument);
learnerRouter.get('/learners/:learnerId', getLearner);

