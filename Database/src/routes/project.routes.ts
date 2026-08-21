import { Router } from 'express';
import {
  assignCompetency,
  deleteProject,
  getPhases,
  getProjectFichas,
  getProjectLearnerStats,
  getUnassigned,
  importProject,
  listProjects,
  unassign,
} from '../controllers/project.controller.ts';

export const projectRouter = Router();

projectRouter.get('/projects', listProjects);
projectRouter.get('/projects/:projectId/phases', getPhases);
projectRouter.get('/projects/:projectId/phase-learner-stats', getProjectLearnerStats);
projectRouter.get('/projects/:projectId/fichas', getProjectFichas);
projectRouter.get('/projects/:projectId/unassigned', getUnassigned);
projectRouter.get('/projects/:projectId/unassigned-competencies', getUnassigned);
projectRouter.post('/projects/phases/:phaseId/competencies/:competencyId', assignCompetency);
projectRouter.delete('/projects/phases/:phaseId/competencies/:competencyId', unassign);
projectRouter.post('/competencies/:competencyId/assign', assignCompetency);
projectRouter.post('/competencies/:competencyId/unassign', unassign);
projectRouter.delete('/projects/:projectId', deleteProject);
projectRouter.post('/import/project', importProject);
