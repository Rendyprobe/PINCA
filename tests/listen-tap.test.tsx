import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListenTap } from '@/features/activities/ListenTap/ListenTap';
import type { LetterItem, SyllableItem, UserSettings } from '@/types/content';

const mockSettings: UserSettings = {
  readingMode: 'syllables',
  difficultyThreshold: 'easy',
  ttsRate: 0.8,
  fontSize: 'large',
  fontFamily: 'default',
  soundEnabled: true,
  micEnabled: false,
};

const sampleLetter: LetterItem = {
  id: 'l_a',
  level: 'letter',
  text: 'a',
  upper: 'A',
  lower: 'a',
  soundTts: 'aa',
  nameTts: 'a',
  difficulty: 1,
  exampleWordId: 'w_apel',
};

const sampleSyllable: SyllableItem = {
  id: 'syl_ba',
  level: 'syllable',
  text: 'ba',
  letters: ['b', 'a'],
  difficulty: 1,
  ttsText: 'baa',
};

describe('ListenTap Activity Component', () => {
  it('renders letter mode correctly with upper/lower display', () => {
    render(
      <ListenTap
        items={[sampleLetter]}
        onComplete={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText(/Ketuk huruf "A"/i)).toBeInTheDocument();
    expect(screen.getByText('A a')).toBeInTheDocument();
  });

  it('renders syllable mode correctly without undefined labels', () => {
    render(
      <ListenTap
        items={[sampleSyllable]}
        onComplete={vi.fn()}
        settings={mockSettings}
      />,
    );

    expect(screen.getByText(/Ketuk suku kata "ba"/i)).toBeInTheDocument();
    expect(screen.getByText('ba')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
  });

  it('completes syllable selection when child taps correct syllable card', async () => {
    const user = userEvent.setup();
    const handleComplete = vi.fn();

    render(
      <ListenTap
        items={[sampleSyllable]}
        onComplete={handleComplete}
        settings={mockSettings}
      />,
    );

    const targetCard = screen.getByRole('button', { name: /suku kata ba/i });
    await user.click(targetCard);

    expect(screen.getByText(/✓ Benar!/i)).toBeInTheDocument();
  });
});

