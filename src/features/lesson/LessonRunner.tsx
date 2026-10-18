import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './LessonRunner.module.css';
import { getLessonById, getItemById, getStoryById } from '@/content';
import type {
  BaseItem,
  LetterItem,
  SyllableItem,
  WordItem,
  StoryItem,
  ActivityResult,
  ActivityResultItem,
  UserSettings,
} from '@/types/content';
import { ListenTap } from '@/features/activities/ListenTap/ListenTap';
import { MatchCase } from '@/features/activities/MatchCase/MatchCase';
import { SoundGuess } from '@/features/activities/SoundGuess/SoundGuess';
import { MatchPictureWord } from '@/features/activities/MatchPictureWord/MatchPictureWord';
import { ArrangeSyllables } from '@/features/activities/ArrangeSyllables/ArrangeSyllables';
import { CompleteWord } from '@/features/activities/CompleteWord/CompleteWord';
import { KaraokeRead } from '@/features/activities/KaraokeRead/KaraokeRead';
import { SpeechReadCheck } from '@/features/activities/SpeechReadCheck/SpeechReadCheck';
import { StoryReader } from '@/features/activities/StoryReader/StoryReader';
import { Button } from '@/components/Button/Button';
import { StarBar } from '@/components/StarBar/StarBar';
import { Mascot } from '@/components/Mascot/Mascot';
import { Confetti } from '@/components/Confetti/Confetti';
import { progressService } from '@/lib/progress/progressService';
import { progressStorage } from '@/lib/storage/progressStorage';
import { evaluateBadges, type EvaluatedBadge } from '@/lib/progress/badgeService';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

const DEFAULT_SETTINGS: UserSettings = {
  readingMode: 'syllables',
  difficultyThreshold: 'easy',
  ttsRate: 0.8,
  fontSize: 'large',
  fontFamily: 'default',
  soundEnabled: true,
  micEnabled: true,
};

export const LessonRunner: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const lesson = lessonId ? getLessonById(lessonId) : undefined;
  const [activityIndex, setActivityIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [newBadges, setNewBadges] = useState<EvaluatedBadge[]>([]);
  const [userSettings, setUserSettings] =
    useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    void progressStorage.getActiveProfile().then((profile) => {
      if (active && profile?.settings) {
        setUserSettings(profile.settings);
        if (profile.settings.ttsRate) {
          tts.setDefaultRate(profile.settings.ttsRate);
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const accumulatedResults = useRef<ActivityResultItem[]>([]);

  const lessonItems: BaseItem[] = (lesson?.itemIds ?? [])
    .map((id) => getItemById(id))
    .filter((it): it is BaseItem => it !== undefined);

  useEffect(() => {
    if (!lesson) {
      void tts.speak('Pelajaran tidak ditemukan!');
    }
  }, [lesson]);

  if (!lesson || !lessonItems.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Pelajaran Tidak Ditemukan</h2>
        <div style={{ marginTop: '20px' }}>
          <Button onClick={() => navigate('/map')}>
            Kembali ke Peta Belajar
          </Button>
        </div>
      </div>
    );
  }

  const currentActivity = lesson.activities[activityIndex];
  const progressPercent =
    ((activityIndex + (isCompleted ? 1 : 0)) / lesson.activities.length) * 100;

  const handleActivityComplete = async (result: ActivityResult) => {
    accumulatedResults.current.push(...result.perItem);

    // Rekam progres item per huruf/suku-kata/kata
    for (const res of result.perItem) {
      await progressService.recordItemOutcome(res.itemId, res.outcome);
    }

    if (activityIndex + 1 < lesson.activities.length) {
      setActivityIndex((prev) => prev + 1);
    } else {
      // Seluruh aktivitas dalam pelajaran ini selesai!
      const allOutcomes = accumulatedResults.current.map((r) => r.outcome);
      const totalHints = accumulatedResults.current.reduce(
        (sum, r) => sum + r.hintsUsed,
        0,
      );

      const profileBefore = await progressStorage.getActiveProfile();
      const prevUnlockedIds = new Set(
        profileBefore
          ? evaluateBadges(profileBefore)
              .filter((b) => b.isUnlocked)
              .map((b) => b.id)
          : [],
      );

      const stars = progressService.calculateStars(allOutcomes, totalHints);
      setEarnedStars(stars);
      setIsCompleted(true);

      await progressService.completeLesson(lesson.id, stars);

      const updatedProfile = await progressStorage.getActiveProfile();
      const newlyUnlocked = updatedProfile
        ? evaluateBadges(updatedProfile).filter(
            (b) => b.isUnlocked && !prevUnlockedIds.has(b.id),
          )
        : [];
      setNewBadges(newlyUnlocked);

      sfx.playCelebrate();
      setTimeout(() => {
        sfx.playStarPop();
      }, 500);

      const starWord = ['nol', 'satu', 'dua', 'tiga'][stars] ?? 'tiga';
      const firstBadge = newlyUnlocked[0];
      const badgePraise = firstBadge
        ? ` dan stiker baru ${firstBadge.title}!`
        : '!';
      void tts.speak(
        `Hore! Kamu hebat sekali! Kamu mendapat ${starWord} bintang${badgePraise}`,
      );
    }
  };

  const handleBackToMap = () => {
    sfx.playClick();
    tts.cancel();
    navigate('/map');
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Button
          variant="secondary"
          size="normal"
          onClick={handleBackToMap}
          ariaLabel="Kembali ke Peta Belajar"
        >
          <span>⬅️</span>
          <span>Kembali</span>
        </Button>
        <span className={styles.lessonTitle}>{lesson.title}</span>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
          Tahap {activityIndex + 1} / {lesson.activities.length}
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isCompleted && currentActivity ? (
        <div className={styles.activityCard}>
          {currentActivity.type === 'listen_tap' && (
            <ListenTap
              items={lessonItems as (LetterItem | SyllableItem)[]}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'match_case' && (
            <MatchCase
              items={lessonItems as LetterItem[]}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'sound_guess' && (
            <SoundGuess
              items={lessonItems as LetterItem[]}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'match_picture_word' && (
            <MatchPictureWord
              items={lessonItems as WordItem[]}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'arrange_syllables' && (
            <ArrangeSyllables
              items={lessonItems as WordItem[]}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'complete_word' && (
            <CompleteWord
              items={lessonItems as WordItem[]}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'karaoke_read' && (
            <KaraokeRead
              items={lessonItems}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'speech_check' && (
            <SpeechReadCheck
              items={lessonItems}
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}

          {currentActivity.type === 'story_reader' && (
            <StoryReader
              story={
                (getStoryById(lesson.itemIds[0] ?? '') ??
                  (lessonItems[0] as unknown as StoryItem)) as StoryItem
              }
              onComplete={handleActivityComplete}
              settings={userSettings}
            />
          )}
        </div>
      ) : (
        <div className={styles.celebrationCard} style={{ position: 'relative' }}>
          <Confetti count={32} />
          <Mascot
            mood="merayakan"
            speechBubble="Luar biasa! Kamu pintar sekali!"
            size={180}
          />
          <h2 className={styles.celebrationTitle}>Pelajaran Selesai! 🎉</h2>
          <p className={styles.celebrationSubtitle}>
            Kamu telah menyelesaikan semua aktivitas di {lesson.title}
          </p>

          <StarBar stars={earnedStars} size="large" />

          {newBadges[0] && (
            <div className={styles.newBadgeCard}>
              <span className={styles.newBadgeIcon}>{newBadges[0].icon}</span>
              <div className={styles.newBadgeInfo}>
                <span className={styles.newBadgeTag}>🏆 STIKER BARU DIRAIH!</span>
                <span className={styles.newBadgeTitle}>
                  {newBadges[0].title}
                </span>
                <span className={styles.newBadgeDesc}>
                  {newBadges[0].description}
                </span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <Button variant="primary" size="large" onClick={handleBackToMap}>
              Lanjut Petualangan! 🚀
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
