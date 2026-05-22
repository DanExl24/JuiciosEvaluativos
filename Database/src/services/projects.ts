import type { Pool, PoolClient } from 'pg';
import type { ProjectImportPayload } from '../types.ts';

const STOP_WORDS = new Set([
  'A',
  'AL',
  'ANTE',
  'BAJO',
  'CON',
  'CONTRA',
  'DE',
  'DEL',
  'DESDE',
  'DURANTE',
  'E',
  'EL',
  'EN',
  'ENTRE',
  'HACIA',
  'HASTA',
  'LA',
  'LAS',
  'LOS',
  'MEDIANTE',
  'O',
  'PARA',
  'POR',
  'SEGUN',
  'SIN',
  'SOBRE',
  'SU',
  'SUS',
  'TRAS',
  'UN',
  'UNA',
  'Y',
]);

function normalizeText(text: string) {
  return text
    ? text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

function compactText(text: string) {
  return normalizeText(text).replace(/\s+/g, '');
}

function extractKeywords(text: string) {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length >= 5 && !STOP_WORDS.has(token));
}

function scoreCompetencyAgainstPhase(
  competency: { codigo: string; nombre: string },
  phase: { competencyCodes: string[]; rawText: string; activity: string },
) {
  const phaseText = `${phase.activity} ${phase.rawText}`;
  const phaseNormalized = normalizeText(phaseText);
  const phaseCompact = compactText(phaseText);
  const competencyCompact = compactText(competency.nombre);

  if (phase.competencyCodes.includes(competency.codigo)) {
    return 10_000;
  }

  if (competencyCompact.length > 20 && phaseCompact.includes(competencyCompact)) {
    return 5_000 + competencyCompact.length;
  }

  const keywords = extractKeywords(competency.nombre);
  if (keywords.length === 0) {
    return 0;
  }

  const matchedKeywords = keywords.filter((keyword) => phaseNormalized.includes(keyword));
  const matchRatio = matchedKeywords.length / keywords.length;

  if (matchedKeywords.length >= 3 && matchRatio >= 0.5) {
    return Math.round(matchRatio * 1_000) + matchedKeywords.length * 10;
  }

  return 0;
}

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
    ON CONFLICT (codigo_proyecto) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      tiempo_ejecucion = EXCLUDED.tiempo_ejecucion,
      regional = EXCLUDED.regional,
      centro_formacion = EXCLUDED.centro_formacion,
      id_programa = EXCLUDED.id_programa
    RETURNING id_proyecto
  `, [payload.projectCode, payload.projectName, payload.executionTime, payload.regional, payload.center, idPrograma]);

  const idProyecto = projectRes.rows[0].id_proyecto;

  // Track counts
  let phasesInserted = 0;
  let competenciesUpdated = 0;
  const persistedPhases: Array<{
    id_fase: number;
    competencyCodes: string[];
    resultCodes: string[];
    rawText: string;
    activity: string;
  }> = [];

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
    persistedPhases.push({
      id_fase: idFase,
      competencyCodes: phase.competencyCodes,
      resultCodes: phase.resultCodes,
      rawText: phase.rawText,
      activity: phase.activity,
    });
  }

  await client.query(`
    DELETE FROM fase_competencia
    WHERE id_fase IN (
      SELECT id_fase
      FROM fases
      WHERE id_programa = $1
    )
  `, [idPrograma]);

  await client.query(`
    DELETE FROM fase_resultado
    WHERE id_fase IN (
      SELECT id_fase
      FROM fases
      WHERE id_programa = $1
    )
  `, [idPrograma]);

  const compsRes = await client.query(`
    SELECT c.id_competencia, c.codigo, c.nombre
    FROM competencia c
    WHERE c.id_programa = $1
  `, [idPrograma]);

  const resultsRes = await client.query(`
    SELECT r.id_resultado, r.codigo, r.detalle, r.id_competencia
    FROM resultados_aprendizaje r
    JOIN competencia c ON r.id_competencia = c.id_competencia
    WHERE c.id_programa = $1
  `, [idPrograma]);

  const resultByCode = new Map<string, Array<{ id_resultado: number; id_competencia: number }>>();
  for (const row of resultsRes.rows) {
    const key = String(row.codigo);
    const list = resultByCode.get(key) ?? [];
    list.push({ id_resultado: row.id_resultado, id_competencia: row.id_competencia });
    resultByCode.set(key, list);
  }

  const linkedCompetencies = new Set<number>();

  for (const phase of persistedPhases) {
    for (const resultCode of phase.resultCodes) {
      const linkedResults = resultByCode.get(resultCode) ?? [];
      for (const linkedResult of linkedResults) {
        // Link Result to Phase (Explicitly like before)
        await client.query(`
          INSERT INTO fase_resultado (id_fase, id_resultado)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [phase.id_fase, linkedResult.id_resultado]);

        // Link Competency to Phase
        const compRes = await client.query(`
          INSERT INTO fase_competencia (id_fase, id_competencia)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          RETURNING id_competencia
        `, [phase.id_fase, linkedResult.id_competencia]);
        
        if ((compRes.rowCount ?? 0) > 0) {
          competenciesUpdated += 1;
        }
        linkedCompetencies.add(linkedResult.id_competencia);
      }
    }
  }

  for (const comp of compsRes.rows) {
    const matchingPhases: number[] = [];

    for (const phase of persistedPhases) {
      const score = scoreCompetencyAgainstPhase(comp, phase);
      if (score > 0) {
        matchingPhases.push(phase.id_fase);
      }
    }

    const distinctPhaseIds = [...new Set(matchingPhases)];

    for (const phaseId of distinctPhaseIds) {
      const compRes = await client.query(`
        INSERT INTO fase_competencia (id_fase, id_competencia)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING id_competencia
      `, [phaseId, comp.id_competencia]);
      
      if ((compRes.rowCount ?? 0) > 0) {
        competenciesUpdated += 1;
      }

      // Also link all results of this matched competency to this phase
      const compResults = resultsRes.rows.filter(r => r.id_competencia === comp.id_competencia);
      for (const r of compResults) {
        await client.query(`
          INSERT INTO fase_resultado (id_fase, id_resultado)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [phaseId, r.id_resultado]);
      }
    }

    if (distinctPhaseIds.length > 0) {
      linkedCompetencies.add(comp.id_competencia);
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

export async function getFichasByProject(pool: Pool, projectId: number) {
  const projRes = await pool.query('SELECT id_programa FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  if (projRes.rowCount === 0) return [];
  const idPrograma = projRes.rows[0].id_programa;

  const fichasRes = await pool.query(`
    SELECT id_formacion, ficha_caracterizacion, estado, modalidad
    FROM formacion
    WHERE id_programa = $1
    ORDER BY ficha_caracterizacion ASC
  `, [idPrograma]);

  return fichasRes.rows;
}

export async function getProjectPhases(pool: Pool, projectId: number, fichaId?: number) {
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
      JOIN fase_competencia fc ON fc.id_competencia = c.id_competencia
      WHERE fc.id_fase = $1
    `, [phase.id_fase]);

    phase.competencies = compsRes.rows || [];

    // Get results for competencies
    for (const comp of phase.competencies) {
      // Get results for this competency and phase, with their approval counts
      const resultsRes = await pool.query(`
        SELECT 
          r.id_resultado, 
          r.codigo, 
          r.detalle,
          (
            SELECT count(*)
            FROM juicios_evaluativos je
            JOIN aprendiz a ON je.id_aprendiz = a.id_aprendiz
            WHERE je.id_resultado = r.id_resultado AND je.estado = 'aprobado'
              AND ($3::int IS NULL OR a.id_formacion = $3)
          ) as approved_count,
          (
            SELECT count(*)
            FROM aprendiz a
            JOIN formacion f ON a.id_formacion = f.id_formacion
            WHERE f.id_programa = (SELECT id_programa FROM competencia WHERE id_competencia = $1)
              AND ($3::int IS NULL OR a.id_formacion = $3)
              AND (
                a.estado = 'en formacion'
                OR EXISTS (
                  SELECT 1 FROM juicios_evaluativos je_check 
                  WHERE je_check.id_aprendiz = a.id_aprendiz AND je_check.id_resultado = r.id_resultado
                )
              )
          ) as total_count
        FROM resultados_aprendizaje r
        JOIN fase_resultado fr ON fr.id_resultado = r.id_resultado
        WHERE r.id_competencia = $1
          AND fr.id_fase = $2
      `, [comp.id_competencia, phase.id_fase, fichaId || null]);

      comp.learningOutcomes = resultsRes.rows.map((row: any) => {
        const approved = Number(row.approved_count);
        const total = Number(row.total_count);
        return {
          id_resultado: row.id_resultado,
          codigo: row.codigo,
          detalle: row.detalle,
          approvedCount: approved,
          totalCount: total,
          isApproved: total > 0 && approved === total
        };
      });

      // Stats for the competency
      comp.totalResults = comp.learningOutcomes.reduce((acc: number, r: any) => acc + r.totalCount, 0);
      comp.approvedResults = comp.learningOutcomes.reduce((acc: number, r: any) => acc + r.approvedCount, 0);
      comp.isApproved = comp.totalResults > 0 && comp.approvedResults === comp.totalResults;
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
    WHERE c.id_programa = $1
      AND NOT EXISTS (
        SELECT 1
        FROM fase_competencia fc
        WHERE fc.id_competencia = c.id_competencia
      )
  `, [idPrograma]);

  return compsRes.rows;
}

export async function assignCompetencyToPhase(pool: Pool, competencyId: number, phaseId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Link competency
    await client.query(`
      INSERT INTO fase_competencia (id_fase, id_competencia)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [phaseId, competencyId]);
    
    // Link all results of this competency to the phase
    await client.query(`
      INSERT INTO fase_resultado (id_fase, id_resultado)
      SELECT $1, id_resultado
      FROM resultados_aprendizaje
      WHERE id_competencia = $2
      ON CONFLICT DO NOTHING
    `, [phaseId, competencyId]);
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function unassignCompetency(pool: Pool, competencyId: number, phaseId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Unlink competency
    await client.query(`
      DELETE FROM fase_competencia
      WHERE id_competencia = $1 AND id_fase = $2
    `, [competencyId, phaseId]);
    
    // Unlink all results of this competency from the phase
    await client.query(`
      DELETE FROM fase_resultado
      WHERE id_fase = $2 AND id_resultado IN (
        SELECT id_resultado FROM resultados_aprendizaje WHERE id_competencia = $1
      )
    `, [competencyId, phaseId]);
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProject(pool: Pool, projectId: number) {
  const result = await pool.query('DELETE FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  return (result.rowCount !== null && result.rowCount > 0);
}

export async function getPhaseLearnerStats(pool: Pool, projectId: number, fichaId?: number) {
  const projRes = await pool.query('SELECT id_programa FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  if (projRes.rowCount === 0) return [];
  const idPrograma = projRes.rows[0].id_programa;

  const phasesRes = await pool.query('SELECT id_fase, nombre FROM fases WHERE id_programa = $1 ORDER BY id_fase ASC', [idPrograma]);
  const phases = phasesRes.rows;
  const orderedPhaseIds = phases.map((phase) => Number(phase.id_fase));
  const phaseIndexById = new Map<number, number>(
    orderedPhaseIds.map((phaseId, index) => [phaseId, index]),
  );

  const activeProgressRes = await pool.query(`
    WITH phase_expected_results AS (
      -- Activos: Se espera todos los resultados asociados a la fase segun fase_resultado
      SELECT
        fr.id_fase,
        a.id_aprendiz,
        fr.id_resultado,
        je.estado AS juicio_estado
      FROM aprendiz a
      JOIN formacion f ON a.id_formacion = f.id_formacion
      JOIN fase_resultado fr ON fr.id_fase IN (SELECT id_fase FROM fases WHERE id_programa = f.id_programa)
      LEFT JOIN juicios_evaluativos je ON je.id_aprendiz = a.id_aprendiz AND je.id_resultado = fr.id_resultado
      WHERE f.id_programa = $1 
        AND a.estado = 'en formacion'
        AND ($2::int IS NULL OR a.id_formacion = $2)
      
      UNION ALL
      
      -- Retirados/Trasladados: Solo se cuenta en la fase si tuvieron actividad real en esa fase
      SELECT
        fr.id_fase,
        a.id_aprendiz,
        fr.id_resultado,
        je.estado AS juicio_estado
      FROM aprendiz a
      JOIN formacion f ON a.id_formacion = f.id_formacion
      JOIN juicios_evaluativos je ON je.id_aprendiz = a.id_aprendiz
      JOIN fase_resultado fr ON fr.id_resultado = je.id_resultado
      WHERE f.id_programa = $1 
        AND a.estado <> 'en formacion'
        AND ($2::int IS NULL OR a.id_formacion = $2)
        AND (je.estado <> 'por evaluar' OR je.fecha IS NOT NULL)
    )
    SELECT
      id_fase,
      COUNT(*)::int AS total_expected_results,
      COUNT(*) FILTER (WHERE juicio_estado = 'aprobado')::int AS approved_results,
      COUNT(*) FILTER (WHERE juicio_estado IS NULL OR juicio_estado <> 'aprobado')::int AS pending_results
    FROM phase_expected_results
    GROUP BY id_fase
  `, [idPrograma, fichaId || null]);

  const activeProgressByPhase = new Map<number, { approvedResults: number; pendingResults: number; expectedResults: number; progress: number }>(
    activeProgressRes.rows.map((row) => {
      const totalExpected = Number(row.total_expected_results) || 0;
      const totalApproved = Number(row.approved_results) || 0;
      const totalPending = Number(row.pending_results) || 0;
      return [
        Number(row.id_fase),
        {
          approvedResults: totalApproved,
          pendingResults: totalPending,
          expectedResults: totalExpected,
          progress: totalExpected > 0 ? (totalApproved / totalExpected) * 100 : 0
        },
      ];
    }),
  );

  const referenceDatesRes = await pool.query(`
    SELECT
      fr.id_fase,
      MAX(je.fecha) AS reference_date
    FROM juicios_evaluativos je
    JOIN resultados_aprendizaje ra ON je.id_resultado = ra.id_resultado
    JOIN fase_resultado fr ON fr.id_resultado = ra.id_resultado
    JOIN aprendiz a ON je.id_aprendiz = a.id_aprendiz
    JOIN formacion f ON a.id_formacion = f.id_formacion
    WHERE f.id_programa = $1
      AND a.estado = 'en formacion'
      AND ($2::int IS NULL OR a.id_formacion = $2)
    GROUP BY fr.id_fase
  `, [idPrograma, fichaId || null]);

  const referenceDateByPhase = new Map<number, Date | null>(
    referenceDatesRes.rows.map((row) => [Number(row.id_fase), row.reference_date ?? null]),
  );

  const desertedRes = await pool.query(`
    WITH retired_learners AS (
      SELECT a.id_aprendiz, a.nombres, a.apellidos, a.documento, a.estado
      FROM aprendiz a
      JOIN formacion f ON a.id_formacion = f.id_formacion
      WHERE f.id_programa = $1
        AND a.estado IN ('retiro voluntario', 'traslado')
        AND ($2::int IS NULL OR a.id_formacion = $2)
    ),
    latest_judgement AS (
      -- Obtenemos el ultimo juicio de cada aprendiz
      SELECT DISTINCT ON (je.id_aprendiz)
        je.id_aprendiz,
        je.id_resultado,
        je.fecha AS ultima_fecha,
        je.estado AS ultimo_juicio_estado,
        ra.codigo AS resultado_codigo,
        ra.detalle AS resultado_detalle,
        c.codigo AS competencia_codigo,
        c.nombre AS competencia_nombre
      FROM juicios_evaluativos je
      JOIN resultados_aprendizaje ra ON je.id_resultado = ra.id_resultado
      JOIN competencia c ON ra.id_competencia = c.id_competencia
      JOIN retired_learners rl ON rl.id_aprendiz = je.id_aprendiz
      WHERE (je.estado <> 'por evaluar' OR je.fecha IS NOT NULL)
      ORDER BY je.id_aprendiz, je.fecha DESC NULLS LAST, je.id_juicio DESC
    )
    SELECT
      rl.id_aprendiz,
      rl.nombres,
      rl.apellidos,
      rl.documento,
      rl.estado,
      lj.ultima_fecha,
      lj.ultimo_juicio_estado,
      lj.id_resultado,
      lj.resultado_codigo,
      lj.resultado_detalle,
      lj.competencia_codigo,
      lj.competencia_nombre
    FROM retired_learners rl
    JOIN latest_judgement lj ON lj.id_aprendiz = rl.id_aprendiz
  `, [idPrograma, fichaId || null]);

  const retiredResultPhaseRes = await pool.query<{
    id_resultado: number;
    id_fase: number;
  }>(`
    SELECT fr.id_resultado, fr.id_fase
    FROM fase_resultado fr
    JOIN fases fase ON fase.id_fase = fr.id_fase
    WHERE fase.id_programa = $1
    ORDER BY fr.id_resultado, fr.id_fase
  `, [idPrograma]);

  const phaseIdsByResultId = new Map<number, number[]>();
  for (const row of retiredResultPhaseRes.rows) {
    const resultId = Number(row.id_resultado);
    const phaseId = Number(row.id_fase);
    const current = phaseIdsByResultId.get(resultId) ?? [];
    current.push(phaseId);
    phaseIdsByResultId.set(resultId, current);
  }

  const desertedLearnersByPhase = new Map<number, any[]>();

  for (const row of desertedRes.rows) {
    const resultPhaseIds = phaseIdsByResultId.get(Number(row.id_resultado)) ?? [];
    const basePhaseId = resultPhaseIds.find((phaseId) => phaseIndexById.has(phaseId));

    if (basePhaseId === undefined) {
      continue;
    }

    let assignedPhaseId = basePhaseId;
    const basePhaseIndex = phaseIndexById.get(basePhaseId) ?? 0;

    if (row.ultima_fecha !== null) {
      const learnerLastDate = new Date(row.ultima_fecha);
      for (let index = basePhaseIndex; index < orderedPhaseIds.length; index += 1) {
        const candidatePhaseId = orderedPhaseIds[index];
        if (candidatePhaseId === undefined) {
          continue;
        }
        const referenceDate = referenceDateByPhase.get(candidatePhaseId);
        if (referenceDate && referenceDate > learnerLastDate) {
          assignedPhaseId = candidatePhaseId;
          break;
        }
      }
    }

    if (row.ultima_fecha === null && row.ultimo_juicio_estado === 'por evaluar') {
      // Conservamos la fase base cuando no hay fecha trazable del ultimo juicio.
    }

    const learners = desertedLearnersByPhase.get(assignedPhaseId) ?? [];
    learners.push({
      nombre: `${row.nombres} ${row.apellidos}`,
      documento: row.documento,
      estado: row.estado,
      ultima_fecha: row.ultima_fecha,
      juicio_estado: row.ultimo_juicio_estado,
      competencia_codigo: row.competencia_codigo,
      competencia_nombre: row.competencia_nombre,
      resultado_codigo: row.resultado_codigo,
      resultado_detalle: row.resultado_detalle,
    });
    desertedLearnersByPhase.set(assignedPhaseId, learners);
  }

  return phases.map((phase) => {
    const phaseId = Number(phase.id_fase);
    const desertedLearners = desertedLearnersByPhase.get(phaseId) ?? [];

    const activeProgress = activeProgressByPhase.get(phaseId) ?? { approvedResults: 0, pendingResults: 0, expectedResults: 0, progress: 0 };
    
    return {
      id_fase: phase.id_fase,
      nombre: phase.nombre,
      approvedResults: activeProgress.approvedResults,
      pendingResults: activeProgress.pendingResults,
      expectedResults: activeProgress.expectedResults,
      desertedCount: desertedLearners.length,
      trasladoCount: desertedLearners.filter(d => d.estado?.toLowerCase().includes('traslado')).length,
      voluntarioCount: desertedLearners.filter(d => d.estado?.toLowerCase().includes('retiro')).length,
      desertedLearners,
      progressPercentage: activeProgress.progress
    };
  });
}
