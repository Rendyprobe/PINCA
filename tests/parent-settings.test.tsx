import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentSettingsModal } from '@/features/parent/ParentSettingsModal';
import type { ChildProfile } from '@/lib/storage/progressStorage';

const mockProfile: ChildProfile = {
  id: 'profile_test',
  name: 'Budi',
  avatar: '🐰',
  createdAt: 1000,
  activeZoneId: 'zone_1',
  completedLessonIds: [],
  lessonStars: {},
  settings: {
    readingMode: 'syllables',
    difficultyThreshold: 'easy',
    ttsRate: 0.85,
    fontSize: 'large',
    fontFamily: 'default',
    soundEnabled: true,
    micEnabled: true,
  },
  unlockedAllLessons: false,
};

describe('ParentSettingsModal Component', () => {
  it('renders parental gate initially and blocks incorrect answer', async () => {
    const user = userEvent.setup();
    render(
      <ParentSettingsModal
        profile={mockProfile}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Pengaturan Orang Tua \/ Guru/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Halaman ini khusus untuk pendamping/i),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Jawaban pertanyaan keamanan orang tua/i);
    await user.type(input, '999');
    await user.click(screen.getByRole('button', { name: /Buka Pengaturan/i }));

    expect(
      screen.getByText(/Jawaban belum tepat, silakan coba lagi/i),
    ).toBeInTheDocument();
  });

  it('unlocks settings when math challenge is solved correctly and saves updates', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(
      <ParentSettingsModal
        profile={mockProfile}
        onSave={handleSave}
        onClose={vi.fn()}
      />,
    );

    // Parse the math question: "num1 + num2 = ?"
    const questionEl = document.querySelector('[class*="gateQuestion"]');
    expect(questionEl).not.toBeNull();
    const match = questionEl?.textContent?.match(/(\d+)\s*\+\s*(\d+)/);
    expect(match).not.toBeNull();
    const num1 = match?.[1] ? parseInt(match[1], 10) : 0;
    const num2 = match?.[2] ? parseInt(match[2], 10) : 0;
    const sum = num1 + num2;

    const input = screen.getByLabelText(/Jawaban pertanyaan keamanan orang tua/i);
    await user.type(input, String(sum));
    await user.click(screen.getByRole('button', { name: /Buka Pengaturan/i }));

    // Now settings are unlocked
    expect(screen.getByText(/Pengecekan Suara & Mikrofon/i)).toBeInTheDocument();
    expect(screen.getByText(/Kendali Kurikulum/i)).toBeInTheDocument();

    // Toggle unlock all
    const unlockAllCheckbox = screen.getByLabelText(/Buka Kunci Manual/i, {
      selector: 'input',
    });
    await user.click(unlockAllCheckbox);

    // Save
    await user.click(
      screen.getByRole('button', { name: /Simpan Pengaturan/i }),
    );

    expect(handleSave).toHaveBeenCalledTimes(1);
    const saved = handleSave.mock.calls[0]?.[0] as ChildProfile | undefined;
    expect(saved?.unlockedAllLessons).toBe(true);
    expect(saved?.settings?.micEnabled).toBe(true);
  });
});

