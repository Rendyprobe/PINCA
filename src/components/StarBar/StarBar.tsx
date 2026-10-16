import React from 'react';
import styles from './StarBar.module.css';

export interface StarBarProps {
  stars: number; // 0..3
  maxStars?: number;
  size?: 'normal' | 'large';
  className?: string;
}

export const StarBar: React.FC<StarBarProps> = ({
  stars,
  maxStars = 3,
  size = 'normal',
  className,
}) => {
  const clampedStars = Math.max(0, Math.min(stars, maxStars));

  return (
    <div
      className={`${styles.starBar} ${className ?? ''}`}
      role="img"
      aria-label={`Mendapatkan ${clampedStars} dari ${maxStars} bintang`}
    >
      {Array.from({ length: maxStars }).map((_, idx) => {
        const isEarned = idx < clampedStars;
        return (
          <span
            key={idx}
            className={`${styles.star} ${isEarned ? styles.starEarned : ''}`}
            style={{ fontSize: size === 'large' ? '3.5rem' : '2.2rem' }}
            aria-hidden="true"
          >
            ⭐
          </span>
        );
      })}
    </div>
  );
};
