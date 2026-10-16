import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button/Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Mulai Membaca</Button>);
    expect(screen.getByRole('button', { name: /mulai membaca/i })).toBeInTheDocument();
  });

  it('triggers onClick callback when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Klik Aku</Button>);

    const button = screen.getByRole('button', { name: /klik aku/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Tidak Bisa Diklik</Button>);

    const button = screen.getByRole('button', { name: /tidak bisa diklik/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('supports aria-label for accessibility', () => {
    render(<Button ariaLabel="Tombol Dengarkan Suara">🔊</Button>);
    expect(screen.getByRole('button', { name: /tombol dengarkan suara/i })).toBeInTheDocument();
  });
});

