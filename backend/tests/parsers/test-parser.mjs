import fs from 'fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

function normalizePhaseLabel(value) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (normalized.includes('PLANEACION')) return 'PLANEACIÓN';
  if (normalized.includes('EJECUCION')) return 'EJECUCIÓN';
  if (normalized.includes('EVALUACION')) return 'EVALUACIÓN';
  return 'ANÁLISIS';
}

function detectPhaseLabel(value) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (normalized.includes('ANALISIS')) return 'ANÁLISIS';
  if (normalized.includes('PLANEACION')) return 'PLANEACIÓN';
  if (normalized.includes('EJECUCION')) return 'EJECUCIÓN';
  if (normalized.includes('EVALUACION')) return 'EVALUACIÓN';
  return null;
}

function buildPageLines(items, pageNumber) {
  const filtered = items
    .filter((item) => item.str && item.str.trim())
    .map((item) => ({
      str: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
      width: item.width ?? 0
    }))
    .sort((a, b) => {
      if (Math.abs(b.y - a.y) > 1.5) return b.y - a.y;
      return a.x - b.x;
    });

  const rows = [];

  for (const item of filtered) {
    const existingRow = rows.find((row) => Math.abs(row.y - item.y) <= 2.5);
    if (existingRow) {
      existingRow.items.push(item);
      existingRow.y = (existingRow.y + item.y) / 2;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }

  return rows
    .map((row) => {
      const ordered = row.items.sort((a, b) => a.x - b.x);
      let text = '';
      let lastRight = -Infinity;

      for (const item of ordered) {
        const gap = item.x - lastRight;
        if (text && gap > 6) {
          text += ' ';
        }
        text += item.str;
        lastRight = item.x + item.width;
      }

      return {
        text: text.replace(/\s+/g, ' ').trim(),
        x: ordered[0]?.x ?? 0,
        y: row.y,
        page: pageNumber,
        items: ordered
      };
    })
    .filter((line) => line.text);
}

function extractPhasesFromLines(lines) {
  const phaseMap = {};
  const orderedAll = [...lines].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return b.y - a.y;
  });

  const sectionStartIndex = orderedAll.findIndex((line) => /3\.4\b/i.test(line.text) && /Competencia Asociada/i.test(line.text));
  const rawSectionEndIndex = orderedAll.findIndex((line, index) => index > sectionStartIndex && /3\.(5|6|7)\b/i.test(line.text));
  const ordered =
    sectionStartIndex >= 0
      ? orderedAll.slice(sectionStartIndex, rawSectionEndIndex > sectionStartIndex ? rawSectionEndIndex : undefined)
      : orderedAll;

  const markers = ordered
    .map((line, index) => ({ line, index, phase: line.x < 120 ? detectPhaseLabel(line.text) : null }))
    .filter((entry) => Boolean(entry.phase));

  for (let i = 0; i < markers.length; i += 1) {
    const marker = markers[i];
    const nextIndex = markers[i + 1]?.index ?? ordered.length;
    const block = ordered.slice(marker.index, nextIndex);

    // DUMP BLOCK HERE TO SEE WHAT WE ARE PROCESSING
    if (i === 1) { // checking second phase: ANALIZAR Y CONOCER HERRAMIENTAS...
       console.log("PHASE BLOCK LINES:", block.map(l => ({text: l.text, x: l.x, y: l.y})));
    }

    const activityLines = block
      .filter((line) => line.x >= 170 && line.x < 355)
      .map((line) => line.text);

    const competencyCodes = new Set();
    const resultCodes = new Set();
    for (const line of block) {
      if (line.x >= 340 && line.x < 520) {
        const resultMatches = line.text.match(/\b\d{6}\b/g) ?? [];
        for (const match of resultMatches) {
          resultCodes.add(match);
        }
      }

      if (line.x >= 520) {
        const matches = line.text.match(/\b\d{6,9}\b/g) ?? [];
        for (const match of matches) {
          competencyCodes.add(match);
        }
      }
    }

    const phaseName = normalizePhaseLabel(marker.phase);
    const activity = activityLines.join(' ').replace(/\s+/g, ' ').trim();

    if (!phaseMap[phaseName]) {
      phaseMap[phaseName] = {
        name: phaseName,
        activity,
        competencyCodes: Array.from(competencyCodes),
        resultCodes: Array.from(resultCodes),
      };
      continue;
    }

    const current = phaseMap[phaseName];
    if (activity.length > current.activity.length) {
      current.activity = activity;
    }
    for (const code of competencyCodes) {
      if (!current.competencyCodes.includes(code)) {
        current.competencyCodes.push(code);
      }
    }
    for (const code of resultCodes) {
      if (!current.resultCodes.includes(code)) {
        current.resultCodes.push(code);
      }
    }
  }

  return Object.values(phaseMap);
}

async function run() {
  const data = await fs.readFile('guides/1.Proyecto Formativo ADSO - 2480542.pdf');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const lines = [];
  
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageLines = buildPageLines(content.items, i);
    lines.push(...pageLines);
  }

  const phases = extractPhasesFromLines(lines);
  await fs.writeFile('pdf-lines.json', JSON.stringify(lines, null, 2));
  console.log(JSON.stringify(phases, null, 2));
}

run().catch(console.error);
