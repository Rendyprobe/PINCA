import { describe, it, expect } from 'vitest';
import { progressService } from '@/lib/progress/progressService';

describe('Progress Service', () => {
  it('calculates mastery correctly based on recent outcomes', () => {
    // Empty outcomes
    expect(progressService.calculateMastery([])).toBe(0);

    // All successful outcomes -> 1.0
    expect(progressService.calculateMastery(['ok', 'ok', 'ok'])).toBe(1.0);

    // Mixed outcomes
    const mixed = progressService.calculateMastery(['miss', 'almost', 'ok']);
    expect(mixed).toBeGreaterThan(0.5);
    expect(mixed).toBeLessThan(1.0);
  });

  it('calculates 3 stars for high accuracy and minimal hints', () => {
    const stars = progressService.calculateStars(['ok', 'ok', 'ok', 'ok', 'ok'], 0);
    expect(stars).toBe(3);
  });

  it('calculates 2 stars for moderate accuracy', () => {
    const stars = progressService.calculateStars(['ok', 'ok', 'ok', 'almost', 'miss'], 2);
    expect(stars).toBe(2);
  });

  it('awards at least 1 star for assisted completion (zero failure principle)', () => {
    const stars = progressService.calculateStars(['assisted', 'assisted'], 4);
    expect(stars).toBe(1);
  });
});

