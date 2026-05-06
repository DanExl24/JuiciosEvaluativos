import type { Pool, PoolClient } from 'pg';
import type { ProjectImportPayload } from '../types.ts';

export async function importProject(client: PoolClient, payload: ProjectImportPayload) {
  // Find the program
  const programRes = await client.query('SELECT id_programa FROM programa WHERE codigo = $1 LIMIT 1', [payload.programCode]);
  
  if (programRes.rowCount === 0) {
    throw new Error(`El programa con código ${payload.programCode} no se encontró en la base de datos. Por favor, importe el CSV primero.`);
  }

  const idPrograma = programRes.rows[0].id_programa;

  // Insert or update project
  const projectRes = await client.query(`
    INSERT INTO proyecto_formativo (codigo_proyecto, nombre, tiempo_ejecucion, regional, centro_formacion, id_programa)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id_programa) DO UPDATE SET
      codigo_proyecto = EXCLUDED.codigo_proyecto,
      nombre = EXCLUDED.nombre,
      tiempo_ejecucion = EXCLUDED.tiempo_ejecucion,
      regional = EXCLUDED.regional,
      centro_formacion = EXCLUDED.centro_formacion
    RETURNING id_proyecto
  `, [payload.projectCode, payload.projectName, payload.executionTime, payload.regional, payload.center, idPrograma]);

  const idProyecto = projectRes.rows[0].id_proyecto;

  // Track counts
  let phasesInserted = 0;
  let competenciesUpdated = 0;

  // Process phases
  for (const phase of payload.phases) {
    // Determine the phase name enum
    const phaseNameStr = phase.name.trim().toUpperCase();
    let phaseEnum = 'ANALISIS';
    if (phaseNameStr.includes('PLANEACI')) phaseEnum = 'PLANEACION';
    if (phaseNameStr.includes('EJECUCI')) phaseEnum = 'EJECUCION';
    if (phaseNameStr.includes('EVALUACI')) phaseEnum = 'EVALUACION';

    // Insert or get phase
    const phaseRes = await client.query(`
      INSERT INTO fases (nombre, actividad, id_programa)
      VALUES ($1, $2, $3)
      ON CONFLICT (nombre, id_programa) DO UPDATE SET
        actividad = EXCLUDED.actividad
      RETURNING id_fase
    `, [phaseEnum, phase.activity, idPrograma]);

    const idFase = phaseRes.rows[0].id_fase;
    phasesInserted++;

    const normalize = (t: string) => t ? t.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9ÁÉÍÓÚÑ]/g, '') : '';
    const phaseRawNorm = normalize(phase.rawText);

    // Get all competencies for the program
    const compsRes = await client.query(`
      SELECT id_competencia, codigo, nombre
      FROM competencia
      WHERE id_formacion IN (SELECT id_formacion FROM formacion WHERE id_programa = $1)
    `, [idPrograma]);

    // Update competencies
    for (const comp of compsRes.rows) {
      let matched = false;
      if (phase.competencyCodes.includes(comp.codigo)) {
        matched = true;
      } else {
        const compNameNorm = normalize(comp.nombre);
        if (compNameNorm.length > 10 && phaseRawNorm.includes(compNameNorm)) {
          matched = true;
        }
      }

      if (matched) {
        const compRes = await client.query(`
          UPDATE competencia
          SET id_fase = $1
          WHERE id_competencia = $2
        `, [idFase, comp.id_competencia]);
        competenciesUpdated += compRes.rowCount ?? 0;
      }
    }
  }

  return { idProyecto, phasesInserted, competenciesUpdated };
}

export async function getProjects(pool: Pool) {
  const result = await pool.query(`
    SELECT 
      pf.id_proyecto, pf.codigo_proyecto, pf.nombre AS proyecto_nombre, 
      pf.tiempo_ejecucion, pf.regional, pf.centro_formacion,
      p.id_programa, p.codigo AS programa_codigo, p.nombre AS programa_nombre
    FROM proyecto_formativo pf
    JOIN programa p ON pf.id_programa = p.id_programa
  `);
  return result.rows;
}

export async function getProjectPhases(pool: Pool, projectId: number) {
  // First get program ID from project
  const projRes = await pool.query('SELECT id_programa FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  if (projRes.rowCount === 0) return null;

  const idPrograma = projRes.rows[0].id_programa;

  // Get phases
  const phasesRes = await pool.query(`
    SELECT id_fase, nombre, actividad 
    FROM fases 
    WHERE id_programa = $1
  `, [idPrograma]);

  const phases = phasesRes.rows;

  // Get competencies for these phases
  for (const phase of phases) {
    const compsRes = await pool.query(`
      SELECT DISTINCT c.id_competencia, c.codigo, c.nombre
      FROM competencia c
      WHERE c.id_fase = $1
    `, [phase.id_fase]);

    phase.competencies = compsRes.rows;

    // Get results for competencies
    for (const comp of phase.competencies) {
      const resultsRes = await pool.query(`
        SELECT 
          r.id_resultado, 
          r.codigo, 
          r.detalle,
          (
            SELECT count(*)
            FROM juicios_evaluativos je
            WHERE je.id_resultado = r.id_resultado AND je.estado = 'por evaluar'
          ) as por_evaluar_count,
          (
            SELECT count(*)
            FROM juicios_evaluativos je
            WHERE je.id_resultado = r.id_resultado AND je.estado = 'aprobado'
          ) as aprobados_count
        FROM resultados_aprendizaje r
        WHERE r.id_competencia = $1
      `, [comp.id_competencia]);

      comp.learningOutcomes = resultsRes.rows.map((row: any) => ({
        id_resultado: row.id_resultado,
        codigo: row.codigo,
        detalle: row.detalle,
        isApproved: Number(row.por_evaluar_count) === 0 && Number(row.aprobados_count) > 0
      }));

      // Competency is approved if it has results and ALL are approved
      comp.isApproved = comp.learningOutcomes.length > 0 && comp.learningOutcomes.every((r: any) => r.isApproved);
    }
  }

  return phases;
}
