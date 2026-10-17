import { getGuideAudio, GUIDE_VOICE, selectGuideVoice } from './guideVoice';
import letters from '@/content/letters.json';
import { audioGate } from './audioGate';
export interface TTSOptions {
  audioSrc?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
  volume?: number;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private speaking = false;
  private isInitialized = false;
  private muted = false;
  private defaultRate = 0.85;
  private audioCache = new Map<string, HTMLAudioElement>();
  private finishCurrent: (() => void) | null = null;
  private generation = 0;
  private pending: Promise<void> = Promise.resolve();

  public async whenIdle(): Promise<void> {
    while (this.speaking) await this.pending;
  }

  constructor() {
    this.getSynth();
  }

  public setDefaultRate(rate: number): void {
    if (rate >= 0.5 && rate <= 2.0) {
      this.defaultRate = rate;
    }
  }

  public getDefaultRate(): number {
    return this.defaultRate;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getSynth(): SpeechSynthesis | null {
    if (this.synth) return this.synth;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }
    return this.synth;
  }

  private initVoices(): void {
    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth?.getVoices() ?? [];
      this.isInitialized = true;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  public isAvailable(): boolean {
    return this.getSynth() !== null || typeof Audio !== 'undefined';
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getBestIndonesianVoice(): SpeechSynthesisVoice | null {
    this.voices = this.getSynth()?.getVoices() ?? [];
    return selectGuideVoice(this.voices);
  }

  /** Play the local neural guide pack, then use an Indonesian browser voice. */
  public speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (audioGate.isCapturing()) return Promise.resolve();
    this.cancel();
    const trimmed = text.trim();
    const letter = letters.find(
      (item) => item.text.toLowerCase() === trimmed.toLowerCase(),
    );
    const cleanText = letter?.soundTts ?? trimmed;
    if (this.muted || !cleanText) return Promise.resolve();
    const playbackOptions = {
      ...options,
      audioSrc: options.audioSrc ?? getGuideAudio(cleanText),
    };
    const generation = this.generation;
    this.speaking = true;
    this.pending = new Promise<void>((resolve) => {
      this.finishCurrent = resolve;
    });
    const done = () => {
      if (generation !== this.generation) return;
      this.speaking = false;
      this.currentAudio = null;
      this.currentUtterance = null;
      this.finishCurrent?.();
      this.finishCurrent = null;
    };
    const phrases = playbackOptions.audioSrc
      ? [cleanText]
      : (cleanText.match(/[^.!?;:]+[.!?;:]?|[^.!?;:]+$/g) ?? [cleanText]);
    const run = async () => {
      for (const phrase of phrases) {
        // Bound utterance length without cutting words in half.
        const chunks = playbackOptions.audioSrc
          ? [phrase]
          : (phrase.trim().match(/.{1,140}(?:\s|$)|\S+/g) ?? [phrase]);
        for (const chunk of chunks) {
          if (generation !== this.generation) return;
          await this.playPhrase(chunk.trim(), playbackOptions, generation);
        }
      }
      done();
    };
    void run().catch(done);
    return this.pending;
  }

  private playPhrase(
    text: string,
    options: TTSOptions,
    generation: number,
  ): Promise<void> {
    const url = options.audioSrc ?? getGuideAudio(text);
    if (!url || typeof Audio === 'undefined')
      return this.speakFallback(text, options);
    return new Promise((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout>;
      let audio: HTMLAudioElement | undefined;
      const finish = (fallback: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (audio) {
          audio.onended = null;
          audio.onerror = null;
          if (fallback) audio.pause();
        }
        if (fallback && generation === this.generation) {
          void this.speakFallback(text, options).then(resolve);
        } else resolve();
      };
      try {
        audio = this.audioCache.get(url);
        if (!audio) {
          audio = new Audio(url);
          audio.preload = 'auto';
          const oldest = this.audioCache.keys().next().value;
          if (this.audioCache.size >= 128 && oldest)
            this.audioCache.delete(oldest);
          this.audioCache.set(url, audio);
        }
        this.currentAudio = audio;
        audio.currentTime = 0;
        audio.playbackRate = options.rate ?? this.defaultRate;
        audio.volume = options.volume ?? 1;
        audio.onended = () => finish(false);
        audio.onerror = () => finish(true);
        timer = setTimeout(() => finish(true), 15000);
        // Cancellation settles both this phrase and the public request.
        const previousFinish = this.finishCurrent;
        this.finishCurrent = () => {
          finish(false);
          previousFinish?.();
        };
        void audio.play()?.catch(() => finish(true));
      } catch {
        finish(true);
      }
    });
  }

  /**
   * Use the best Indonesian browser voice for text absent from the local pack.
   */
  private speakFallback(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      const synth = this.getSynth();
      if (!synth || this.muted) {
        resolve();
        return;
      }

      // Pitch 1.0 (nada manusia alami)
      // Rate 0.85 default (tempo wajar bicara ramah anak, atau konfigurasi orang tua)
      const { volume = 1.0 } = options;
      const voice = this.getBestIndonesianVoice();
      if (!voice) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.rate = options.rate ?? this.defaultRate;
      utterance.pitch = options.pitch ?? GUIDE_VOICE.pitch;
      utterance.lang = options.lang ?? GUIDE_VOICE.lang;
      utterance.volume = volume;

      utterance.voice = voice;

      const finish = () => {
        clearTimeout(timer);
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
        resolve();
      };
      const timer = setTimeout(() => {
        synth.cancel();
        finish();
      }, 20000);
      utterance.onstart = () => {
        this.speaking = true;
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        finish();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        finish();
      };

      const previousFinish = this.finishCurrent;
      this.finishCurrent = () => {
        finish();
        previousFinish?.();
      };
      try {
        synth.speak(utterance);
      } catch {
        finish();
      }
    });
  }

  public cancel(): void {
    this.generation++;
    this.finishCurrent?.();
    this.finishCurrent = null;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Abaikan
      }
      this.currentAudio = null;
    }

    const synth = this.getSynth();
    if (synth) {
      synth.cancel();
    }
    this.speaking = false;
    this.currentUtterance = null;
  }
}

export const tts = new TTSService();
