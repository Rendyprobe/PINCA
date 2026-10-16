export type Level = 'letter' | 'syllable' | 'word' | 'sentence' | 'story';

export interface ImageRef {
  type: 'emoji' | 'svg';
  value: string;
  alt: string; // alt WAJIB untuk aksesibilitas
}

export interface BaseItem {
  id: string; // Unik & stabil, misal "w_ibu", "l_a"
  level: Level;
  text: string;
  ttsText?: string;
  audioSrc?: string;
  acceptedAliases?: string[];
  image?: ImageRef;
  tags?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface LetterItem extends BaseItem {
  level: 'letter';
  upper: string;
  lower: string;
  soundTts: string;
  nameTts: string;
  exampleWordId: string;
}

export interface SyllableItem extends BaseItem {
  level: 'syllable';
  letters: string[];
}

export interface WordItem extends BaseItem {
  level: 'word';
  syllables: string[]; // join('') === text
  imageRequired: boolean;
}

export interface SentenceItem extends BaseItem {
  level: 'sentence';
  words: string[];
  punctuation: '.' | '?' | '!';
  wordIds?: (string | null)[];
}

export interface StoryQuestion {
  prompt: string;
  options: { text: string; image?: ImageRef }[];
  answerIndex: number;
}

export interface StoryPage {
  sentenceIds: string[];
  illustration: ImageRef;
}

export interface StoryItem {
  id: string;
  title: string;
  level: 'story';
  pages: StoryPage[];
  questions: StoryQuestion[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface ActivityConfig {
  type: string;
  options?: Record<string, unknown>;
}

export interface Lesson {
  id: string;
  zoneId: string;
  title: string;
  itemIds: string[];
  activities: ActivityConfig[];
  unlockAfter?: string[];
}

export interface Zone {
  id: string;
  title: string;
  icon: string;
  lessonIds: string[];
  order: number;
}

export interface UserSettings {
  readingMode: 'syllables' | 'whole-word';
  difficultyThreshold: 'easy' | 'normal' | 'strict';
  ttsRate: number;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'default' | 'lexend';
  soundEnabled: boolean;
  micEnabled: boolean;
  childName?: string;
}

export type ItemOutcome = 'ok' | 'almost' | 'miss' | 'assisted';

export interface ActivityResultItem {
  itemId: string;
  outcome: ItemOutcome;
  attempts: number;
  hintsUsed: number;
}

export interface ActivityResult {
  activityType: string;
  perItem: ActivityResultItem[];
  durationMs: number;
}

export interface ActivityProps<TItem extends BaseItem = BaseItem> {
  items: TItem[];
  onComplete: (result: ActivityResult) => void;
  onProgress?: (info: { index: number; total: number }) => void;
  settings: UserSettings;
}
