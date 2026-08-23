export function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\uFEFF/g, '').trim();
}

export function normalizeKey(value: string): string {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase();
}

/**
 * Parsea fechas con hora en formatos 12h/24h y sufijos AM/PM de SofiaPlus
 * Ejemplos:
 *  - "08/12/2025 18.16 a" => "2025-12-08T18:16:00-05:00"
 *  - "08/12/2025 06.16 p" => "2025-12-08T18:16:00-05:00"
 *  - "08/12/2025 09:30:00 a.m." => "2025-12-08T09:30:00-05:00"
 *  - "08/12/2025" => "2025-12-08T00:00:00-05:00"
 */
export function parseJudgementDate(rawValue: string): string | null {
  const normalized = normalizeText(rawValue);
  if (!normalized || normalized === '-') {
    return null;
  }

  // Matches DD/MM/YYYY or DD-MM-YYYY with optional HH[:.]MM[:.]SS [a|p|am|pm|a.m.|p.m.]
  const match = normalized.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([ap](?:\.m\.)?|am|pm)?)?$/i
  );
  if (!match) {
    return null;
  }

  const day = match[1]!.padStart(2, '0');
  const month = match[2]!.padStart(2, '0');
  const year = match[3]!;
  const rawHours = match[4];
  const rawMinutes = match[5];
  const rawSeconds = match[6] || '00';
  const periodStr = (match[7] || '').toLowerCase().replace(/\./g, '');

  if (!rawHours || !rawMinutes) {
    return `${year}-${month}-${day}T00:00:00-05:00`;
  }

  let hours = Number(rawHours);
  const minutes = rawMinutes.padStart(2, '0');
  const seconds = rawSeconds.padStart(2, '0');

  const isPM = periodStr.startsWith('p');
  const isAM = periodStr.startsWith('a');

  if (hours <= 12) {
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }

  return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${minutes}:${seconds}-05:00`;
}
