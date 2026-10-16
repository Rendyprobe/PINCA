import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSpeechRecognizer } from '@/lib/speech/speechRecognizer';

class NativeRecognition {
  static latest: NativeRecognition;
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;
  onsoundstart: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          isFinal: boolean;
          length: number;
          [index: number]: { transcript: string; confidence: number };
        }[];
      }) => void)
    | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    NativeRecognition.latest = this;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Native recognition lifecycle', () => {
  it('announces listening only after the native start event', () => {
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onStart = vi.fn();
    recognizer.start({ onStart });
    expect(onStart).not.toHaveBeenCalled();
    NativeRecognition.latest.onstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);
    recognizer.abort();
  });

  it('releases a native session even after its error flag becomes inactive', () => {
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    recognizer.start({ onError: () => recognizer.abort() });
    const session = NativeRecognition.latest;
    session.onerror?.({ error: 'audio-capture' });
    expect(session.abort).toHaveBeenCalledTimes(1);
    expect(session.onstart).toBeNull();
    expect(session.onresult).toBeNull();
  });

  it('keeps final results from all five alternatives and ignores retired sessions', () => {
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onFinal = vi.fn();
    recognizer.start({ onFinal });
    const session = NativeRecognition.latest;
    expect(session.maxAlternatives).toBe(5);
    const result = session.onresult;
    const event = {
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          length: 5,
          ...Object.fromEntries(
            ['sapi', 'nasi', 'meja', 'topi', 'bola'].map((transcript, i) => [
              i,
              { transcript, confidence: 0.5 },
            ]),
          ),
        },
      ],
    };
    result?.(event);
    expect(onFinal).toHaveBeenCalledWith([
      'sapi',
      'nasi',
      'meja',
      'topi',
      'bola',
    ]);
    recognizer.abort();
    result?.(event);
    expect(onFinal).toHaveBeenCalledTimes(1);
  });
});

describe('Capture and transcription diagnostics', () => {
  it('separates service startup from actual capture and detected speech', () => {
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onStart = vi.fn(),
      onAudioStart = vi.fn(),
      onSoundStart = vi.fn(),
      onSpeechStart = vi.fn();
    recognizer.start({ onStart, onAudioStart, onSoundStart, onSpeechStart });
    const session = NativeRecognition.latest;
    session.onstart?.();
    expect(onAudioStart).not.toHaveBeenCalled();
    session.onaudiostart?.();
    session.onsoundstart?.();
    session.onspeechstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onAudioStart).toHaveBeenCalledTimes(1);
    expect(onSoundStart).toHaveBeenCalledTimes(1);
    expect(onSpeechStart).toHaveBeenCalledTimes(1);
    recognizer.abort();
  });

  it('gracefully stops at the capture deadline and accepts a delayed final answer', () => {
    vi.useFakeTimers();
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onFinal = vi.fn(),
      onError = vi.fn();
    recognizer.start({ timeoutMs: 6000, onFinal, onError });
    const session = NativeRecognition.latest;
    session.onaudiostart?.();
    vi.advanceTimersByTime(6000);
    expect(session.stop).toHaveBeenCalledTimes(1);
    expect(session.abort).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    session.onresult?.({
      resultIndex: 0,
      results: [
        { isFinal: true, length: 1, 0: { transcript: 'ibu', confidence: 0.9 } },
      ],
    });
    expect(onFinal).toHaveBeenCalledWith(['ibu']);
    expect(onError).not.toHaveBeenCalled();
    recognizer.abort();
  });

  it('does not discard finals after the child finishes manually', () => {
    vi.useFakeTimers();
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onFinal = vi.fn();
    recognizer.start({ onFinal });
    const session = NativeRecognition.latest;
    session.onaudiostart?.();
    recognizer.stop();
    session.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          length: 1,
          0: { transcript: 'bola', confidence: 0.9 },
        },
      ],
    });
    expect(onFinal).toHaveBeenCalledWith(['bola']);
    recognizer.abort();
  });

  it('does not treat interim text as a verified final answer', () => {
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onFinal = vi.fn(),
      onError = vi.fn();
    recognizer.start({ onFinal, onError });
    const session = NativeRecognition.latest;
    session.onaudiostart?.();
    session.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal: false,
          length: 1,
          0: { transcript: 'bola', confidence: 0.8 },
        },
      ],
    });
    session.onend?.();
    expect(onFinal).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('no-result', expect.any(String));
  });

  it('reports capture startup timeout separately from silence', () => {
    vi.useFakeTimers();
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onError = vi.fn();
    recognizer.start({ onError });
    NativeRecognition.latest.onstart?.();
    vi.advanceTimersByTime(12000);
    expect(onError).toHaveBeenCalledWith('start-timeout', expect.any(String));
  });

  it('joins final word segments and waits for an interim tail to finalize', () => {
    vi.stubGlobal('SpeechRecognition', NativeRecognition);
    const recognizer = new WebSpeechRecognizer();
    const onFinal = vi.fn(),
      onInterim = vi.fn();
    recognizer.start({ onFinal, onInterim });
    const session = NativeRecognition.latest;
    const first = {
      isFinal: true,
      length: 1,
      0: { transcript: 'ibu', confidence: 0.9 },
    };
    session.onresult?.({
      resultIndex: 1,
      results: [
        first,
        {
          isFinal: false,
          length: 1,
          0: { transcript: 'masak', confidence: 0.8 },
        },
      ],
    });
    expect(onFinal).not.toHaveBeenCalled();
    expect(onInterim).toHaveBeenCalledWith('ibu masak');
    session.onresult?.({
      resultIndex: 1,
      results: [
        first,
        {
          isFinal: true,
          length: 1,
          0: { transcript: 'masak', confidence: 0.9 },
        },
      ],
    });
    expect(onFinal).toHaveBeenCalledWith(['ibu masak']);
    recognizer.abort();
  });
});
