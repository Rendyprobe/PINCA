import React, { useState, useEffect, useRef } from 'react';
import styles from './MatchPictureWord.module.css';
import type {
  ActivityProps,
  WordItem,
  ActivityResultItem,
} from '@/types/content';
import { getAllWords, getRandomPraise, getRandomHint } from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export const MatchPictureWord: React.FC<ActivityProps<WordItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<WordItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const startTimeRef = useRef(Date.now());
  const attemptsRef = useRef<Record<string, number>>({});
  const hintsUsedRef = useRef<Record<string, number>>({});
  const resultsRef = useRef<ActivityResultItem[]>([]);

  const currentItem = items[currentIndex];
  const allWords = useRef(getAllWords()).current;

  useEffect(() => {
    if (!currentItem) return;

    // Distraktor: 2 kata lain dari bank kata
    const distractors = allWords
      .filter((w) => w.id !== currentItem.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const merged = [currentItem, ...distractors].sort(
      () => 0.5 - Math.random(),
    );
    setOptions(merged);
    setSelectedId(null);
    setIsCorrect(null);
    setShakeId(null);

    const promptText = 'Pilih kata yang cocok dengan gambar ini ya!';
    void tts.speak(promptText, { rate: 0.8 });

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [currentIndex, currentItem, allWords, items.length, onProgress]);

  const handleReplay = () => {
    if (!currentItem) return;
    sfx.playClick();
    const itemId = currentItem.id;
    hintsUsedRef.current[itemId] = (hintsUsedRef.current[itemId] ?? 0) + 1;
    void tts.speak(`Ini gambar ${currentItem.text}. Mana tulisannya?`, {
      rate: 0.75,
    });
  };

  const handleSelect = (chosen: WordItem) => {
    if (!currentItem || isCorrect) return;

    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;
    setSelectedId(chosen.id);

    if (chosen.id === currentItem.id) {
      setIsCorrect(true);
      sfx.playSuccessDing();
      const praise = getRandomPraise();
      void tts.speak(`${praise} Benar! Ini kata ${currentItem.text}!`);

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
            activityType: 'match_picture_word',
            perItem: resultsRef.current,
            durationMs: Date.now() - startTimeRef.current,
          });
        }
      }, 1500);
    } else {
      sfx.playClick();
      setShakeId(chosen.id);
      setTimeout(() => setShakeId(null), 400);
      const hint = getRandomHint();
      void tts.speak(`Hampir! ${hint}. Coba lagi ya!`);
    }
  };

  if (!currentItem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.imageCard}>
        {currentItem.image && (
          <span
            className={styles.emojiDisplay}
            role="img"
            aria-label={currentItem.image.alt}
          >
            {currentItem.image.value}
          </span>
        )}
        <span className={styles.promptText}>Gambar apakah ini?</span>
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
          🔊 Dengar Petunjuk
        </button>
      </div>

      <div className={styles.optionsGrid}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCardCorrect = isSelected && isCorrect;
          const isCardShaking = shakeId === opt.id;

          const btnClass = [
            styles.optionBtn,
            isCardCorrect ? styles.optionCorrect : '',
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
              aria-label={`Pilih kata ${opt.text}`}
            >
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
