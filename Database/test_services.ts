import { pool } from './src/config/db.ts';
import { getProjectPhases, getPhaseLearnerStats } from './src/services/projects.ts';

async function check() {
  try {
    console.log('Testing getProjectPhases...');
    const phases = await getProjectPhases(pool, 1);
    console.log('Phases loaded:', phases?.length);
    
    console.log('Testing getPhaseLearnerStats...');
    const stats = await getPhaseLearnerStats(pool, 1);
    console.log('Stats loaded:', stats?.length);
    
  } catch (e) {
    console.error('ERROR DETECTED:');
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
