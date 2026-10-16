import type { Level } from '@/types/content';
import type { DifficultyMode } from '@/config/thresholds';

export type SpeechState =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'evaluating'
  | 'success'
  | 'almost'
  | 'retry'
  | 'noSpeech'
  | 'speechError'
  | 'assisted'
  | 'fallbackTap';

export type UnitStatus = 'pending' | 'active' | 'done' | 'almost';

export type MatchOutcome = 'ok' | 'almost' | 'miss';

export interface MatchInput {
  target: string;
  aliases?: string[];
  heard: string[];
  level: Level;
  exampleWord?: string;
  exampleWordAliases?: string[];
}

export interface MatchResult {
  score: number;
  outcome: MatchOutcome;
  bestHeard: string | null;
  matchedPrefixChars: number;
  matchedVia?:
    'exact' | 'alias' | 'phonetic' | 'fuzzy' | 'exampleWord' | 'none';
}

export type SpeechErrorCode =
  | 'not-allowed'
  | 'no-speech'
  | 'no-result'
  | 'start-timeout'
  | 'language-not-supported'
  | 'network'
  | 'audio-capture'
  | 'service-not-allowed'
  | 'unsupported'
  | 'aborted'
  | 'unknown';

export interface SpeechRecognitionOptions {
  lang?: string;
  timeoutMs?: number;
  onStart?: () => void;
  onAudioStart?: () => void;
  onSoundStart?: () => void;
  onSpeechStart?: () => void;
  onProcessing?: () => void;
  onInterim?: (transcript: string) => void;
  onFinal?: (alternatives: string[]) => void;
  onError?: (code: SpeechErrorCode, message: string) => void;
  onEnd?: () => void;
}

export interface ISpeechRecognizer {
  isSupported(): boolean;
  start(options: SpeechRecognitionOptions): void;
  stop(): void;
  abort(): void;
}

export type ReadingMode = 'whole-word' | 'syllable-by-syllable';

export interface SpeechCheckOptions {
  difficultyMode?: DifficultyMode;
  readingMode?: ReadingMode;
  maxRetriesBeforeAssist?: number;
}
