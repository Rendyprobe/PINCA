export interface TTSOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  volume?: number;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speaking = false;
  private isInitialized = false;

  constructor() {
    this.getSynth();
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
    return this.getSynth() !== null;
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

  /**
   * Cari voice bahasa Indonesia terbaik yang tersedia di perangkat.
   */
  public getBestIndonesianVoice(): SpeechSynthesisVoice | null {
    const synth = this.getSynth();
    if (!this.voices.length && synth) {
      this.voices = synth.getVoices();
    }

    // 1. Cari yang persis 'id-ID' atau 'id_ID'
    const exactMatch = this.voices.find(
      (v) =>
        v.lang.toLowerCase() === 'id-id' || v.lang.toLowerCase() === 'id_id',
    );
    if (exactMatch) return exactMatch;

    // 2. Cari yang diawali 'id'
    const idPrefix = this.voices.find((v) =>
      v.lang.toLowerCase().startsWith('id'),
    );
    if (idPrefix) return idPrefix;

    // 3. Fallback: suara default sistem
    return this.voices.find((v) => v.default) ?? this.voices[0] ?? null;
  }

  /**
   * Membacakan teks dengan Promise yang selesai saat pengucapan berakhir.
   */
  public speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      const synth = this.getSynth();
      if (!synth) {
        resolve();
        return;
      }

      // Pastikan antrean sebelumnya dibatalkan agar tidak bertumpuk
      this.cancel();

      const { rate = 0.8, pitch = 1.1, lang = 'id-ID', volume = 1.0 } = options;

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;
      utterance.volume = volume;

      const voice = this.getBestIndonesianVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.speaking = true;
      };

      utterance.onend = () => {
        this.speaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        this.speaking = false;
        this.currentUtterance = null;
        resolve();
      };

      synth.speak(utterance);
    });
  }

  public cancel(): void {
    const synth = this.getSynth();
    if (synth) {
      synth.cancel();
    }
    this.speaking = false;
    this.currentUtterance = null;
  }
}

export const tts = new TTSService();
