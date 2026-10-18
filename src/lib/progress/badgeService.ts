import { getBadges, getZones } from '@/content';
import type { Badge } from '@/types/content';
import type { ChildProfile } from '@/lib/storage/progressStorage';

export interface EvaluatedBadge extends Badge {
  isUnlocked: boolean;
  currentProgress: number;
  totalRequired: number;
}

/**
 * Mengevaluasi seluruh lencana pencapaian berdasarkan progres profil anak.
 * Motivasi positif dan ramah anak tanpa hukuman.
 */
export function evaluateBadges(profile: ChildProfile): EvaluatedBadge[] {
  const badges = getBadges();
  const zones = getZones();
  const completedLessons = new Set(profile.completedLessonIds ?? []);
  const totalStars = Object.values(profile.lessonStars ?? {}).reduce(
    (sum, stars) => sum + (stars ?? 0),
    0,
  );

  return badges.map((badge) => {
    let currentProgress = 0;
    let totalRequired = badge.threshold;
    let isUnlocked = false;

    switch (badge.requirementType) {
      case 'lessons_completed': {
        currentProgress = completedLessons.size;
        isUnlocked = currentProgress >= totalRequired;
        break;
      }

      case 'stars_collected': {
        currentProgress = totalStars;
        isUnlocked = currentProgress >= totalRequired;
        break;
      }

      case 'zone_completed': {
        if (!badge.targetZoneId) break;
        const targetZone = zones.find((z) => z.id === badge.targetZoneId);
        if (!targetZone || targetZone.lessonIds.length === 0) break;

        totalRequired = targetZone.lessonIds.length;
        currentProgress = targetZone.lessonIds.filter((id) =>
          completedLessons.has(id),
        ).length;
        isUnlocked = currentProgress >= totalRequired;
        break;
      }
    }

    return {
      ...badge,
      isUnlocked,
      currentProgress: Math.min(currentProgress, totalRequired),
      totalRequired,
    };
  });
}

/**
 * Menghitung jumlah total lencana yang sudah diraih.
 */
export function countUnlockedBadges(profile: ChildProfile): {
  unlocked: number;
  total: number;
} {
  const evaluated = evaluateBadges(profile);
  const unlocked = evaluated.filter((b) => b.isUnlocked).length;
  return { unlocked, total: evaluated.length };
}

