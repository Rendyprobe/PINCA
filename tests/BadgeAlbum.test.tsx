import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BadgeAlbumModal } from '@/features/rewards/BadgeAlbumModal';
import type { ChildProfile } from '@/lib/storage/progressStorage';

describe('BadgeAlbumModal Component', () => {
  const profile: ChildProfile = {
    id: 'child_1',
    name: 'Kirana',
    avatar: '🐱',
    createdAt: Date.now(),
    activeZoneId: 'zone_1',
    completedLessonIds: ['lesson_1_vowels'],
    lessonStars: { lesson_1_vowels: 3 },
  };

  it('renders album title and child collection name', () => {
    render(<BadgeAlbumModal profile={profile} onClose={vi.fn()} />);

    expect(screen.getByText(/Album Stiker Prestasi/i)).toBeInTheDocument();
    expect(screen.getByText(/Koleksi Kirana/i)).toBeInTheDocument();
  });

  it('renders badges with proper unlocked status', () => {
    render(<BadgeAlbumModal profile={profile} onClose={vi.fn()} />);

    // Langkah pertama should be unlocked because 1 lesson completed
    expect(screen.getByText('Langkah Pertama')).toBeInTheDocument();
    expect(screen.getByText('✨ Terbuka!')).toBeInTheDocument();

    // Jagoan Membaca should be locked (requires 15 lessons)
    expect(screen.getByText('Jagoan Membaca')).toBeInTheDocument();
    expect(screen.getByText('1/15')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<BadgeAlbumModal profile={profile} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /tutup album stiker/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

