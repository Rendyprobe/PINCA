import React from 'react';
import styles from './Mascot.module.css';

export type MascotMood =
  | 'idle'
  | 'senang'
  | 'semangat'
  | 'berpikir'
  | 'mendengar'
  | 'merayakan'
  | 'istirahat';

export interface MascotProps {
  mood?: MascotMood;
  speechBubble?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'idle',
  speechBubble,
  size = 140,
  className,
  onClick,
}) => {
  return (
    <div
      className={`${styles.mascotWrapper} ${className ?? ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {speechBubble && (
        <div className={styles.bubble} aria-live="polite">
          {speechBubble}
        </div>
      )}
      <svg
        className={styles.mascotSvg}
        style={{ width: size, height: size }}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Maskot Bu Hantu sedang ${mood}`}
      >
        {/* Head Feather Tufts / Ears */}
        <path
          d="M 40 45 L 30 18 L 60 35 Z"
          fill="#4DABF7"
          stroke="#339AF0"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 120 45 L 130 18 L 100 35 Z"
          fill="#4DABF7"
          stroke="#339AF0"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Main Body */}
        <ellipse
          cx="80"
          cy="92"
          rx="54"
          ry="58"
          fill="#74C0FC"
          stroke="#339AF0"
          strokeWidth="3.5"
        />

        {/* Belly */}
        <ellipse cx="80" cy="102" rx="38" ry="40" fill="#FFF8E7" />
        {/* Belly feather marks */}
        <path
          d="M 70 95 Q 80 102 90 95"
          stroke="#FFA94D"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 68 110 Q 80 117 92 110"
          stroke="#FFA94D"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Wings */}
        {mood === 'merayakan' || mood === 'semangat' ? (
          <>
            <path
              d="M 28 85 C 10 70 8 50 20 42 C 32 48 38 70 34 85 Z"
              fill="#4DABF7"
              stroke="#339AF0"
              strokeWidth="3"
            />
            <path
              d="M 132 85 C 150 70 152 50 140 42 C 128 48 122 70 126 85 Z"
              fill="#4DABF7"
              stroke="#339AF0"
              strokeWidth="3"
            />
          </>
        ) : (
          <>
            <path
              d="M 28 85 C 20 95 20 115 32 122 C 36 112 36 96 34 85 Z"
              fill="#4DABF7"
              stroke="#339AF0"
              strokeWidth="3"
            />
            <path
              d="M 132 85 C 140 95 140 115 128 122 C 124 112 124 96 126 85 Z"
              fill="#4DABF7"
              stroke="#339AF0"
              strokeWidth="3"
            />
          </>
        )}

        {/* Eyes Rings (Big friendly owl spectacles) */}
        <circle
          cx="58"
          cy="68"
          r="22"
          fill="#FFFFFF"
          stroke="#FFA94D"
          strokeWidth="3.5"
        />
        <circle
          cx="102"
          cy="68"
          r="22"
          fill="#FFFFFF"
          stroke="#FFA94D"
          strokeWidth="3.5"
        />

        {/* Eye Pupils based on Mood */}
        {mood === 'senang' || mood === 'merayakan' ? (
          <>
            {/* Happy curved eyes ^^ */}
            <path
              d="M 48 70 Q 58 60 68 70"
              stroke="#2B2B3A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 92 70 Q 102 60 112 70"
              stroke="#2B2B3A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : mood === 'istirahat' ? (
          <>
            {/* Sleeping eyes - - */}
            <path
              d="M 48 68 Q 58 74 68 68"
              stroke="#2B2B3A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 92 68 Q 102 74 112 68"
              stroke="#2B2B3A"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : mood === 'berpikir' ? (
          <>
            {/* Thinking eyes looking up-right */}
            <circle cx="62" cy="62" r="9" fill="#2B2B3A" />
            <circle cx="65" cy="59" r="3" fill="#FFFFFF" />
            <circle cx="106" cy="62" r="9" fill="#2B2B3A" />
            <circle cx="109" cy="59" r="3" fill="#FFFFFF" />
          </>
        ) : mood === 'mendengar' ? (
          <>
            {/* Listening attentive eyes */}
            <circle cx="58" cy="68" r="10" fill="#2B2B3A" />
            <circle cx="61" cy="65" r="3.5" fill="#FFFFFF" />
            <circle cx="102" cy="68" r="10" fill="#2B2B3A" />
            <circle cx="105" cy="65" r="3.5" fill="#FFFFFF" />
            {/* Headphone / ear mic indicator */}
            <circle
              cx="28"
              cy="68"
              r="7"
              fill="#FFD43B"
              stroke="#FFA94D"
              strokeWidth="2"
            />
            <circle
              cx="132"
              cy="68"
              r="7"
              fill="#FFD43B"
              stroke="#FFA94D"
              strokeWidth="2"
            />
            <path
              d="M 28 62 C 28 35 132 35 132 62"
              stroke="#FFA94D"
              strokeWidth="3"
              fill="none"
            />
          </>
        ) : (
          <>
            {/* Idle / Semangat: big sparkling eyes */}
            <circle cx="58" cy="68" r="9" fill="#2B2B3A" />
            <circle cx="61" cy="65" r="3.5" fill="#FFFFFF" />
            <circle cx="102" cy="68" r="9" fill="#2B2B3A" />
            <circle cx="105" cy="65" r="3.5" fill="#FFFFFF" />
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="42" cy="80" rx="6" ry="4" fill="#FFD43B" opacity="0.6" />
        <ellipse cx="118" cy="80" rx="6" ry="4" fill="#FFD43B" opacity="0.6" />

        {/* Beak */}
        <polygon
          points="80,72 87,83 73,83"
          fill="#FFA94D"
          stroke="#FF922B"
          strokeWidth="1.5"
        />

        {/* Feet */}
        <ellipse cx="66" cy="148" rx="8" ry="4" fill="#FFA94D" />
        <ellipse cx="94" cy="148" rx="8" ry="4" fill="#FFA94D" />
      </svg>
    </div>
  );
};
