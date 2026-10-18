import React from 'react';
import type { ImageRef } from '@/types/content';
import styles from './WordIllustration.module.css';

export interface WordIllustrationProps {
  image?: ImageRef;
  size?: number | string;
  className?: string;
}

export const WordIllustration: React.FC<WordIllustrationProps> = ({
  image,
  size,
  className,
}) => {
  if (!image) return null;

  const style = size ? { width: size, height: size } : undefined;

  if (image.type === 'svg') {
    return (
      <div
        className={`${styles.container} ${className ?? ''}`.trim()}
        style={style}
      >
        <img
          src={image.value}
          alt={image.alt}
          className={styles.svgImage}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${className ?? ''}`.trim()}
      style={style}
    >
      <span
        className={styles.emojiBadge}
        role="img"
        aria-label={image.alt}
      >
        <span
          className={styles.emojiChar}
          style={
            size
              ? {
                  fontSize:
                    typeof size === 'number'
                      ? `${size * 0.6}px`
                      : `calc(${size} * 0.6)`,
                }
              : undefined
          }
        >
          {image.value}
        </span>
      </span>
    </div>
  );
};
