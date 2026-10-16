import React, { useState, useEffect, useRef } from 'react';
import styles from './CompleteWord.module.css';
import type {
  ActivityProps,
  WordItem,
  ActivityResultItem,
} from '@/types/content';
import { getSyllables, getRandomPraise, getRandomHint } from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export const CompleteWord: React.FC<ActivityProps<WordItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [missingIndex, setMissingIndex] = useState<number>(1);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeText, setShakeText] = useState<string | null>(null);
  const [wrongTexts, setWrongTexts] = useState<string[]>([]);

  const startTimeRef = useRef(Date.now());
  const attemptsRef = useRef<Record<string, number>>({});
  const hintsUsedRef = useRef<Record<string, number>>({});
  const resultsRef = useRef<ActivityResultItem[]>([]);

  const currentItem = items[currentIndex];
  const allSyllables = useRef(getSyllables()).current;

  useEffect(() => {
    if (!currentItem || !currentItem.syllables.length) return;

    // Tentukan suku kata mana yang hilang (indeks 0 atau 1)
    const missingIdx = currentItem.syllables.length > 1 ? 1 : 0;
    const targetSyl = currentItem.syllables[missingIdx] ?? currentItem.text;

    // Ambil 2 distraktor acak dari bank suku kata
    const distractors = allSyllables
      .filter((s) => s.text !== targetSyl)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map((s) => s.text);

    const merged = [targetSyl, ...distractors].sort(() => 0.5 - Math.random());

    setMissingIndex(missingIdx);
    setOptions(merged);
    setSelectedText(null);
    setIsCorrect(null);
    setShakeText(null);
    setWrongTexts([]);

    const promptText = `Lengkapi kata ${currentItem.text}! Suku kata apa yang hilang?`;
    void tts.speak(promptText, { rate: 0.8 });

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [currentIndex, currentItem, allSyllables, items.length, onProgress]);

  const targetSyl = currentItem?.syllables[missingIndex];

  const handleSelect = (chosen: string) => {
    if (!currentItem || isCorrect || !targetSyl) return;

    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;
    setSelectedText(chosen);

    if (chosen.toLowerCase() === targetSyl.toLowerCase()) {
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
            activityType: 'complete_word',
            perItem: resultsRef.current,
            durationMs: Date.now() - startTimeRef.current,
          });
        }
      }, 1600);
    } else {
      sfx.playClick();
      setShakeText(chosen);
      setTimeout(() => setShakeText(null), 400);
      setWrongTexts((prev) =>
        prev.includes(chosen) ? prev : [...prev, chosen],
      );
      const hint = getRandomHint();
      void tts.speak(`Hampir! ${hint}. Ayo coba lagi!`);
    }
  };

  const handleReplay = () => {
    if (!currentItem) return;
    sfx.playClick();
    const itemId = currentItem.id;
    hintsUsedRef.current[itemId] = (hintsUsedRef.current[itemId] ?? 0) + 1;
    void tts.speak(
      `Kata ${currentItem.text}: ${currentItem.syllables.join('... ')}`,
      {
        rate: 0.75,
      },
    );
  };

  if (!currentItem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.wordCard}>
        {currentItem.image && (
          <span
            className={styles.emoji}
            role="img"
            aria-label={currentItem.image.alt}
          >
            {currentItem.image.value}
          </span>
        )}

        <div className={styles.syllablesDisplay}>
          {currentItem.syllables.map((syl, idx) => {
            if (idx === missingIndex) {
              return (
                <div
                  key={idx}
                  className={`${styles.missingSlot} ${isCorrect ? styles.missingSlotFilled : ''}`}
                >
                  {isCorrect ? selectedText : '?'}
                </div>
              );
            }
            return (
              <span key={idx} className={styles.knownSyllable}>
                {syl}
              </span>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleReplay}
          style={{
            fontSize: '0.9rem',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            border: '2px solid var(--color-border)',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          🔊 Dengar Kata
        </button>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 'var(--font-size-lg)',
        }}
      >
        Pilih suku kata yang hilang:
      </div>

      <div className={styles.optionsGrid}>
        {options.map((opt) => {
          const isTarget = opt.toLowerCase() === targetSyl?.toLowerCase();
          const isCardCorrect = isTarget && isCorrect;
          const isCardShaking = shakeText === opt;
          const isWrong = wrongTexts.includes(opt);
          const showHint =
            isTarget &&
            !isCorrect &&
            (wrongTexts.length > 0 ||
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
              key={opt}
              type="button"
              className={btnClass}
              onClick={() => handleSelect(opt)}
              aria-label={`Pilih suku kata ${opt}`}
            >
              {isCardCorrect && (
                <span className={styles.correctBadge}>✓ Benar!</span>
              )}
              {showHint && !isCardCorrect && (
                <span className={styles.hintBadge}>⭐ Ini dia!</span>
              )}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
