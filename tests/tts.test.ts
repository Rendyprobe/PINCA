import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tts } from '@/lib/audio/tts';

describe('TTS Service Wrapper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects availability correctly when speechSynthesis exists', () => {
    expect(tts.isAvailable()).toBe(true);
  });

  it('cancels speech and resets speaking state on cancel()', () => {
    tts.cancel();
    expect(tts.isSpeaking()).toBe(false);
  });

  it('speaks text via Audio when available', async () => {
    let played = false;
    const originalAudio = window.Audio;
    window.Audio = class {
      src = '';
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play() {
        played = true;
        setTimeout(() => this.onended?.(), 10);
        return Promise.resolve();
      }
      pause() {}
    } as unknown as typeof Audio;

    await tts.speak('Halo Teman!', { audioSrc: '/audio/test-guide.mp3' });
    expect(played).toBe(true);
    window.Audio = originalAudio;
  });

  it('falls back to speechSynthesis when Audio fails', async () => {
    const mockSpeak = vi
      .fn()
      .mockImplementation((utterance: SpeechSynthesisUtterance) => {
        setTimeout(() => {
          utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
        }, 10);
      });

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.speak = mockSpeak;
    }

    const originalAudio = window.Audio;
    window.Audio = class {
      src = '';
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play() {
        setTimeout(() => this.onerror?.(), 5);
        return Promise.reject(new Error('Audio load failed'));
      }
      pause() {}
    } as unknown as typeof Audio;

    await tts.speak('Halo lagi!', { audioSrc: '/audio/test-unavailable.mp3' });
    expect(mockSpeak).toHaveBeenCalled();
    window.Audio = originalAudio;
  });
});
