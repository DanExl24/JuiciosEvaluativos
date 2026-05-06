import { pool } from './src/config/db.ts';

async function check() {
  try {
    const proj = await pool.query('SELECT id_programa FROM proyecto_formativo LIMIT 1');
    const idProg = proj.rows[0].id_programa;
    
    const totalComps = await pool.query('SELECT COUNT(*) FROM competencia WHERE id_programa = $1', [idProg]);
    console.log('Total competencias en el programa:', totalComps.rows[0].count);
    
    const assignedComps = await pool.query('SELECT COUNT(DISTINCT id_competencia) FROM fase_competencia');
    console.log('Competencias asignadas a fases:', assignedComps.rows[0].count);
    
    const assignments = await pool.query('SELECT id_fase, COUNT(*) FROM fase_competencia GROUP BY id_fase');
    console.log('Distribución por fase:', assignments.rows);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
