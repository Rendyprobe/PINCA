import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KaraokeRead } from '@/features/activities/KaraokeRead/KaraokeRead';
import type { WordItem, UserSettings } from '@/types/content';

const mockSettings: UserSettings = {
  readingMode: 'syllables',
  difficultyThreshold: 'easy',
  ttsRate: 0.8,
  fontSize: 'large',
  fontFamily: 'default',
  soundEnabled: true,
  micEnabled: false,
};

const sampleWord: WordItem = {
  id: 'w_sapi',
  level: 'word',
  text: 'sapi',
  syllables: ['sa', 'pi'],
  difficulty: 1,
  image: { type: 'emoji', value: '🐄', alt: 'sapi' },
  imageRequired: true,
};

describe('KaraokeRead Activity Component', () => {
  it('renders all syllables of the target word', () => {
    render(
      <KaraokeRead
        items={[sampleWord]}
        onComplete={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText('🐄')).toBeInTheDocument();
    expect(screen.getByText('sa')).toBeInTheDocument();
    expect(screen.getByText('pi')).toBeInTheDocument();
  });

  it('triggers onComplete when child clicks continue button', async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();

    render(
      <KaraokeRead
        items={[sampleWord]}
        onComplete={handleComplete}
        settings={mockSettings}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /aku bisa! lanjut/i });
    await user.click(nextBtn);

    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: 'karaoke_read',
        perItem: expect.arrayContaining([
          expect.objectContaining({ itemId: 'w_sapi', outcome: 'ok' }),
        ]),
      }),
    );
  });
});

