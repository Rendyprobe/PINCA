import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LearningMap.module.css';
import { getZones, getLessonsByZone } from '@/content';
import {
  progressStorage,
  type ChildProfile,
} from '@/lib/storage/progressStorage';
import { StarBar } from '@/components/StarBar/StarBar';
import { Mascot } from '@/components/Mascot/Mascot';
import { Button } from '@/components/Button/Button';
import { sfx } from '@/lib/audio/sfx';
import { tts } from '@/lib/audio/tts';

export interface LearningMapProps {
  onOpenProfile?: () => void;
}

export const LearningMap: React.FC<LearningMapProps> = ({ onOpenProfile }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone_1');
  const zones = getZones().slice(0, 3); // Zona 1, 2, dan 3 untuk M1-M2

  useEffect(() => {
    void progressStorage.getActiveProfile().then((p) => {
      setProfile(p);
      if (
        p.activeZoneId &&
        ['zone_1', 'zone_2', 'zone_3'].includes(p.activeZoneId)
      ) {
        setSelectedZoneId(p.activeZoneId);
      }
      void tts.speak(`Halo ${p.name}! Ayo kita lanjutkan petualangan membaca.`);
    });
  }, []);

  const completedSet = new Set(profile?.completedLessonIds ?? []);

  // Periksa apakah sebuah zona terbuka
  const isZoneUnlocked = (zoneId: string): boolean => {
    if (zoneId === 'zone_1') return true;

    if (zoneId === 'zone_2') {
      const z1Lessons = getLessonsByZone('zone_1');
      const z1Completed = z1Lessons.filter((l) =>
        completedSet.has(l.id),
      ).length;
      return z1Completed >= Math.ceil(z1Lessons.length * 0.8);
    }

    if (zoneId === 'zone_3') {
      const z2Lessons = getLessonsByZone('zone_2');
      const z2Completed = z2Lessons.filter((l) =>
        completedSet.has(l.id),
      ).length;
      return (
        isZoneUnlocked('zone_2') &&
        z2Completed >= Math.ceil(z2Lessons.length * 0.8)
      );
    }

    return false;
  };

  const handleZoneTabClick = (zoneId: string) => {
    const unlocked = isZoneUnlocked(zoneId);
    sfx.playClick();

    if (!unlocked) {
      void tts.speak('Selesaikan pelajaran di zona sebelumnya dulu ya!');
      return;
    }

    setSelectedZoneId(zoneId);
    if (profile) {
      void progressStorage.saveProfile({ ...profile, activeZoneId: zoneId });
    }

    const currentZone = zones.find((z) => z.id === zoneId);
    if (currentZone) {
      void tts.speak(`Selamat datang di ${currentZone.title}!`);
    }
  };

  const handleLessonClick = (lessonId: string, isLocked: boolean) => {
    if (isLocked) {
      sfx.playClick();
      void tts.speak('Selesaikan pelajaran sebelumnya dulu ya!');
      return;
    }
    sfx.playClick();
    navigate(`/lesson/${lessonId}`);
  };

  if (!profile) {
    return <div>Memuat peta belajar...</div>;
  }

  const activeZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0];
  const activeLessons = getLessonsByZone(selectedZoneId);

  return (
    <div className={styles.container}>
      {/* Zone Switcher Tabs */}
      <div
        className={styles.zoneTabs}
        role="tablist"
        aria-label="Pilihan Zona Belajar"
      >
        {zones.map((z) => {
          const unlocked = isZoneUnlocked(z.id);
          const isSelected = z.id === selectedZoneId;

          const tabClass = [
            styles.zoneTab,
            isSelected ? styles.zoneTabActive : '',
            !unlocked ? styles.zoneTabLocked : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={z.id}
              type="button"
              className={tabClass}
              onClick={() => handleZoneTabClick(z.id)}
              role="tab"
              aria-selected={isSelected}
              aria-label={`${z.title}${!unlocked ? ' (Terkunci)' : ''}`}
            >
              <span>{z.icon}</span>
              <span>{z.title}</span>
              {!unlocked && <span aria-hidden="true">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Active Zone Header */}
      {activeZone && (
        <div className={styles.zoneHeader}>
          <span
            className={styles.zoneIcon}
            role="img"
            aria-label={activeZone.title}
          >
            {activeZone.icon}
          </span>
          <div style={{ flex: 1 }}>
            <h2>{activeZone.title}</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {activeZone.id === 'zone_1' &&
                'Belajar bentuk dan bunyi 26 huruf alfabet bersama Bu Hantu!'}
              {activeZone.id === 'zone_2' &&
                'Belajar menggabungkan huruf konsonan dan vokal menjadi suku kata!'}
              {activeZone.id === 'zone_3' &&
                'Membaca dan menyusun kata-kata pertamamu yang bergambar!'}
            </p>
          </div>
          {onOpenProfile && (
            <Button
              variant="ghost"
              size="normal"
              onClick={onOpenProfile}
              ariaLabel="Ubah profil anak"
            >
              <span>{profile.avatar}</span>
              <span>{profile.name}</span>
            </Button>
          )}
        </div>
      )}

      {/* Mascot Prompt */}
      <div style={{ margin: '4px 0' }}>
        <Mascot
          mood="semangat"
          speechBubble={`Ayo ${profile.name}, pilih pelajaran di ${activeZone?.title} yuk!`}
          size={130}
          onClick={() => {
            sfx.playClick();
            void tts.speak(
              'Pilih kartu pelajaran untuk mulai petualangan membaca!',
            );
          }}
        />
      </div>

      {/* Lesson Path */}
      <div className={styles.mapPath}>
        {activeLessons.map((lesson, index) => {
          const isCompleted = completedSet.has(lesson.id);
          const stars = profile.lessonStars[lesson.id] ?? 0;

          // Terbuka jika pelajaran pertama ATAU prasyarat sudah selesai
          const isUnlocked =
            index === 0 ||
            !lesson.unlockAfter ||
            lesson.unlockAfter.every((depId) => completedSet.has(depId));

          const isLocked = !isUnlocked;
          const isActive = isUnlocked && !isCompleted;

          const cardClass = [
            styles.nodeCard,
            isActive ? styles.active : '',
            isLocked ? styles.locked : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={lesson.id}
              className={cardClass}
              onClick={() => handleLessonClick(lesson.id, isLocked)}
              role="button"
              tabIndex={isLocked ? -1 : 0}
              aria-disabled={isLocked}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLessonClick(lesson.id, isLocked);
                }
              }}
            >
              <div className={styles.nodeInfo}>
                <div className={styles.nodeNumber}>
                  {isLocked ? '🔒' : index + 1}
                </div>
                <div>
                  <h3 className={styles.nodeTitle}>{lesson.title}</h3>
                  <p className={styles.nodeSubtitle}>
                    {lesson.itemIds.length} Materi · {lesson.activities.length}{' '}
                    Aktivitas Ceria
                  </p>
                </div>
              </div>

              <div>
                {isCompleted ? (
                  <StarBar stars={stars} size="normal" />
                ) : isLocked ? (
                  <span
                    style={{
                      fontSize: '1.2rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Terkunci
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFF',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Mulai 🚀
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
