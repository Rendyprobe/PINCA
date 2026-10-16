import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SoundGuess } from '@/features/activities/SoundGuess/SoundGuess';
import { LearningMap } from '@/features/map/LearningMap';
import { getLetters } from '@/content';
import { tts } from '@/lib/audio/tts';
import { progressStorage } from '@/lib/storage/progressStorage';
import type { UserSettings } from '@/types/content';

const settings: UserSettings = {
  readingMode: 'syllables',
  difficultyThreshold: 'easy',
  ttsRate: 0.85,
  fontSize: 'large',
  fontFamily: 'default',
  soundEnabled: true,
  micEnabled: false,
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Page responsiveness regressions', () => {
  it('keeps the sound activity stable instead of restarting its initialization on every render', () => {
    vi.useFakeTimers();
    let prompts = 0;
    vi.spyOn(tts, 'speak').mockImplementation(async () => {
      // Fail promptly if the old render loop returns, instead of hanging the runner.
      if (++prompts > 10) throw new Error('Repeated initialization');
    });
    const onProgress = vi.fn();
    const items = getLetters().filter((letter) => letter.id === 'l_a');
    render(
      <SoundGuess
        items={items}
        settings={settings}
        onProgress={onProgress}
        onComplete={vi.fn()}
      />,
    );
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(prompts).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih huruf A' }));
    expect(screen.getByText(/Benar!/)).toBeInTheDocument();
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(prompts).toBe(2);
  });

  it('changes map zones without reloading the profile or resetting the selected zone', async () => {
    const load = vi
      .spyOn(progressStorage, 'getActiveProfile')
      .mockResolvedValue({
        id: 'test',
        name: 'Teman',
        avatar: '',
        createdAt: 0,
        activeZoneId: 'zone_1',
        completedLessonIds: [],
        lessonStars: {},
      });
    vi.spyOn(progressStorage, 'saveProfile').mockResolvedValue();
    const speak = vi.spyOn(tts, 'speak').mockResolvedValue();
    await act(async () => {
      render(
        <MemoryRouter>
          <LearningMap />
        </MemoryRouter>,
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kata Pertama' }));
    expect(
      screen.getByRole('button', { name: 'Kata Pertama' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(load).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(2);
  });
});
