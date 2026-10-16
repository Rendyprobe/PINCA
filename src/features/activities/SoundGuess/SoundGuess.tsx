import React, { useState, useEffect, useRef } from 'react';
import styles from './SoundGuess.module.css';
import type {
  ActivityProps,
  LetterItem,
  ActivityResultItem,
} from '@/types/content';
import {
  getLetters,
  getWordById,
  getRandomPraise,
  getRandomHint,
} from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export const SoundGuess: React.FC<ActivityProps<LetterItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<LetterItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const startTimeRef = useRef(Date.now());
  const attemptsRef = useRef<Record<string, number>>({});
  const hintsUsedRef = useRef<Record<string, number>>({});
  const resultsRef = useRef<ActivityResultItem[]>([]);

  const currentItem = items[currentIndex];
  const allLetters = useRef(getLetters()).current;
  const exampleWord = currentItem
    ? getWordById(currentItem.exampleWordId)
    : undefined;

  useEffect(() => {
    if (!currentItem) return;

    const distractors = allLetters
      .filter((l) => l.id !== currentItem.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const merged = [currentItem, ...distractors].sort(
      () => 0.5 - Math.random(),
    );
    setOptions(merged);
    setSelectedId(null);
    setIsCorrect(null);
    setShakeId(null);

    const wordName = exampleWord?.text ?? currentItem.text;
    const promptText = `Ini gambar ${wordName}. Huruf awal kata ${wordName} adalah...?`;
    void tts.speak(promptText, { rate: 0.75 });

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [
    currentIndex,
    currentItem,
    allLetters,
    exampleWord,
    items.length,
    onProgress,
  ]);

  const handleReplay = () => {
    if (!currentItem) return;
    sfx.playClick();
    const wordName = exampleWord?.text ?? currentItem.text;
    void tts.speak(`Kata ${wordName}. Huruf awalnya apa ya?`, { rate: 0.75 });
  };

  const handleSelect = (chosen: LetterItem) => {
    if (!currentItem || isCorrect) return;

    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;
    setSelectedId(chosen.id);

    if (chosen.id === currentItem.id) {
      setIsCorrect(true);
      sfx.playSuccessDing();
      const praise = getRandomPraise();
      const wordName = exampleWord?.text ?? currentItem.text;
      void tts.speak(
        `${praise} Benar sekali! ${currentItem.upper} untuk ${wordName}!`,
      );

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
            activityType: 'sound_guess',
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
        {exampleWord?.image && (
          <span
            className={styles.exampleEmoji}
            role="img"
            aria-label={exampleWord.image.alt}
          >
            {exampleWord.image.value}
          </span>
        )}
        <span className={styles.wordTitle}>
          {exampleWord?.text ?? currentItem.text}
        </span>
        <button
          type="button"
          onClick={handleReplay}
          style={{
            fontSize: '1rem',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            border: '2px solid var(--color-border)',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          🔊 Ulangi Suara
        </button>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 'var(--font-size-lg)',
        }}
      >
        Pilih huruf awal yang tepat:
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
              aria-label={`Pilih huruf ${opt.upper}`}
            >
              <span>{opt.upper}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
