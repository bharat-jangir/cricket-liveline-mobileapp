/**
 * score.ts
 * 
 * Client-side utilities to intelligently merge socket live score and overs updates
 * with REST-loaded multi-inning (e.g. Test match) values, preventing live updates
 * from overwriting completed innings or displaying empty placeholders (like "—/—").
 */

/**
 * Parses the leading run count from a score string.
 * E.g., "112/2" -> 112, "140" -> 140, "0/0" -> 0, "112 (16.8)" -> 112.
 */
export function parseRuns(scoreStr: string | null | undefined): number | null {
  if (!scoreStr) return null;
  const cleanStr = String(scoreStr).trim();
  const match = cleanStr.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Parses the leading overs count as a float.
 * E.g., "16.8" -> 16.8, "40" -> 40, "0.0" -> 0.
 */
export function parseOvers(oversStr: string | null | undefined): number | null {
  if (!oversStr) return null;
  const cleanStr = String(oversStr).trim();
  const match = cleanStr.match(/^([\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Checks if a value represents a placeholder or empty string.
 */
function isPlaceholder(val: string | null | undefined): boolean {
  if (!val) return true;
  const clean = String(val).trim();
  return clean === '' || clean === '—' || clean === '—/—' || clean === '-/-' || clean === '-';
}

/**
 * Merges the socket score update with the REST-loaded score.
 * 
 * Rules:
 * 1. If socketScore is empty or a placeholder (like "—/—"), keep restScore (prevents wiping non-batting team scores).
 * 2. If restScore is empty or a placeholder, use socketScore.
 * 3. Split restScore by " & " to extract previous/completed inning scores.
 * 4. Compare the runs of socketScore with the last part of restScore.
 * 5. If socketRuns < lastRestRuns, it indicates a brand-new inning has started for this team.
 *    Append the socketScore (e.g., "140" & "0/0" -> "140 & 0/0").
 * 6. Otherwise, it is an update to the current active inning. Replace the last part of restScore with socketScore.
 */
export function mergeTeamScore(
  restScore: string | number | null | undefined,
  socketScore: string | number | null | undefined
): string {
  const restStr = restScore !== null && restScore !== undefined ? String(restScore).trim() : '';
  const socketStr = socketScore !== null && socketScore !== undefined ? String(socketScore).trim() : '';

  if (isPlaceholder(socketStr)) {
    return restStr;
  }
  if (isPlaceholder(restStr)) {
    return socketStr;
  }

  const restParts = restStr.split(' & ');
  const lastRestPart = restParts[restParts.length - 1];

  const socketRuns = parseRuns(socketStr);
  const lastRestRuns = parseRuns(lastRestPart);

  // If both run counts can be parsed, and socket score is less, it's a new inning
  if (socketRuns !== null && lastRestRuns !== null && socketRuns < lastRestRuns) {
    return `${restStr} & ${socketStr}`;
  }

  // Otherwise, it's an update to the current/active inning
  restParts[restParts.length - 1] = socketStr;
  return restParts.join(' & ');
}

/**
 * Merges the socket overs update with the REST-loaded overs.
 * 
 * Rules:
 * 1. If socketOvers is empty or a placeholder, keep restOvers.
 * 2. If restOvers is empty or a placeholder, use socketOvers.
 * 3. Split restOvers by " & " to handle multi-innings.
 * 4. Compare the overs count. If socketOvers < lastRestOvers, it indicates a new inning has started.
 *    Append the socketOvers (e.g., "40 & 0.2").
 * 5. Otherwise, replace the last part of restOvers with socketOvers.
 */
export function mergeTeamOvers(
  restOvers: string | number | null | undefined,
  socketOvers: string | number | null | undefined
): string {
  const restStr = restOvers !== null && restOvers !== undefined ? String(restOvers).trim() : '';
  const socketStr = socketOvers !== null && socketOvers !== undefined ? String(socketOvers).trim() : '';

  if (isPlaceholder(socketStr)) {
    return restStr;
  }
  if (isPlaceholder(restStr)) {
    return socketStr;
  }

  const restParts = restStr.split(' & ');
  const lastRestPart = restParts[restParts.length - 1];

  const socketVal = parseOvers(socketStr);
  const lastRestVal = parseOvers(lastRestPart);

  if (socketVal !== null && lastRestVal !== null && socketVal < lastRestVal) {
    return `${restStr} & ${socketStr}`;
  }

  restParts[restParts.length - 1] = socketStr;
  return restParts.join(' & ');
}

/**
 * Balls per over for a match. The Hundred is played in 5-ball sets; everything else uses the
 * match setting (default 6). Child components that format "over.ball" read `matchBallsPerOver.value`.
 */
export const matchBallsPerOver = { value: 6 };

export function ballsPerOverOf(match: any, liveStatus?: any): number {
  const fmt = String(liveStatus?.format || match?.matchFormat || '').toLowerCase();
  if (fmt === 'hundred' || fmt === '100b') return 5;
  const n = Number(liveStatus?.ballsPerOver || match?.ballsPerOver);
  return n > 0 ? n : 6;
}

export function isHundredMatch(match: any, liveStatus?: any): boolean {
  const fmt = String(liveStatus?.format || match?.matchFormat || '').toLowerCase();
  return fmt === 'hundred' || fmt === '100b';
}

const FORMAT_NAMES: Record<string, string> = { T20: 'T20', T20I: 'T20I', ODI: 'ODI', TEST: 'Test', T10: 'T10', HUNDRED: 'The Hundred', '100B': 'The Hundred' };
export function formatLabelFromApi(f?: string): string {
  const k = String(f || '').toUpperCase();
  return FORMAT_NAMES[k] || k || 'Match';
}
