import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { matchSpeech } from '@/lib/speech/matcher';
import { getThresholdsForMode } from '@/config/thresholds';
import { useSpeechCheck } from '@/features/speech/useSpeechCheck';
import { MockSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import { SpeechReadCheck } from '@/features/activities/SpeechReadCheck/SpeechReadCheck';
import { KaraokeRead } from '@/features/activities/KaraokeRead/KaraokeRead';
import type { SentenceItem } from '@/types/content';
import { tts } from '@/lib/audio/tts';
import { audioGate } from '@/lib/audio/audioGate';

const mockSentence: SentenceItem = {
  id: 's_test_ini_bola',
  level: 'sentence',
  text: 'Ini bola.',
  words: ['Ini', 'bola'],
  punctuation: '.',
  difficulty: 1,
  tags: ['benda'],
};

const mockSentenceLong: SentenceItem = {
  id: 's_test_ibu_masak',
  level: 'sentence',
  text: 'Ibu masak nasi.',
  words: ['Ibu', 'masak', 'nasi'],
  punctuation: '.',
  difficulty: 1,
  tags: ['keluarga'],
};

describe('Sentence Speech Matching', () => {
  const easy = getThresholdsForMode('easy');
  const normal = getThresholdsForMode('normal');

  it('matches exact sentence with punctuation in target', () => {
    const res = matchSpeech(
      {
        target: 'Ini bola.',
        heard: ['ini bola'],
        level: 'sentence',
      },
      normal,
    );
    expect(res.outcome).toBe('ok');
    expect(res.score).toBeGreaterThanOrEqual(0.75);
    expect(res.matchedVia).toBe('exact');
  });

  it('matches 3-word sentence with slight speech variation', () => {
    const res = matchSpeech(
      {
        target: 'Ibu masak nasi.',
        heard: ['ibu masak nasi'],
        level: 'sentence',
      },
      easy,
    );
    expect(res.outcome).toBe('ok');
    expect(res.score).toBe(1.0);
  });

  it('matches sentence with minor child phonetic variations', () => {
    const res = matchSpeech(
      {
        target: 'Ini bola.',
        heard: ['ini bolah'],
        level: 'sentence',
      },
      easy,
    );
    expect(res.outcome).toBe('ok');
    expect(res.score).toBeGreaterThanOrEqual(0.65);
  });
});

describe('useSpeechCheck on sentences', () => {
  beforeEach(() => {
    vi.spyOn(tts, 'speak').mockResolvedValue();
    vi.useRealTimers();
  });

  afterEach(() => {
    tts.cancel();
    audioGate.setCapturing(false);
    vi.restoreAllMocks();
  });

  it('recognizes whole sentence even when readingMode is syllable-by-syllable', async () => {
    const recognizer = new MockSpeechRecognizer(true);
    recognizer.simulateScript = [
      {
        delayMs: 30,
        action: (cb) => {
          cb.onFinal?.(['ini bola']);
        },
      },
    ];
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'Ini bola.',
        syllables: ['Ini', 'bola'],
        level: 'sentence',
        readingMode: 'syllable-by-syllable', // Default user setting
        recognizer,
        onSuccess,
      }),
    );

    act(() => {
      result.current.startListening();
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 550));
    });

    expect(result.current.state).toBe('success');
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.units.every((u) => u.status === 'done')).toBe(true);
  });
});

describe('SpeechReadCheck with SentenceItem', () => {
  beforeEach(() => {
    vi.spyOn(tts, 'speak').mockResolvedValue();
  });

  afterEach(() => {
    tts.cancel();
    audioGate.setCapturing(false);
    vi.restoreAllMocks();
  });

  it('renders sentence cards, prompt, and handles speech completion', async () => {
    const recognizer = new MockSpeechRecognizer(true);
    recognizer.simulateScript = [
      {
        delayMs: 30,
        action: (cb) => {
          cb.onFinal?.(['ibu masak nasi']);
        },
      },
    ];
    const onComplete = vi.fn();

    render(
      <SpeechReadCheck
        items={[mockSentenceLong]}
        recognizer={recognizer}
        onComplete={onComplete}
      />,
    );

    // Sentence words should be rendered
    expect(screen.getByText('Ibu')).toBeInTheDocument();
    expect(screen.getByText('masak')).toBeInTheDocument();
    expect(screen.getByText('nasi')).toBeInTheDocument();

    // Eyebrow should specify Kalimat
    expect(
      screen.getByText(/CEK BACAAN KALIMAT BERSAMA BU DELIA/i),
    ).toBeInTheDocument();

    // Reading target prompt should show the complete sentence
    expect(screen.getByText(/Baca kalimat:/i)).toBeInTheDocument();

    // Start speech recognition
    const micButton = screen.getByRole('button', {
      name: /mulai membaca kalimat/i,
    });
    fireEvent.click(micButton);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 550));
    });

    expect(screen.getByText(/Sudah cocok! Bacaanmu selesai/i)).toBeInTheDocument();
  });
});

describe('KaraokeRead with SentenceItem and Mic', () => {
  beforeEach(() => {
    vi.spyOn(tts, 'speak').mockResolvedValue();
  });

  afterEach(() => {
    tts.cancel();
    audioGate.setCapturing(false);
    vi.restoreAllMocks();
  });

  it('renders sentence words and provides interactive Cek Suara (Mic) button', () => {
    const onComplete = vi.fn();

    render(
      <KaraokeRead
        items={[mockSentence]}
        onComplete={onComplete}
        settings={{
          readingMode: 'syllables',
          difficultyThreshold: 'easy',
          ttsRate: 0.8,
          fontSize: 'medium',
          fontFamily: 'default',
          soundEnabled: true,
          micEnabled: true,
        }}
      />,
    );

    expect(screen.getByText('Ini')).toBeInTheDocument();
    expect(screen.getByText('bola')).toBeInTheDocument();

    // Interactive Mic Check button is available!
    const micBtn = screen.getByRole('button', {
      name: /cek suaraku dengan mikrofon/i,
    });
    expect(micBtn).toBeInTheDocument();

    // Advance button is available
    expect(
      screen.getByRole('button', { name: /aku bisa! lanjut/i }),
    ).toBeInTheDocument();
  });
});
