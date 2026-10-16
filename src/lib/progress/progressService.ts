import {
  progressStorage,
  type ItemProgress,
  type ChildProfile,
} from '@/lib/storage/progressStorage';
import type { ItemOutcome } from '@/types/content';

export class ProgressService {
  /**
   * Menghitung nilai mastery 0..1 dari riwayat percobaan terbaru
   * dengan bobot eksponensial lebih besar pada percobaan paling akhir.
   */
  public calculateMastery(recent: ItemOutcome[]): number {
    if (!recent.length) return 0;

    const weights = [1, 1.2, 1.5, 1.8, 2.2, 2.6, 3.1, 3.7, 4.4, 5.3].slice(
      0,
      recent.length,
    );
    let totalScore = 0;
    let totalWeight = 0;

    recent.forEach((outcome, idx) => {
      const w = weights[idx] ?? 1;
      let score = 0;
      switch (outcome) {
        case 'ok':
          score = 1.0;
          break;
        case 'almost':
          score = 0.6;
          break;
        case 'assisted':
          score = 0.4;
          break;
        case 'miss':
          score = 0.0;
          break;
      }
      totalScore += score * w;
      totalWeight += w;
    });

    return totalWeight > 0
      ? Math.round((totalScore / totalWeight) * 100) / 100
      : 0;
  }

  /**
   * Merekam hasil percobaan membaca/menjawab untuk suatu item
   */
  public async recordItemOutcome(
    itemId: string,
    outcome: ItemOutcome,
  ): Promise<ItemProgress> {
    const existing = (await progressStorage.getItemProgress(itemId)) ?? {
      itemId,
      attempts: 0,
      successes: 0,
      assistedSuccesses: 0,
      recent: [],
      mastery: 0,
      lastSeenAt: 0,
      nextDueAt: 0,
    };

    const newAttempts = existing.attempts + 1;
    const newSuccesses =
      outcome === 'ok' ? existing.successes + 1 : existing.successes;
    const newAssisted =
      outcome === 'assisted'
        ? existing.assistedSuccesses + 1
        : existing.assistedSuccesses;

    const newRecent = [...existing.recent, outcome].slice(-10);
    const newMastery = this.calculateMastery(newRecent);

    // Hitung jadwal pengulangan berjarak (hari)
    const daysUntilNext = newMastery >= 0.85 ? 7 : newMastery >= 0.6 ? 3 : 1;
    const nextDueAt = Date.now() + daysUntilNext * 24 * 60 * 60 * 1000;

    const updated: ItemProgress = {
      ...existing,
      attempts: newAttempts,
      successes: newSuccesses,
      assistedSuccesses: newAssisted,
      recent: newRecent,
      mastery: newMastery,
      lastSeenAt: Date.now(),
      nextDueAt,
    };

    await progressStorage.saveItemProgress(updated);
    return updated;
  }

  /**
   * Menghitung perolehan 1-3 bintang berdasarkan akurasi dan bantuan
   */
  public calculateStars(
    outcomes: ItemOutcome[],
    totalHintsUsed: number,
  ): number {
    if (!outcomes.length) return 1;

    const okCount = outcomes.filter((o) => o === 'ok').length;
    const okRatio = okCount / outcomes.length;

    // 3 Bintang: akurasi >= 80% dan minim bantuan (<= 1 petunjuk)
    if (okRatio >= 0.8 && totalHintsUsed <= 1) {
      return 3;
    }

    // 2 Bintang: akurasi >= 60%
    if (okRatio >= 0.6) {
      return 2;
    }

    // 1 Bintang: selesai dengan bantuan (tidak pernah 0 bintang / anak selalu merasa berhasil)
    return 1;
  }

  /**
   * Menyelesaikan pelajaran dan memperbarui profil anak
   */
  public async completeLesson(
    lessonId: string,
    stars: number,
  ): Promise<ChildProfile> {
    const profile = await progressStorage.getActiveProfile();

    const completed = new Set(profile.completedLessonIds);
    completed.add(lessonId);

    const prevStars = profile.lessonStars[lessonId] ?? 0;
    const newStars = Math.max(prevStars, stars);

    const updatedProfile: ChildProfile = {
      ...profile,
      completedLessonIds: Array.from(completed),
      lessonStars: {
        ...profile.lessonStars,
        [lessonId]: newStars,
      },
    };

    await progressStorage.saveProfile(updatedProfile);
    return updatedProfile;
  }
}

export const progressService = new ProgressService();
