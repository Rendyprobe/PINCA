import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './KaraokeRead.module.css';
import type {
  ActivityProps,
  BaseItem,
  WordItem,
  SentenceItem,
  ActivityResultItem,
} from '@/types/content';
import { Button } from '@/components/Button/Button';
import { WordIllustration } from '@/components/Illustration/WordIllustration';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';
import { WebSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import { matchSpeech, commonPrefixFuzzy } from '@/lib/speech/matcher';
import { getThresholdsForMode } from '@/config/thresholds';
import { audioGate } from '@/lib/audio/audioGate';

export const KaraokeRead: React.FC<ActivityProps<BaseItem>> = ({
  items,
  onComplete,
  onProgress,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [allDone, setAllDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [micFeedback, setMicFeedback] = useState<string | null>(null);

  const startTimeRef = useRef(Date.now());
  const resultsRef = useRef<ActivityResultItem[]>([]);
  const isCancelledRef = useRef(false);
  const recognizerRef = useRef<WebSpeechRecognizer | null>(null);

  const currentItem = items[currentIndex];
  const isSentence = currentItem?.level === 'sentence';
  const syllables = useMemo<string[]>(() => {
    if (!currentItem) return [];
    if ('syllables' in currentItem) return (currentItem as WordItem).syllables;
    if ('words' in currentItem) return (currentItem as SentenceItem).words;
    return [currentItem.text];
  }, [currentItem]);

  const punctuation = isSentence
    ? (currentItem as SentenceItem).punctuation
    : '';

  const wordImage =
    currentItem && 'image' in currentItem && currentItem.image
      ? currentItem.image
      : undefined;

  // Hentikan rekaman mic jika sedang berjalan
  const stopMic = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current = null;
    }
    audioGate.setCapturing(false);
    setIsMicListening(false);
  }, []);

  // Mulai pembacaan karaoke panduan per kata / suku kata
  const startKaraoke = useCallback(async () => {
    if (!currentItem || isPlaying) return;

    stopMic();
    setIsPlaying(true);
    setAllDone(false);
    setMicChecked(false);
    setMicFeedback(null);
    isCancelledRef.current = false;

    for (let i = 0; i < syllables.length; i++) {
      if (isCancelledRef.current) break;

      setHighlightIndex(i);
      const syl = syllables[i] ?? '';
      await tts.speak(syl, { rate: isSentence ? 0.8 : 0.75 });

      // Jeda lembut antar suku kata / kata
      await new Promise((r) => setTimeout(r, isSentence ? 220 : 180));
    }

    if (!isCancelledRef.current) {
      setHighlightIndex(syllables.length);
      setAllDone(true);
      sfx.playSuccessDing();

      await new Promise((r) => setTimeout(r, 150));
      await tts.speak(currentItem.text, { rate: 0.85 });
    }

    setIsPlaying(false);
  }, [currentItem, isPlaying, isSentence, syllables, stopMic]);

  // Fitur Cek Suara (Mic) langsung di baca bersama
  const startMicCheck = useCallback(() => {
    if (!currentItem) return;

    // Hentikan TTS dan karaoke jika sedang berjalan
    tts.cancel();
    isCancelledRef.current = true;
    setIsPlaying(false);

    if (isMicListening) {
      stopMic();
      setMicFeedback(null);
      return;
    }

    const recognizer = new WebSpeechRecognizer();
    if (!recognizer.isSupported() || settings?.micEnabled === false) {
      setMicFeedback('Mikrofon belum tersedia di browser ini. Kamu bisa langsung lanjut!');
      return;
    }

    recognizerRef.current = recognizer;
    setIsMicListening(true);
    setHighlightIndex(-1);
    setAllDone(false);
    setMicChecked(false);
    setMicFeedback(
      isSentence
        ? `Mendengarkan... Silakan baca: "${currentItem.text}"`
        : `Mendengarkan... Silakan baca: "${currentItem.text}"`,
    );

    audioGate.setCapturing(true);

    const thresholds = getThresholdsForMode(
      settings?.difficultyThreshold ?? 'easy',
    );

    recognizer.start({
      lang: 'id-ID',
      timeoutMs: isSentence ? 10000 : 7000,
      onAudioStart: () => {
        // Audio capture aktif
      },
      onInterim: (interim) => {
        const matched = commonPrefixFuzzy(interim, currentItem.text);
        let cumulative = 0;
        let lastMatchIdx = -1;
        for (let i = 0; i < syllables.length; i++) {
          const len = (syllables[i] ?? '').length;
          cumulative += len;
          if (matched >= cumulative) {
            lastMatchIdx = i;
          }
        }
        if (lastMatchIdx >= 0) {
          setHighlightIndex(lastMatchIdx);
        }
      },
      onFinal: (alternatives) => {
        stopMic();
        const match = matchSpeech(
          {
            target: currentItem.text,
            heard: alternatives,
            level: currentItem.level,
          },
          thresholds,
        );

        if (match.outcome === 'ok') {
          setHighlightIndex(syllables.length);
          setAllDone(true);
          setMicChecked(true);
          setMicFeedback(
            isSentence
              ? 'Wah hebat sekali! Kalimatmu terbaca sempurna! 🌟'
              : 'Keren! Bacaanmu terdengar jelas dan benar! 🌟',
          );
          sfx.playSuccessDing();
          sfx.playCelebrate();
          void tts.speak('Hebat! Bacaanmu sangat bagus!');
        } else if (match.outcome === 'almost') {
          setMicFeedback(
            'Hampir tepat! Ayo coba baca sekali lagi ya.',
          );
          void tts.speak('Hampir tepat! Ayo coba lagi ya.');
        } else {
          setMicFeedback(
            'Ayo coba baca dengan suara sedikit lebih keras ya!',
          );
        }
      },
      onError: (code) => {
        stopMic();
        if (code === 'no-speech' || code === 'no-result') {
          setMicFeedback('Belum ada suara yang terdengar. Coba ketuk mikrofon lagi ya!');
        } else {
          setMicFeedback('Sambungan mikrofon belum berhasil. Coba lagi ya!');
        }
      },
      onEnd: () => {
        stopMic();
      },
    });
  }, [currentItem, isSentence, isMicListening, settings, syllables, stopMic]);

  useEffect(() => {
    if (!currentItem) return;

    setHighlightIndex(-1);
    setAllDone(false);
    setIsPlaying(false);
    setMicChecked(false);
    setMicFeedback(null);
    stopMic();

    if (onProgress) {
      onProgress({ index: currentIndex + 1, total: items.length });
    }

    // Putar karaoke otomatis saat item pertama kali muncul
    const timer = setTimeout(() => {
      void startKaraoke();
    }, 450);

    return () => {
      clearTimeout(timer);
      isCancelledRef.current = true;
      tts.cancel();
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentItem]);

  const handleNext = () => {
    if (!currentItem) return;

    sfx.playClick();
    tts.cancel();
    stopMic();
    isCancelledRef.current = true;

    resultsRef.current.push({
      itemId: currentItem.id,
      outcome: 'ok',
      attempts: micChecked ? 1 : 1,
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
      <div className={styles.activityHeading}>
        <span className={styles.eyebrow}>
          {isSentence ? 'BACA KALIMAT BERSAMA' : 'BACA BERSAMA BU DELIA'}
        </span>
        <span className={styles.itemCount}>
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      <div className={styles.card}>
        {wordImage && (
          <div className={styles.wordImage}>
            <WordIllustration image={wordImage} size="110px" />
          </div>
        )}

        <div className={styles.syllablesRow}>
          {syllables.map((syl, idx) => {
            const isActive = highlightIndex === idx;
            const isDone = allDone || highlightIndex >= idx;

            const sylClass = [
              styles.syllableBlock,
              isSentence ? styles.sentenceBlock : '',
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
          {isSentence && punctuation && (
            <span className={styles.sentencePunctuation} aria-hidden="true">
              {punctuation}
            </span>
          )}
        </div>

        <div className={styles.feedbackText}>
          {micFeedback ? (
            <span className={micChecked ? styles.micSuccessNotice : undefined}>
              {micFeedback}
            </span>
          ) : allDone ? (
            'Hebat! Yuk coba baca dengan mikrofon atau lanjut!'
          ) : (
            'Dengarkan dan ikuti kata-katanya ya!'
          )}
        </div>

        <div className={styles.controls}>
          <Button
            variant="ghost"
            size="normal"
            onClick={() => void startKaraoke()}
            disabled={isPlaying || isMicListening}
          >
            <span>🔄</span>
            <span>Dengarkan Lagi</span>
          </Button>

          {/* Tombol Cek Suara Mic Interaktif */}
          <button
            type="button"
            className={`${styles.micCheckBtn} ${isMicListening ? styles.listening : ''}`}
            onClick={startMicCheck}
            disabled={isPlaying}
            aria-label={
              isMicListening
                ? 'Hentikan mikrofon'
                : 'Cek suaraku dengan mikrofon'
            }
          >
            <span>{isMicListening ? '⏹️' : '🎙️'}</span>
            <span>
              {isMicListening ? 'Mendengarkan...' : 'Cek Suaraku (Mic)'}
            </span>
          </button>

          <Button variant="primary" size="large" onClick={handleNext}>
            <span>{micChecked ? 'Hebat! Lanjut 🌟' : 'Aku Bisa! Lanjut 🌟'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
