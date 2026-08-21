import type { Pool } from 'pg';

import type { DashboardFilters } from '../types.ts';

interface JoinedRow {
  programa_codigo: string;
  programa_nombre: string;
  ficha_caracterizacion: string;
  aprendiz_id: number;
  aprendiz_documento: string;
  aprendiz_tipo_documento: string;
  aprendiz_nombres: string;
  aprendiz_apellidos: string;
  aprendiz_estado: string;
  competencia_codigo: string;
  competencia_codigo_juicio: string | null;
  competencia_codigo_proyecto: string | null;
  competencia_nombre: string;
  resultado_codigo: string;
  resultado_codigo_juicio: string | null;
  resultado_codigo_proyecto: string | null;
  resultado_detalle: string;
  juicio_estado: string;
  juicio_fecha: string | null;
  funcionario_documento: string | null;
  funcionario_tipo_documento: string | null;
  funcionario_nombre: string | null;
  funcionario_apellido: string | null;
}

function normalizeFilterValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildWhere(filters: DashboardFilters) {
  const clauses: string[] = [];
  const values: string[] = [];

  const estado = normalizeFilterValue(filters.estado);
  if (estado) {
    values.push(estado);
    clauses.push(`a.estado = $${values.length}`);
  }

  const ficha = normalizeFilterValue(filters.ficha);
  if (ficha) {
    values.push(ficha);
    clauses.push(`f.ficha_caracterizacion = $${values.length}`);
  }

  const juicio = normalizeFilterValue(filters.juicio);
  if (juicio) {
    values.push(juicio);
    clauses.push(`j.estado = $${values.length}`);
  }

  const competencia = normalizeFilterValue(filters.competencia);
  if (competencia) {
    values.push(competencia);
    clauses.push(`(c.codigo = $${values.length} OR c.codigo_juicio = $${values.length} OR c.codigo_proyecto = $${values.length})`);
  }

  const resultado = normalizeFilterValue(filters.resultado);
  if (resultado) {
    values.push(resultado);
    clauses.push(`(r.codigo = $${values.length} OR r.codigo_juicio = $${values.length} OR r.codigo_proyecto = $${values.length})`);
  }

  const aprendiz = normalizeFilterValue(filters.aprendiz);
  if (aprendiz) {
    values.push(aprendiz);
    clauses.push(`a.id_aprendiz::text = $${values.length}`);
  }

  const sql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return { sql, values };
}

function buildProgress(approved: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((approved / total) * 100).toFixed(1));
}

function distinct<T>(values: T[]) {
  return [...new Set(values)];
}

function buildFuncionarioLabel(row: JoinedRow) {
  if (!row.funcionario_documento || !row.funcionario_nombre) {
    return 'Sin funcionario';
  }

  return `${row.funcionario_tipo_documento ?? ''} ${row.funcionario_documento} - ${row.funcionario_nombre} ${row.funcionario_apellido ?? ''}`.trim();
}

async function queryJoinedRows(pool: Pool, filters: DashboardFilters) {
  const { sql, values } = buildWhere(filters);

  const rowsResult = await pool.query<JoinedRow>(
    `
      SELECT
        p.codigo AS programa_codigo,
        p.nombre AS programa_nombre,
        f.ficha_caracterizacion,
        a.id_aprendiz AS aprendiz_id,
        a.documento AS aprendiz_documento,
        a.tipo_documento AS aprendiz_tipo_documento,
        a.nombres AS aprendiz_nombres,
        a.apellidos AS aprendiz_apellidos,
        a.estado AS aprendiz_estado,
        c.codigo AS competencia_codigo,
        c.codigo_juicio AS competencia_codigo_juicio,
        c.codigo_proyecto AS competencia_codigo_proyecto,
        c.nombre AS competencia_nombre,
        r.codigo AS resultado_codigo,
        r.codigo_juicio AS resultado_codigo_juicio,
        r.codigo_proyecto AS resultado_codigo_proyecto,
        r.detalle AS resultado_detalle,
        j.estado AS juicio_estado,
        to_char(j.fecha AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD"T"HH24:MI:SS') AS juicio_fecha,
        fn.documento AS funcionario_documento,
        fn.tipo_documento AS funcionario_tipo_documento,
        fn.nombre AS funcionario_nombre,
        fn.apellido AS funcionario_apellido
      FROM juicios_evaluativos j
      INNER JOIN resultados_aprendizaje r ON r.id_resultado = j.id_resultado
      INNER JOIN competencia c ON c.id_competencia = r.id_competencia
      INNER JOIN aprendiz a ON a.id_aprendiz = j.id_aprendiz
      INNER JOIN formacion f ON f.id_formacion = a.id_formacion
      INNER JOIN programa p ON p.id_programa = f.id_programa
      LEFT JOIN funcionario fn ON fn.id_funcionario = j.id_funcionario
      ${sql}
      ORDER BY p.nombre, f.ficha_caracterizacion, a.apellidos, a.nombres, c.nombre, r.codigo
    `,
    values,
  );

  return rowsResult.rows;
}

export async function getDashboardData(pool: Pool, filters: DashboardFilters) {
  const rows = await queryJoinedRows(pool, filters);

  const optionsResult = await pool.query<{
    estados: string[];
    fichas: string[];
    fichas_detalle: Array<{ codigo: string; nombre: string }>;
    juicios: string[];
  }>(
    `
      SELECT
        ARRAY(SELECT DISTINCT estado::text FROM aprendiz ORDER BY estado::text) AS estados,
        ARRAY(SELECT DISTINCT ficha_caracterizacion FROM formacion ORDER BY ficha_caracterizacion) AS fichas,
        ARRAY(
          SELECT json_build_object('codigo', f.ficha_caracterizacion, 'nombre', p.nombre)
          FROM formacion f
          INNER JOIN programa p ON p.id_programa = f.id_programa
          ORDER BY f.ficha_caracterizacion
        ) AS fichas_detalle,
        ARRAY(SELECT DISTINCT estado::text FROM juicios_evaluativos ORDER BY estado::text) AS juicios
    `,
  );

  const programMap = new Map<string, {
    programCode: string;
    programName: string;
    approvedCount: number;
    pendingCount: number;
    fichas: Set<string>;
    learners: Set<number>;
  }>();
  const learnerMap = new Map<number, {
    id: number;
    fullName: string;
    document: string;
    documentType: string;
    state: string;
    ficha: string;
    program: string;
    totalResults: number;
    approvedResults: number;
    pendingResults: number;
    disapprovedResults: number;
    progress: number;
    pendingCompetencies: string[];
  }>();
  const learnerPendingCompetencies = new Map<number, Set<string>>();
  const competenciaMap = new Map<string, {
    code: string;
    name: string;
    program: string;
    ficha: string;
    total: number;
    approved: number;
    pending: number;
    disapproved: number;
    approvalRate: number;
  }>();

  for (const row of rows) {
    const programKey = `${row.programa_codigo}::${row.ficha_caracterizacion}`;
    if (!programMap.has(programKey)) {
      programMap.set(programKey, {
        programCode: row.programa_codigo,
        programName: row.programa_nombre,
        approvedCount: 0,
        pendingCount: 0,
        fichas: new Set<string>(),
        learners: new Set<number>(),
      });
    }

    const programEntry = programMap.get(programKey)!;
    programEntry.fichas.add(row.ficha_caracterizacion);
    programEntry.learners.add(row.aprendiz_id);
    if (row.juicio_estado === 'aprobado') {
      programEntry.approvedCount += 1;
    }
    if (row.juicio_estado === 'por evaluar') {
      programEntry.pendingCount += 1;
    }

    if (!learnerMap.has(row.aprendiz_id)) {
      learnerMap.set(row.aprendiz_id, {
        id: row.aprendiz_id,
        fullName: `${row.aprendiz_nombres} ${row.aprendiz_apellidos}`,
        document: row.aprendiz_documento,
        documentType: row.aprendiz_tipo_documento,
        state: row.aprendiz_estado,
        ficha: row.ficha_caracterizacion,
        program: row.programa_nombre,
        totalResults: 0,
        approvedResults: 0,
        pendingResults: 0,
        disapprovedResults: 0,
        progress: 0,
        pendingCompetencies: [],
      });
    }

    const learnerEntry = learnerMap.get(row.aprendiz_id)!;
    learnerEntry.totalResults += 1;
    if (row.juicio_estado === 'aprobado') {
      learnerEntry.approvedResults += 1;
    } else if (row.juicio_estado === 'por evaluar') {
      learnerEntry.pendingResults += 1;
      if (!learnerPendingCompetencies.has(row.aprendiz_id)) {
        learnerPendingCompetencies.set(row.aprendiz_id, new Set<string>());
      }
      learnerPendingCompetencies.get(row.aprendiz_id)!.add(row.competencia_nombre);
    } else if (row.juicio_estado === 'desaprobado') {
      learnerEntry.disapprovedResults += 1;
    }

    const competenciaKey = `${row.ficha_caracterizacion}::${row.competencia_codigo}`;
    if (!competenciaMap.has(competenciaKey)) {
      competenciaMap.set(competenciaKey, {
        code: row.competencia_codigo,
        codigo_juicio: row.competencia_codigo_juicio || row.competencia_codigo,
        codigo_proyecto: row.competencia_codigo_proyecto || row.competencia_codigo,
        name: row.competencia_nombre,
        program: row.programa_nombre,
        ficha: row.ficha_caracterizacion,
        total: 0,
        approved: 0,
        pending: 0,
        disapproved: 0,
        approvalRate: 0,
      });
    }

    const competenciaEntry = competenciaMap.get(competenciaKey)!;
    competenciaEntry.total += 1;
    if (row.juicio_estado === 'aprobado') {
      competenciaEntry.approved += 1;
    } else if (row.juicio_estado === 'por evaluar') {
      competenciaEntry.pending += 1;
    } else if (row.juicio_estado === 'desaprobado') {
      competenciaEntry.disapproved += 1;
    }
  }

  const learners = [...learnerMap.values()]
    .map((learner) => ({
      ...learner,
      progress: buildProgress(learner.approvedResults, learner.totalResults),
      pendingCompetencies: [...(learnerPendingCompetencies.get(learner.id) ?? new Set<string>())],
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));

  const programs = [...programMap.values()]
    .map((program) => ({
      programCode: program.programCode,
      programName: program.programName,
      fichaCount: program.fichas.size,
      learnerCount: program.learners.size,
      approvedCount: program.approvedCount,
      pendingCount: program.pendingCount,
      progress: buildProgress(program.approvedCount, program.approvedCount + program.pendingCount),
    }))
    .sort((a, b) => a.programName.localeCompare(b.programName, 'es'));

  const competencies = [...competenciaMap.values()]
    .map((competency) => ({
      ...competency,
      approvalRate: buildProgress(competency.approved, competency.total),
    }))
    .sort((a, b) => b.approvalRate - a.approvalRate || a.name.localeCompare(b.name, 'es'));

  const overview = {
    programCount: distinct(rows.map((row) => row.programa_codigo)).length,
    fichaCount: distinct(rows.map((row) => row.ficha_caracterizacion)).length,
    learnerCount: distinct(rows.map((row) => row.aprendiz_id)).length,
    inTrainingCount: distinct(rows.filter((row) => row.aprendiz_estado === 'en formacion').map((row) => row.aprendiz_id)).length,
    retiredCount: distinct(rows.filter((row) => row.aprendiz_estado === 'retiro voluntario').map((row) => row.aprendiz_id)).length,
    transferredCount: distinct(rows.filter((row) => row.aprendiz_estado === 'traslado').map((row) => row.aprendiz_id)).length,
    approvedJudgements: rows.filter((row) => row.juicio_estado === 'aprobado').length,
    pendingJudgements: rows.filter((row) => row.juicio_estado === 'por evaluar').length,
    disapprovedJudgements: rows.filter((row) => row.juicio_estado === 'desaprobado').length,
    averageProgress:
      learners.length > 0
        ? Number((learners.reduce((sum, learner) => sum + learner.progress, 0) / learners.length).toFixed(1))
        : 0,
  };

  const pendingLearners = learners
    .filter((learner) => learner.pendingResults > 0)
    .sort((a, b) => b.pendingResults - a.pendingResults || a.fullName.localeCompare(b.fullName, 'es'));

  const recentJudgements = rows
    .filter((row) => row.juicio_fecha)
    .map((row) => ({
      learner: `${row.aprendiz_nombres} ${row.aprendiz_apellidos}`,
      document: row.aprendiz_documento,
      ficha: row.ficha_caracterizacion,
      program: row.programa_nombre,
      competencia: row.competencia_nombre,
      competencia_codigo: row.competencia_codigo,
      competencia_codigo_juicio: row.competencia_codigo_juicio || row.competencia_codigo,
      competencia_codigo_proyecto: row.competencia_codigo_proyecto || row.competencia_codigo,
      resultado: row.resultado_detalle,
      resultado_codigo: row.resultado_codigo,
      resultado_codigo_juicio: row.resultado_codigo_juicio || row.resultado_codigo,
      resultado_codigo_proyecto: row.resultado_codigo_proyecto || row.resultado_codigo,
      judgement: row.juicio_estado,
      registeredAt: row.juicio_fecha!,
      funcionario: buildFuncionarioLabel(row),
    }))
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 20);

  const competenciasOptionsResult = await pool.query<{
    codigo: string;
    codigo_juicio: string;
    codigo_proyecto: string;
    nombre: string;
    ficha: string;
  }>(
    `
      SELECT DISTINCT
        c.codigo AS codigo,
        COALESCE(c.codigo_juicio, c.codigo) AS codigo_juicio,
        COALESCE(c.codigo_proyecto, c.codigo) AS codigo_proyecto,
        c.nombre AS nombre,
        f.ficha_caracterizacion AS ficha
      FROM competencia c
      INNER JOIN programa p ON p.id_programa = c.id_programa
      INNER JOIN formacion f ON f.id_programa = p.id_programa
      ORDER BY ficha, nombre
    `,
  );

  const resultadosOptionsResult = await pool.query<{
    codigo: string;
    codigo_juicio: string;
    codigo_proyecto: string;
    detalle: string;
    competencia_codigo: string;
    ficha: string;
  }>(
    `
      SELECT DISTINCT
        r.codigo AS codigo,
        COALESCE(r.codigo_juicio, r.codigo) AS codigo_juicio,
        COALESCE(r.codigo_proyecto, r.codigo) AS codigo_proyecto,
        r.detalle AS detalle,
        c.codigo AS competencia_codigo,
        f.ficha_caracterizacion AS ficha
      FROM resultados_aprendizaje r
      INNER JOIN competencia c ON c.id_competencia = r.id_competencia
      INNER JOIN programa p ON p.id_programa = c.id_programa
      INNER JOIN formacion f ON f.id_programa = p.id_programa
      ORDER BY ficha, codigo
    `,
  );

  const competenciasOptions = competenciasOptionsResult.rows;
  const resultadosOptions = resultadosOptionsResult.rows;

  const aprendicesOptions = distinct(
    (
      await pool.query<{
        id: number;
        nombre: string;
        documento: string;
        ficha: string;
        estado: string;
      }>(
        `
          SELECT DISTINCT
            a.id_aprendiz AS id,
            CONCAT(a.nombres, ' ', a.apellidos) AS nombre,
            a.documento,
            f.ficha_caracterizacion AS ficha,
            a.estado
          FROM aprendiz a
          INNER JOIN formacion f ON f.id_formacion = a.id_formacion
          ORDER BY nombre, a.documento
        `,
      )
    ).rows.map((row) => JSON.stringify(row)),
  )
    .map((item) => JSON.parse(item) as { id: number; nombre: string; documento: string; ficha: string; estado: string })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.documento.localeCompare(b.documento, 'es'));

  const options = optionsResult.rows[0] ?? {
    estados: [],
    fichas: [],
    fichas_detalle: [],
    juicios: [],
  };

  return {
    overview,
    programs,
    learners,
    competencies,
    pendingLearners,
    recentJudgements,
    options: {
      ...options,
      fichasDetalle: options.fichas_detalle,
      competencias: competenciasOptions,
      resultados: resultadosOptions,
      aprendices: aprendicesOptions,
    },
  };
}

export async function getLearnerDetail(pool: Pool, learnerId: number) {
  const rows = await queryJoinedRows(pool, { aprendiz: String(learnerId) });

  if (!rows.length) {
    return null;
  }

  const firstRow = rows[0]!;
  const competencyMap = new Map<string, {
    code: string;
    codigo_juicio: string;
    codigo_proyecto: string;
    name: string;
    totalResults: number;
    approvedResults: number;
    pendingResults: number;
    disapprovedResults: number;
    progress: number;
    results: Array<{
      code: string;
      codigo_juicio: string;
      codigo_proyecto: string;
      detail: string;
      judgement: string;
      registeredAt: string | null;
      funcionario: string;
      statusProgress: number;
    }>;
  }>();

  let totalResults = 0;
  let approvedResults = 0;
  let pendingResults = 0;
  let disapprovedResults = 0;

  for (const row of rows) {
    totalResults += 1;
    if (row.juicio_estado === 'aprobado') {
      approvedResults += 1;
    } else if (row.juicio_estado === 'por evaluar') {
      pendingResults += 1;
    } else if (row.juicio_estado === 'desaprobado') {
      disapprovedResults += 1;
    }

    if (!competencyMap.has(row.competencia_codigo)) {
      competencyMap.set(row.competencia_codigo, {
        code: row.competencia_codigo,
        codigo_juicio: row.competencia_codigo_juicio || row.competencia_codigo,
        codigo_proyecto: row.competencia_codigo_proyecto || row.competencia_codigo,
        name: row.competencia_nombre,
        totalResults: 0,
        approvedResults: 0,
        pendingResults: 0,
        disapprovedResults: 0,
        progress: 0,
        results: [],
      });
    }

    const competency = competencyMap.get(row.competencia_codigo)!;
    competency.totalResults += 1;
    if (row.juicio_estado === 'aprobado') {
      competency.approvedResults += 1;
    } else if (row.juicio_estado === 'por evaluar') {
      competency.pendingResults += 1;
    } else if (row.juicio_estado === 'desaprobado') {
      competency.disapprovedResults += 1;
    }

    competency.results.push({
      code: row.resultado_codigo,
      codigo_juicio: row.resultado_codigo_juicio || row.resultado_codigo,
      codigo_proyecto: row.resultado_codigo_proyecto || row.resultado_codigo,
      detail: row.resultado_detalle,
      judgement: row.juicio_estado,
      registeredAt: row.juicio_fecha,
      funcionario: buildFuncionarioLabel(row),
      statusProgress: row.juicio_estado === 'aprobado' ? 100 : 0,
    });
  }

  const competencies = [...competencyMap.values()]
    .map((competency) => ({
      ...competency,
      progress: buildProgress(competency.approvedResults, competency.totalResults),
      results: competency.results.sort((a, b) => a.code.localeCompare(b.code, 'es')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return {
    learner: {
      id: firstRow.aprendiz_id,
      fullName: `${firstRow.aprendiz_nombres} ${firstRow.aprendiz_apellidos}`,
      document: firstRow.aprendiz_documento,
      documentType: firstRow.aprendiz_tipo_documento,
      state: firstRow.aprendiz_estado,
      ficha: firstRow.ficha_caracterizacion,
      program: firstRow.programa_nombre,
      totalResults,
      approvedResults,
      pendingResults,
      disapprovedResults,
      progress: buildProgress(approvedResults, totalResults),
    },
    competencies,
  };
}

export async function getFormationCompetencyCatalog(pool: Pool, filters: DashboardFilters = {}) {
  const catalogFilters: DashboardFilters = {};

  if (filters.ficha) {
    catalogFilters.ficha = filters.ficha;
  }

  if (filters.estado) {
    catalogFilters.estado = filters.estado;
  }

  const rows = await queryJoinedRows(pool, catalogFilters);

  const competencyMap = new Map<string, {
    ficha: string;
    program: string;
    code: string;
    codigo_juicio: string;
    codigo_proyecto: string;
    name: string;
    totalResults: number;
    totalLearners: number;
    approvedLearners: number;
    pendingLearners: number;
    disapprovedLearners: number;
    progress: number;
    results: Array<{
      code: string;
      codigo_juicio: string;
      codigo_proyecto: string;
      detail: string;
      totalLearners: number;
      approvedLearners: number;
      pendingLearners: number;
      disapprovedLearners: number;
      progress: number;
      learners: Array<{
        id: number;
        fullName: string;
        document: string;
        documentType: string;
        state: string;
        judgement: string;
      }>;
    }>;
  }>();

  const resultMap = new Map<string, {
    ficha: string;
    competencyCode: string;
    code: string;
    codigo_juicio: string;
    codigo_proyecto: string;
    detail: string;
    totalLearners: number;
    approvedLearners: number;
    pendingLearners: number;
    disapprovedLearners: number;
    progress: number;
    learners: Array<{
      id: number;
      fullName: string;
      document: string;
      documentType: string;
      state: string;
      judgement: string;
    }>;
  }>();

  for (const row of rows) {
    const competencyKey = `${row.ficha_caracterizacion}::${row.competencia_codigo}`;
    if (!competencyMap.has(competencyKey)) {
      competencyMap.set(competencyKey, {
        ficha: row.ficha_caracterizacion,
        program: row.programa_nombre,
        code: row.competencia_codigo,
        codigo_juicio: row.competencia_codigo_juicio || row.competencia_codigo,
        codigo_proyecto: row.competencia_codigo_proyecto || row.competencia_codigo,
        name: row.competencia_nombre,
        totalResults: 0,
        totalLearners: 0,
        approvedLearners: 0,
        pendingLearners: 0,
        disapprovedLearners: 0,
        progress: 0,
        results: [],
      });
    }

    const resultKey = `${row.ficha_caracterizacion}::${row.competencia_codigo}::${row.resultado_codigo}`;
    if (!resultMap.has(resultKey)) {
      resultMap.set(resultKey, {
        ficha: row.ficha_caracterizacion,
        competencyCode: row.competencia_codigo,
        code: row.resultado_codigo,
        codigo_juicio: row.resultado_codigo_juicio || row.resultado_codigo,
        codigo_proyecto: row.resultado_codigo_proyecto || row.resultado_codigo,
        detail: row.resultado_detalle,
        totalLearners: 0,
        approvedLearners: 0,
        pendingLearners: 0,
        disapprovedLearners: 0,
        progress: 0,
        learners: [],
      });
    }

    const competency = competencyMap.get(competencyKey)!;
    const result = resultMap.get(resultKey)!;

    competency.totalLearners += 1;
    result.totalLearners += 1;

    if (row.juicio_estado === 'aprobado') {
      competency.approvedLearners += 1;
      result.approvedLearners += 1;
    } else if (row.juicio_estado === 'por evaluar') {
      competency.pendingLearners += 1;
      result.pendingLearners += 1;
    } else if (row.juicio_estado === 'desaprobado') {
      competency.disapprovedLearners += 1;
      result.disapprovedLearners += 1;
    }

    result.learners.push({
      id: row.aprendiz_id,
      fullName: `${row.aprendiz_nombres} ${row.aprendiz_apellidos}`,
      document: row.aprendiz_documento,
      documentType: row.aprendiz_tipo_documento,
      state: row.aprendiz_estado,
      judgement: row.juicio_estado,
    });
  }

  for (const competency of competencyMap.values()) {
    competency.progress = buildProgress(competency.approvedLearners, competency.totalLearners);
  }

  for (const result of resultMap.values()) {
    result.progress = buildProgress(result.approvedLearners, result.totalLearners);

    const competencyKey = `${result.ficha}::${result.competencyCode}`;
    const competency = competencyMap.get(competencyKey);
    if (!competency) {
      continue;
    }

    competency.results.push({
      code: result.code,
      codigo_juicio: result.codigo_juicio,
      codigo_proyecto: result.codigo_proyecto,
      detail: result.detail,
      totalLearners: result.totalLearners,
      approvedLearners: result.approvedLearners,
      pendingLearners: result.pendingLearners,
      disapprovedLearners: result.disapprovedLearners,
      progress: result.progress,
      learners: result.learners.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
    });
  }

  for (const competency of competencyMap.values()) {
    competency.results.sort((a, b) => a.code.localeCompare(b.code, 'es'));
    competency.totalResults = competency.results.length;
  }

  return [...competencyMap.values()]
    .sort((a, b) => a.ficha.localeCompare(b.ficha, 'es') || a.name.localeCompare(b.name, 'es'));
}

