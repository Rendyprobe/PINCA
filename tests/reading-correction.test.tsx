import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { matchSpeech, commonPrefixFuzzy } from '@/lib/speech/matcher';
import { getThresholdsForMode } from '@/config/thresholds';
import { useSpeechCheck } from '@/features/speech/useSpeechCheck';
import { MockSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import { tts } from '@/lib/audio/tts';
import { audioGate } from '@/lib/audio/audioGate';

const easy = getThresholdsForMode('easy');
afterEach(() => {
  tts.cancel();
  audioGate.setCapturing(false);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Reading correction instead of automatic approval', () => {
  it.each([
    ['ba', 'bi'],
    ['bu', 'bo'],
    ['i', 'u'],
    ['ibu', 'aba'],
    ['bola', 'bula'],
  ])('does not pass %s when hearing %s', (target, heard) => {
    const level =
      target.length === 1 ? 'letter' : target.length <= 2 ? 'syllable' : 'word';
    expect(
      matchSpeech({ target, heard: [heard], level }, easy).outcome,
    ).not.toBe('ok');
    expect(commonPrefixFuzzy(heard, target)).toBeLessThan(target.length);
  });

  it('still accepts an explicit curriculum alias and phonetic ch/c variation', () => {
    expect(
      matchSpeech({ target: 'ca', heard: ['cha'], level: 'syllable' }, easy)
        .outcome,
    ).toBe('ok');
    expect(
      matchSpeech(
        { target: 'ibu', aliases: ['ibuh'], heard: ['ibuh'], level: 'word' },
        easy,
      ).outcome,
    ).toBe('ok');
  });

  it('respects sentence order and penalizes extra spoken words', () => {
    const input = { target: 'ibu masak nasi', level: 'sentence' as const };
    expect(
      matchSpeech({ ...input, heard: ['nasi masak ibu'] }, easy).outcome,
    ).not.toBe('ok');
    expect(
      matchSpeech({ ...input, heard: ['ibu masak nasi'] }, easy).score,
    ).toBe(1);
    expect(
      matchSpeech(
        { ...input, heard: ['ibu masak nasi lalu adik bermain bola'] },
        easy,
      ).outcome,
    ).not.toBe('ok');
  });

  it('does not activate a microphone disabled by settings', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    const start = vi.spyOn(recognizer, 'start');
    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'ba',
        level: 'syllable',
        recognizer,
        micEnabled: false,
      }),
    );
    act(() => {
      result.current.startListening();
      vi.advanceTimersByTime(1000);
    });
    expect(start).not.toHaveBeenCalled();
    expect(result.current.issue).toBe('disabled');
  });

  it('allows a fresh microphone attempt after permission denial without passing the item', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [
      {
        delayMs: 10,
        action: (cb) => cb.onError?.('not-allowed', 'Permission denied'),
      },
    ];
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'ba',
        level: 'syllable',
        recognizer,
        onSuccess,
      }),
    );
    act(() => result.current.startListening());
    act(() => vi.advanceTimersByTime(420));
    expect(result.current.issue).toBe('not-allowed');
    expect(result.current.state).toBe('speechError');
    expect(result.current.isFallbackTap).toBe(false);
    act(() => result.current.retryMicrophone());
    expect(result.current.state).toBe('idle');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('aborts a pending microphone when the page is hidden', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    const start = vi.spyOn(recognizer, 'start');
    const { result } = renderHook(() =>
      useSpeechCheck({ targetText: 'ba', level: 'syllable', recognizer }),
    );
    act(() => result.current.startListening());
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    act(() => vi.advanceTimersByTime(1000));
    expect(start).not.toHaveBeenCalled();
    expect(audioGate.isCapturing()).toBe(false);
  });
});
