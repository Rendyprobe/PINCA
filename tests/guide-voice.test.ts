import { describe, it, expect, vi, afterEach } from 'vitest';
import guideAudio from '@/content/guide-audio.json';
import {
  getGuideAudio,
  guideAudioKey,
  selectGuideVoice,
} from '@/lib/audio/guideVoice';
import { tts } from '@/lib/audio/tts';

afterEach(() => {
  tts.cancel();
  vi.restoreAllMocks();
});

function voice(name: string, lang = 'id-ID'): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: false, voiceURI: name };
}

describe('Local motherly guide voice', () => {
  it('prefers Gadis over male neural voices regardless of list order', () => {
    const gadis = voice('Microsoft Gadis Online (Natural)');
    expect(selectGuideVoice([voice('id-ID-ArdiNeural'), gadis])).toBe(gadis);
    expect(selectGuideVoice([gadis, voice('id-ID-ArdiNeural')])).toBe(gadis);
    expect(selectGuideVoice([voice('Microsoft David', 'en-US')])).toBeNull();
  });

  it('resolves punctuation and case variants to the same local MP3', () => {
    expect(getGuideAudio('  AYO BACA BOLA! ')).toBe(
      getGuideAudio('Ayo baca bola'),
    );
    expect(getGuideAudio('Ayo baca bola')).toMatch(/^\/audio\/ibu\/.+\.mp3$/);
  });

  it('ships a local MP3 for every manifest entry', () => {
    const files = import.meta.glob('/public/audio/ibu/*.mp3');
    expect(Object.keys(guideAudio.entries).length).toBeGreaterThan(800);
    for (const [key, entry] of Object.entries(guideAudio.entries)) {
      expect(guideAudioKey(entry.text)).toBe(key);
      expect(entry.src).toMatch(/^audio\/ibu\/[a-f0-9]{20}\.mp3$/);
      expect(files[`/public/${entry.src}`]).toBeDefined();
    }
  });

  it('plays the local neural audio and reuses it for repeat readings', async () => {
    const sources: string[] = [];
    class TestAudio {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(src: string) {
        sources.push(src);
      }
      play() {
        queueMicrotask(() => this.onended?.());
        return Promise.resolve();
      }
      pause() {}
    }
    vi.stubGlobal('Audio', TestAudio);
    try {
      await tts.speak('Ayo baca bola');
      await tts.speak('Ayo baca bola');
      expect(sources).toEqual([getGuideAudio('Ayo baca bola')]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
