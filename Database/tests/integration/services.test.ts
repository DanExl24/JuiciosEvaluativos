import { pool } from '../../src/config/db.ts';
import { getProjectPhases, getPhaseLearnerStats, getProjects } from '../../src/services/projects.ts';

async function testServices() {
  console.log('=== RUNNING INTEGRATION TEST: services.test.ts ===');
  try {
    const projects = await getProjects(pool);
    console.log(`Loaded ${projects.length} project(s).`);

    if (projects.length > 0) {
      const pid = projects[0].id_proyecto;
      console.log(`Testing getProjectPhases for project ${pid}...`);
      const phases = await getProjectPhases(pool, pid);
      console.log(`Phases loaded: ${phases?.length}`);

      console.log(`Testing getPhaseLearnerStats for project ${pid}...`);
      const stats = await getPhaseLearnerStats(pool, pid);
      console.log(`Stats loaded: ${stats?.length}`);
    }

    console.log('Integration test completed successfully.');
  } catch (e) {
    console.error('ERROR DETECTED:', e);
  } finally {
    await pool.end();
  }
}

testServices();
