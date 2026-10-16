import guideAudio from '@/content/guide-audio.json';

export const GUIDE_VOICE = {
  name: 'Bu Delia',
  rate: 0.85,
  pitch: 1,
  lang: 'id-ID',
} as const;

export function guideAudioKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.!?,;:…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getGuideAudio(text: string): string | undefined {
  const entries: Record<string, { src: string }> = guideAudio.entries;
  const entry = entries[guideAudioKey(text)];
  return entry ? `${import.meta.env.BASE_URL}${entry.src}` : undefined;
}

/** Prefer the Indonesian female neural voice consistently across voice list order. */
export function selectGuideVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    if (/gadis/.test(name)) return 100;
    if (/google.*(indonesia|indonesian)/.test(name)) return 90;
    if (/desi/.test(name)) return 50;
    if (/ardi|\bmale\b/.test(name)) return -100;
    return (
      (/natural|neural/.test(name) ? 40 : 0) +
      (/female|perempuan|wanita/.test(name) ? 30 : 0)
    );
  };
  return (
    voices
      .filter((voice) => /^id(?:[-_]|$)/i.test(voice.lang))
      .sort((a, b) => score(b) - score(a))[0] ?? null
  );
}
