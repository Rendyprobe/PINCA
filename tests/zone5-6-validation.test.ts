import { describe, it, expect } from 'vitest';
import {
  getSentences,
  getStories,
  getZone5Lessons,
  getZone6Lessons,
  getLessonById,
  getItemById,
} from '@/content';

describe('Zone 5 & 6 Curriculum Data Integrity', () => {
  it('validates Zone 5 sentences integrity', () => {
    const sentences = getSentences();
    expect(sentences.length).toBeGreaterThanOrEqual(18);

    sentences.forEach((s) => {
      expect(s.level).toBe('sentence');
      expect(s.words.length).toBeGreaterThanOrEqual(2);
      expect(s.text.length).toBeGreaterThan(0);
      expect(s.punctuation).toMatch(/[.?!]/);
      expect(s.id).toMatch(/^s_/);
    });
  });

  it('validates Zone 5 lessons and item references', () => {
    const z5Lessons = getZone5Lessons();
    const sentences = getSentences();
    const sentenceIdSet = new Set(sentences.map((s) => s.id));

    expect(z5Lessons.length).toBeGreaterThanOrEqual(6);

    z5Lessons.forEach((ls) => {
      expect(ls.zoneId).toBe('zone_5');
      expect(ls.itemIds.length).toBeGreaterThanOrEqual(1);
      ls.itemIds.forEach((id) => {
        expect(sentenceIdSet.has(id)).toBe(true);
        const item = getItemById(id);
        expect(item).toBeDefined();
        expect(item?.level).toBe('sentence');
      });
    });
  });

  it('validates Zone 6 mini-stories integrity', () => {
    const stories = getStories();
    const sentences = getSentences();
    const sentenceIdSet = new Set(sentences.map((s) => s.id));

    expect(stories.length).toBeGreaterThanOrEqual(3);

    stories.forEach((st) => {
      expect(st.level).toBe('story');
      expect(st.title.length).toBeGreaterThan(0);
      expect(st.pages.length).toBeGreaterThanOrEqual(2);
      expect(st.questions.length).toBeGreaterThanOrEqual(2);

      // Verify all page sentences exist
      st.pages.forEach((page) => {
        expect(page.sentenceIds.length).toBeGreaterThanOrEqual(1);
        page.sentenceIds.forEach((sid) => {
          expect(sentenceIdSet.has(sid)).toBe(true);
        });
        expect(page.illustration).toBeDefined();
        expect(page.illustration.value.length).toBeGreaterThan(0);
      });

      // Verify questions
      st.questions.forEach((q) => {
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(q.options.length);
      });
    });
  });

  it('validates Zone 6 lessons and item references', () => {
    const z6Lessons = getZone6Lessons();
    const stories = getStories();
    const storyIdSet = new Set(stories.map((st) => st.id));

    expect(z6Lessons.length).toBeGreaterThanOrEqual(3);

    z6Lessons.forEach((ls) => {
      expect(ls.zoneId).toBe('zone_6');
      expect(ls.itemIds.length).toBeGreaterThanOrEqual(1);
      ls.itemIds.forEach((id) => {
        expect(storyIdSet.has(id)).toBe(true);
      });

      expect(ls.activities).toHaveLength(1);
      expect(ls.activities[0]?.type).toBe('story_reader');
    });
  });

  it('retrieves lessons and items correctly from root index', () => {
    const l5 = getLessonById('l5_1');
    expect(l5).toBeDefined();
    expect(l5?.zoneId).toBe('zone_5');

    const l6 = getLessonById('l6_1');
    expect(l6).toBeDefined();
    expect(l6?.zoneId).toBe('zone_6');

    const storyItem = getItemById('story_kelinci_sahabat');
    expect(storyItem).toBeDefined();
  });
});

