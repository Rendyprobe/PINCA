import { audioGate } from '@/lib/audio/audioGate';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Level } from '@/types/content';
import type {
  SpeechState,
  UnitStatus,
  MatchResult,
  ISpeechRecognizer,
  ReadingMode,
  SpeechErrorCode,
} from '@/lib/speech/types';
import { WebSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import { matchSpeech, commonPrefixFuzzy } from '@/lib/speech/matcher';
import { getThresholdsForMode, type DifficultyMode } from '@/config/thresholds';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export interface UseSpeechCheckProps {
  targetText: string;
  itemKey?: string;
  syllables?: string[];
  level: Level;
  aliases?: string[];
  exampleWord?: string;
  exampleWordAliases?: string[];
  difficultyMode?: DifficultyMode;
  readingMode?: ReadingMode;
  maxRetries?: number;
  micEnabled?: boolean;
  recognizer?: ISpeechRecognizer;
  onSuccess?: (result: MatchResult) => void;
  onAssistedComplete?: () => void;
}

export interface UnitItem {
  id: string;
  text: string;
  status: UnitStatus;
  charIndex: number;
}

export function useSpeechCheck({
  targetText,
  itemKey,
  syllables,
  level,
  aliases = [],
  exampleWord,
  exampleWordAliases = [],
  difficultyMode = 'easy',
  readingMode = 'whole-word',
  maxRetries = 2,
  micEnabled = true,
  recognizer: customRecognizer,
  onSuccess,
  onAssistedComplete,
}: UseSpeechCheckProps) {
  const [issue, setIssue] = useState<SpeechErrorCode | 'disabled' | null>(null);
  const [completionMode, setCompletionMode] = useState<
    'verified' | 'assisted' | null
  >(null);
  const completedRef = useRef(false);
  const [state, setState] = useState<SpeechState>('idle');
  const [emptyCount, setEmptyCount] = useState(0);
  const [captureStarted, setCaptureStarted] = useState(false);
  const [soundDetected, setSoundDetected] = useState(false);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [transcriptKind, setTranscriptKind] = useState<
    'interim' | 'final' | null
  >(null);
  const heardRef = useRef('');
  const soundRef = useRef(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(0);

  // Monotonically tracked matched prefix chars for current attempt
  const pendingStart = useRef<ReturnType<typeof setTimeout>>();
  const attemptRef = useRef(0);
  const busyRef = useRef(false);
  const [matchedPrefix, setMatchedPrefix] = useState(0);
  const releaseCapture = useCallback(() => {
    busyRef.current = false;
    audioGate.setCapturing(false);
  }, []);
  const maxMatchedPrefixRef = useRef<number>(0);

  const recognizer = useMemo<ISpeechRecognizer>(() => {
    return customRecognizer ?? new WebSpeechRecognizer();
  }, [customRecognizer]);

  const thresholds = useMemo(() => {
    return getThresholdsForMode(difficultyMode);
  }, [difficultyMode]);

  // Siapkan unit suku kata atau kata utuh
  const isSyllableMode =
    readingMode === 'syllable-by-syllable' &&
    level !== 'sentence' &&
    level !== 'story' &&
    Boolean(syllables && syllables.length > 0);

  const units: UnitItem[] = useMemo(() => {
    const norm = targetText.toLowerCase().trim();
    if (syllables && syllables.length > 0) {
      let cumulativeChars = 0;
      return syllables.map((syl, idx) => {
        const sylLen = syl.length;
        const startChar = cumulativeChars;
        cumulativeChars += sylLen;

        let status: UnitStatus = 'pending';
        if (state === 'success') {
          status = 'done';
        } else if (isSyllableMode) {
          if (idx < activeSyllableIndex) {
            status = 'done';
          } else if (idx === activeSyllableIndex) {
            status = state === 'almost' ? 'almost' : 'active';
          } else {
            status = 'pending';
          }
        } else {
          // Whole word / sentence mode: berbasis maxMatchedPrefix
          if (matchedPrefix >= cumulativeChars) {
            status = 'done';
          } else if (
            matchedPrefix > startChar &&
            matchedPrefix < cumulativeChars
          ) {
            status = 'active';
          } else if (state === 'almost' && idx === syllables.length - 1) {
            status = 'almost';
          }
        }

        return {
          id: `unit_${idx}_${syl}`,
          text: syl,
          status,
          charIndex: startChar,
        };
      });
    }

    // Default 1 unit kata
    return [
      {
        id: `unit_0_${norm}`,
        text: norm,
        status:
          state === 'success'
            ? 'done'
            : state === 'almost'
              ? 'almost'
              : state === 'listening'
                ? 'active'
                : 'pending',
        charIndex: 0,
      },
    ];
  }, [
    targetText,
    syllables,
    state,
    isSyllableMode,
    activeSyllableIndex,
    matchedPrefix,
  ]);

  // Bersihkan recognizer saat unmount
  useEffect(() => {
    const attemptCounter = attemptRef;
    return () => {
      attemptCounter.current++;
      clearTimeout(pendingStart.current);
      recognizer.abort();
      tts.cancel();
      releaseCapture();
    };
  }, [recognizer, releaseCapture]);

  useEffect(() => {
    attemptRef.current++;
    clearTimeout(pendingStart.current);
    recognizer.abort();
    releaseCapture();
    setState(
      !micEnabled
        ? 'fallbackTap'
        : recognizer.isSupported()
          ? 'idle'
          : 'speechError',
    );
    setIssue(
      !micEnabled
        ? 'disabled'
        : !recognizer.isSupported()
          ? 'unsupported'
          : null,
    );
    setCompletionMode(null);
    completedRef.current = false;
    setRetryCount(0);
    setEmptyCount(0);
    setCaptureStarted(false);
    setSoundDetected(false);
    setSpeechDetected(false);
    setTranscriptKind(null);
    heardRef.current = '';
    soundRef.current = false;
    setLastTranscript('');
    setLastResult(null);
    setActiveSyllableIndex(0);
    maxMatchedPrefixRef.current = 0;
    setMatchedPrefix(0);
  }, [targetText, itemKey, recognizer, releaseCapture, micEnabled]);

  const evaluateFinalSpeech = useCallback(
    (alternatives: string[]) => {
      const nonempty = alternatives.filter((text) => text.trim());
      if (!nonempty.length) {
        setIssue('no-result');
        setEmptyCount((count) => count + 1);
        setState('noSpeech');
        return;
      }
      setState('evaluating');
      setTranscriptKind('final');
      setLastTranscript(nonempty[0] ?? '');

      // Tentukan target yang sedang diuji (apakah suku kata aktif atau kata utuh)
      const currentTarget = isSyllableMode
        ? (syllables?.[activeSyllableIndex] ?? targetText)
        : targetText;
      const currentLevel: Level = isSyllableMode ? 'syllable' : level;

      let result = matchSpeech(
        {
          target: currentTarget,
          aliases: isSyllableMode ? [] : aliases,
          heard: alternatives,
          level: currentLevel,
          exampleWord,
          exampleWordAliases,
        },
        thresholds,
      );

      const wholeWord = isSyllableMode
        ? matchSpeech(
            { target: targetText, aliases, heard: nonempty, level },
            thresholds,
          )
        : null;
      const readWholeWord = Boolean(
        wholeWord?.outcome === 'ok' &&
        (wholeWord.matchedVia === 'exact' ||
          wholeWord.matchedVia === 'alias' ||
          level === 'sentence' ||
          level === 'story' ||
          wholeWord.score >= 0.75),
      );
      if (wholeWord && readWholeWord) result = wholeWord;

      setLastResult(result);
      setLastTranscript(result.bestHeard ?? alternatives[0] ?? '');
      setIssue(null);

      if (result.outcome === 'ok') {
        sfx.playClick();
        if (
          isSyllableMode &&
          !readWholeWord &&
          activeSyllableIndex < (syllables?.length ?? 1) - 1
        ) {
          // Lanjut ke suku kata berikutnya
          setActiveSyllableIndex((prev) => prev + 1);
          setState('idle');
        } else {
          // Berhasil seluruhnya
          maxMatchedPrefixRef.current = targetText.length;
          completedRef.current = true;
          setCompletionMode('verified');
          setState('success');
          sfx.playSuccessDing();
          onSuccess?.(result);
        }
      } else {
        setRetryCount((count) => count + 1);
        setState(result.outcome === 'almost' ? 'almost' : 'retry');
      }
    },
    [
      isSyllableMode,
      syllables,
      activeSyllableIndex,
      targetText,
      level,
      aliases,
      exampleWord,
      exampleWordAliases,
      thresholds,
      onSuccess,
    ],
  );

  const startListening = useCallback(() => {
    if (!micEnabled || !recognizer.isSupported()) {
      setIssue(!micEnabled ? 'disabled' : 'unsupported');
      setState(!micEnabled ? 'fallbackTap' : 'speechError');
      return;
    }

    if (busyRef.current || state === 'success' || state === 'assisted') return;
    setIssue(null);
    heardRef.current = '';
    soundRef.current = false;
    setCaptureStarted(false);
    setSoundDetected(false);
    setSpeechDetected(false);
    setTranscriptKind(null);
    setLastResult(null);
    busyRef.current = true;
    audioGate.setCapturing(true);
    const attempt = ++attemptRef.current;
    maxMatchedPrefixRef.current = 0;
    setMatchedPrefix(0);
    setLastTranscript('');

    setState('requesting');

    // Wait for guide completion, then a full 400 ms of silence.
    const begin = () => {
      if (attempt !== attemptRef.current) return;
      if (tts.isSpeaking()) {
        pendingStart.current = setTimeout(begin, 50);
        return;
      }
      pendingStart.current = setTimeout(() => {
        if (attempt !== attemptRef.current) return;
        const currentTarget = isSyllableMode
          ? (syllables?.[activeSyllableIndex] ?? targetText)
          : targetText;

        // Timeout durasi bicara (detik)
        const timeoutMs =
          level === 'letter' || isSyllableMode
            ? 6000
            : level === 'sentence' || level === 'story'
              ? Math.min(20000, 5000 + currentTarget.split(/\s+/).length * 1500)
              : 8000;

        recognizer.start({
          lang: 'id-ID',
          timeoutMs,
          onStart: () => {
            // Service startup alone does not prove the microphone captures audio.
          },
          onAudioStart: () => {
            if (attempt !== attemptRef.current) return;
            setCaptureStarted(true);
            setState('listening');
          },
          onSoundStart: () => {
            if (attempt !== attemptRef.current) return;
            soundRef.current = true;
            setSoundDetected(true);
          },
          onSpeechStart: () => {
            if (attempt !== attemptRef.current) return;
            soundRef.current = true;
            setSoundDetected(true);
            setSpeechDetected(true);
          },
          onProcessing: () => {
            if (attempt === attemptRef.current) setState('evaluating');
          },
          onInterim: (interim) => {
            if (attempt !== attemptRef.current) return;
            heardRef.current = interim;
            setTranscriptKind('interim');
            setLastTranscript(interim);
            // Hitung awalan yang cocok secara monoton
            const matchedChars = commonPrefixFuzzy(interim, currentTarget);
            if (matchedChars > maxMatchedPrefixRef.current) {
              maxMatchedPrefixRef.current = matchedChars;
              setMatchedPrefix(matchedChars);
            }
          },
          onFinal: (alternatives) => {
            if (attempt !== attemptRef.current) return;
            attemptRef.current++;
            recognizer.abort();
            releaseCapture();
            evaluateFinalSpeech(alternatives);
          },
          onError: (code: SpeechErrorCode) => {
            if (attempt !== attemptRef.current) return;
            setIssue(code);
            attemptRef.current++;
            recognizer.abort();
            releaseCapture();
            if (code === 'no-speech' || code === 'no-result') {
              setEmptyCount((count) => count + 1);
              setState('noSpeech');
            } else {
              setState('speechError');
            }
          },
          onEnd: () => {
            if (attempt !== attemptRef.current) return;
            attemptRef.current++;
            releaseCapture();
            setIssue(
              heardRef.current || soundRef.current ? 'no-result' : 'no-speech',
            );
            setEmptyCount((count) => count + 1);
            setState('noSpeech');
          },
        });
      }, 400);
    };
    begin();
  }, [
    recognizer,
    micEnabled,
    state,
    releaseCapture,
    isSyllableMode,
    syllables,
    activeSyllableIndex,
    targetText,
    level,
    evaluateFinalSpeech,
  ]);

  const stopListening = useCallback(() => {
    attemptRef.current++;
    clearTimeout(pendingStart.current);
    recognizer.abort();
    releaseCapture();
    setState('idle');
  }, [recognizer, releaseCapture]);

  const finishListening = useCallback(() => {
    if (state !== 'listening' || !busyRef.current) return;
    setState('evaluating');
    recognizer.stop();
  }, [state, recognizer]);

  const choosePractice = useCallback(() => {
    if (completedRef.current) return;
    stopListening();
    tts.cancel();
    setState('assisted');
  }, [stopListening]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (busyRef.current) stopListening();
        tts.cancel();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stopListening]);

  const finishWithHelp = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    tts.cancel();
    setCompletionMode('assisted');
    setState('success');
    sfx.playSuccessDing();
    onAssistedComplete?.();
  }, [onAssistedComplete]);

  const handleTapUnit = useCallback(
    (index: number) => {
      if (state !== 'fallbackTap') return;
      if (readingMode === 'syllable-by-syllable' && syllables?.length) {
        if (index !== activeSyllableIndex) return;
        if (index < syllables.length - 1) {
          sfx.playClick();
          setActiveSyllableIndex((prev) => prev + 1);
          return;
        }
      }
      finishWithHelp();
    },
    [state, readingMode, syllables, activeSyllableIndex, finishWithHelp],
  );

  const handleCompleteTap = useCallback(() => {
    if (state === 'fallbackTap') finishWithHelp();
  }, [state, finishWithHelp]);
  const handleFinishAssisted = useCallback(() => {
    if (state === 'assisted') finishWithHelp();
  }, [state, finishWithHelp]);

  const retryMicrophone = useCallback(() => {
    if (!micEnabled || !recognizer.isSupported() || completedRef.current)
      return;
    setIssue(null);
    setRetryCount(0);
    setState('idle');
  }, [micEnabled, recognizer]);

  return {
    state,
    issue,
    emptyCount,
    captureStarted,
    soundDetected,
    speechDetected,
    transcriptKind,
    helpRecommended: retryCount >= maxRetries,
    completionMode,
    choosePractice,
    finishListening,
    retryMicrophone,
    units,
    retryCount,
    lastTranscript,
    lastResult,
    matchedPrefixChars: matchedPrefix,
    activeSyllableIndex,
    isListening: state === 'listening',
    isRequesting: state === 'requesting',
    isSuccess: state === 'success',
    isFallbackTap: state === 'fallbackTap',
    isAssisted: state === 'assisted',
    startListening,
    stopListening,
    handleTapUnit,
    handleCompleteTap,
    handleFinishAssisted,
  };
}
