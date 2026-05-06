import { pool } from './src/config/db.ts';

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fase_resultado (
        id_fase INTEGER REFERENCES fases(id_fase) ON DELETE CASCADE,
        id_resultado INTEGER REFERENCES resultados_aprendizaje(id_resultado) ON DELETE CASCADE,
        PRIMARY KEY (id_fase, id_resultado)
      )
    `);
    console.log('Tabla fase_resultado restaurada.');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

run();
