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

export async function getUnassignedCompetencies(pool: Pool, projectId: number) {
  // Get program ID
  const projRes = await pool.query('SELECT id_programa FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  if (projRes.rowCount === 0) return [];
  const idPrograma = projRes.rows[0].id_programa;

  // Get competencies for this program where id_fase is null
  const compsRes = await pool.query(`
    SELECT c.id_competencia, c.codigo, c.nombre
    FROM competencia c
    JOIN formacion f ON c.id_formacion = f.id_formacion
    WHERE f.id_programa = $1 AND c.id_fase IS NULL
  `, [idPrograma]);

  return compsRes.rows;
}

export async function assignCompetencyToPhase(pool: Pool, competencyId: number, phaseId: number) {
  const result = await pool.query(`
    UPDATE competencia
    SET id_fase = $1
    WHERE id_competencia = $2
  `, [phaseId, competencyId]);
  
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function unassignCompetency(pool: Pool, competencyId: number) {
  const result = await pool.query(`
    UPDATE competencia
    SET id_fase = NULL
    WHERE id_competencia = $1
  `, [competencyId]);
  
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function getPhaseLearnerStats(pool: Pool, projectId: number) {
  const projRes = await pool.query('SELECT id_programa FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  if (projRes.rowCount === 0) return [];
  const idPrograma = projRes.rows[0].id_programa;

  const learnersRes = await pool.query(`
    SELECT DISTINCT id_aprendiz, nombres, apellidos, documento, estado
    FROM aprendiz 
    WHERE id_formacion IN (SELECT id_formacion FROM formacion WHERE id_programa = $1)
  `, [idPrograma]);
  const learners = learnersRes.rows;

  const phasesRes = await pool.query('SELECT id_fase, nombre FROM fases WHERE id_programa = $1 ORDER BY id_fase ASC', [idPrograma]);
  const phases = phasesRes.rows;

  const stats = [];

  for (const phase of phases) {
    try {
      let approvedLearners = 0;
      let pendingLearners = 0;
      const desertedLearnersList: any[] = [];

      // Get the last evaluation date of any "en formacion" learner in this phase to use as reference
      const refDateRes = await pool.query(`
        SELECT MAX(je.fecha) as ref_date
        FROM juicios_evaluativos je
        JOIN resultados_aprendizaje ra ON je.id_resultado = ra.id_resultado
        JOIN competencia c ON ra.id_competencia = c.id_competencia
        JOIN aprendiz a ON je.id_aprendiz = a.id_aprendiz
        WHERE c.id_fase = $1 AND a.estado = 'en formacion'
      `, [phase.id_fase]);
      const refDate = refDateRes.rows[0]?.ref_date;

      for (const learner of learners) {
          const isRetired = learner.estado === 'retiro voluntario' || learner.estado === 'traslado';

          // If learner is retired, fetch their latest evaluation across all phases only once
          let latestEval: { fecha: string | null; faseId: number } | null = null;
          if (isRetired) {
            if (!globalThis.__latestEvalCache) {
              (globalThis as any).__latestEvalCache = new Map();
            }
            const cache = (globalThis as any).__latestEvalCache as Map<number, { fecha: string | null; faseId: number }>;
            if (cache.has(learner.id_aprendiz)) {
              latestEval = cache.get(learner.id_aprendiz)!;
            } else {
              const latestRes = await pool.query(`
                SELECT je.fecha, c.id_fase as fase_id
                FROM juicios_evaluativos je
                JOIN resultados_aprendizaje ra ON je.id_resultado = ra.id_resultado
                JOIN competencia c ON ra.id_competencia = c.id_competencia
                WHERE je.id_aprendiz = $1
                ORDER BY je.fecha DESC
                LIMIT 1
              `, [learner.id_aprendiz]);
              if (latestRes.rowCount > 0) {
                latestEval = { fecha: latestRes.rows[0].fecha, faseId: latestRes.rows[0].fase_id };
                cache.set(learner.id_aprendiz, latestEval);
              }
            }
          }

          // Only consider desertion for the phase where the learner's latest evaluation occurred
          if (isRetired && latestEval && latestEval.faseId !== phase.id_fase) {
            // skip this phase, desertion belongs to another phase
            continue;
          }

          // Query evaluations for the current phase (needed for approval/pending logic)
          const juiciosRes = await pool.query(`
            SELECT je.estado, je.fecha
            FROM juicios_evaluativos je
            JOIN resultados_aprendizaje ra ON je.id_resultado = ra.id_resultado
            JOIN competencia c ON ra.id_competencia = c.id_competencia
            WHERE c.id_fase = $1 AND je.id_aprendiz = $2
            ORDER BY je.fecha DESC
          `, [phase.id_fase, learner.id_aprendiz]);
          const juicios = juiciosRes.rows;

          if (isRetired && latestEval) {
            const lastEvalTime = latestEval.fecha ? new Date(latestEval.fecha).getTime() : 0;
            const refTime = refDate ? new Date(refDate).getTime() : 0;
            if (lastEvalTime !== refTime) {
              desertedLearnersList.push({
                nombre: `${learner.nombres} ${learner.apellidos}`,
                documento: learner.documento,
                estado: learner.estado,
                ultima_fecha: latestEval.fecha
              });
              // No need to evaluate further phases for this learner
              continue;
            }
          }

          if (learner.estado === 'en formacion') {
            if (juicios.length > 0 && juicios.every(j => j.estado === 'aprobado')) {
              approvedLearners++;
            } else {
              pendingLearners++;
            }
          }
        }

      stats.push({
        id_fase: phase.id_fase,
        nombre: phase.nombre,
        approvedCount: approvedLearners,
        pendingCount: pendingLearners,
        desertedCount: desertedLearnersList.length,
        desertedLearners: desertedLearnersList,
        totalLearners: learners.length
      });
    } catch (phaseError) {
      console.error(`Error in phase ${phase.nombre}:`, phaseError);
      throw phaseError;
    }
  }

  return stats;
}
