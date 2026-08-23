import multer from 'multer';
import { uploadsDirectory } from '../utils/log-writer.ts';

export const upload = multer({ dest: uploadsDirectory });
