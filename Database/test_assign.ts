import { pool } from './src/config/db.ts';
import { assignCompetencyToPhase } from './src/services/projects.ts';

async function testAssign() {
  try {
    const compId = 295; // Unassigned competency from previous test
    
    const projRes = await pool.query('SELECT id_proyecto, id_programa FROM proyecto_formativo LIMIT 1');
    const programId = projRes.rows[0].id_programa;
    
    // Assign to a different phase, let's say PLANEACION
    const phasesRes = await pool.query('SELECT id_fase FROM fases WHERE id_programa = $1 AND nombre = \'PLANEACION\'', [programId]);
    const targetPhaseId = phasesRes.rows[0].id_fase;
    
    console.log(`Assigning competency ${compId} to phase ${targetPhaseId}...`);
    
    const success = await assignCompetencyToPhase(pool, compId, targetPhaseId);
    console.log(`Assign result: ${success}`);
    
    const checkRes = await pool.query('SELECT * FROM fase_competencia WHERE id_competencia = $1 AND id_fase = $2', [compId, targetPhaseId]);
    console.log(`Is assigned: ${checkRes.rowCount > 0}`);
    
  } catch (err) {
    console.error("Error during assign test:", err);
  } finally {
    await pool.end();
  }
}

testAssign();
