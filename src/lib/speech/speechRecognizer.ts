import type {
  ISpeechRecognizer,
  SpeechErrorCode,
  SpeechRecognitionOptions,
} from './types';

interface SpeechAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternative | undefined;
}
interface SpeechEvent {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult | undefined };
}
interface NativeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionConstructor = new () => NativeRecognition;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

/** A bounded native session; graceful stop lets the browser finish transcribing. */
export class WebSpeechRecognizer implements ISpeechRecognizer {
  private recognition: NativeRecognition | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private requestStop: (() => void) | null = null;

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as SpeechWindow;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  start(options: SpeechRecognitionOptions): void {
    this.abort();
    if (typeof window === 'undefined') {
      options.onError?.('unsupported', 'Pengenalan suara belum tersedia.');
      return;
    }
    const win = window as SpeechWindow;
    const Constructor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Constructor) {
      options.onError?.('unsupported', 'Pengenalan suara belum tersedia.');
      return;
    }
    let session: NativeRecognition;
    try {
      session = new Constructor();
    } catch {
      options.onError?.('unknown', 'Mikrofon belum dapat disiapkan.');
      return;
    }
    this.recognition = session;
    session.lang = options.lang ?? 'id-ID';
    session.continuous = false;
    session.interimResults = true;
    session.maxAlternatives = 5;
    let finalDelivered = false;
    let receivedSound = false;
    let receivedText = false;
    let stopping = false;
    const current = () => this.recognition === session;
    const clearTimer = () => {
      clearTimeout(this.timer);
      this.timer = undefined;
    };
    const fail = (code: SpeechErrorCode, message: string) => {
      if (!current()) return;
      this.abort();
      options.onError?.(code, message);
    };
    const emptyCode = () =>
      receivedSound || receivedText
        ? ('no-result' as const)
        : ('no-speech' as const);
    this.requestStop = () => {
      if (!current() || stopping || finalDelivered) return;
      stopping = true;
      clearTimer();
      options.onProcessing?.();
      // Install the deadline before stop(): native events can be synchronous.
      this.timer = setTimeout(
        () => fail(emptyCode(), 'Teks bacaan belum diterima.'),
        2000,
      );
      try {
        session.stop();
      } catch {
        fail('unknown', 'Sesi mendengar belum dapat diselesaikan.');
      }
    };
    session.onstart = () => {
      if (current()) options.onStart?.();
    };
    session.onaudiostart = () => {
      if (!current() || stopping) return;
      clearTimer();
      this.timer = setTimeout(
        () => this.requestStop?.(),
        options.timeoutMs ?? 8000,
      );
      options.onAudioStart?.();
    };
    session.onsoundstart = () => {
      if (!current()) return;
      receivedSound = true;
      options.onSoundStart?.();
    };
    session.onspeechstart = () => {
      if (!current()) return;
      receivedSound = true;
      options.onSpeechStart?.();
    };
    session.onresult = (event) => {
      if (!current() || finalDelivered) return;
      const finals: SpeechAlternative[][] = [];
      const interim: string[] = [];
      for (const result of Array.from(event.results)) {
        if (!result) continue;
        const alternatives = Array.from(
          { length: Math.min(5, result.length) },
          (_, index) => result[index],
        ).filter((alt): alt is SpeechAlternative =>
          Boolean(alt?.transcript.trim()),
        );
        if (alternatives.length) receivedText = true;
        if (result.isFinal && alternatives.length) finals.push(alternatives);
        else if (alternatives[0]) interim.push(alternatives[0].transcript);
      }
      if (interim.length) {
        options.onInterim?.(
          [...finals.map((segment) => segment[0]?.transcript ?? ''), ...interim]
            .join(' ')
            .trim(),
        );
        return;
      }
      if (!finals.length) return;
      // Join result segments instead of judging only one word from a sentence.
      let candidates = [{ text: '', rank: 0 }];
      for (const segment of finals) {
        candidates = candidates
          .flatMap((prefix) =>
            segment.map((alt, index) => ({
              text: `${prefix.text} ${alt.transcript}`.trim(),
              rank: prefix.rank + index,
            })),
          )
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 5);
      }
      finalDelivered = true;
      clearTimer();
      options.onFinal?.([
        ...new Set(candidates.map((candidate) => candidate.text)),
      ]);
    };
    session.onerror = (event) => {
      if (!current() || finalDelivered) return;
      const supported: SpeechErrorCode[] = [
        'not-allowed',
        'no-speech',
        'network',
        'audio-capture',
        'service-not-allowed',
        'aborted',
        'language-not-supported',
      ];
      let code: SpeechErrorCode =
        event.error === 'permission-denied'
          ? 'not-allowed'
          : supported.includes(event.error as SpeechErrorCode)
            ? (event.error as SpeechErrorCode)
            : 'unknown';
      if (code === 'no-speech' && (receivedSound || receivedText))
        code = 'no-result';
      fail(code, event.message ?? event.error);
    };
    session.onend = () => {
      if (!current()) return;
      clearTimer();
      if (!finalDelivered) {
        fail(emptyCode(), 'Sesi selesai tanpa teks bacaan final.');
        return;
      }
      this.abort();
      options.onEnd?.();
    };
    this.timer = setTimeout(
      () => fail('start-timeout', 'Mikrofon belum mulai menangkap suara.'),
      12000,
    );
    try {
      session.start();
    } catch {
      fail('unknown', 'Mikrofon belum dapat dimulai.');
    }
  }

  stop(): void {
    this.requestStop?.();
  }

  abort(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.requestStop = null;
    const session = this.recognition;
    this.recognition = null;
    if (!session) return;
    session.onstart =
      session.onaudiostart =
      session.onsoundstart =
      session.onspeechstart =
      session.onend =
        null;
    session.onresult = session.onerror = null;
    try {
      session.abort();
    } catch {
      /* A native session may already be closed. */
    }
  }
}

export interface MockSimulationStep {
  delayMs: number;
  action: (callbacks: {
    onAudioStart?: () => void;
    onSoundStart?: () => void;
    onSpeechStart?: () => void;
    onProcessing?: () => void;
    onStart?: () => void;
    onInterim?: (t: string) => void;
    onFinal?: (alt: string[]) => void;
    onError?: (c: SpeechErrorCode, m: string) => void;
    onEnd?: () => void;
  }) => void;
}

/**
 * Mock Recognizer untuk testing dan simulasi lingkungan tanpa mikrofon nyata
 */
export class MockSpeechRecognizer implements ISpeechRecognizer {
  private supported: boolean;
  public simulateScript: MockSimulationStep[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(supported = true) {
    this.supported = supported;
  }

  isSupported(): boolean {
    return this.supported;
  }

  start(options: SpeechRecognitionOptions): void {
    if (!this.supported) {
      options.onError?.('unsupported', 'Peramban tidak mendukung');
      return;
    }

    options.onStart?.();
    options.onAudioStart?.();
    if (this.simulateScript.length > 0) {
      for (const step of this.simulateScript) {
        this.timers.push(
          setTimeout(() => {
            step.action(options);
          }, step.delayMs),
        );
      }
    }
  }

  stop(): void {
    // Implementasi mock tanpa efek samping
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  abort(): void {
    // Implementasi mock tanpa efek samping
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
