import { describe, it, expect } from 'vitest';
import {
  getSyllables,
  getZone3Words,
  getAllWords,
  getZone2Lessons,
  getZone3Lessons,
} from '@/content';

describe('Zone 2 & Zone 3 Curriculum Data Integrity', () => {
  it('contains at least 80 open KV syllables in syllables.json', () => {
    const syllables = getSyllables();
    expect(syllables.length).toBeGreaterThanOrEqual(80);

    syllables.forEach((s) => {
      expect(s.level).toBe('syllable');
      expect(s.letters.length).toBe(2);
      expect(s.text).toBe(s.letters.join(''));
      expect(s.id).toMatch(/^syl_/);
    });
  });

  it('contains at least 40 KV-KV illustrated words in Zone 3', () => {
    const zone3Words = getZone3Words();
    expect(zone3Words.length).toBeGreaterThanOrEqual(40);

    zone3Words.forEach((w) => {
      expect(w.level).toBe('word');
      expect(w.syllables.length).toBeGreaterThanOrEqual(1);
      // Syllables must strictly match text
      expect(w.syllables.join('').toLowerCase()).toBe(w.text.toLowerCase());
      // Image and alt must exist
      expect(w.image).toBeDefined();
      expect(w.image?.alt.length).toBeGreaterThan(0);
      expect(w.image?.value.length).toBeGreaterThan(0);
    });
  });

  it('validates Zone 2 lessons item references', () => {
    const z2Lessons = getZone2Lessons();
    const syllables = getSyllables();
    const sylIdSet = new Set(syllables.map((s) => s.id));

    expect(z2Lessons.length).toBeGreaterThanOrEqual(6);

    z2Lessons.forEach((ls) => {
      expect(ls.zoneId).toBe('zone_2');
      expect(ls.itemIds.length).toBeGreaterThanOrEqual(1);
      ls.itemIds.forEach((id) => {
        expect(sylIdSet.has(id)).toBe(true);
      });
    });
  });

  it('validates Zone 3 lessons item references', () => {
    const z3Lessons = getZone3Lessons();
    const allWords = getAllWords();
    const wordIdSet = new Set(allWords.map((w) => w.id));

    expect(z3Lessons.length).toBeGreaterThanOrEqual(6);

    z3Lessons.forEach((ls) => {
      expect(ls.zoneId).toBe('zone_3');
      expect(ls.itemIds.length).toBeGreaterThanOrEqual(1);
      ls.itemIds.forEach((id) => {
        expect(wordIdSet.has(id)).toBe(true);
      });
    });
  });
});

