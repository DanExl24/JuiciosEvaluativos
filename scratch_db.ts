import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'Database', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const res = await pool.query('SELECT codigo, nombre, id_fase, id_formacion FROM competencia LIMIT 10');
  console.log('Competencias in DB:', res.rows);
  const progRes = await pool.query('SELECT id_programa, codigo FROM programa');
  console.log('Programs in DB:', progRes.rows);
  const compMatch = await pool.query(`
    SELECT c.codigo, f.id_programa 
    FROM competencia c
    JOIN formacion f ON c.id_formacion = f.id_formacion
    LIMIT 10
  `);
  console.log('Competencias with program:', compMatch.rows);
  pool.end();
}

run().catch(console.error);
