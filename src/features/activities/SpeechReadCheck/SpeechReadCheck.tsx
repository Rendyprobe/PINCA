import { audioGate } from '@/lib/audio/audioGate';
import { getWordById } from '@/content';
import { useMicLevel } from '@/features/speech/useMicLevel';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  BaseItem,
  WordItem,
  LetterItem,
  SentenceItem,
  ActivityResult,
  ActivityResultItem,
  UserSettings,
} from '@/types/content';
import type {
  ISpeechRecognizer,
  ReadingMode,
  MatchResult,
} from '@/lib/speech/types';
import { useSpeechCheck } from '@/features/speech/useSpeechCheck';
import { Mascot, type MascotMood } from '@/components/Mascot/Mascot';
import { Button } from '@/components/Button/Button';
import { WordIllustration } from '@/components/Illustration/WordIllustration';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';
import styles from './SpeechReadCheck.module.css';

export interface SpeechReadCheckProps {
  items?: BaseItem[];
  item?: BaseItem; // Opsional jika hanya 1 item langsung
  settings?: UserSettings;
  readingMode?: ReadingMode;
  recognizer?: ISpeechRecognizer;
  onComplete: (result: ActivityResult) => void;
  onSkip?: () => void;
}

export const SpeechReadCheck: React.FC<SpeechReadCheckProps> = ({
  items: propItems,
  item: propItem,
  settings,
  readingMode: customReadingMode,
  recognizer,
  onComplete,
  onSkip,
}) => {
  const items: BaseItem[] = propItems ?? (propItem ? [propItem] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = items[currentIndex];

  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();
  const completedItem = useRef<string | null>(null);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);
  const startTimeRef = useRef<number>(Date.now());
  const retriesRef = useRef(0);
  const perItemResultsRef = useRef<ActivityResultItem[]>([]);
  const [checkingMic, setCheckingMic] = useState(false);
  const [assistedSpeaking, setAssistedSpeaking] = useState(false);

  // Mode membaca dari settings atau props
  const effectiveReadingMode: ReadingMode =
    customReadingMode ??
    (settings?.readingMode === 'syllables'
      ? 'syllable-by-syllable'
      : 'whole-word');

  // Ekstrak data sesuai level item
  const syllables = currentItem
    ? 'syllables' in currentItem
      ? (currentItem as WordItem).syllables
      : 'words' in currentItem
        ? (currentItem as SentenceItem).words
        : undefined
    : undefined;
  const exampleWordId = currentItem
    ? (currentItem as LetterItem).exampleWordId
    : undefined;
  const example = exampleWordId ? getWordById(exampleWordId) : undefined;
  const exampleWord = example?.text;
  const pronunciation =
    currentItem?.ttsText ??
    (currentItem?.level === 'letter'
      ? (currentItem as LetterItem).soundTts
      : currentItem?.text) ??
    '';
  const targetText = currentItem?.text ?? '';
  const aliases = currentItem?.acceptedAliases ?? [];

  const handleItemAdvance = useCallback(
    (outcome: 'ok' | 'assisted') => {
      if (
        !currentItem ||
        completedItem.current === `${currentIndex}:${currentItem.id}`
      )
        return;
      completedItem.current = `${currentIndex}:${currentItem.id}`;

      perItemResultsRef.current.push({
        itemId: currentItem.id,
        outcome,
        attempts: Math.max(1, retriesRef.current + (outcome === 'ok' ? 1 : 0)),
        hintsUsed: outcome === 'assisted' ? 1 : 0,
      });

      if (currentIndex + 1 < items.length) {
        advanceTimer.current = setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 1200);
      } else {
        // Semua item selesai
        advanceTimer.current = setTimeout(() => {
          const durationMs = Date.now() - startTimeRef.current;
          onComplete({
            activityType: 'speech_check',
            perItem: perItemResultsRef.current,
            durationMs,
          });
        }, 1200);
      }
    },
    [currentItem, currentIndex, items.length, onComplete],
  );

  const handleSuccess = useCallback(
    (_result: MatchResult) => {
      handleItemAdvance('ok');
    },
    [handleItemAdvance],
  );

  const handleAssistedComplete = useCallback(() => {
    handleItemAdvance('assisted');
  }, [handleItemAdvance]);

  const {
    state,
    issue,
    captureStarted,
    soundDetected,
    speechDetected,
    transcriptKind,
    choosePractice,
    finishListening,
    completionMode,
    retryMicrophone,
    retryCount,
    units,
    matchedPrefixChars,
    lastTranscript,
    isListening,
    isRequesting,
    isFallbackTap,
    isAssisted,
    isSuccess,
    startListening,
    stopListening,
    handleTapUnit,
    handleCompleteTap,
    handleFinishAssisted,
  } = useSpeechCheck({
    targetText,
    itemKey: `${currentIndex}:${currentItem?.id}`,
    syllables,
    micEnabled: settings?.micEnabled ?? true,
    level: currentItem?.level ?? 'word',
    aliases,
    exampleWord,
    exampleWordAliases: example?.acceptedAliases,
    readingMode: effectiveReadingMode,
    difficultyMode: settings?.difficultyThreshold ?? 'easy',
    recognizer,
    onSuccess: handleSuccess,
    onAssistedComplete: handleAssistedComplete,
  });

  retriesRef.current = retryCount;
  // Device metering is an explicit check, never a second capture during recognition.
  const { level: micLevel, error: micCheckError } = useMicLevel(checkingMic);
  const toggleMicCheck = useCallback(() => {
    if (checkingMic) {
      setCheckingMic(false);
      audioGate.setCapturing(false);
    } else {
      tts.cancel();
      audioGate.setCapturing(true);
      setCheckingMic(true);
    }
  }, [checkingMic]);
  useEffect(() => {
    if (!checkingMic) return;
    const hide = () => {
      if (document.hidden) {
        setCheckingMic(false);
        audioGate.setCapturing(false);
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [checkingMic]);
  const handleChoosePractice = useCallback(() => {
    if (checkingMic) {
      setCheckingMic(false);
      audioGate.setCapturing(false);
    }
    choosePractice();
  }, [checkingMic, choosePractice]);
  const handleRetryMic = useCallback(() => {
    if (checkingMic) {
      setCheckingMic(false);
      audioGate.setCapturing(false);
    }
    retryMicrophone();
  }, [checkingMic, retryMicrophone]);
  const activeReadingTarget =
    effectiveReadingMode === 'syllable-by-syllable'
      ? (units.find(
          (unit) => unit.status === 'active' || unit.status === 'almost',
        )?.text ?? targetText)
      : targetText;
  const isBusy = isListening || isRequesting || state === 'evaluating';

  // Dengarkan pengucapan kata via TTS (hanya saat ditekan anak)
  const handleHearExample = useCallback(() => {
    if (!currentItem) return;
    sfx.playClick();
    const ttsText = pronunciation;
    void tts.speak(ttsText, { audioSrc: currentItem.audioSrc });
  }, [currentItem, pronunciation]);

  // Mode dibacakan bareng saat assisted
  const handleAssistedReadAlong = useCallback(async () => {
    if (!currentItem) return;
    setAssistedSpeaking(true);
    sfx.playClick();
    const ttsText = pronunciation;
    await tts.speak(ttsText, { audioSrc: currentItem.audioSrc });
    setAssistedSpeaking(false);
  }, [currentItem, pronunciation]);

  useEffect(() => {
    if (isAssisted) void handleAssistedReadAlong();
  }, [isAssisted, handleAssistedReadAlong]);

  useEffect(() => {
    if (state !== 'almost' && state !== 'retry') return;
    const exampleText =
      effectiveReadingMode === 'syllable-by-syllable'
        ? (units.find(
            (unit) => unit.status === 'active' || unit.status === 'almost',
          )?.text ?? pronunciation)
        : pronunciation;
    void tts.speak(exampleText);
  }, [state, effectiveReadingMode, pronunciation, units]);

  if (!currentItem) {
    return null;
  }

  // Hitung ekspresi Maskot berdasarkan state
  let mascotMood: MascotMood = 'senang';
  let mascotMessage = 'Ayo baca bersama!';

  if (isListening) {
    mascotMood = 'mendengar';
    mascotMessage = 'Sekarang giliranmu, ya.';
  } else if (state === 'evaluating') {
    mascotMood = 'berpikir';
    mascotMessage = 'Mengecek bacaanmu...';
  } else if (isSuccess) {
    mascotMood = 'merayakan';
    mascotMessage =
      completionMode === 'verified'
        ? 'Sudah cocok. Hebat sekali!'
        : 'Hebat! Kita sudah berlatih bersama.';
  } else if (state === 'almost') {
    mascotMood = 'semangat';
    mascotMessage = 'Hampir! Ayo coba lagi!';
  } else if (state === 'noSpeech') {
    mascotMood = 'semangat';
    mascotMessage =
      issue === 'no-result'
        ? 'Suara masuk, teksnya belum diterima.'
        : 'Aku belum mendengar dengan jelas.';
  } else if (state === 'speechError') {
    mascotMood = 'berpikir';
    mascotMessage = 'Yuk, periksa sambungan mikrofon.';
  } else if (state === 'retry') {
    mascotMood = 'semangat';
    mascotMessage =
      issue === 'no-speech'
        ? 'Aku belum mendengar dengan jelas.'
        : 'Yuk, ulang bagian ini pelan-pelan.';
  } else if (isAssisted) {
    mascotMood = 'semangat';
    mascotMessage = 'Yuk kita baca bareng!';
  } else if (isFallbackTap) {
    mascotMood = 'senang';
    mascotMessage = 'Baca keras-keras, lalu ketuk!';
  }

  return (
    <div className={styles.container}>
      <div className={styles.activityHeading}>
        <span className={styles.eyebrow}>
          {isFallbackTap
            ? 'LATIHAN BERSAMA BU DELIA'
            : 'CEK BACAAN BERSAMA BU DELIA'}
        </span>
        <span className={styles.itemCount}>
          {currentIndex + 1} / {items.length}
        </span>
      </div>
      {/* Guide instruction stays separate from the reading card. */}
      <div className={styles.header}>
        <div className={styles.speechBubble}>
          <span aria-live="polite">{mascotMessage}</span>
          <button
            type="button"
            className={styles.listenPromptBtn}
            disabled={isBusy || checkingMic || isSuccess}
            onClick={handleHearExample}
            aria-label="Dengarkan pengucapan kata"
            title="Dengarkan suara"
          >
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4 6 8H3v8h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Area Gambar (jika ada) */}
      <div className={styles.cardArea} aria-label="Kartu bacaan">
        {currentItem.image && (
          <div className={styles.imageBox}>
            <WordIllustration image={currentItem.image} size="90px" />
          </div>
        )}

        {/* Kartu Unit Kata / Suku Kata */}
        <div className={styles.unitsContainer}>
          {units.map((u, idx) => (
            <div
              key={u.id}
              className={`${styles.unitCard} ${styles[u.status]} ${
                isFallbackTap ? styles.interactive : ''
              }`}
              onClick={() => {
                if (isFallbackTap) {
                  handleTapUnit(idx);
                }
              }}
              role={isFallbackTap ? 'button' : undefined}
              tabIndex={isFallbackTap ? 0 : undefined}
              aria-label={`${currentItem.level === 'letter' ? 'Huruf' : 'Bacaan'} ${u.text}${u.status === 'done' ? ', sudah dibaca' : ''}`}
              onKeyDown={(e) => {
                if (isFallbackTap && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleTapUnit(idx);
                }
              }}
            >
              <span
                className={`${styles.unitText} ${currentItem.level === 'letter' ? styles.singleLetter : ''}`}
              >
                {state === 'listening'
                  ? Array.from(u.text).map((letter, letterIndex) => {
                      const progressIndex =
                        effectiveReadingMode === 'syllable-by-syllable'
                          ? letterIndex
                          : u.charIndex + letterIndex;
                      const read =
                        u.status === 'done' ||
                        (u.status === 'active' &&
                          progressIndex < matchedPrefixChars);
                      return (
                        <span
                          key={letterIndex}
                          className={read ? styles.readLetter : undefined}
                        >
                          {letter}
                        </span>
                      );
                    })
                  : u.text}
              </span>
              <span
                className={`${styles.doneBadge} ${u.status !== 'done' ? styles.badgePlaceholder : ''}`}
                aria-hidden="true"
              >
                &#10003;
              </span>
            </div>
          ))}
        </div>

        {/* Transkrip interim atau feedback */}
        {lastTranscript ? (
          <div className={styles.transcriptHint}>
            {transcriptKind === 'interim' ? 'Teks sementara' : 'Yang terdengar'}
            : &ldquo;{lastTranscript}&rdquo;
          </div>
        ) : (
          <div className={styles.transcriptHint} />
        )}

        {(state === 'almost' || state === 'retry' || state === 'noSpeech') && (
          <div className={styles.feedbackBanner}>
            {state === 'noSpeech'
              ? issue === 'no-result'
                ? 'Browser menangkap suara, tetapi belum memberi teks bacaan. Coba lagi, ya.'
                : 'Belum ada teks bacaan yang masuk. Ini belum dihitung sebagai percobaan bacaan.'
              : `Yuk, ulang bagian: ${activeReadingTarget}.`}
          </div>
        )}
      </div>

      {/* Kontrol Utama: Mikrofon / Fallback / Assisted */}
      <div className={styles.controlsArea}>
        {isSuccess ? (
          <p role="status">
            {completionMode === 'verified'
              ? 'Sudah cocok! Bacaanmu selesai.'
              : 'Selesai dengan bantuan. Hebat sudah berlatih!'}
          </p>
        ) : state === 'speechError' ? (
          <div className={styles.assistedContainer}>
            <p role="status">
              {issue === 'network'
                ? 'Layanan pengenal suara belum terhubung. Periksa koneksi internet, lalu coba lagi.'
                : issue === 'not-allowed' || issue === 'service-not-allowed'
                  ? 'Izinkan mikrofon lewat pengaturan browser, lalu coba lagi.'
                  : issue === 'unsupported'
                    ? 'Browser ini belum mendukung cek suara. Coba Chrome atau Edge.'
                    : issue === 'start-timeout'
                      ? 'Mikrofon belum mulai menangkap suara. Periksa izin dan perangkat input.'
                      : issue === 'audio-capture'
                        ? 'Perangkat mikrofon belum bisa digunakan. Periksa pilihan mikrofon browser.'
                        : 'Pengenal suara belum dapat digunakan. Coba sambungkan kembali.'}
            </p>
            {issue !== 'unsupported' && (
              <Button variant="primary" onClick={handleRetryMic}>
                Coba mikrofon lagi
              </Button>
            )}
            <Button variant="ghost" onClick={handleChoosePractice}>
              Latihan tanpa penilaian
            </Button>
          </div>
        ) : isAssisted ? (
          <div className={styles.assistedContainer}>
            <p className={styles.assistedText}>
              Mode latihan bersama. Bacaan tidak dinilai lewat mikrofon.
            </p>
            <div className={styles.buttonRow}>
              <Button
                variant="secondary"
                size="large"
                onClick={handleAssistedReadAlong}
                disabled={assistedSpeaking || checkingMic}
              >
                🔊 Dengarkan
              </Button>
              <Button
                variant="primary"
                size="large"
                onClick={handleFinishAssisted}
                disabled={checkingMic}
              >
                &#128077; Aku Sudah Baca
              </Button>
            </div>
            {issue !== 'unsupported' && issue !== 'disabled' && (
              <Button variant="ghost" onClick={handleRetryMic}>
                Kembali ke cek bacaan
              </Button>
            )}
          </div>
        ) : isFallbackTap ? (
          <div className={styles.tapFallbackContainer}>
            <Button
              variant="primary"
              size="large"
              onClick={handleCompleteTap}
              disabled={checkingMic}
              aria-label="Aku sudah baca kata ini"
            >
              👍 Aku Sudah Baca!
            </Button>
            <div className={styles.fallbackNotice}>
              💡 Baca dengan lantang, lalu ketuk tombolnya.
            </div>
            {issue !== 'disabled' && issue !== 'unsupported' && (
              <Button variant="ghost" size="normal" onClick={handleRetryMic}>
                Coba mikrofon lagi
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.micControls}>
            <p className={styles.readingTarget}>
              Baca: <strong>{activeReadingTarget}</strong>
              {effectiveReadingMode === 'syllable-by-syllable' && (
                <small>Boleh juga membaca kata lengkap: {targetText}.</small>
              )}
            </p>
            <div
              className={`${styles.micPromptText} ${isListening ? styles.active : ''}`}
            >
              {isListening
                ? 'Aku mendengarkan... Bacalah, ya!'
                : isRequesting
                  ? 'Tunggu sebentar, ya...'
                  : 'Ketuk mikrofon untuk mulai'}
            </div>
            <button
              type="button"
              className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
              disabled={checkingMic || state === 'evaluating'}
              aria-pressed={isListening}
              onClick={
                isRequesting
                  ? stopListening
                  : isListening
                    ? finishListening
                    : startListening
              }
              aria-label={
                isListening || isRequesting
                  ? 'Hentikan mikrofon'
                  : 'Mulai bicara'
              }
              title={isListening ? 'Mendengarkan...' : 'Ketuk untuk bicara'}
            >
              <svg
                viewBox="0 0 24 24"
                width="40"
                height="40"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isListening || isRequesting ? (
                  <rect
                    x="6"
                    y="6"
                    width="12"
                    height="12"
                    rx="3"
                    fill="currentColor"
                    stroke="none"
                  />
                ) : (
                  <>
                    <rect x="9" y="2" width="6" height="13" rx="3" />
                    <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
                  </>
                )}
              </svg>
            </button>
            {isRequesting && (
              <p className={styles.quietHint} role="status">
                Dengarkan dulu. Ketuk lagi untuk berhenti.
              </p>
            )}
            {state === 'evaluating' && (
              <>
                <p role="status">Menunggu teks akhir dari browser...</p>
                <Button variant="ghost" onClick={stopListening}>
                  Batalkan
                </Button>
              </>
            )}
            {!isBusy && !checkingMic && (
              <Button variant="ghost" onClick={handleChoosePractice}>
                Latihan tanpa penilaian
              </Button>
            )}
          </div>
        )}

        {/* Tombol Lewati (opsional tanpa menghukum) */}
        {onSkip && !isSuccess && (
          <Button variant="ghost" size="normal" onClick={onSkip}>
            Lewati dulu ➔
          </Button>
        )}
      </div>

      {!isSuccess && (
        <details
          className={styles.microphoneDetails}
          onToggle={(event) => {
            if (!event.currentTarget.open && checkingMic) toggleMicCheck();
          }}
        >
          <summary>Status mikrofon dan bantuan</summary>
          <dl>
            <dt>Input mikrofon sesi terakhir</dt>
            <dd>{captureStarted ? 'Sudah aktif' : 'Belum terkonfirmasi'}</dd>
            <dt>Suara tertangkap browser</dt>
            <dd>{soundDetected ? 'Ya' : 'Belum terdeteksi'}</dd>
            <dt>Ucapan terdeteksi browser</dt>
            <dd>{speechDetected ? 'Ya' : 'Belum terdeteksi'}</dd>
            <dt>Teks bacaan</dt>
            <dd>
              {transcriptKind === 'final'
                ? 'Hasil akhir diterima'
                : transcriptKind === 'interim'
                  ? 'Baru hasil sementara'
                  : 'Belum diterima'}
            </dd>
          </dl>
          <p>
            Mikrofon aktif belum berarti layanan pengenal suara sudah menerima
            bacaan. Cek koneksi dan mikrofon yang dipilih browser.
          </p>
          <Button variant="ghost" onClick={toggleMicCheck} disabled={isBusy}>
            {checkingMic
              ? 'Selesai memeriksa mikrofon'
              : 'Periksa input mikrofon'}
          </Button>
          {checkingMic && (
            <div role="status">
              <p>
                {micCheckError ??
                  (micLevel === null
                    ? 'Menyiapkan pemeriksaan perangkat...'
                    : 'Ucapkan sesuatu. Gerakan indikator menunjukkan suara perangkat masuk; bacaan belum dinilai.')}
              </p>
              {micLevel !== null && (
                <meter
                  min={0}
                  max={1}
                  value={micLevel}
                  className={styles.micMeter}
                  aria-label="Kekuatan suara perangkat"
                />
              )}
            </div>
          )}
        </details>
      )}

      {/* Footer Maskot Visual */}
      <div className={styles.mascotFooter}>
        <Mascot mood={mascotMood} size={80} />
        <span>Bu Delia menemanimu. Pelan-pelan saja, ya.</span>
      </div>
    </div>
  );
};
