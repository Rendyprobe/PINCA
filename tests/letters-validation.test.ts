import { describe, it, expect } from 'vitest';
import { getLetters, getZone1Words, getZone1Lessons } from '@/content';

describe('Zone 1 Letters & Lessons Integrity', () => {
  it('contains exactly 26 letters from a to z', () => {
    const letters = getLetters();
    expect(letters).toHaveLength(26);

    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const letterChars = letters.map((l) => l.text);
    expect(letterChars).toEqual(alphabet);
  });

  it('ensures every letter references a valid example word', () => {
    const letters = getLetters();
    const words = getZone1Words();
    const wordIdSet = new Set(words.map((w) => w.id));

    letters.forEach((l) => {
      expect(wordIdSet.has(l.exampleWordId)).toBe(true);
      expect(l.upper).toBe(l.text.toUpperCase());
      expect(l.lower).toBe(l.text.toLowerCase());
      expect(l.soundTts.length).toBeGreaterThan(0);
      expect(l.nameTts.length).toBeGreaterThan(0);
    });
  });

  it('verifies all Zone 1 lessons reference existing letters', () => {
    const lessons = getZone1Lessons();
    const letters = getLetters();
    const letterIdSet = new Set(letters.map((l) => l.id));

    expect(lessons.length).toBeGreaterThanOrEqual(6);

    lessons.forEach((ls) => {
      expect(ls.zoneId).toBe('zone_1');
      expect(ls.activities.length).toBeGreaterThanOrEqual(1);
      ls.itemIds.forEach((id) => {
        expect(letterIdSet.has(id)).toBe(true);
      });
    });
  });
});

