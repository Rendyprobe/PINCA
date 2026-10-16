import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArrangeSyllables } from '@/features/activities/ArrangeSyllables/ArrangeSyllables';
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
  id: 'w_bola',
  level: 'word',
  text: 'bola',
  syllables: ['bo', 'la'],
  difficulty: 1,
  image: { type: 'emoji', value: '⚽', alt: 'bola' },
  imageRequired: true,
};

describe('ArrangeSyllables Activity Component', () => {
  it('renders target word image and empty slots', () => {
    render(
      <ArrangeSyllables
        items={[sampleWord]}
        onComplete={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText('⚽')).toBeInTheDocument();
    expect(screen.getByLabelText(/slot 1: kosong/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slot 2: kosong/i)).toBeInTheDocument();
  });

  it('moves tapped piece to first empty slot via tap-to-place', async () => {
    const user = userEvent.setup();
    render(
      <ArrangeSyllables
        items={[sampleWord]}
        onComplete={vi.fn()}
        settings={mockSettings}
      />,
    );

    const boBtn = screen.getByRole('button', { name: /pilih suku kata bo/i });
    await user.click(boBtn);

    // Slot 1 should now be filled with 'bo'
    expect(screen.getByLabelText(/slot 1: bo/i)).toBeInTheDocument();
  });

  it('returns piece to pool when filled slot is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ArrangeSyllables
        items={[sampleWord]}
        onComplete={vi.fn()}
        settings={mockSettings}
      />,
    );

    const boBtn = screen.getByRole('button', { name: /pilih suku kata bo/i });
    await user.click(boBtn);

    const filledSlot = screen.getByLabelText(/slot 1: bo/i);
    await user.click(filledSlot);

    // Slot 1 should be empty again
    expect(screen.getByLabelText(/slot 1: kosong/i)).toBeInTheDocument();
  });
});

