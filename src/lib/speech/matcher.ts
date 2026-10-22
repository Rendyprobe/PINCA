import type { ThresholdConfig } from '@/config/thresholds';
import type { MatchInput, MatchResult, MatchOutcome } from './types';
import {
  normalizeIdText,
  collapseSpacedLetters,
  phoneticKey,
} from './normalizeId';

/**
 * Jarak Levenshtein standar (DP)
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  const at = (i: number, j: number) => rows[i]?.[j] ?? 0;
  for (let i = 1; i <= a.length; i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        at(i - 1, j) + 1,
        at(i, j - 1) + 1,
        at(i - 1, j - 1) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j] ?? 0, at(i - 2, j - 2) + 1);
      }
    }
  }
  return at(a.length, b.length);
}

/**
 * Rasio kemiripan berbasis edit distance: 0 (berbeda total) hingga 1.0 (identik)
 */
export function similarity(a: string, b: string): number {
  const normA = a.trim();
  const normB = b.trim();
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  return Math.max(0, 1.0 - levenshtein(normA, normB) / maxLen);
}

/**
 * Menghitung jumlah karakter awal target yang tercakup oleh heard (dengan toleransi kesalahan).
 * Digunakan untuk progres pewarnaan bertahap pada hasil interim.
 */
export function commonPrefixFuzzy(
  heard: string,
  target: string,
  tolerance = 1,
): number {
  const normHeard = collapseSpacedLetters(normalizeIdText(heard)).replace(
    /\s+/g,
    '',
  );
  const normTarget = collapseSpacedLetters(normalizeIdText(target)).replace(
    /\s+/g,
    '',
  );

  if (!normHeard || !normTarget) return 0;

  if (normHeard.startsWith(normTarget)) {
    return normTarget.length;
  }

  let matchedChars = 0;

  for (
    let len = 1;
    len <= Math.min(normTarget.length, normHeard.length);
    len++
  ) {
    const targetSub = normTarget.slice(0, len);
    const heardSub = normHeard.slice(0, len);

    // Periksa kesamaan awalan
    const dist = levenshtein(heardSub, targetSub);
    const sim = similarity(heardSub, targetSub);

    // Do not light a whole short syllable for a changed vowel, e.g. ba -> bi.
    const sameVowels =
      (heardSub.match(/[aiueo]/g) ?? []).join('') ===
      (targetSub.match(/[aiueo]/g) ?? []).join('');
    if (
      sameVowels &&
      (dist <= Math.min(tolerance, Math.floor(len / 3)) || sim >= 0.7)
    ) {
      matchedChars = len;
    } else {
      break;
    }
  }

  return matchedChars;
}

/**
 * Perbandingan kemiripan kalimat dengan pencocokan token per kata (LCS / alignment)
 */
function matchSentence(
  heardTokens: string[],
  targetTokens: string[],
): { score: number; matchedWords: number } {
  if (targetTokens.length === 0) return { score: 1.0, matchedWords: 0 };
  if (heardTokens.length === 0) return { score: 0.0, matchedWords: 0 };

  // Weighted sequence alignment preserves word order and penalizes extra words.
  const rows = Array.from({ length: targetTokens.length + 1 }, () =>
    new Array<number>(heardTokens.length + 1).fill(0),
  );
  const at = (i: number, j: number) => rows[i]?.[j] ?? 0;
  for (let i = 1; i <= targetTokens.length; i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 1; j <= heardTokens.length; j++) {
      const target = targetTokens[i - 1] ?? '';
      const heard = heardTokens[j - 1] ?? '';
      const wordScore = Math.max(
        similarity(heard, target),
        similarity(phoneticKey(heard), phoneticKey(target)),
      );
      row[j] = Math.max(
        at(i - 1, j),
        at(i, j - 1),
        at(i - 1, j - 1) + (wordScore >= 0.65 ? wordScore : 0),
      );
    }
  }
  const total = at(targetTokens.length, heardTokens.length);
  return {
    score: total / Math.max(targetTokens.length, heardTokens.length),
    matchedWords: Math.floor(total),
  };
}

/**
 * Mencocokkan transkrip speech recognition dengan target bacaan.
 * Mengikuti spesifikasi GEMINI.md Bagian 5.4, 5.8, dan 20.1.
 */
export function matchSpeech(
  input: MatchInput,
  thresholds: ThresholdConfig,
): MatchResult {
  const normTarget = normalizeIdText(input.target);
  const targetTokens = normTarget.split(/\s+/).filter(Boolean);
  const collapsedTarget = collapseSpacedLetters(normTarget);

  const candidateTargets = [normTarget, collapsedTarget];
  const letterNames: Record<string, string[]> = {
    b: ['be', 'beh'],
    c: ['ce', 'ceh'],
    d: ['de', 'deh'],
    f: ['ef'],
    g: ['ge', 'geh'],
    h: ['ha'],
    j: ['je', 'jeh'],
    k: ['ka', 'keh'],
    l: ['el'],
    m: ['em', 'meh'],
    n: ['en', 'neh'],
    p: ['pe', 'peh'],
    q: ['ki', 'kiu'],
    r: ['er'],
    s: ['es'],
    t: ['te', 'teh'],
    v: ['ve', 'fe'],
    w: ['we'],
    x: ['eks'],
    y: ['ye'],
    z: ['zet'],
  };
  if (input.level === 'letter')
    candidateTargets.push(...(letterNames[normTarget] ?? []));
  if (input.aliases) {
    for (const alias of input.aliases) {
      const normAlias = normalizeIdText(alias);
      if (normAlias && !candidateTargets.includes(normAlias)) {
        candidateTargets.push(normAlias);
      }
    }
  }

  // Jika level huruf, tambahkan strategi kata contoh (Bagian 5.8)
  const candidateExampleWords: string[] = [];
  if (input.level === 'letter' && input.exampleWord) {
    candidateExampleWords.push(normalizeIdText(input.exampleWord));
    if (input.exampleWordAliases) {
      for (const exAlias of input.exampleWordAliases) {
        candidateExampleWords.push(normalizeIdText(exAlias));
      }
    }
  }

  const levelThreshold = thresholds[input.level];
  let bestScore = 0;
  let bestHeardText: string | null = null;
  let bestMatchedVia: MatchResult['matchedVia'] = 'none';

  for (const rawHeard of input.heard) {
    const normHeard =
      input.level === 'letter' &&
      ['em', 'eh', 'ah'].includes(rawHeard.toLowerCase().trim())
        ? rawHeard.toLowerCase().trim()
        : normalizeIdText(rawHeard);
    if (!normHeard) continue;
    const collapsedHeard = collapseSpacedLetters(normHeard);
    const heardTokens = normHeard.split(/\s+/).filter(Boolean);

    // 1. Cek strategi kata contoh untuk huruf (misal anak sebut "apel" untuk 'A')
    if (candidateExampleWords.length > 0) {
      for (const exWord of candidateExampleWords) {
        if (normHeard === exWord || collapsedHeard === exWord) {
          if (1.0 > bestScore) {
            bestScore = 1.0;
            bestHeardText = rawHeard;
            bestMatchedVia = 'exampleWord';
          }
        } else {
          const exSim = similarity(normHeard, exWord);
          if (exSim >= 0.75 && exSim > bestScore) {
            bestScore = exSim;
            bestHeardText = rawHeard;
            bestMatchedVia = 'exampleWord';
          }
        }
      }
    }

    // 2. Cek pencocokan terhadap target dan semua alias
    for (const targetCand of candidateTargets) {
      // 2a. Persis
      if (normHeard === targetCand || collapsedHeard === targetCand) {
        if (1.0 > bestScore) {
          bestScore = 1.0;
          bestHeardText = rawHeard;
          bestMatchedVia = targetCand === normTarget ? 'exact' : 'alias';
        }
        continue;
      }

      // 2b. Kalimat: kecocokan token per kata
      if (input.level === 'sentence' || targetTokens.length > 1) {
        const sentenceMatch = matchSentence(
          heardTokens,
          targetCand.split(/\s+/).filter(Boolean),
        );
        if (sentenceMatch.score > bestScore) {
          bestScore = sentenceMatch.score;
          bestHeardText = rawHeard;
          bestMatchedVia = sentenceMatch.score >= 0.95 ? 'exact' : 'fuzzy';
        }
      } else {
        // 2c. Kata / Suku Kata / Huruf: similarity edit distance
        const phonHeard = phoneticKey(normHeard);
        const phonTarget = phoneticKey(targetCand);
        const shortUnit =
          input.level === 'letter' ||
          input.level === 'syllable' ||
          normTarget.length <= 3;
        // Explicit aliases remain authoritative; fuzzy short units must preserve vowels.
        if (
          shortUnit &&
          (phonHeard.match(/[aiueo]/g) ?? []).join('') !==
            (phonTarget.match(/[aiueo]/g) ?? []).join('')
        )
          continue;
        const vowelMismatch =
          (phonHeard.match(/[aiueo]/g) ?? []).join('') !==
          (phonTarget.match(/[aiueo]/g) ?? []).join('');
        const scoreCeiling =
          input.level === 'word' && vowelMismatch
            ? Math.max(0, levelThreshold.pass - 0.01)
            : 1;
        const directSim = Math.min(
          scoreCeiling,
          Math.max(
            similarity(normHeard, targetCand),
            similarity(collapsedHeard, targetCand),
          ),
        );

        if (directSim > bestScore) {
          bestScore = directSim;
          bestHeardText = rawHeard;
          bestMatchedVia = 'fuzzy';
        }

        // 2d. Kesamaan Fonetik
        const phonSim = Math.min(
          scoreCeiling,
          similarity(phonHeard, phonTarget),
        );

        if (phonSim > bestScore) {
          bestScore = phonSim;
          bestHeardText = rawHeard;
          bestMatchedVia = 'phonetic';
        }
      }
    }
  }

  // Tentukan outcome berdasarkan ambang
  let outcome: MatchOutcome = 'miss';
  if (bestScore >= levelThreshold.pass) {
    outcome = 'ok';
  } else if (bestScore >= levelThreshold.almost) {
    outcome = 'almost';
  }

  // Hitung prefix characters untuk pewarnaan interim
  const effectiveHeard = bestHeardText ?? input.heard[0] ?? '';
  let matchedPrefixChars = commonPrefixFuzzy(effectiveHeard, normTarget);

  if (outcome === 'ok') {
    matchedPrefixChars = normTarget.length;
  }

  return {
    score: Math.round(bestScore * 100) / 100,
    outcome,
    bestHeard: bestHeardText,
    matchedPrefixChars,
    matchedVia: bestMatchedVia,
  };
}
