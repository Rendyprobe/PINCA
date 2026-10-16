import { describe, it, expect } from 'vitest';
import {
  levenshtein,
  similarity,
  commonPrefixFuzzy,
  matchSpeech,
} from '@/lib/speech/matcher';
import {
  normalizeIdText,
  phoneticKey,
  collapseSpacedLetters,
} from '@/lib/speech/normalizeId';
import { BASE_THRESHOLDS, getThresholdsForMode } from '@/config/thresholds';

describe('Speech Normalization & Phonetics', () => {
  it('normalizes punctuation, case, and fillers', () => {
    expect(normalizeIdText('  Eh... BOLA!? ')).toBe('bola');
    expect(normalizeIdText('Hmm adik, minum susu.')).toBe('adik minum susu');
    expect(normalizeIdText('ada 1 bola')).toBe('ada satu bola');
  });

  it('collapses single spaced letters', () => {
    expect(collapseSpacedLetters('i b u')).toBe('ibu');
    expect(collapseSpacedLetters('b o l a')).toBe('bola');
    expect(collapseSpacedLetters('ibu beli bola')).toBe('ibu beli bola');
  });

  it('generates consistent phonetic keys', () => {
    expect(phoneticKey('syal')).toBe('sal');
    expect(phoneticKey('khusus')).toBe('kusus');
    expect(phoneticKey('variasi')).toBe('fariasi');
    expect(phoneticKey('zaman')).toBe('jaman');
  });
});

describe('Levenshtein Distance & Similarity', () => {
  it('computes exact distance and similarity', () => {
    expect(levenshtein('bola', 'bola')).toBe(0);
    expect(similarity('bola', 'bola')).toBe(1.0);

    expect(levenshtein('bola', 'pola')).toBe(1);
    expect(similarity('bola', 'pola')).toBe(0.75);

    expect(similarity('kucing', 'sepatu')).toBeLessThan(0.4);
  });
});

describe('Fuzzy Common Prefix (Interim Monotonic Lighting)', () => {
  it('matches prefix progressively and monotonically', () => {
    const target = 'bola';
    const prefix1 = commonPrefixFuzzy('b', target);
    const prefix2 = commonPrefixFuzzy('bo', target);
    const prefix3 = commonPrefixFuzzy('bol', target);
    const prefix4 = commonPrefixFuzzy('bola', target);

    expect(prefix1).toBeGreaterThanOrEqual(1);
    expect(prefix2).toBeGreaterThanOrEqual(prefix1);
    expect(prefix3).toBeGreaterThanOrEqual(prefix2);
    expect(prefix4).toBe(4);
  });

  it('tolerates minor space or interim fluctuations', () => {
    expect(commonPrefixFuzzy('bo la', 'bola')).toBe(4);
    expect(commonPrefixFuzzy('b o', 'bola')).toBeGreaterThanOrEqual(2);
  });
});

describe('Speech Matcher by Curriculum Level', () => {
  const normalThresholds = BASE_THRESHOLDS;
  const easyThresholds = getThresholdsForMode('easy');

  describe('Word Level', () => {
    it('recognizes exact match as ok with score 1.0', () => {
      const res = matchSpeech(
        {
          target: 'bola',
          heard: ['bola'],
          level: 'word',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('ok');
      expect(res.score).toBe(1.0);
      expect(res.matchedPrefixChars).toBe(4);
    });

    it('recognizes spaced speech (e.g. "bo la")', () => {
      const res = matchSpeech(
        {
          target: 'bola',
          heard: ['bo la'],
          level: 'word',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('ok');
      expect(res.score).toBeGreaterThanOrEqual(normalThresholds.word.pass);
    });

    it('recognizes accepted aliases from curriculum JSON', () => {
      const res = matchSpeech(
        {
          target: 'ibu',
          aliases: ['ibuh', 'i bu', 'ibu ibu'],
          heard: ['ibuh'],
          level: 'word',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('ok');
      expect(res.matchedVia).toBe('alias');
    });

    it('detects "almost" for close pronunciations', () => {
      const res = matchSpeech(
        {
          target: 'sepeda',
          heard: ['sepedxxx'], // Similarity 0.625: above almost and below the new 0.65 pass threshold.
          level: 'word',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('almost');
      expect(res.score).toBeGreaterThanOrEqual(normalThresholds.word.almost);
      expect(res.score).toBeLessThan(normalThresholds.word.pass);
    });

    it('returns "miss" for completely different words', () => {
      const res = matchSpeech(
        {
          target: 'buku',
          heard: ['sapi'],
          level: 'word',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('miss');
      expect(res.score).toBeLessThan(normalThresholds.word.almost);
    });
  });

  describe('Single Letter Strategy', () => {
    it('accepts letter name (e.g. "be" for letter "b")', () => {
      const res = matchSpeech(
        {
          target: 'b',
          aliases: ['be', 'bé'],
          heard: ['be'],
          level: 'letter',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('ok');
    });

    it('accepts example word for single letter (GEMINI.md Bagian 5.8)', () => {
      const res = matchSpeech(
        {
          target: 'a',
          exampleWord: 'apel',
          exampleWordAliases: ['apel merah'],
          heard: ['apel'],
          level: 'letter',
        },
        easyThresholds
      );
      expect(res.outcome).toBe('ok');
      expect(res.matchedVia).toBe('exampleWord');
    });
  });

  describe('Sentence Level', () => {
    it('accurately scores multi-word sentences', () => {
      const res = matchSpeech(
        {
          target: 'ibu masak nasi',
          heard: ['ibu masak nasi'],
          level: 'sentence',
        },
        normalThresholds
      );
      expect(res.outcome).toBe('ok');
      expect(res.score).toBe(1.0);
    });

    it('handles minor missing words with proportional score', () => {
      const res = matchSpeech(
        {
          target: 'ibu masak nasi',
          heard: ['ibu masak'], // 2 of 3 words
          level: 'sentence',
        },
        normalThresholds
      );
      expect(res.score).toBeGreaterThanOrEqual(0.6);
      expect(res.outcome).toBe('almost');
    });
  });
});
