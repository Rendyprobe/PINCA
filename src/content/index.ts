import zonesData from './zones.json';
import feedbackData from './feedback.json';
import lettersData from './letters.json';
import syllablesData from './syllables.json';
import zone1WordsData from './words/zone1-words.json';
import zone3WordsData from './words/zone3-words.json';
import zone4WordsData from './words/zone4-words.json';
import zone1LessonsData from './lessons/zone1-lessons.json';
import zone2LessonsData from './lessons/zone2-lessons.json';
import zone3LessonsData from './lessons/zone3-lessons.json';
import zone4LessonsData from './lessons/zone4-lessons.json';
import zone5SentencesData from './sentences/zone5-sentences.json';
import zone5LessonsData from './lessons/zone5-lessons.json';
import zone6StoriesData from './stories/zone6-stories.json';
import zone6LessonsData from './lessons/zone6-lessons.json';
import badgesData from './badges.json';

import {
  zonesFileSchema,
  feedbackFileSchema,
  letterItemsFileSchema,
  syllableItemsFileSchema,
  wordItemsFileSchema,
  sentenceItemsFileSchema,
  storyItemsFileSchema,
  lessonsFileSchema,
  badgesFileSchema,
} from './schema';
import type {
  Zone,
  LetterItem,
  SyllableItem,
  WordItem,
  SentenceItem,
  StoryItem,
  Lesson,
  BaseItem,
  Badge,
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
  const z4Words = wordItemsFileSchema.parse(zone4WordsData);
  return [...z1Words, ...z3Words, ...z4Words];
}

export function getZone1Words(): WordItem[] {
  return wordItemsFileSchema.parse(zone1WordsData);
}

export function getZone3Words(): WordItem[] {
  return wordItemsFileSchema.parse(zone3WordsData);
}

export function getZone4Words(): WordItem[] {
  return wordItemsFileSchema.parse(zone4WordsData);
}

export function getWordById(id: string): WordItem | undefined {
  return getAllWords().find((w) => w.id === id);
}

export function getSentences(): SentenceItem[] {
  return sentenceItemsFileSchema.parse(zone5SentencesData);
}

export function getSentenceById(id: string): SentenceItem | undefined {
  return getSentences().find((s) => s.id === id);
}

export function getStories(): StoryItem[] {
  return storyItemsFileSchema.parse(zone6StoriesData);
}

export function getStoryById(id: string): StoryItem | undefined {
  return getStories().find((st) => st.id === id);
}

export function getAllLessons(): Lesson[] {
  const z1 = lessonsFileSchema.parse(zone1LessonsData);
  const z2 = lessonsFileSchema.parse(zone2LessonsData);
  const z3 = lessonsFileSchema.parse(zone3LessonsData);
  const z4 = lessonsFileSchema.parse(zone4LessonsData);
  const z5 = lessonsFileSchema.parse(zone5LessonsData);
  const z6 = lessonsFileSchema.parse(zone6LessonsData);
  return [...z1, ...z2, ...z3, ...z4, ...z5, ...z6];
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

export function getZone4Lessons(): Lesson[] {
  return lessonsFileSchema.parse(zone4LessonsData);
}

export function getZone5Lessons(): Lesson[] {
  return lessonsFileSchema.parse(zone5LessonsData);
}

export function getZone6Lessons(): Lesson[] {
  return lessonsFileSchema.parse(zone6LessonsData);
}

export function getLessonById(id: string): Lesson | undefined {
  return getAllLessons().find((l) => l.id === id);
}

export function getItemById(id: string): BaseItem | undefined {
  return (
    getLetterById(id) ??
    getSyllableById(id) ??
    getWordById(id) ??
    getSentenceById(id) ??
    (getStoryById(id) as unknown as BaseItem | undefined)
  );
}

export function getBadges(): Badge[] {
  return badgesFileSchema.parse(badgesData);
}

export function getBadgeById(id: string): Badge | undefined {
  return getBadges().find((b) => b.id === id);
}
