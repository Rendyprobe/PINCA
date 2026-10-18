import React, { useState, useEffect, useRef } from 'react';
import styles from './StoryReader.module.css';
import type {
  StoryItem,
  SentenceItem,
  ActivityResult,
  UserSettings,
} from '@/types/content';
import { getSentenceById } from '@/content';
import { Button } from '@/components/Button/Button';
import { Mascot } from '@/components/Mascot/Mascot';
import { WordIllustration } from '@/components/Illustration/WordIllustration';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export interface StoryReaderProps {
  story: StoryItem;
  onComplete: (result: ActivityResult) => void;
  settings?: UserSettings;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  onComplete,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [inQuiz, setInQuiz] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const startTimeRef = useRef(Date.now());
  const isCancelledRef = useRef(false);

  const currentPage = story.pages[pageIndex];
  const pageSentences: SentenceItem[] = (currentPage?.sentenceIds ?? [])
    .map((id) => getSentenceById(id))
    .filter((s): s is SentenceItem => s !== undefined);

  const pageText = pageSentences.map((s) => s.text).join(' ');

  // Bacakan teks halaman saat ini menggunakan suara pemandu
  const speakPage = async () => {
    if (!pageText || isReading) return;
    setIsReading(true);
    isCancelledRef.current = false;

    for (const sentence of pageSentences) {
      if (isCancelledRef.current) break;
      await tts.speak(sentence.text, { rate: 0.85 });
      await new Promise((r) => setTimeout(r, 200));
    }

    setIsReading(false);
  };

  useEffect(() => {
    setIsReading(false);
    return () => {
      isCancelledRef.current = true;
      tts.cancel();
    };
  }, [pageIndex, inQuiz]);

  const handleNextPage = () => {
    sfx.playClick();
    tts.cancel();

    if (pageIndex + 1 < story.pages.length) {
      setPageIndex((prev) => prev + 1);
    } else {
      // Masuk ke kuis pemahaman cerita
      sfx.playCelebrate();
      setInQuiz(true);
      void tts.speak('Hebat! Sekarang ayo jawab pertanyaan tentang cerita ini ya!');
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      sfx.playClick();
      tts.cancel();
      setPageIndex((prev) => prev - 1);
    }
  };

  // Kuis Pemahaman Cerita
  const currentQuestion = story.questions[questionIndex];

  useEffect(() => {
    if (inQuiz && currentQuestion) {
      setSelectedOption(null);
      setIsCorrect(null);
      const timer = setTimeout(() => {
        void tts.speak(currentQuestion.prompt);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [inQuiz, questionIndex, currentQuestion]);

  const handleSelectOption = (idx: number) => {
    if (!currentQuestion || selectedOption !== null) return;
    setSelectedOption(idx);

    if (idx === currentQuestion.answerIndex) {
      setIsCorrect(true);
      sfx.playSuccessDing();
      void tts.speak('Benar sekali! Kamu pintar!');

      setTimeout(() => {
        if (questionIndex + 1 < story.questions.length) {
          setQuestionIndex((prev) => prev + 1);
        } else {
          // Kuis cerita selesai dengan sukses!
          sfx.playCelebrate();
          onComplete({
            activityType: 'story_reader',
            durationMs: Date.now() - startTimeRef.current,
            perItem: [
              {
                itemId: story.id,
                outcome: 'ok',
                attempts: 1,
                hintsUsed: 0,
              },
            ],
          });
        }
      }, 1400);
    } else {
      setIsCorrect(false);
      sfx.playClick();
      void tts.speak('Hampir! Ayo coba pilih jawaban yang lain ya!');
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 1200);
    }
  };

  if (inQuiz && currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.storyHeader}>
          <h2 className={styles.storyTitle}>Pertanyaan Cerita 🌟</h2>
          <span className={styles.pageBadge}>
            Soal {questionIndex + 1} / {story.questions.length}
          </span>
        </div>

        <div className={styles.quizContainer}>
          <Mascot mood={isCorrect ? 'senang' : 'berpikir'} size={120} />
          <p className={styles.quizPrompt}>{currentQuestion.prompt}</p>

          <div className={styles.optionsGrid}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              let statusClass = '';
              if (isSelected) {
                statusClass = (isCorrect ? styles.correct : styles.wrong) ?? '';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.optionCard} ${statusClass}`}
                  onClick={() => handleSelectOption(idx)}
                >
                  {opt.image && (
                    <span className={styles.optionImage}>{opt.image.value}</span>
                  )}
                  <span className={styles.optionText}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.storyHeader}>
        <h2 className={styles.storyTitle}>{story.title}</h2>
        <span className={styles.pageBadge}>
          Halaman {pageIndex + 1} / {story.pages.length}
        </span>
      </div>

      <div className={styles.pageCard}>
        {currentPage?.illustration && (
          <div className={styles.illustrationWrapper}>
            {currentPage.illustration.type === 'svg' ? (
              <WordIllustration
                image={currentPage.illustration}
                size={140}
              />
            ) : (
              <span className={styles.emojiIllustration}>
                {currentPage.illustration.value}
              </span>
            )}
          </div>
        )}

        <div className={styles.sentenceText}>
          {pageSentences.map((s, idx) => (
            <p key={idx} style={{ margin: '8px 0' }}>
              {s.text}
            </p>
          ))}
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="normal"
            onClick={speakPage}
            disabled={isReading}
          >
            <span>🔊</span>
            <span>{isReading ? 'Mendengarkan...' : 'Dengar Cerita'}</span>
          </Button>

          {pageIndex > 0 && (
            <Button variant="secondary" size="normal" onClick={handlePrevPage}>
              <span>⬅️</span>
              <span>Sebelumnya</span>
            </Button>
          )}

          <Button variant="primary" size="normal" onClick={handleNextPage}>
            <span>
              {pageIndex + 1 < story.pages.length
                ? 'Halaman Berikutnya ➡️'
                : 'Kuis Pemahaman 🌟'}
            </span>
          </Button>
        </div>
      </div>

      <Mascot mood={isReading ? 'semangat' : 'senang'} size={120} />
    </div>
  );
};
