import { normalizeKey, normalizeText, parseJudgementDate } from '../../src/utils/date-parser.ts';

function testDateParser() {
  console.log('=== RUNNING UNIT TEST: date-parser.test.ts ===');

  const tests = [
    { input: '08/12/2025 18.16 a', expected: '2025-12-08T18:16:00-05:00' },
    { input: '08/12/2025 09.30 a', expected: '2025-12-08T09:30:00-05:00' },
    { input: '08/12/2025 06.16 p', expected: '2025-12-08T18:16:00-05:00' },
    { input: '08/12/2025 12.00 a', expected: '2025-12-08T00:00:00-05:00' },
    { input: '08/12/2025 12.00 p', expected: '2025-12-08T12:00:00-05:00' },
    { input: '08/12/2025 18:16:45', expected: '2025-12-08T18:16:45-05:00' },
    { input: '08/12/2025 08:30:00 a.m.', expected: '2025-12-08T08:30:00-05:00' },
    { input: '08/12/2025 04:15:20 p.m.', expected: '2025-12-08T16:15:20-05:00' },
    { input: '08/12/2025', expected: '2025-12-08T00:00:00-05:00' },
  ];

  let passed = 0;
  for (const t of tests) {
    const result = parseJudgementDate(t.input);
    if (result === t.expected) {
      passed++;
    } else {
      console.error(`FAIL: ${t.input} -> got "${result}", expected "${t.expected}"`);
    }
  }

  console.log(`Passed ${passed}/${tests.length} tests.\n`);
}

testDateParser();
