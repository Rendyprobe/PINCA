import React, { useState } from 'react';
import styles from './BadgeAlbumModal.module.css';
import type { ChildProfile } from '@/lib/storage/progressStorage';
import {
  evaluateBadges,
  countUnlockedBadges,
  type EvaluatedBadge,
} from '@/lib/progress/badgeService';
import { Button } from '@/components/Button/Button';
import { Mascot } from '@/components/Mascot/Mascot';
import { sfx } from '@/lib/audio/sfx';

export interface BadgeAlbumModalProps {
  profile: ChildProfile;
  onClose: () => void;
}

export const BadgeAlbumModal: React.FC<BadgeAlbumModalProps> = ({
  profile,
  onClose,
}) => {
  const evaluatedBadges = evaluateBadges(profile);
  const { unlocked, total } = countUnlockedBadges(profile);

  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(
    null,
  );

  const handleCardClick = (badge: EvaluatedBadge) => {
    setSelectedBadge(badge);
    if (badge.isUnlocked) {
      sfx.playCelebrate();
    } else {
      sfx.playClick();
    }
  };

  const mascotBubble = selectedBadge
    ? selectedBadge.isUnlocked
      ? `Hebat sekali! Kamu sudah meraih stiker "${selectedBadge.title}"! 🌟`
      : `Yuk selesaikan misi: ${selectedBadge.description}`
    : `Kamu sudah mengumpulkan ${unlocked} dari ${total} stiker hebat! 🚀`;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 id="album-title">🏆 Album Stiker Prestasi</h2>
            <span className={styles.subtitle}>
              Koleksi {profile.name} ({unlocked} dari {total} Terbuka)
            </span>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            aria-label="Tutup album stiker"
          >
            ✕
          </button>
        </div>

        <div className={styles.grid}>
          {evaluatedBadges.map((badge) => {
            const isSelected = selectedBadge?.id === badge.id;
            const cardClass = [
              styles.badgeCard,
              badge.isUnlocked ? styles.unlocked : styles.locked,
            ].join(' ');

            const progressPct =
              badge.totalRequired > 0
                ? (badge.currentProgress / badge.totalRequired) * 100
                : 0;

            return (
              <div
                key={badge.id}
                className={cardClass}
                onClick={() => handleCardClick(badge)}
                role="button"
                tabIndex={0}
                aria-label={`Stiker ${badge.title}: ${badge.isUnlocked ? 'Terbuka' : 'Masih Terkunci'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(badge);
                  }
                }}
                style={{
                  outline: isSelected ? '3px solid var(--color-primary)' : 'none',
                }}
              >
                <div className={styles.iconWrapper}>
                  <span>{badge.isUnlocked ? badge.icon : '🔒'}</span>
                </div>

                <h3 className={styles.badgeTitle}>{badge.title}</h3>
                <p className={styles.badgeDesc}>{badge.description}</p>

                {!badge.isUnlocked && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}

                <span
                  className={`${styles.statusTag} ${
                    badge.isUnlocked ? styles.tagUnlocked : styles.tagLocked
                  }`}
                >
                  {badge.isUnlocked
                    ? '✨ Terbuka!'
                    : `${badge.currentProgress}/${badge.totalRequired}`}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}
        >
          <Mascot
            mood={selectedBadge?.isUnlocked ? 'merayakan' : 'semangat'}
            speechBubble={mascotBubble}
            size={72}
          />

          <Button
            variant="primary"
            size="normal"
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
          >
            Tutup Album
          </Button>
        </div>
      </div>
    </div>
  );
};

