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
    DELETE FROM fase_resultado
    WHERE id_fase IN (
      SELECT id_fase
      FROM fases
      WHERE id_programa = $1
    )
  `, [idPrograma]);

  await client.query(`
    DELETE FROM fase_competencia
    WHERE id_fase IN (
      SELECT id_fase
      FROM fases
      WHERE id_programa = $1
    )
  `, [idPrograma]);

  const compsRes = await client.query(`
    SELECT c.id_competencia, c.codigo, c.nombre
    FROM competencia c
    JOIN formacion f ON c.id_formacion = f.id_formacion
    WHERE f.id_programa = $1
  `, [idPrograma]);

  const resultsRes = await client.query(`
    SELECT r.id_resultado, r.codigo, r.detalle, r.id_competencia
    FROM resultados_aprendizaje r
    JOIN competencia c ON r.id_competencia = c.id_competencia
    JOIN formacion f ON c.id_formacion = f.id_formacion
    WHERE f.id_programa = $1
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
        await client.query(`
          INSERT INTO fase_resultado (id_fase, id_resultado)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [phase.id_fase, linkedResult.id_resultado]);

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
      JOIN fase_competencia fc ON fc.id_competencia = c.id_competencia
      WHERE fc.id_fase = $1
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
        JOIN fase_resultado fr ON fr.id_resultado = r.id_resultado
        WHERE r.id_competencia = $1 AND fr.id_fase = $2
      `, [comp.id_competencia, phase.id_fase]);

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
    WHERE f.id_programa = $1
      AND NOT EXISTS (
        SELECT 1
        FROM fase_competencia fc
        WHERE fc.id_competencia = c.id_competencia
      )
  `, [idPrograma]);

  return compsRes.rows;
}

export async function assignCompetencyToPhase(pool: Pool, competencyId: number, phaseId: number) {
  const result = await pool.query(`
    INSERT INTO fase_competencia (id_fase, id_competencia)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING id_competencia
  `, [phaseId, competencyId]);

  await pool.query(`
    INSERT INTO fase_resultado (id_fase, id_resultado)
    SELECT $1, r.id_resultado
    FROM resultados_aprendizaje r
    WHERE r.id_competencia = $2
    ON CONFLICT DO NOTHING
  `, [phaseId, competencyId]);
  
  return result.rowCount !== null;
}

export async function unassignCompetency(pool: Pool, competencyId: number, phaseId: number) {
  const result = await pool.query(`
    DELETE FROM fase_competencia
    WHERE id_competencia = $1 AND id_fase = $2
  `, [competencyId, phaseId]);

  await pool.query(`
    DELETE FROM fase_resultado fr
    USING resultados_aprendizaje r
    WHERE fr.id_resultado = r.id_resultado
      AND r.id_competencia = $1
      AND fr.id_fase = $2
  `, [competencyId, phaseId]);
  
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function getPhaseLearnerStats(pool: Pool, projectId: number) {
  const projRes = await pool.query('SELECT id_programa FROM proyecto_formativo WHERE id_proyecto = $1', [projectId]);
  if (projRes.rowCount === 0) return [];
  const idPrograma = projRes.rows[0].id_programa;

  const phasesRes = await pool.query('SELECT id_fase, nombre FROM fases WHERE id_programa = $1 ORDER BY id_fase ASC', [idPrograma]);
  const phases = phasesRes.rows;

  const activeProgressRes = await pool.query(`
    WITH phase_results AS (
      SELECT
        c.id_formacion,
        fr.id_fase,
        COUNT(DISTINCT fr.id_resultado)::int AS total_results
      FROM fase_resultado fr
      JOIN resultados_aprendizaje ra ON fr.id_resultado = ra.id_resultado
      JOIN competencia c ON ra.id_competencia = c.id_competencia
      JOIN formacion f ON c.id_formacion = f.id_formacion
      WHERE f.id_programa = $1
      GROUP BY c.id_formacion, fr.id_fase
    ),
    learner_phase_judgements AS (
      SELECT
        fr.id_fase,
        a.id_formacion,
        a.id_aprendiz,
        COUNT(DISTINCT fr.id_resultado) FILTER (WHERE je.id_resultado IS NOT NULL)::int AS evaluated_results,
        COUNT(DISTINCT fr.id_resultado) FILTER (WHERE je.estado = 'aprobado')::int AS approved_results
      FROM aprendiz a
      JOIN formacion f ON a.id_formacion = f.id_formacion
      JOIN fase_resultado fr ON true
      JOIN resultados_aprendizaje ra ON fr.id_resultado = ra.id_resultado
      JOIN competencia c ON ra.id_competencia = c.id_competencia AND c.id_formacion = a.id_formacion
      LEFT JOIN juicios_evaluativos je ON je.id_aprendiz = a.id_aprendiz AND je.id_resultado = fr.id_resultado
      WHERE f.id_programa = $1 AND a.estado = 'en formacion'
      GROUP BY fr.id_fase, a.id_formacion, a.id_aprendiz
    )
    SELECT
      lpj.id_fase,
      COUNT(*) FILTER (
        WHERE COALESCE(pr.total_results, 0) > 0
          AND lpj.evaluated_results = pr.total_results
          AND lpj.approved_results = pr.total_results
      )::int AS approved_count,
      COUNT(*) FILTER (
        WHERE COALESCE(pr.total_results, 0) = 0
          OR lpj.evaluated_results <> pr.total_results
          OR lpj.approved_results <> pr.total_results
      )::int AS pending_count
    FROM learner_phase_judgements lpj
    LEFT JOIN phase_results pr ON pr.id_fase = lpj.id_fase AND pr.id_formacion = lpj.id_formacion
    GROUP BY lpj.id_fase
  `, [idPrograma]);

  const activeProgressByPhase = new Map<number, { approvedCount: number; pendingCount: number }>(
    activeProgressRes.rows.map((row) => [
      Number(row.id_fase),
      {
        approvedCount: Number(row.approved_count),
        pendingCount: Number(row.pending_count),
      },
    ]),
  );

  const referenceDatesRes = await pool.query(`
    SELECT
      fr.id_fase,
      MAX(je.fecha) AS reference_date
    FROM juicios_evaluativos je
    JOIN fase_resultado fr ON je.id_resultado = fr.id_resultado
    JOIN resultados_aprendizaje ra ON fr.id_resultado = ra.id_resultado
    JOIN competencia c ON ra.id_competencia = c.id_competencia
    JOIN aprendiz a ON je.id_aprendiz = a.id_aprendiz
    JOIN formacion f ON a.id_formacion = f.id_formacion
    WHERE f.id_programa = $1
      AND a.estado = 'en formacion'
    GROUP BY fr.id_fase
  `, [idPrograma]);

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
    ),
    latest_judgement AS (
      SELECT DISTINCT ON (je.id_aprendiz)
        je.id_aprendiz,
        je.fecha AS ultima_fecha,
        je.estado AS ultimo_juicio_estado,
        ra.codigo AS resultado_codigo,
        ra.detalle AS resultado_detalle,
        fr.id_fase,
        c.codigo AS competencia_codigo,
        c.nombre AS competencia_nombre
      FROM juicios_evaluativos je
      JOIN fase_resultado fr ON je.id_resultado = fr.id_resultado
      JOIN resultados_aprendizaje ra ON je.id_resultado = ra.id_resultado
      JOIN competencia c ON ra.id_competencia = c.id_competencia
      JOIN retired_learners rl ON rl.id_aprendiz = je.id_aprendiz
      WHERE je.fecha IS NOT NULL
      ORDER BY je.id_aprendiz, je.fecha DESC, je.id_juicio DESC, fr.id_fase
    )
    SELECT
      rl.id_aprendiz,
      rl.nombres,
      rl.apellidos,
      rl.documento,
      rl.estado,
      lj.ultima_fecha,
      lj.ultimo_juicio_estado,
      lj.resultado_codigo,
      lj.resultado_detalle,
      lj.id_fase,
      lj.competencia_codigo,
      lj.competencia_nombre
    FROM retired_learners rl
    JOIN latest_judgement lj ON lj.id_aprendiz = rl.id_aprendiz
  `, [idPrograma]);

  const desertedLearnersByPhase = new Map<number, any[]>();

  for (const row of desertedRes.rows) {
    const phaseId = Number(row.id_fase);
    const referenceDate = referenceDateByPhase.get(phaseId);
    const latestDate = row.ultima_fecha;
    const latestTime = latestDate ? new Date(latestDate).getTime() : null;
    const referenceTime = referenceDate ? new Date(referenceDate).getTime() : null;

    if (latestTime === null || latestTime === referenceTime) {
      continue;
    }

    const learners = desertedLearnersByPhase.get(phaseId) ?? [];
    learners.push({
      nombre: `${row.nombres} ${row.apellidos}`,
      documento: row.documento,
      estado: row.estado,
      ultima_fecha: latestDate,
      juicio_estado: row.ultimo_juicio_estado,
      competencia_codigo: row.competencia_codigo,
      competencia_nombre: row.competencia_nombre,
      resultado_codigo: row.resultado_codigo,
      resultado_detalle: row.resultado_detalle,
    });
    desertedLearnersByPhase.set(phaseId, learners);
  }

  return phases.map((phase) => {
    const phaseId = Number(phase.id_fase);
    const activeProgress = activeProgressByPhase.get(phaseId) ?? { approvedCount: 0, pendingCount: 0 };
    const desertedLearners = desertedLearnersByPhase.get(phaseId) ?? [];

    return {
      id_fase: phase.id_fase,
      nombre: phase.nombre,
      approvedCount: activeProgress.approvedCount,
      pendingCount: activeProgress.pendingCount,
      desertedCount: desertedLearners.length,
      desertedLearners,
      totalLearners: activeProgress.approvedCount + activeProgress.pendingCount + desertedLearners.length,
    };
  });
}
