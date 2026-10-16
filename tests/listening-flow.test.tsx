import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { SpeechReadCheck } from '@/features/activities/SpeechReadCheck/SpeechReadCheck';
import { useSpeechCheck } from '@/features/speech/useSpeechCheck';
import { MockSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import { tts } from '@/lib/audio/tts';
import { audioGate } from '@/lib/audio/audioGate';
import type { WordItem } from '@/types/content';

const word: WordItem = {
  id: 'w_ibu',
  text: 'ibu',
  level: 'word',
  difficulty: 1,
  syllables: ['i', 'bu'],
  imageRequired: false,
};
const mediaDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  'mediaDevices',
);
afterEach(() => {
  tts.cancel();
  audioGate.setCapturing(false);
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (mediaDescriptor)
    Object.defineProperty(navigator, 'mediaDevices', mediaDescriptor);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('Listening and reading are different stages', () => {
  it('completes the activity as verified when the displayed final transcript matches the whole word', async () => {
    vi.useFakeTimers();
    vi.spyOn(tts, 'speak').mockResolvedValue();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [
      { delayMs: 10, action: (cb) => cb.onInterim?.('ibu') },
      { delayMs: 20, action: (cb) => cb.onFinal?.(['Ibu.']) },
    ];
    const onComplete = vi.fn();
    render(
      <SpeechReadCheck
        item={word}
        readingMode="syllable-by-syllable"
        recognizer={recognizer}
        onComplete={onComplete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /mulai bicara/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(screen.getByText(/Yang terdengar.*Ibu\./i)).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]?.[0].perItem).toEqual([
      expect.objectContaining({ itemId: word.id, outcome: 'ok' }),
    ]);
  });

  it('passes a correctly spoken whole word even while highlighting its first syllable', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [
      { delayMs: 20, action: (cb) => cb.onFinal?.(['ibu']) },
    ];
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'ibu',
        level: 'word',
        syllables: ['i', 'bu'],
        readingMode: 'syllable-by-syllable',
        recognizer,
        onSuccess,
      }),
    );
    act(() => result.current.startListening());
    act(() => vi.advanceTimersByTime(420));
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.lastTranscript).toBe('ibu');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('keeps checking wrong readings and accepts a later correct reading', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [
      { delayMs: 20, action: (cb) => cb.onFinal?.(['sapi']) },
    ];
    const { result } = renderHook(() =>
      useSpeechCheck({ targetText: 'buku', level: 'word', recognizer }),
    );
    for (let index = 0; index < 3; index++) {
      act(() => result.current.startListening());
      act(() => vi.advanceTimersByTime(420));
      expect(result.current.isAssisted).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    }
    expect(result.current.retryCount).toBe(3);
    recognizer.simulateScript = [
      { delayMs: 20, action: (cb) => cb.onFinal?.(['buku']) },
    ];
    act(() => result.current.startListening());
    act(() => vi.advanceTimersByTime(420));
    expect(result.current.completionMode).toBe('verified');
  });

  it('does not pass a correct interim transcript without a final result', () => {
    vi.useFakeTimers();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [
      { delayMs: 10, action: (cb) => cb.onInterim?.('ibu') },
      { delayMs: 20, action: (cb) => cb.onEnd?.() },
    ];
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'ibu',
        level: 'word',
        recognizer,
        onSuccess,
      }),
    );
    act(() => result.current.startListening());
    act(() => vi.advanceTimersByTime(420));
    expect(result.current.issue).toBe('no-result');
    expect(result.current.lastTranscript).toBe('ibu');
    expect(result.current.retryCount).toBe(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('never reveals an unchecked completion button after repeated empty captures', async () => {
    vi.useFakeTimers();
    vi.spyOn(tts, 'speak').mockResolvedValue();
    const recognizer = new MockSpeechRecognizer();
    recognizer.simulateScript = [{ delayMs: 20, action: (cb) => cb.onEnd?.() }];
    render(
      <SpeechReadCheck
        item={word}
        recognizer={recognizer}
        onComplete={vi.fn()}
      />,
    );
    for (let index = 0; index < 3; index++) {
      fireEvent.click(screen.getByRole('button', { name: /mulai bicara/i }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(
        screen.queryByRole('button', { name: /aku sudah baca/i }),
      ).not.toBeInTheDocument();
    }
    expect(
      screen.getByText(/belum dihitung sebagai percobaan bacaan/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /latihan tanpa penilaian/i }),
    ).toBeInTheDocument();
  });

  it('does not open a competing getUserMedia stream during recognition', async () => {
    vi.useFakeTimers();
    vi.spyOn(tts, 'speak').mockResolvedValue();
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    render(
      <SpeechReadCheck
        item={word}
        recognizer={new MockSpeechRecognizer()}
        onComplete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /mulai bicara/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(
      screen.getByRole('button', { name: /hentikan mikrofon/i }),
    ).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
