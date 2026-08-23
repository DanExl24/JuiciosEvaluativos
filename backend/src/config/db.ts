import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const cleanPassword = (process.env.DB_PASSWORD || 'postgres').replace(/^['"]|['"]$/g, '');

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: cleanPassword,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'juicios',
});


//