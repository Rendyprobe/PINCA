import { describe, it, expect } from 'vitest';
import {
  wordItemSchema,
  imageRefSchema,
  zonesFileSchema,
  feedbackFileSchema,
} from '@/content/schema';
import zonesData from '@/content/zones.json';
import feedbackData from '@/content/feedback.json';

describe('Content Validation Schemas', () => {
  it('validates zones.json structure', () => {
    const zones = zonesFileSchema.parse(zonesData);
    expect(zones).toHaveLength(6);
    expect(zones[0]?.id).toBe('zone_1');
    expect(zones[0]?.order).toBe(1);
    expect(zones[5]?.id).toBe('zone_6');
  });

  it('validates feedback.json structure', () => {
    const feedback = feedbackFileSchema.parse(feedbackData);
    expect(feedback.praises.length).toBeGreaterThanOrEqual(8);
    expect(feedback.encouragements.length).toBeGreaterThanOrEqual(6);
    expect(feedback.hints.length).toBeGreaterThanOrEqual(4);
  });

  it('validates word item syllables must match text', () => {
    // Valid case
    const validWord = {
      id: 'w_ibu',
      level: 'word',
      text: 'ibu',
      syllables: ['i', 'bu'],
      imageRequired: true,
      difficulty: 1,
    };
    expect(() => wordItemSchema.parse(validWord)).not.toThrow();

    // Invalid case: syllables do not match text
    const invalidWord = {
      id: 'w_bola',
      level: 'word',
      text: 'bola',
      syllables: ['bo', 'ku'], // Mismatch!
      imageRequired: true,
      difficulty: 1,
    };
    expect(() => wordItemSchema.parse(invalidWord)).toThrow();
  });

  it('requires alt text for ImageRef', () => {
    const validImg = {
      type: 'emoji',
      value: '🍎',
      alt: 'apel manis',
    };
    expect(() => imageRefSchema.parse(validImg)).not.toThrow();

    const invalidImg = {
      type: 'emoji',
      value: '🍎',
      alt: '', // Empty alt is not allowed
    };
    expect(() => imageRefSchema.parse(invalidImg)).toThrow();
  });
});

