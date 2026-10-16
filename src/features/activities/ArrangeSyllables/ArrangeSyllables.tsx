import React, { useState, useEffect, useRef } from 'react';
import styles from './ArrangeSyllables.module.css';
import type {
  ActivityProps,
  WordItem,
  ActivityResultItem,
} from '@/types/content';
import { getSyllables, getRandomPraise, getRandomHint } from '@/content';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

interface Piece {
  id: string;
  text: string;
}

export const ArrangeSyllables: React.FC<ActivityProps<WordItem>> = ({
  items,
  onComplete,
  onProgress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slots, setSlots] = useState<(Piece | null)[]>([]);
  const [pool, setPool] = useState<Piece[]>([]);
  const [usedPieceIds, setUsedPieceIds] = useState<Set<string>>(new Set());
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const startTimeRef = useRef(Date.now());
  const attemptsRef = useRef<Record<string, number>>({});
  const hintsUsedRef = useRef<Record<string, number>>({});
  const resultsRef = useRef<ActivityResultItem[]>([]);

  const currentItem = items[currentIndex];
  const allSyllables = useRef(getSyllables()).current;

  // Inisialisasi slot dan pool potongan
  useEffect(() => {
    if (!currentItem) return;

    // Potongan suku kata asli
    const realPieces: Piece[] = currentItem.syllables.map((s, idx) => ({
      id: `${currentItem.id}_syl_${idx}_${s}`,
      text: s,
    }));

    // Tambahkan 1 suku kata distraktor acak
    const distractorText =
      allSyllables.find((s) => !currentItem.syllables.includes(s.text))?.text ??
      'ba';
    const distractorPiece: Piece = {
      id: `${currentItem.id}_dist_${distractorText}`,
      text: distractorText,
    };

    const combined = [...realPieces, distractorPiece].sort(
      () => 0.5 - Math.random(),
    );

    setSlots(new Array(currentItem.syllables.length).fill(null));
    setPool(combined);
    setUsedPieceIds(new Set());
    setIsCorrect(null);
    setIsShaking(false);

    const promptText = `Susun suku kata untuk kata: ${currentItem.text}!`;
    void tts.speak(promptText, { rate: 0.8 });

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }
  }, [currentIndex, currentItem, allSyllables, items.length, onProgress]);

  // Cek apakah semua slot terisi
  const checkCompletion = (newSlots: (Piece | null)[]) => {
    if (!currentItem || newSlots.some((s) => s === null)) return;

    const assembledWord = newSlots.map((s) => s?.text ?? '').join('');
    const itemId = currentItem.id;
    attemptsRef.current[itemId] = (attemptsRef.current[itemId] ?? 0) + 1;

    if (assembledWord.toLowerCase() === currentItem.text.toLowerCase()) {
      // Benar!
      setIsCorrect(true);
      sfx.playSuccessDing();
      const praise = getRandomPraise();
      void tts.speak(`${praise} Kata ${currentItem.text} tersusun sempurna!`);

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
            activityType: 'arrange_syllables',
            perItem: resultsRef.current,
            durationMs: Date.now() - startTimeRef.current,
          });
        }
      }, 1600);
    } else {
      // Salah susun
      sfx.playClick();
      setIsShaking(true);
      const hint = getRandomHint();
      void tts.speak(
        `Hampir! ${hint}. Dengarkan: ${currentItem.syllables.join('... ')}`,
      );

      setTimeout(() => {
        setIsShaking(false);
        // Kembalikan potongan ke pool
        setSlots(new Array(currentItem.syllables.length).fill(null));
        setUsedPieceIds(new Set());
      }, 800);
    }
  };

  // Ketuk potongan di pool untuk memasukkan ke slot kosong pertama
  const handlePieceClick = (piece: Piece) => {
    if (usedPieceIds.has(piece.id) || isCorrect) return;

    const emptySlotIdx = slots.findIndex((s) => s === null);
    if (emptySlotIdx === -1) return;

    sfx.playClick();
    const updatedSlots = [...slots];
    updatedSlots[emptySlotIdx] = piece;
    setSlots(updatedSlots);

    const updatedUsed = new Set(usedPieceIds);
    updatedUsed.add(piece.id);
    setUsedPieceIds(updatedUsed);

    checkCompletion(updatedSlots);
  };

  // Ketuk slot yang terisi untuk mengembalikan potongan ke pool
  const handleSlotClick = (slotIdx: number) => {
    const piece = slots[slotIdx];
    if (!piece || isCorrect) return;

    sfx.playClick();
    const updatedSlots = [...slots];
    updatedSlots[slotIdx] = null;
    setSlots(updatedSlots);

    const updatedUsed = new Set(usedPieceIds);
    updatedUsed.delete(piece.id);
    setUsedPieceIds(updatedUsed);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, piece: Piece) => {
    if (usedPieceIds.has(piece.id) || isCorrect) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', piece.id);
  };

  const handleDropOnSlot = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    if (isCorrect) return;

    const pieceId = e.dataTransfer.getData('text/plain');
    const piece = pool.find((p) => p.id === pieceId);
    if (!piece || usedPieceIds.has(piece.id)) return;

    sfx.playClick();
    const updatedSlots = [...slots];
    // Jika slot sudah terisi, kembalikan piece lama ke pool
    const existingPiece = updatedSlots[slotIdx];
    const updatedUsed = new Set(usedPieceIds);

    if (existingPiece) {
      updatedUsed.delete(existingPiece.id);
    }

    updatedSlots[slotIdx] = piece;
    updatedUsed.add(piece.id);

    setSlots(updatedSlots);
    setUsedPieceIds(updatedUsed);

    checkCompletion(updatedSlots);
  };

  const handleReplay = () => {
    if (!currentItem) return;
    sfx.playClick();
    const itemId = currentItem.id;
    hintsUsedRef.current[itemId] = (hintsUsedRef.current[itemId] ?? 0) + 1;
    void tts.speak(
      `Kata ${currentItem.text}: ${currentItem.syllables.join('... ')}`,
      {
        rate: 0.7,
      },
    );
  };

  if (!currentItem) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hintCard}>
        {currentItem.image && (
          <span
            className={styles.wordImage}
            role="img"
            aria-label={currentItem.image.alt}
          >
            {currentItem.image.value}
          </span>
        )}
        <div>
          <p className={styles.instruction}>
            Susun suku kata untuk kata{' '}
            <strong>&quot;{currentItem.text}&quot;</strong>
          </p>
          <button
            type="button"
            onClick={handleReplay}
            style={{
              marginTop: '4px',
              fontSize: '0.9rem',
              padding: '4px 12px',
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
      </div>

      <div>
        <p
          style={{ textAlign: 'center', fontWeight: 700, marginBottom: '8px' }}
        >
          Kotak Kata:
        </p>
        <div className={styles.slotsRow}>
          {slots.map((slotPiece, idx) => {
            const isFilled = slotPiece !== null;
            const slotClass = [
              styles.slot,
              isFilled ? styles.slotFilled : '',
              isCorrect ? styles.slotCorrect : '',
              isShaking ? styles.slotShake : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={idx}
                className={slotClass}
                onClick={() => handleSlotClick(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnSlot(e, idx)}
                role="button"
                tabIndex={0}
                aria-label={`Slot ${idx + 1}: ${slotPiece?.text ?? 'kosong'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSlotClick(idx);
                  }
                }}
              >
                <span>{slotPiece?.text ?? ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: '8px',
          }}
        >
          Ketuk atau tarik suku kata ke kotak di atas:
        </p>
        <div className={styles.poolRow}>
          {pool.map((piece) => {
            const isUsed = usedPieceIds.has(piece.id);
            const pieceClass = [styles.pieceBtn, isUsed ? styles.pieceUsed : '']
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={piece.id}
                type="button"
                className={pieceClass}
                disabled={isUsed}
                draggable={!isUsed}
                onDragStart={(e) => handleDragStart(e, piece)}
                onClick={() => handlePieceClick(piece)}
                aria-label={`Pilih suku kata ${piece.text}`}
              >
                <span>{piece.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
