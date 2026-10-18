import { describe, it, expect } from 'vitest';
import { evaluateBadges, countUnlockedBadges } from '@/lib/progress/badgeService';
import type { ChildProfile } from '@/lib/storage/progressStorage';

describe('Badge Service Evaluator', () => {
  const baseProfile: ChildProfile = {
    id: 'test_child',
    name: 'Budi',
    avatar: '🐰',
    createdAt: Date.now(),
    activeZoneId: 'zone_1',
    completedLessonIds: [],
    lessonStars: {},
  };

  it('starts with 0 unlocked badges for fresh profile', () => {
    const { unlocked, total } = countUnlockedBadges(baseProfile);
    expect(unlocked).toBe(0);
    expect(total).toBeGreaterThanOrEqual(8);
  });

  it('unlocks badge_first_step when 1 lesson is completed', () => {
    const profile: ChildProfile = {
      ...baseProfile,
      completedLessonIds: ['lesson_1_vowels'],
      lessonStars: { lesson_1_vowels: 3 },
    };

    const badges = evaluateBadges(profile);
    const firstStep = badges.find((b) => b.id === 'badge_first_step');
    expect(firstStep?.isUnlocked).toBe(true);
    expect(firstStep?.currentProgress).toBe(1);
  });

  it('unlocks star collector badges when star threshold is reached', () => {
    const profile: ChildProfile = {
      ...baseProfile,
      completedLessonIds: ['l1', 'l2', 'l3', 'l4'],
      lessonStars: {
        l1: 3,
        l2: 3,
        l3: 3,
        l4: 2, // Total 11 stars
      },
    };

    const badges = evaluateBadges(profile);
    const star10 = badges.find((b) => b.id === 'badge_star_collector_10');
    const star25 = badges.find((b) => b.id === 'badge_star_collector_25');

    expect(star10?.isUnlocked).toBe(true);
    expect(star25?.isUnlocked).toBe(false);
    expect(star25?.currentProgress).toBe(11);
    expect(star25?.totalRequired).toBe(25);
  });

  it('unlocks zone_1 badge when all zone 1 lessons are completed', () => {
    const profile: ChildProfile = {
      ...baseProfile,
      completedLessonIds: [
        'lesson_1_vowels',
        'lesson_1_consonants_1',
        'lesson_1_consonants_2',
        'lesson_1_consonants_3',
        'lesson_1_consonants_4',
        'lesson_1_consonants_5',
      ],
      lessonStars: {},
    };

    const badges = evaluateBadges(profile);
    const z1Badge = badges.find((b) => b.id === 'badge_vowel_master');
    expect(z1Badge?.isUnlocked).toBe(true);
    expect(z1Badge?.currentProgress).toBe(z1Badge?.totalRequired);
  });
});

