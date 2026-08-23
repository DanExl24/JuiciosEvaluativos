import { pool } from '../../src/config/db.ts';

async function checkCounts() {
  console.log('=== DIAGNOSTICS: check_counts.ts ===');
  try {
    const counts = await pool.query(`
      SELECT 'aprendiz' as table_name, count(*) FROM aprendiz
      UNION ALL
      SELECT 'formacion', count(*) FROM formacion
      UNION ALL
      SELECT 'programa', count(*) FROM programa
      UNION ALL
      SELECT 'competencia', count(*) FROM competencia
      UNION ALL
      SELECT 'resultados_aprendizaje', count(*) FROM resultados_aprendizaje
      UNION ALL
      SELECT 'juicios_evaluativos', count(*) FROM juicios_evaluativos
      UNION ALL
      SELECT 'proyecto', count(*) FROM proyecto
      UNION ALL
      SELECT 'fases', count(*) FROM fases
      UNION ALL
      SELECT 'fase_actividad', count(*) FROM fase_actividad
      UNION ALL
      SELECT 'fase_competencia', count(*) FROM fase_competencia
      UNION ALL
      SELECT 'fase_resultado', count(*) FROM fase_resultado;
    `);
    console.table(counts.rows);
  } catch (e) {
    console.error('Diagnostic error:', e);
  } finally {
    await pool.end();
  }
}

checkCounts();
