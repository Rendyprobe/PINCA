import React, { useState, useEffect, useRef } from 'react';
import styles from './ListenTap.module.css';
import type {
  ActivityProps,
  LetterItem,
  SyllableItem,
  ActivityResultItem,
} from '@/types/content';
import {
  getLetters,
  getSyllables,
  getRandomPraise,
  getRandomHint,
} from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

type SupportedItem = LetterItem | SyllableItem;

const isLetter = (item: SupportedItem): item is LetterItem =>
  item.level === 'letter';

export const ListenTap: React.FC<ActivityProps<SupportedItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<SupportedItem[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const startTimeRef = useRef(Date.now());
  const attemptsRef = useRef<Record<string, number>>({});
  const hintsUsedRef = useRef<Record<string, number>>({});
  const resultsRef = useRef<ActivityResultItem[]>([]);

  const currentItem = items[currentIndex];
  const allLetters = useRef(getLetters()).current;
  const allSyllables = useRef(getSyllables()).current;

  // Siapkan pilihan opsi saat item berganti
  useEffect(() => {
    if (!currentItem) return;

    let distractors: SupportedItem[];
    if (isLetter(currentItem)) {
      distractors = allLetters
        .filter((l) => l.id !== currentItem.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
    } else {
      distractors = allSyllables
        .filter((s) => s.id !== currentItem.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
    }

    const merged = [currentItem, ...distractors].sort(
      () => 0.5 - Math.random(),
    );
    setOptions(merged);
    setIsCorrect(null);
    setShakeId(null);
    setWrongIds([]);

    // TTS membacakan instruksi
    const promptText = isLetter(currentItem)
      ? `Dengarkan ya... Mana huruf ${currentItem.soundTts}?`
      : `Dengarkan ya... Mana suku kata ${currentItem.ttsText ?? currentItem.text}?`;
    void tts.speak(promptText, { rate: 0.75 });

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [
    currentIndex,
    currentItem,
    allLetters,
    allSyllables,
    items.length,
    onProgress,
  ]);

  const handleReplay = () => {
    if (!currentItem) return;
    sfx.playClick();
    const itemId = currentItem.id;
    hintsUsedRef.current[itemId] = (hintsUsedRef.current[itemId] ?? 0) + 1;
    const speakText = isLetter(currentItem)
      ? (currentItem.ttsText ?? currentItem.soundTts)
      : (currentItem.ttsText ?? currentItem.text);
    void tts.speak(speakText, {
      audioSrc: currentItem.audioSrc,
    });
  };

  const handleSelect = (chosen: SupportedItem) => {
    if (!currentItem || isCorrect) return;

    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;

    if (chosen.id === currentItem.id) {
      // Benar!
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
      setWrongIds((prev) =>
        prev.includes(chosen.id) ? prev : [...prev, chosen.id],
      );
      const hint = getRandomHint();
      void tts.speak(`Hampir! ${hint}. Coba lagi ya!`);
    }
  };

  if (!currentItem) return null;

  const instructionLabel = isLetter(currentItem)
    ? `Ketuk huruf "${currentItem.upper}"`
    : `Ketuk suku kata "${currentItem.text}"`;

  return (
    <div className={styles.container}>
      <div className={styles.instructionBox}>
        <button
          type="button"
          className={styles.replayBtn}
          onClick={handleReplay}
          aria-label="Dengarkan bunyi lagi"
        >
          🔊
        </button>
        <span className={styles.instructionText}>{instructionLabel}</span>
      </div>

      <div className={styles.grid}>
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

          const cardClass = [
            styles.card,
            isCardCorrect ? styles.cardCorrect : '',
            showHint ? styles.cardHint : '',
            isWrong && !isCardCorrect ? styles.cardWrong : '',
            isCardShaking ? styles.cardShake : '',
          ]
            .filter(Boolean)
            .join(' ');

          const optDisplay = isLetter(opt)
            ? `${opt.upper} ${opt.lower}`
            : opt.text;

          const optAria = isLetter(opt)
            ? `Huruf ${opt.upper}`
            : `Suku kata ${opt.text}`;

          return (
            <div
              key={opt.id}
              className={cardClass}
              onClick={() => handleSelect(opt)}
              role="button"
              tabIndex={0}
              aria-label={optAria}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(opt);
                }
              }}
            >
              {isCardCorrect && (
                <span className={styles.correctBadge}>✓ Benar!</span>
              )}
              {showHint && !isCardCorrect && (
                <span className={styles.hintBadge}>⭐ Ini dia!</span>
              )}
              <span className={styles.letterDisplay}>{optDisplay}</span>
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
