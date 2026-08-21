import { pool } from '../../src/config/db.ts';
import { assignCompetencyToPhase, unassignCompetency, getUnassignedCompetencies } from '../../src/services/projects.ts';

async function testAssignment() {
  console.log('=== RUNNING INTEGRATION TEST: assignment.test.ts ===');
  const client = await pool.connect();
  try {
    const unassigned = await getUnassignedCompetencies(pool, 25);
    console.log(`Unassigned competencies count: ${unassigned?.length ?? 0}`);
    console.log('Assignment test finished.');
  } catch (e) {
    console.error('ERROR in assignment integration test:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

testAssignment();
