import type { PoolClient } from 'pg';

import type { CsvImportPayload, CsvMetadata, CsvRow } from '../types.ts';

const metadataAliases = {
  ficha: ['Ficha de Caracterizacion'],
  programaCodigo: ['Cogigo', 'Codigo'],
  programaVersion: ['Version'],
  programaNombre: ['Denominacion'],
  formacionEstado: ['Estado de la Ficha de Caracterizacion'],
  modalidad: ['Modalidad de Formacion'],
} as const;

const rowAliases = {
  tipoDocumento: ['Tipo de Documento'],
  numeroDocumento: ['Numero de Documento'],
  nombre: ['Nombre'],
  apellidos: ['Apellidos'],
  estado: ['Estado'],
  competencia: ['Competencia'],
  resultado: ['Resultado de Aprendizaje'],
  juicio: ['Juicio de Evaluacion'],
  fechaJuicio: ['Fecha y Hora del Juicio Evaluativo'],
  funcionario: ['Funcionario que registro el juicio evaluativo'],
} as const;

const learnerStateMap: Record<string, string> = {
  'EN FORMACION': 'en formacion',
  'RETIRO VOLUNTARIO': 'retiro voluntario',
  TRASLADADO: 'traslado',
  TRASLADO: 'traslado',
};

const formationStateMap: Record<string, string> = {
  'EN EJECUCION': 'en ejecucion',
  FINALIZADA: 'finalizada',
  CANCELADA: 'cancelada',
};

const modalidadMap: Record<string, string> = {
  PRESENCIAL: 'presencial',
  VIRTUAL: 'virtual',
  'A DISTANCIA': 'a distancia',
};

const judgementStateMap: Record<string, string> = {
  APROBADO: 'aprobado',
  DESAPROBADO: 'desaprobado',
  'POR EVALUAR': 'por evaluar',
};

interface ImportSummary {
  programa: string;
  ficha: string;
  learners: number;
  competencies: number;
  results: number;
  judgements: number;
}

function normalizeText(value: string | undefined) {
  return (value ?? '').replace(/\uFEFF/g, '').trim();
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase();
}

function findValueFromMap(values: Record<string, string>, aliases: readonly string[]) {
  const normalizedEntries = Object.entries(values).map(([key, value]) => [normalizeKey(key), normalizeText(value)] as const);

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const match = normalizedEntries.find(([key]) => key === normalizedAlias);
    if (match?.[1]) {
      return match[1];
    }
  }

  return '';
}

function getMetadataValue(metadata: CsvMetadata, aliases: readonly string[]) {
  return findValueFromMap(metadata, aliases);
}

function getRowValue(row: CsvRow, aliases: readonly string[]) {
  return findValueFromMap(row, aliases);
}

function mapRequiredEnum(value: string, map: Record<string, string>, fieldLabel: string) {
  const normalized = normalizeKey(value);
  const mapped = map[normalized];

  if (!mapped) {
    throw new Error(`Valor no soportado para ${fieldLabel}: "${value}".`);
  }

  return mapped;
}

function splitCodeAndName(value: string, fieldLabel: string) {
  const normalized = normalizeText(value);
  const match = normalized.match(/^([0-9]+)\s*-\s*(.+)$/);

  if (!match) {
    throw new Error(`No se pudo separar codigo y nombre para ${fieldLabel}: "${value}".`);
  }

  return {
    code: match[1]!.trim(),
    name: match[2]!.trim(),
  };
}

function splitFuncionario(rawValue: string) {
  const normalized = normalizeText(rawValue);
  if (!normalized || normalized === '-') {
    return null;
  }

  const match = normalized.match(/^([A-Z]+)\s+([0-9]+)\s*-\s*(.+)$/i);
  if (!match) {
    return null;
  }

  const fullName = normalizeText(match[3]!);
  const tokens = fullName.split(/\s+/).filter(Boolean);
  const splitIndex = tokens.length <= 2 ? 1 : Math.ceil(tokens.length / 2);

  return {
    tipoDocumento: match[1]!.toUpperCase(),
    documento: match[2]!,
    nombre: tokens.slice(0, splitIndex).join(' ') || fullName,
    apellido: tokens.slice(splitIndex).join(' ') || fullName,
  };
}

function parseJudgementDate(rawValue: string) {
  const normalized = normalizeText(rawValue);
  if (!normalized || normalized === '-') {
    return null;
  }

  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2})\.(\d{2})\s*([ap]))?$/i);
  if (!match) {
    return null;
  }

  const day = match[1]!.padStart(2, '0');
  const month = match[2]!.padStart(2, '0');
  const year = match[3]!;
  const period = match[6]?.toLowerCase();

  if (!match[4] || !match[5]) {
    return `${year}-${month}-${day}T00:00:00-05:00`;
  }

  let hours = Number(match[4]!);
  const minutes = match[5]!;

  if (period === 'p' && hours < 12) {
    hours += 12;
  }

  if (period === 'a' && hours === 12) {
    hours = 0;
  }

  return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${minutes}:00-05:00`;
}

async function ensureProgram(client: PoolClient, metadata: CsvMetadata) {
  const codigo = getMetadataValue(metadata, metadataAliases.programaCodigo);
  const version = getMetadataValue(metadata, metadataAliases.programaVersion);
  const nombre = getMetadataValue(metadata, metadataAliases.programaNombre);

  if (!codigo || !version || !nombre) {
    throw new Error('El metadata del CSV no contiene codigo, version o denominacion del programa.');
  }

  const result = await client.query<{ id_programa: number; nombre: string }>(
    `
      INSERT INTO programa (codigo, nombre, version)
      VALUES ($1, $2, $3)
      ON CONFLICT (codigo)
      DO UPDATE SET nombre = EXCLUDED.nombre, version = EXCLUDED.version
      RETURNING id_programa, nombre
    `,
    [codigo, nombre, version],
  );

  const program = result.rows[0];
  if (!program) {
    throw new Error('No se pudo crear o actualizar el programa.');
  }

  return program;
}

async function ensureFormacion(client: PoolClient, programId: number, metadata: CsvMetadata) {
  const ficha = getMetadataValue(metadata, metadataAliases.ficha);
  const estado = mapRequiredEnum(
    getMetadataValue(metadata, metadataAliases.formacionEstado),
    formationStateMap,
    'estado de la ficha',
  );
  const modalidad = mapRequiredEnum(
    getMetadataValue(metadata, metadataAliases.modalidad),
    modalidadMap,
    'modalidad de formacion',
  );

  if (!ficha) {
    throw new Error('El metadata del CSV no contiene la ficha de caracterizacion.');
  }

  const result = await client.query<{ id_formacion: number; ficha_caracterizacion: string }>(
    `
      INSERT INTO formacion (ficha_caracterizacion, estado, modalidad, id_programa)
      VALUES ($1, $2::estado_formacion_enum, $3::modalidad_enum, $4)
      ON CONFLICT (ficha_caracterizacion)
      DO UPDATE SET
        estado = EXCLUDED.estado,
        modalidad = EXCLUDED.modalidad,
        id_programa = EXCLUDED.id_programa
      RETURNING id_formacion, ficha_caracterizacion
    `,
    [ficha, estado, modalidad, programId],
  );

  const formacion = result.rows[0];
  if (!formacion) {
    throw new Error('No se pudo crear o actualizar la formacion.');
  }

  return formacion;
}

async function ensureAprendiz(client: PoolClient, row: CsvRow, formacionId: number) {
  const estado = mapRequiredEnum(getRowValue(row, rowAliases.estado), learnerStateMap, 'estado del aprendiz');
  const result = await client.query<{ id_aprendiz: number }>(
    `
      INSERT INTO aprendiz (documento, tipo_documento, nombres, apellidos, estado, id_formacion)
      VALUES ($1, $2, $3, $4, $5::estado_aprendiz_enum, $6)
      ON CONFLICT (documento, id_formacion)
      DO UPDATE SET
        tipo_documento = EXCLUDED.tipo_documento,
        nombres = EXCLUDED.nombres,
        apellidos = EXCLUDED.apellidos,
        estado = EXCLUDED.estado
      RETURNING id_aprendiz
    `,
    [
      getRowValue(row, rowAliases.numeroDocumento),
      getRowValue(row, rowAliases.tipoDocumento),
      getRowValue(row, rowAliases.nombre),
      getRowValue(row, rowAliases.apellidos),
      estado,
      formacionId,
    ],
  );

  const aprendiz = result.rows[0];
  if (!aprendiz) {
    throw new Error('No se pudo crear o actualizar el aprendiz.');
  }

  return aprendiz.id_aprendiz;
}

async function ensureCompetencia(client: PoolClient, row: CsvRow, formacionId: number) {
  const competencia = splitCodeAndName(getRowValue(row, rowAliases.competencia), 'competencia');
  const result = await client.query<{ id_competencia: number }>(
    `
      INSERT INTO competencia (codigo, nombre, id_formacion)
      VALUES ($1, $2, $3)
      ON CONFLICT (codigo, id_formacion)
      DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id_competencia
    `,
    [competencia.code, competencia.name, formacionId],
  );

  return {
    id: result.rows[0]!.id_competencia,
    code: competencia.code,
  };
}

async function ensureResultado(client: PoolClient, row: CsvRow, competenciaId: number) {
  const resultado = splitCodeAndName(getRowValue(row, rowAliases.resultado), 'resultado de aprendizaje');
  const result = await client.query<{ id_resultado: number }>(
    `
      INSERT INTO resultados_aprendizaje (codigo, detalle, id_competencia)
      VALUES ($1, $2, $3)
      ON CONFLICT (codigo, id_competencia)
      DO UPDATE SET detalle = EXCLUDED.detalle
      RETURNING id_resultado
    `,
    [resultado.code, resultado.name, competenciaId],
  );

  return {
    id: result.rows[0]!.id_resultado,
    code: resultado.code,
  };
}

async function ensureFuncionario(client: PoolClient, row: CsvRow) {
  const funcionario = splitFuncionario(getRowValue(row, rowAliases.funcionario));
  if (!funcionario) {
    return null;
  }

  const result = await client.query<{ id_funcionario: number }>(
    `
      INSERT INTO funcionario (documento, tipo_documento, nombre, apellido)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (documento)
      DO UPDATE SET
        tipo_documento = EXCLUDED.tipo_documento,
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido
      RETURNING id_funcionario
    `,
    [funcionario.documento, funcionario.tipoDocumento, funcionario.nombre, funcionario.apellido],
  );

  const funcionarioCreado = result.rows[0];
  if (!funcionarioCreado) {
    throw new Error('No se pudo crear o actualizar el funcionario.');
  }

  return funcionarioCreado.id_funcionario;
}

async function ensureJuicio(
  client: PoolClient,
  row: CsvRow,
  resultadoId: number,
  aprendizId: number,
  funcionarioId: number | null,
) {
  const estado = mapRequiredEnum(getRowValue(row, rowAliases.juicio), judgementStateMap, 'juicio evaluativo');
  const fecha = parseJudgementDate(getRowValue(row, rowAliases.fechaJuicio));

  await client.query(
    `
      INSERT INTO juicios_evaluativos (id_resultado, id_aprendiz, estado, fecha, id_funcionario)
      VALUES ($1, $2, $3::juicio_estado_enum, $4, $5)
      ON CONFLICT (id_resultado, id_aprendiz)
      DO UPDATE SET
        estado = EXCLUDED.estado,
        fecha = EXCLUDED.fecha,
        id_funcionario = EXCLUDED.id_funcionario
    `,
    [resultadoId, aprendizId, estado, fecha, funcionarioId],
  );
}

export async function importCsvPayload(client: PoolClient, payload: CsvImportPayload): Promise<ImportSummary> {
  if (!payload.fileName || !payload.summary || !Array.isArray(payload.rows) || payload.rows.length === 0) {
    throw new Error('El CSV no contiene filas para importar.');
  }

  const program = await ensureProgram(client, payload.metadata);
  const formacion = await ensureFormacion(client, program.id_programa, payload.metadata);

  const learnerCache = new Map<string, number>();
  const competenciaCache = new Map<string, number>();
  const resultadoCache = new Map<string, number>();
  const funcionarioCache = new Map<string, number | null>();

  for (const row of payload.rows) {
    const learnerKey = getRowValue(row, rowAliases.numeroDocumento);
    if (!learnerKey) {
      continue;
    }

    let aprendizId = learnerCache.get(learnerKey);
    if (!aprendizId) {
      aprendizId = await ensureAprendiz(client, row, formacion.id_formacion);
      learnerCache.set(learnerKey, aprendizId);
    }

    const competenciaKey = `${formacion.id_formacion}::${getRowValue(row, rowAliases.competencia)}`;
    let competenciaId = competenciaCache.get(competenciaKey);
    if (!competenciaId) {
      const competencia = await ensureCompetencia(client, row, formacion.id_formacion);
      competenciaId = competencia.id;
      competenciaCache.set(competenciaKey, competenciaId);
    }

    const resultadoKey = `${competenciaId}::${getRowValue(row, rowAliases.resultado)}`;
    let resultadoId = resultadoCache.get(resultadoKey);
    if (!resultadoId) {
      const resultado = await ensureResultado(client, row, competenciaId);
      resultadoId = resultado.id;
      resultadoCache.set(resultadoKey, resultadoId);
    }

    const funcionarioKey = getRowValue(row, rowAliases.funcionario);
    let funcionarioId = funcionarioCache.get(funcionarioKey);
    if (funcionarioId === undefined) {
      funcionarioId = await ensureFuncionario(client, row);
      funcionarioCache.set(funcionarioKey, funcionarioId);
    }

    await ensureJuicio(client, row, resultadoId, aprendizId, funcionarioId ?? null);
  }

  return {
    programa: program.nombre,
    ficha: formacion.ficha_caracterizacion,
    learners: learnerCache.size,
    competencies: competenciaCache.size,
    results: resultadoCache.size,
    judgements: payload.rows.length,
  };
}
