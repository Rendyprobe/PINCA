import React, { useState, useEffect, useRef } from 'react';
import styles from './KaraokeRead.module.css';
import type {
  ActivityProps,
  BaseItem,
  WordItem,
  ActivityResultItem,
} from '@/types/content';
import { Button } from '@/components/Button/Button';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export const KaraokeRead: React.FC<ActivityProps<BaseItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [allDone, setAllDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<ActivityResultItem[]>([]);
  const isCancelledRef = useRef(false);

  const currentItem = items[currentIndex];
  const syllables: string[] =
    currentItem && 'syllables' in currentItem
      ? (currentItem as WordItem).syllables
      : currentItem
        ? [currentItem.text]
        : [];

  const wordImage =
    currentItem && 'image' in currentItem && currentItem.image
      ? currentItem.image
      : undefined;

  // Mulai pembacaan karaoke per suku kata
  const startKaraoke = async () => {
    if (!currentItem || isPlaying) return;

    setIsPlaying(true);
    setAllDone(false);
    isCancelledRef.current = false;

    for (let i = 0; i < syllables.length; i++) {
      if (isCancelledRef.current) break;

      setHighlightIndex(i);
      const syl = syllables[i] ?? '';
      await tts.speak(syl, { rate: 0.75 });

      // Jeda lembut antar suku kata
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!isCancelledRef.current) {
      // Seluruh suku kata terbaca! Nyalakan seluruh kata hijau
      setHighlightIndex(syllables.length);
      setAllDone(true);
      sfx.playSuccessDing();

      await new Promise((r) => setTimeout(r, 150));
      await tts.speak(currentItem.text, { rate: 0.85 });
    }

    setIsPlaying(false);
  };

  useEffect(() => {
    if (!currentItem) return;

    setHighlightIndex(-1);
    setAllDone(false);
    setIsPlaying(false);

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }

    // Putar karaoke otomatis saat item pertama kali muncul
    const timer = setTimeout(() => {
      void startKaraoke();
    }, 400);

    return () => {
      clearTimeout(timer);
      isCancelledRef.current = true;
      tts.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentItem]);

  const handleNext = () => {
    if (!currentItem) return;

    sfx.playClick();
    tts.cancel();
    isCancelledRef.current = true;

    resultsRef.current.push({
      itemId: currentItem.id,
      outcome: 'ok',
      attempts: 1,
      hintsUsed: 0,
    });

    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete({
        activityType: 'karaoke_read',
        perItem: resultsRef.current,
        durationMs: Date.now() - startTimeRef.current,
      });
    }
  };

  if (!currentItem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {wordImage && (
          <span
            className={styles.wordImage}
            role="img"
            aria-label={wordImage.alt}
          >
            {wordImage.value}
          </span>
        )}

        <div className={styles.syllablesRow}>
          {syllables.map((syl, idx) => {
            const isActive = highlightIndex === idx;
            const isDone = allDone || highlightIndex > idx;

            const sylClass = [
              styles.syllableBlock,
              isActive ? styles.syllableActive : '',
              isDone ? styles.syllableDone : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <span key={idx} className={sylClass}>
                {syl}
              </span>
            );
          })}
        </div>

        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 700,
          }}
        >
          {allDone
            ? 'Hebat! Yuk baca bersama dengan lantang!'
            : 'Dengarkan dan ikuti suku katanya ya!'}
        </p>

        <div className={styles.controls}>
          <Button
            variant="ghost"
            size="normal"
            onClick={() => void startKaraoke()}
            disabled={isPlaying}
          >
            <span>🔄</span>
            <span>Ulangi Baca</span>
          </Button>

          <Button variant="primary" size="large" onClick={handleNext}>
            <span>Aku Bisa! Lanjut 🌟</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
