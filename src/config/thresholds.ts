import type { Level } from '@/types/content';

export interface LevelThreshold {
  pass: number;
  almost: number;
}

export type DifficultyMode = 'easy' | 'normal' | 'strict';

export type ThresholdConfig = Record<Level, LevelThreshold>;

// Ambang dasar (Normal) sesuai GEMINI.md Bagian 5.4
export const BASE_THRESHOLDS: ThresholdConfig = {
  letter: { pass: 0.45, almost: 0.35 },
  syllable: { pass: 0.55, almost: 0.45 },
  word: { pass: 0.65, almost: 0.55 },
  sentence: { pass: 0.75, almost: 0.6 },
  story: { pass: 0.65, almost: 0.55 },
};

/**
 * Mengembalikan ambang kecocokan yang disesuaikan dengan mode kesulitan.
 * Mode Mudah: pass/almost - 0.10 (Default untuk anak 5 tahun).
 * Mode Ketat: pass/almost + 0.05.
 */
export function getThresholdsForMode(mode: DifficultyMode): ThresholdConfig {
  const delta = mode === 'easy' ? -0.1 : mode === 'strict' ? 0.05 : 0;

  const adjusted: Partial<ThresholdConfig> = {};
  for (const [key, val] of Object.entries(BASE_THRESHOLDS)) {
    const level = key as Level;
    adjusted[level] = {
      pass: Math.max(0.1, Math.min(1.0, val.pass + delta)),
      almost: Math.max(0.05, Math.min(1.0, val.almost + delta)),
    };
  }

  return adjusted as ThresholdConfig;
}
