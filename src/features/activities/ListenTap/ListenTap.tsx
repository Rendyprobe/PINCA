import React, { useState, useEffect, useRef } from 'react';
import styles from './ListenTap.module.css';
import type {
  ActivityProps,
  LetterItem,
  ActivityResultItem,
} from '@/types/content';
import { getLetters, getRandomPraise, getRandomHint } from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export const ListenTap: React.FC<ActivityProps<LetterItem>> = ({
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

  // Siapkan pilihan opsi saat item berganti
  useEffect(() => {
    if (!currentItem) return;

    // Ambil 2 distraktor dari seluruh huruf yang bukan currentItem
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

    // TTS membacakan instruksi
    const promptText = `Dengarkan ya... Mana huruf ${currentItem.soundTts}?`;
    void tts.speak(promptText, { rate: 0.75 });

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [currentIndex, currentItem, allLetters, items.length, onProgress]);

  const handleReplay = () => {
    if (!currentItem) return;
    sfx.playClick();
    const itemId = currentItem.id;
    hintsUsedRef.current[itemId] = (hintsUsedRef.current[itemId] ?? 0) + 1;
    void tts.speak(`Huruf ${currentItem.soundTts}`, { rate: 0.7 });
  };

  const handleSelect = (chosen: LetterItem) => {
    if (!currentItem || isCorrect) return;

    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;
    setSelectedId(chosen.id);

    if (chosen.id === currentItem.id) {
      // Benar!
      setIsCorrect(true);
      sfx.playSuccessDing();
      const praise = getRandomPraise();
      void tts.speak(`${praise} Ini huruf ${currentItem.upper}!`);

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

      // Lanjut ke item berikutnya setelah jeda perayaan singkat
      setTimeout(() => {
        if (currentIndex + 1 < items.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Aktivitas selesai
          onComplete({
            activityType: 'listen_tap',
            perItem: resultsRef.current,
            durationMs: Date.now() - startTimeRef.current,
          });
        }
      }, 1400);
    } else {
      // Salah ketuk - umpan balik lembut
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
      <div className={styles.instructionBox}>
        <button
          type="button"
          className={styles.replayBtn}
          onClick={handleReplay}
          aria-label="Dengarkan bunyi huruf lagi"
        >
          🔊
        </button>
        <span className={styles.instructionText}>
          Ketuk huruf <strong>&quot;{currentItem.upper}&quot;</strong>
        </span>
      </div>

      <div className={styles.grid}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCardCorrect = isSelected && isCorrect;
          const isCardShaking = shakeId === opt.id;

          const cardClass = [
            styles.card,
            isCardCorrect ? styles.cardCorrect : '',
            isCardShaking ? styles.cardShake : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={opt.id}
              className={cardClass}
              onClick={() => handleSelect(opt)}
              role="button"
              tabIndex={0}
              aria-label={`Huruf ${opt.upper}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(opt);
                }
              }}
            >
              <span className={styles.letterDisplay}>
                {opt.upper} {opt.lower}
              </span>
              {opt.image && (
                <span
                  className={styles.exampleImage}
                  role="img"
                  aria-label={opt.image.alt}
                >
                  {opt.image.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
