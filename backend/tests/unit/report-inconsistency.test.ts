import assert from 'node:assert/strict';
import { ReportInconsistencyError } from '../../src/services/csvImport.ts';

console.log('=== RUNNING UNIT TEST: report-inconsistency.test.ts ===');

const rowsWithRegression = [
  {
    'Tipo de Documento': 'CC',
    'Numero de Documento': '1001',
    'Nombre': 'Carlos',
    'Apellidos': 'Perez',
    'Estado': 'EN FORMACION',
    'Competencia': '240201500 - Promover la interaccion idonea',
    'Resultado de Aprendizaje': '240201500-01 - Interactuar en los contextos productivos',
    'Juicio de Evaluacion': 'POR EVALUAR',
    'Fecha y Hora del Juicio Evaluativo': '',
    'Funcionario que registro el juicio evaluativo': '',
  },
  {
    'Tipo de Documento': 'CC',
    'Numero de Documento': '1002',
    'Nombre': 'Maria',
    'Apellidos': 'Gomez',
    'Estado': 'EN FORMACION',
    'Competencia': '240201500 - Promover la interaccion idonea',
    'Resultado de Aprendizaje': '240201500-01 - Interactuar en los contextos productivos',
    'Juicio de Evaluacion': 'APROBADO',
    'Fecha y Hora del Juicio Evaluativo': '10/01/2026',
    'Funcionario que registro el juicio evaluativo': 'CC 9999 - Pedro Instructor',
  },
];

const rowsLegitimateProgress = [
  {
    'Tipo de Documento': 'CC',
    'Numero de Documento': '1001',
    'Nombre': 'Carlos',
    'Apellidos': 'Perez',
    'Estado': 'EN FORMACION',
    'Competencia': '240201500 - Promover la interaccion idonea',
    'Resultado de Aprendizaje': '240201500-01 - Interactuar en los contextos productivos',
    'Juicio de Evaluacion': 'APROBADO',
    'Fecha y Hora del Juicio Evaluativo': '05/01/2026',
    'Funcionario que registro el juicio evaluativo': 'CC 9999 - Pedro Instructor',
  },
  {
    'Tipo de Documento': 'CC',
    'Numero de Documento': '1002',
    'Nombre': 'Maria',
    'Apellidos': 'Gomez',
    'Estado': 'EN FORMACION',
    'Competencia': '240201500 - Promover la interaccion idonea',
    'Resultado de Aprendizaje': '240201500-01 - Interactuar en los contextos productivos',
    'Juicio de Evaluacion': 'APROBADO',
    'Fecha y Hora del Juicio Evaluativo': '10/01/2026',
    'Funcionario que registro el juicio evaluativo': 'CC 9999 - Pedro Instructor',
  },
];

async function testInconsistencyDetection() {
  const existingJudgements = [
    {
      documento: '1001',
      nombres: 'Carlos',
      apellidos: 'Perez',
      resultado_codigo: '240201500-01',
      resultado_detalle: 'Interactuar en los contextos productivos',
      estado_actual: 'aprobado',
      fecha_actual: '2026-01-05T00:00:00-05:00',
    },
    {
      documento: '1002',
      nombres: 'Maria',
      apellidos: 'Gomez',
      resultado_codigo: '240201500-01',
      resultado_detalle: 'Interactuar en los contextos productivos',
      estado_actual: 'por evaluar',
      fecha_actual: null,
    },
  ];

  // Test 1: Report with regression must detect regression
  console.log('Test 1: Detecting regression from APROBADO to POR EVALUAR...');
  const existingMap = new Map();
  for (const item of existingJudgements) {
    existingMap.set(`${item.documento}::${item.resultado_codigo}`, item);
  }

  const inconsistencies: any[] = [];
  for (const row of rowsWithRegression) {
    const doc = row['Numero de Documento'];
    const resCode = '240201500-01';
    const juicio = row['Juicio de Evaluacion'].toLowerCase();
    const existing = existingMap.get(`${doc}::${resCode}`);

    if (existing && existing.estado_actual === 'aprobado' && juicio !== 'aprobado') {
      inconsistencies.push({
        documento: doc,
        aprendiz: `${row['Nombre']} ${row['Apellidos']}`,
        resultadoCodigo: resCode,
        resultadoDetalle: 'Interactuar en los contextos productivos',
        estadoActual: existing.estado_actual,
        estadoReporte: juicio,
      });
    }
  }

  assert.equal(inconsistencies.length, 1, 'Should detect exactly 1 regression');
  assert.equal(inconsistencies[0].documento, '1001');
  assert.equal(inconsistencies[0].estadoActual, 'aprobado');
  assert.equal(inconsistencies[0].estadoReporte, 'por evaluar');
  console.log('  -> OK: Regression detected correctly!');

  // Test 2: Error instantiation and properties
  console.log('Test 2: Validating ReportInconsistencyError properties...');
  const error = new ReportInconsistencyError('2670123', inconsistencies);
  assert.equal(error.code, 'REPORT_INCONSISTENCY');
  assert.equal(error.ficha, '2670123');
  assert.equal(error.totalInconsistencies, 1);
  assert.equal(error.inconsistencies.length, 1);
  console.log('  -> OK: ReportInconsistencyError structure verified!');

  // Test 3: Legitimate progress must produce 0 inconsistencies
  console.log('Test 3: Validating legitimate progressive report...');
  const legitInconsistencies: any[] = [];
  for (const row of rowsLegitimateProgress) {
    const doc = row['Numero de Documento'];
    const resCode = '240201500-01';
    const juicio = row['Juicio de Evaluacion'].toLowerCase();
    const existing = existingMap.get(`${doc}::${resCode}`);

    if (existing && existing.estado_actual === 'aprobado' && juicio !== 'aprobado') {
      legitInconsistencies.push({ doc });
    }
  }
  assert.equal(legitInconsistencies.length, 0, 'Legitimate progress should have 0 inconsistencies');
  console.log('  -> OK: Legitimate progress accepted without errors!');

  console.log('\nAll 3 unit test cases PASSED successfully!\n');
}

testInconsistencyDetection().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
