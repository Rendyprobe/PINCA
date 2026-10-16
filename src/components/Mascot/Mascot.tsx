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

/** Bu Delia: a gentle owl teacher with a book and expressive, readable eyes. */
export const Mascot: React.FC<MascotProps> = ({
  mood = 'idle',
  speechBubble,
  size = 140,
  className,
  onClick,
}) => {
  const happy = mood === 'senang' || mood === 'merayakan';
  const resting = mood === 'istirahat';
  const celebrating = mood === 'merayakan';
  const pupilOffset = mood === 'berpikir' ? 4 : 0;
  return (
    <div
      className={`${styles.mascotWrapper} ${className ?? ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? 'Dengarkan Bu Delia' : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
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
        className={`${styles.mascotSvg} ${celebrating ? styles.celebrating : ''}`}
        style={{ width: size, height: size }}
        width={size}
        height={size}
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Maskot Bu Delia sedang ${mood}`}
      >
        <ellipse cx="90" cy="167" rx="48" ry="6" fill="#E9DFCE" />
        <path
          d="M43 56Q30 29 45 24L68 40M137 56Q150 29 135 24L112 40"
          fill="#A98ACB"
          stroke="#71538E"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M35 87C30 40 57 30 90 34C123 30 150 40 145 87L143 120C141 151 121 165 90 165C59 165 39 151 37 120Z"
          fill="#B69AD5"
          stroke="#71538E"
          strokeWidth="3"
        />
        <path
          d="M45 81C41 51 69 42 90 60C111 42 139 51 135 81C135 107 110 119 90 123C70 119 45 107 45 81Z"
          fill="#FFF6E5"
        />
        <ellipse cx="90" cy="131" rx="35" ry="27" fill="#FFF6E5" />
        <path
          d="M77 123L82 128L87 123M93 123L98 128L103 123"
          stroke="#D7C3A4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="67" cy="162" rx="10" ry="5" fill="#E9AE58" />
        <ellipse cx="113" cy="162" rx="10" ry="5" fill="#E9AE58" />
        <g stroke="#71538E" strokeWidth="3">
          <circle cx="65" cy="78" r="21" fill="#FFFEFA" />
          <circle cx="115" cy="78" r="21" fill="#FFFEFA" />
          <path
            d="M86 77Q90 73 94 77M40 72L44 73M136 73L140 72"
            strokeLinecap="round"
          />
        </g>
        {happy || resting ? (
          <g stroke="#493C59" strokeWidth="3.5" strokeLinecap="round">
            <path d={resting ? 'M55 79Q65 86 75 79' : 'M55 81Q65 69 75 81'} />
            <path
              d={resting ? 'M105 79Q115 86 125 79' : 'M105 81Q115 69 125 81'}
            />
          </g>
        ) : (
          <g>
            <ellipse
              cx={65 + pupilOffset}
              cy={mood === 'berpikir' ? 74 : 79}
              rx="8"
              ry={mood === 'mendengar' ? 10 : 9}
              fill="#493C59"
            />
            <ellipse
              cx={115 + pupilOffset}
              cy={mood === 'berpikir' ? 74 : 79}
              rx="8"
              ry={mood === 'mendengar' ? 10 : 9}
              fill="#493C59"
            />
            <circle
              cx={68 + pupilOffset}
              cy={mood === 'berpikir' ? 71 : 76}
              r="3"
              fill="#FFF"
            />
            <circle
              cx={118 + pupilOffset}
              cy={mood === 'berpikir' ? 71 : 76}
              r="3"
              fill="#FFF"
            />
          </g>
        )}
        <ellipse cx="45" cy="99" rx="7" ry="4" fill="#F5D69A" />
        <ellipse cx="135" cy="99" rx="7" ry="4" fill="#F5D69A" />
        <path
          d="M83 94Q90 89 97 94L90 104Z"
          fill="#E9AE58"
          stroke="#C78B36"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {resting ? (
          <ellipse cx="90" cy="112" rx="4" ry="5" fill="#71538E" />
        ) : (
          <path
            d="M84 109Q90 114 96 109"
            stroke="#71538E"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        <path
          d="M90 141Q73 129 56 136L58 158Q76 151 90 162Q104 151 122 158L124 136Q107 129 90 141Z"
          fill="#BFE1D6"
          stroke="#4D8375"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M90 142V160M65 142L80 145M100 145L115 142"
          stroke="#6D9F90"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={
            celebrating || mood === 'semangat'
              ? 'M39 99C23 96 13 71 23 65C35 65 45 83 43 99Z'
              : 'M37 104C24 115 29 141 43 145Q52 126 43 106Z'
          }
          fill="#9675B6"
          stroke="#71538E"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d={
            celebrating
              ? 'M141 99C157 96 167 71 157 65C145 65 135 83 137 99Z'
              : 'M143 104C156 115 151 141 137 145Q128 126 137 106Z'
          }
          fill="#9675B6"
          stroke="#71538E"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {mood === 'mendengar' && (
          <g stroke="#4D8375" strokeWidth="3" strokeLinecap="round">
            <path d="M28 59Q19 75 28 91M17 55Q5 75 17 95M152 59Q161 75 152 91" />
          </g>
        )}
        {celebrating && (
          <g fill="#E9AE58">
            <path d="M18 35L21 42L28 45L21 48L18 55L15 48L8 45L15 42Z" />
            <path d="M155 23L158 30L165 33L158 36L155 43L152 36L145 33L152 30Z" />
          </g>
        )}
      </svg>
    </div>
  );
};
