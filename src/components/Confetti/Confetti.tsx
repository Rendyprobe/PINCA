import React, { useMemo } from 'react';
import styles from './Confetti.module.css';

export interface ConfettiProps {
  count?: number;
}

const COLORS = [
  '#4dabf7', // Biru
  '#ffd43b', // Kuning
  '#ffa94d', // Oranye
  '#40c057', // Hijau
  '#9775fa', // Ungu
  '#ff8787', // Merah muda lembut
];

export const Confetti: React.FC<ConfettiProps> = ({ count = 28 }) => {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, idx) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 2.2 + Math.random() * 1.5;
      const color = COLORS[idx % COLORS.length];
      const isRound = idx % 3 === 0;

      return {
        id: idx,
        style: {
          left: `${left}%`,
          backgroundColor: color,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          borderRadius: isRound ? '50%' : '4px',
        },
      };
    });
  }, [count]);

  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {pieces.map((p) => (
        <div key={p.id} className={styles.piece} style={p.style} />
      ))}
    </div>
  );
};

