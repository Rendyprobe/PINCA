import React, { useState, useEffect, useRef } from 'react';
import styles from './MatchCase.module.css';
import type {
  ActivityProps,
  LetterItem,
  ActivityResultItem,
} from '@/types/content';
import { getLetters, getRandomPraise, getRandomHint } from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export const MatchCase: React.FC<ActivityProps<LetterItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<LetterItem[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const startTimeRef = useRef(Date.now());
  const attemptsRef = useRef<Record<string, number>>({});
  const hintsUsedRef = useRef<Record<string, number>>({});
  const resultsRef = useRef<ActivityResultItem[]>([]);

  const currentItem = items[currentIndex];
  const allLetters = useRef(getLetters()).current;

  useEffect(() => {
    if (!currentItem) return;

    // Distraktor: jika b, p, d, q berikan pasangan yang mirip jika relevan, atau huruf acak
    const distractors = allLetters
      .filter((l) => l.id !== currentItem.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const merged = [currentItem, ...distractors].sort(
      () => 0.5 - Math.random(),
    );
    setOptions(merged);
    setIsCorrect(null);
    setShakeId(null);
    setWrongIds([]);

    if (currentIndex === 0) {
      const promptText = `Pasangkan huruf besar dengan huruf kecil yang tepat ya!`;
      void tts.speak(promptText, { rate: 0.75 });
    }

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [currentIndex, currentItem, allLetters, items.length, onProgress]);

  const handleSelect = (chosen: LetterItem) => {
    if (!currentItem || isCorrect) return;

    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;

    if (chosen.id === currentItem.id) {
      setIsCorrect(true);
      sfx.playSuccessDing();
      const praise = getRandomPraise();
      void tts.speak(praise);

      const totalAttempts = attemptsRef.current[itemId] ?? 1;
      const totalHints = hintsUsedRef.current[itemId] ?? 0;
      const outcome =
        totalAttempts === 1 ? 'ok' : totalAttempts <= 3 ? 'almost' : 'assisted';

      resultsRef.current.push({
        itemId,
        outcome,
        attempts: totalAttempts,
        hintsUsed: totalHints,
      });

      setTimeout(() => {
        if (currentIndex + 1 < items.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onComplete({
            activityType: 'match_case',
            perItem: resultsRef.current,
            durationMs: Date.now() - startTimeRef.current,
          });
        }
      }, 1500);
    } else {
      sfx.playClick();
      setShakeId(chosen.id);
      setTimeout(() => setShakeId(null), 400);
      setWrongIds((prev) =>
        prev.includes(chosen.id) ? prev : [...prev, chosen.id],
      );
      const hint = getRandomHint();
      void tts.speak(`Hampir! ${hint}. Ayo coba lagi!`);
    }
  };

  if (!currentItem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.targetCard}>
        <span className={styles.targetLetter}>{currentItem.upper}</span>
        <span className={styles.targetLabel}>Huruf Besar</span>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 'var(--font-size-lg)',
        }}
      >
        Pilih bentuk huruf kecilnya:
      </div>

      <div className={styles.optionsGrid}>
        {options.map((opt) => {
          const isTarget = opt.id === currentItem.id;
          const isCardCorrect = isTarget && isCorrect;
          const isCardShaking = shakeId === opt.id;
          const isWrong = wrongIds.includes(opt.id);
          const showHint =
            isTarget &&
            !isCorrect &&
            (wrongIds.length > 0 ||
              (hintsUsedRef.current[currentItem.id] ?? 0) > 0);

          const btnClass = [
            styles.optionBtn,
            isCardCorrect ? styles.optionCorrect : '',
            showHint ? styles.optionHint : '',
            isWrong && !isCardCorrect ? styles.optionWrong : '',
            isCardShaking ? styles.optionShake : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={opt.id}
              type="button"
              className={btnClass}
              onClick={() => handleSelect(opt)}
              aria-label={`Pilih huruf kecil ${opt.lower}`}
            >
              {isCardCorrect && (
                <span className={styles.correctBadge}>✓ Benar!</span>
              )}
              {showHint && !isCardCorrect && (
                <span className={styles.hintBadge}>⭐ Ini dia!</span>
              )}
              <span>{opt.lower}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
