import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './LessonRunner.module.css';
import { getLessonById, getItemById } from '@/content';
import type {
  BaseItem,
  LetterItem,
  WordItem,
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
import { Button } from '@/components/Button/Button';
import { StarBar } from '@/components/StarBar/StarBar';
import { Mascot } from '@/components/Mascot/Mascot';
import { progressService } from '@/lib/progress/progressService';
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

      const stars = progressService.calculateStars(allOutcomes, totalHints);
      setEarnedStars(stars);
      setIsCompleted(true);

      await progressService.completeLesson(lesson.id, stars);

      sfx.playCelebrate();
      setTimeout(() => {
        sfx.playStarPop();
      }, 500);

      void tts.speak(
        `Hore! Kamu hebat sekali! Kamu mendapat ${['nol', 'satu', 'dua', 'tiga'][stars]} bintang!`,
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
              items={lessonItems as LetterItem[]}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'match_case' && (
            <MatchCase
              items={lessonItems as LetterItem[]}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'sound_guess' && (
            <SoundGuess
              items={lessonItems as LetterItem[]}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'match_picture_word' && (
            <MatchPictureWord
              items={lessonItems as WordItem[]}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'arrange_syllables' && (
            <ArrangeSyllables
              items={lessonItems as WordItem[]}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'complete_word' && (
            <CompleteWord
              items={lessonItems as WordItem[]}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'karaoke_read' && (
            <KaraokeRead
              items={lessonItems}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}

          {currentActivity.type === 'speech_check' && (
            <SpeechReadCheck
              items={lessonItems}
              onComplete={handleActivityComplete}
              settings={DEFAULT_SETTINGS}
            />
          )}
        </div>
      ) : (
        <div className={styles.celebrationCard}>
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
