import { pool } from './src/config/db.ts';

async function check() {
  try {
    const res = await pool.query(`
      SELECT 
        a.nombres, a.id_aprendiz, a.estado,
        COUNT(je.id_juicio) as juicios_count,
        COUNT(DISTINCT fc.id_fase) as phases_count,
        ARRAY_AGG(DISTINCT f.nombre) as phase_names
      FROM aprendiz a
      JOIN juicios_evaluativos je ON a.id_aprendiz = je.id_aprendiz
      JOIN resultados_aprendizaje ra ON ra.id_resultado = je.id_resultado
      JOIN competencia c ON c.id_competencia = ra.id_competencia
      JOIN fase_competencia fc ON fc.id_competencia = c.id_competencia
      JOIN fases f ON f.id_fase = fc.id_fase
      WHERE a.estado <> 'en formacion'
      GROUP BY a.id_aprendiz, a.nombres, a.estado
    `);
    console.log('Desertores y sus fases de actividad:', res.rows);
    
    const duplicateComps = await pool.query(`
      SELECT id_competencia, COUNT(*) as phases
      FROM fase_competencia
      GROUP BY id_competencia
      HAVING COUNT(*) > 1
    `);
    console.log('Competencias duplicadas en fases:', duplicateComps.rows);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
