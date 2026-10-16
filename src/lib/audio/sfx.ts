import { audioGate } from './audioGate';
class SFXService {
  private ctx: AudioContext | null = null;
  private muted = false;
  private output: GainNode | null = null;

  constructor() {
    audioGate.subscribe((capturing) => {
      if (this.ctx && this.output) {
        this.output.gain.setValueAtTime(
          capturing || this.muted ? 0 : 1,
          this.ctx.currentTime,
        );
      }
    });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.output = this.ctx.createGain();
        this.output.gain.value = this.muted || audioGate.isCapturing() ? 0 : 1;
        this.output.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ctx && this.output) {
      this.output.gain.setValueAtTime(
        muted || audioGate.isCapturing() ? 0 : 1,
        this.ctx.currentTime,
      );
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Efek klik tombol lembut (pop pendek)
   */
  public playClick(): void {
    if (this.muted || audioGate.isCapturing()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.output ?? ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Efek 'ting' lembut saat jawaban/huruf benar (nada E5 -> B5)
   */
  public playSuccessDing(): void {
    if (this.muted || audioGate.isCapturing()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc1.connect(gain1);
      gain1.connect(this.output ?? ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.08); // B5
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc2.connect(gain2);
      gain2.connect(this.output ?? ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.4);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Efek 'pop' ceria saat bintang muncul
   */
  public playStarPop(): void {
    if (this.muted || audioGate.isCapturing()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.output ?? ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext error handling
    }
  }

  /**
   * Efek selebrasi riang di akhir pelajaran (arpeggio ceria C-E-G-C)
   */
  public playCelebrate(): void {
    if (this.muted || audioGate.isCapturing()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const start = now + i * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

        osc.connect(gain);
        gain.connect(this.output ?? ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {
      // AudioContext error handling
    }
  }
}

export const sfx = new SFXService();
