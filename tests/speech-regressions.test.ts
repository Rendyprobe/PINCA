import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSpeechCheck } from '@/features/speech/useSpeechCheck';
import { MockSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import { tts } from '@/lib/audio/tts';
import { audioGate } from '@/lib/audio/audioGate';
import { matchSpeech, levenshtein } from '@/lib/speech/matcher';
import { BASE_THRESHOLDS } from '@/config/thresholds';

afterEach(() => {
  tts.cancel();
  audioGate.setCapturing(false);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Speech lifecycle regressions', () => {
  it('settles canceled TTS and suppresses audio during capture', async () => {
    const pending = tts.speak('Contoh pembatalan');
    tts.cancel();
    await pending;
    audioGate.setCapturing(true);
    await tts.speak('Tidak diputar');
    expect(tts.isSpeaking()).toBe(false);
  });

  it('waits for guide completion plus 400 ms before starting recognition', async () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    const start = vi.spyOn(recognizer, 'start');
    const { result } = renderHook(() =>
      useSpeechCheck({ targetText: 'bola', level: 'word', recognizer }),
    );
    const guide = tts.speak('Dengarkan contoh dulu');
    act(() => result.current.startListening());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399);
    });
    expect(start).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    await guide;
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('cancels pending recognition on unmount', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    const start = vi.spyOn(recognizer, 'start');
    const { result, unmount } = renderHook(() =>
      useSpeechCheck({ targetText: 'bola', level: 'word', recognizer }),
    );
    act(() => result.current.startListening());
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(start).not.toHaveBeenCalled();
    expect(audioGate.isCapturing()).toBe(false);
  });

  it('does not count empty sessions as mismatches or switch to practice', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [
      { delayMs: 10, action: (callbacks) => callbacks.onEnd?.() },
    ];
    const { result, rerender } = renderHook(
      ({ targetText }) =>
        useSpeechCheck({ targetText, level: 'word', recognizer }),
      { initialProps: { targetText: 'bola' } },
    );
    for (let i = 0; i < 2; i++) {
      act(() => result.current.startListening());
      act(() => vi.advanceTimersByTime(410));
    }
    expect(result.current.isAssisted).toBe(false);
    expect(result.current.state).toBe('noSpeech');
    expect(result.current.retryCount).toBe(0);
    expect(result.current.emptyCount).toBe(2);
    rerender({ targetText: 'buku' });
    expect(result.current.state).toBe('idle');
    expect(result.current.retryCount).toBe(0);
  });
});

describe('Child-friendly phonetic matching', () => {
  it('counts adjacent transposition as one edit', () =>
    expect(levenshtein('bola', 'bloa')).toBe(1));
  it.each([
    ['a', ['a-pel'], 'letter', 'apel'],
    ['b', ['beh'], 'letter', undefined],
    ['m', ['em'], 'letter', undefined],
    ['ca', ['cha'], 'syllable', undefined],
    ['ke', ['qé'], 'syllable', undefined],
    ['bola', ['sapi', 'meja', 'nasi', 'topi', 'bola'], 'word', undefined],
  ] as const)(
    'accepts %s from phonetic or alternative transcripts',
    (target, heard, level, exampleWord) => {
      expect(
        matchSpeech(
          { target, heard: [...heard], level, exampleWord },
          BASE_THRESHOLDS,
        ).outcome,
      ).toBe('ok');
    },
  );
});
