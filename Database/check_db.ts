import { pool } from './src/config/db.ts';

async function checkDb() {
  try {
    const programId = 18;
    console.log(`Checking Competencies for Program ${programId}`);
    
    const comps = await pool.query(`
      SELECT c.id_competencia, c.codigo, c.nombre, 
             (SELECT string_agg(f.nombre::text, ', ') 
              FROM fase_competencia fc 
              JOIN fases f ON fc.id_fase = f.id_fase 
              WHERE fc.id_competencia = c.id_competencia) as phases
      FROM competencia c
      WHERE c.id_programa = $1
    `, [programId]);
    
    for (const r of comps.rows) {
        if (!r.phases) {
            console.log(`[UNASSIGNED] ${r.id_competencia} - ${r.codigo} - ${r.nombre.substring(0, 50)}`);
        } else {
            console.log(`[${r.phases}] ${r.id_competencia} - ${r.codigo} - ${r.nombre.substring(0, 50)}`);
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDb();
