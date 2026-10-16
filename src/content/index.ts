import zonesData from './zones.json';
import feedbackData from './feedback.json';
import lettersData from './letters.json';
import syllablesData from './syllables.json';
import zone1WordsData from './words/zone1-words.json';
import zone3WordsData from './words/zone3-words.json';
import zone1LessonsData from './lessons/zone1-lessons.json';
import zone2LessonsData from './lessons/zone2-lessons.json';
import zone3LessonsData from './lessons/zone3-lessons.json';

import {
  zonesFileSchema,
  feedbackFileSchema,
  letterItemsFileSchema,
  syllableItemsFileSchema,
  wordItemsFileSchema,
  lessonsFileSchema,
} from './schema';
import type {
  Zone,
  LetterItem,
  SyllableItem,
  WordItem,
  Lesson,
  BaseItem,
} from '@/types/content';

export interface FeedbackBank {
  praises: string[];
  encouragements: string[];
  hints: string[];
}

export function getZones(): Zone[] {
  return zonesFileSchema.parse(zonesData);
}

export function getFeedback(): FeedbackBank {
  return feedbackFileSchema.parse(feedbackData);
}

export function getRandomPraise(): string {
  const { praises } = getFeedback();
  const randomIndex = Math.floor(Math.random() * praises.length);
  return praises[randomIndex] ?? 'Hebat!';
}

export function getRandomEncouragement(): string {
  const { encouragements } = getFeedback();
  const randomIndex = Math.floor(Math.random() * encouragements.length);
  return encouragements[randomIndex] ?? 'Ayo coba lagi!';
}

export function getRandomHint(): string {
  const { hints } = getFeedback();
  const randomIndex = Math.floor(Math.random() * hints.length);
  return hints[randomIndex] ?? 'Dengarkan bunyinya ya!';
}

export function getLetters(): LetterItem[] {
  return letterItemsFileSchema.parse(lettersData);
}

export function getLetterById(id: string): LetterItem | undefined {
  return getLetters().find((l) => l.id === id);
}

export function getSyllables(): SyllableItem[] {
  return syllableItemsFileSchema.parse(syllablesData);
}

export function getSyllableById(id: string): SyllableItem | undefined {
  return getSyllables().find((s) => s.id === id);
}

export function getAllWords(): WordItem[] {
  const z1Words = wordItemsFileSchema.parse(zone1WordsData);
  const z3Words = wordItemsFileSchema.parse(zone3WordsData);
  return [...z1Words, ...z3Words];
}

export function getZone1Words(): WordItem[] {
  return wordItemsFileSchema.parse(zone1WordsData);
}

export function getZone3Words(): WordItem[] {
  return wordItemsFileSchema.parse(zone3WordsData);
}

export function getWordById(id: string): WordItem | undefined {
  return getAllWords().find((w) => w.id === id);
}

export function getAllLessons(): Lesson[] {
  const z1 = lessonsFileSchema.parse(zone1LessonsData);
  const z2 = lessonsFileSchema.parse(zone2LessonsData);
  const z3 = lessonsFileSchema.parse(zone3LessonsData);
  return [...z1, ...z2, ...z3];
}

export function getLessonsByZone(zoneId: string): Lesson[] {
  return getAllLessons().filter((l) => l.zoneId === zoneId);
}

export function getZone1Lessons(): Lesson[] {
  return lessonsFileSchema.parse(zone1LessonsData);
}

export function getZone2Lessons(): Lesson[] {
  return lessonsFileSchema.parse(zone2LessonsData);
}

export function getZone3Lessons(): Lesson[] {
  return lessonsFileSchema.parse(zone3LessonsData);
}

export function getLessonById(id: string): Lesson | undefined {
  return getAllLessons().find((l) => l.id === id);
}

export function getItemById(id: string): BaseItem | undefined {
  return getLetterById(id) ?? getSyllableById(id) ?? getWordById(id);
}
