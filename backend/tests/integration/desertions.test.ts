import { pool } from '../../src/config/db.ts';
import { getPhaseLearnerStats } from '../../src/services/projects.ts';

async function testDesertions() {
  console.log('=== RUNNING INTEGRATION TEST: desertions.test.ts ===');
  try {
    const res = await pool.query(`
      SELECT 
        a.id_aprendiz, a.nombres, a.apellidos, a.estado,
        je.fecha, je.estado as juicio_estado,
        f.nombre as fase_nombre
      FROM aprendiz a
      JOIN juicios_evaluativos je ON a.id_aprendiz = je.id_aprendiz
      JOIN fase_resultado fr ON je.id_resultado = fr.id_resultado
      JOIN fases f ON fr.id_fase = f.id_fase
      WHERE a.estado IN ('retiro voluntario', 'traslado')
      ORDER BY a.id_aprendiz, je.fecha DESC NULLS LAST
      LIMIT 10;
    `);

    console.log(`Desertion sample count: ${res.rows.length}`);
    console.table(res.rows);
  } catch (e) {
    console.error('ERROR in desertions integration test:', e);
  } finally {
    await pool.end();
  }
}

testDesertions();
