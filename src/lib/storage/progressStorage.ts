import { openDB, type IDBPDatabase } from 'idb';
import type { ItemOutcome, UserSettings } from '@/types/content';

export interface ItemProgress {
  itemId: string;
  attempts: number;
  successes: number;
  assistedSuccesses: number;
  recent: ItemOutcome[]; // max 10
  mastery: number; // 0..1
  lastSeenAt: number;
  nextDueAt: number;
  confusions?: string[];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  readingMode: 'syllables',
  difficultyThreshold: 'easy',
  ttsRate: 0.85,
  fontSize: 'large',
  fontFamily: 'default',
  soundEnabled: true,
  micEnabled: true,
};

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
  activeZoneId: string;
  completedLessonIds: string[];
  lessonStars: Record<string, number>; // lessonId -> stars (1..3)
  settings?: UserSettings;
  unlockedAllLessons?: boolean;
}

const DB_NAME = 'ayo-membaca';
const DB_VERSION = 1;
const LS_PROFILE_KEY = 'ayo_membaca_active_profile';
const LS_PROGRESS_KEY = 'ayo_membaca_item_progress';

export class ProgressStorage {
  private dbPromise: Promise<IDBPDatabase | null>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return null;
    }

    try {
      return await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('profiles')) {
            db.createObjectStore('profiles', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('progress')) {
            db.createObjectStore('progress', { keyPath: 'itemId' });
          }
        },
      });
    } catch {
      return null;
    }
  }

  public async getActiveProfile(): Promise<ChildProfile> {
    const defaultProfile: ChildProfile = {
      id: 'default_child',
      name: 'Teman',
      avatar: '🦉',
      createdAt: Date.now(),
      activeZoneId: 'zone_1',
      completedLessonIds: [],
      lessonStars: {},
      settings: { ...DEFAULT_USER_SETTINGS },
      unlockedAllLessons: false,
    };

    try {
      const db = await this.dbPromise;
      if (db) {
        const stored = (await db.get('profiles', defaultProfile.id)) as
          ChildProfile | undefined;
        if (stored) {
          return {
            ...defaultProfile,
            ...stored,
            settings: {
              ...DEFAULT_USER_SETTINGS,
              ...(stored.settings ?? {}),
            },
          };
        }
      }
    } catch {
      // Fallback to localStorage below
    }

    if (typeof window !== 'undefined') {
      const lsRaw = localStorage.getItem(LS_PROFILE_KEY);
      if (lsRaw) {
        try {
          const stored = JSON.parse(lsRaw) as ChildProfile;
          return {
            ...defaultProfile,
            ...stored,
            settings: {
              ...DEFAULT_USER_SETTINGS,
              ...(stored.settings ?? {}),
            },
          };
        } catch {
          // ignore error
        }
      }
    }

    // Save default profile initially
    await this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  public async saveProfile(profile: ChildProfile): Promise<void> {
    try {
      const db = await this.dbPromise;
      if (db) {
        await db.put('profiles', profile);
      }
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile));
    }
  }

  public async getItemProgress(itemId: string): Promise<ItemProgress | null> {
    try {
      const db = await this.dbPromise;
      if (db) {
        const res = await db.get('progress', itemId);
        if (res) return res as ItemProgress;
      }
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(`${LS_PROGRESS_KEY}_${itemId}`);
      if (raw) {
        try {
          return JSON.parse(raw) as ItemProgress;
        } catch {
          // ignore
        }
      }
    }

    return null;
  }

  public async saveItemProgress(progress: ItemProgress): Promise<void> {
    try {
      const db = await this.dbPromise;
      if (db) {
        await db.put('progress', progress);
      }
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `${LS_PROGRESS_KEY}_${progress.itemId}`,
        JSON.stringify(progress),
      );
    }
  }
}

export const progressStorage = new ProgressStorage();
