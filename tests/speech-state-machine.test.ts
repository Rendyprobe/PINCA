import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechCheck } from '@/features/speech/useSpeechCheck';
import { MockSpeechRecognizer } from '@/lib/speech/speechRecognizer';

describe('useSpeechCheck State Machine Hook', () => {
  it('reports unsupported recognition without automatically switching to practice', () => {
    const mockRecognizer = new MockSpeechRecognizer(false);
    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'bola',
        level: 'word',
        recognizer: mockRecognizer,
      }),
    );

    expect(result.current.state).toBe('speechError');
    expect(result.current.isFallbackTap).toBe(false);
  });

  it('progresses to success when speech matches target text', async () => {
    vi.useFakeTimers();
    const mockRecognizer = new MockSpeechRecognizer(true);
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'bola',
        syllables: ['bo', 'la'],
        level: 'word',
        recognizer: mockRecognizer,
        onSuccess,
      }),
    );

    expect(result.current.state).toBe('idle');

    // Setup simulated speech recognition sequence
    mockRecognizer.simulateScript = [
      {
        delayMs: 50,
        action: ({ onInterim }) => onInterim?.('bo'),
      },
      {
        delayMs: 150,
        action: ({ onFinal }) => onFinal?.(['bola']),
      },
    ];

    // Trigger start listening
    act(() => {
      result.current.startListening();
    });

    // Advance 400ms for TTS debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.state).toBe('listening');

    // Advance for interim
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(result.current.lastTranscript).toBe('bo');

    // Advance for final
    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(result.current.state).toBe('success');
    expect(onSuccess).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('keeps checking after three mismatches and offers practice only when selected', async () => {
    vi.useFakeTimers();
    const mockRecognizer = new MockSpeechRecognizer(true);

    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'buku',
        level: 'word',
        maxRetries: 3,
        recognizer: mockRecognizer,
      }),
    );

    // Attempt 1: miss
    mockRecognizer.simulateScript = [
      {
        delayMs: 50,
        action: ({ onFinal }) => onFinal?.(['sapi']),
      },
    ];

    act(() => {
      result.current.startListening();
    });
    act(() => {
      vi.advanceTimersByTime(460);
    });
    expect(result.current.retryCount).toBe(1);
    expect(result.current.state).toBe('retry');

    // Attempt 2: miss
    act(() => {
      result.current.startListening();
    });
    act(() => {
      vi.advanceTimersByTime(460);
    });
    expect(result.current.retryCount).toBe(2);
    expect(result.current.state).toBe('retry');

    // Attempt 3: miss -> triggers assisted mode
    act(() => {
      result.current.startListening();
    });
    act(() => {
      vi.advanceTimersByTime(460);
    });
    expect(result.current.retryCount).toBe(3);
    expect(result.current.state).toBe('retry');
    expect(result.current.isAssisted).toBe(false);
    act(() => result.current.choosePractice());
    expect(result.current.isAssisted).toBe(true);

    vi.useRealTimers();
  });

  it('completes via tap fallback cleanly', () => {
    const mockRecognizer = new MockSpeechRecognizer(false);
    const onSuccess = vi.fn();
    const onAssistedComplete = vi.fn();

    const { result } = renderHook(() =>
      useSpeechCheck({
        targetText: 'bola',
        syllables: ['bo', 'la'],
        level: 'word',
        recognizer: mockRecognizer,
        micEnabled: false,
        onSuccess,
        onAssistedComplete,
      }),
    );

    expect(result.current.state).toBe('fallbackTap');

    act(() => {
      result.current.handleTapUnit(0);
    });

    expect(result.current.state).toBe('success');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onAssistedComplete).toHaveBeenCalledTimes(1);
    expect(result.current.completionMode).toBe('assisted');
  });
});
