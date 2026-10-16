import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tts } from '@/lib/audio/tts';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SpeechReadCheck } from '@/features/activities/SpeechReadCheck/SpeechReadCheck';
import { MockSpeechRecognizer } from '@/lib/speech/speechRecognizer';
import type { WordItem } from '@/types/content';

const mockWordItem: WordItem = {
  id: 'w_test_bola',
  level: 'word',
  text: 'bola',
  syllables: ['bo', 'la'],
  difficulty: 1,
  image: {
    type: 'emoji',
    value: '⚽',
    alt: 'bola sepak',
  },
  imageRequired: true,
};

describe('SpeechReadCheck Activity Component', () => {
  beforeEach(() => {
    vi.spyOn(tts, 'speak').mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('offers an explicit practice choice when recognition is unsupported', () => {
    const mockRecognizer = new MockSpeechRecognizer(false);
    const onComplete = vi.fn();

    render(
      <SpeechReadCheck
        item={mockWordItem}
        recognizer={mockRecognizer}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByText('bo')).toBeInTheDocument();
    expect(screen.getByText('la')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'bola sepak' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /aku sudah baca/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /latihan tanpa penilaian/i }),
    ).toBeInTheDocument();
  });

  it('completes activity when child taps "Aku Sudah Baca" in fallback mode', async () => {
    vi.useFakeTimers();
    const mockRecognizer = new MockSpeechRecognizer(false);
    const onComplete = vi.fn();

    render(
      <SpeechReadCheck
        item={mockWordItem}
        recognizer={mockRecognizer}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /latihan tanpa penilaian/i }),
    );
    const button = screen.getByRole('button', { name: /aku sudah baca/i });
    fireEvent.click(button);

    // Advance 1200ms debounce before onComplete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]?.[0];
    expect(result).toBeDefined();
    expect(result?.activityType).toBe('speech_check');
    expect(result?.perItem[0]?.itemId).toBe('w_test_bola');
    expect(result?.perItem[0]?.outcome).toBe('assisted');

    vi.useRealTimers();
  });

  it('starts listening when microphone button is tapped with supported recognizer', async () => {
    vi.useFakeTimers();
    const mockRecognizer = new MockSpeechRecognizer(true);
    const onComplete = vi.fn();

    render(
      <SpeechReadCheck
        item={mockWordItem}
        recognizer={mockRecognizer}
        onComplete={onComplete}
      />,
    );

    const micBtn = screen.getByRole('button', { name: /mulai bicara/i });
    fireEvent.click(micBtn);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Mic button should now have aria-label "Hentikan mikrofon"
    expect(
      screen.getByRole('button', { name: /hentikan mikrofon/i }),
    ).toBeInTheDocument();

    vi.useRealTimers();
  });
});
