export const APP_NAME = 'Ayo Membaca!';
export const APP_VERSION = '0.1.0';

// Batas waktu mendengar (detik) - GEMINI.md Bagian 5.7
export const SPEECH_TIMEOUTS = {
  letter: 6000,
  syllable: 6000,
  word: 8000,
  sentenceBase: 5000,
  sentencePerWord: 1500,
  maxSentence: 20000,
};

// Pengaturan default TTS - GEMINI.md Bagian 6
export const DEFAULT_TTS_CONFIG = {
  lang: 'id-ID',
  rate: 0.8,
  pitch: 1.1,
  letterRate: 0.7,
};

// Kriteria penguasaan - GEMINI.md Bagian 8.2
export const MASTERY_LEVELS = {
  baru: 0.2,
  belajar: 0.6,
  hampirLancar: 0.85,
  lancar: 0.85,
};
