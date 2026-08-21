import { Router } from 'express';
import { extractProjectPdf, getLogByFileName, getLogs, importCsv } from '../controllers/import.controller.ts';
import { upload } from '../middlewares/upload.ts';

export const importRouter = Router();

importRouter.post('/import/csv', importCsv);
importRouter.post('/extract/project', upload.single('file'), extractProjectPdf);
importRouter.get('/logs', getLogs);
importRouter.get('/logs/:fileName', getLogByFileName);
