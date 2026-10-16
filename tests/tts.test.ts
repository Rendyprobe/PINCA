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

  it('speaks text and resolves promise upon completion', async () => {
    const mockSpeak = vi.fn().mockImplementation((utterance: SpeechSynthesisUtterance) => {
      // Simulate speech completion
      setTimeout(() => {
        utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
      }, 10);
    });

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.speak = mockSpeak;
    }

    await tts.speak('Halo Teman!', { rate: 0.8 });
    expect(mockSpeak).toHaveBeenCalled();
  });
});

