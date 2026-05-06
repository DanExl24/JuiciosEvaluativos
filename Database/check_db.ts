import { pool } from './src/config/db.ts';

async function check() {
  try {
    const res = await pool.query('SELECT DISTINCT estado FROM aprendiz');
    console.log('Estados en DB:', res.rows);
    const proj = await pool.query('SELECT id_proyecto, id_programa FROM proyecto_formativo');
    console.log('Proyectos:', proj.rows);
    const phases = await pool.query('SELECT id_fase, id_programa FROM fases');
    console.log('Fases:', phases.rows);
    const fc = await pool.query('SELECT * FROM fase_competencia');
    console.log('Asignaciones:', fc.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
