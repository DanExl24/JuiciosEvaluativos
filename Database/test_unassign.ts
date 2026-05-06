import { pool } from './src/config/db.ts';

async function testUnassign() {
  const compId = 295; // ANÁLISIS competency
  const phaseId = 126; // ANÁLISIS phase for Project 12 (or whatever it is now)
  
  // Actually let's get the latest IDs
  const projRes = await pool.query('SELECT id_proyecto, id_programa FROM proyecto_formativo LIMIT 1');
  const projectId = projRes.rows[0].id_proyecto;
  const programId = projRes.rows[0].id_programa;
  
  const phasesRes = await pool.query('SELECT id_fase FROM fases WHERE id_programa = $1 AND nombre = \'ANALISIS\'', [programId]);
  const currentPhaseId = phasesRes.rows[0].id_fase;
  
  const compRes = await pool.query('SELECT c.id_competencia FROM competencia c JOIN fase_competencia fc ON c.id_competencia = fc.id_competencia WHERE fc.id_fase = $1 LIMIT 1', [currentPhaseId]);
  if (compRes.rowCount === 0) {
      console.log('No competencies in ANALISIS');
      await pool.end();
      return;
  }
  const testCompId = compRes.rows[0].id_competencia;
  
  console.log(`Unassigning competency ${testCompId} from phase ${currentPhaseId}...`);
  
  await pool.query('DELETE FROM fase_competencia WHERE id_competencia = $1 AND id_fase = $2', [testCompId, currentPhaseId]);
  await pool.query('DELETE FROM fase_resultado WHERE id_fase = $2 AND id_resultado IN (SELECT id_resultado FROM resultados_aprendizaje WHERE id_competencia = $1)', [testCompId, currentPhaseId]);
  
  console.log('Checking unassigned...');
  const unassigned = await pool.query(`
    SELECT c.id_competencia, c.codigo
    FROM competencia c
    WHERE c.id_programa = $1
      AND NOT EXISTS (
        SELECT 1 FROM fase_competencia fc WHERE fc.id_competencia = c.id_competencia
      )
  `, [programId]);
  
  console.table(unassigned.rows);
  
  const isTargetCompUnassigned = unassigned.rows.some(r => r.id_competencia === testCompId);
  console.log(`Is competency ${testCompId} unassigned? ${isTargetCompUnassigned}`);

  await pool.end();
}

testUnassign();
