import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const queryZone = searchParams.get('zone');

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone_1');
  const zones = useMemo(() => getZones(), []);

  useEffect(() => {
    let active = true;
    void progressStorage.getActiveProfile().then((p) => {
      if (!active) return;
      setProfile(p);
      const targetZone = queryZone || p.activeZoneId || 'zone_1';
      const validZoneIds = zones.map((z) => z.id);
      if (validZoneIds.includes(targetZone)) {
        setSelectedZoneId(targetZone);
      }
      void tts.speak('Halo, Teman! Ayo kita lanjutkan petualangan membaca.');
    });
    return () => {
      active = false;
      tts.cancel();
    };
  }, [queryZone, zones]);

  const completedSet = new Set(profile?.completedLessonIds ?? []);

  const handleZoneTabClick = (zoneId: string) => {
    sfx.playClick();
    setSelectedZoneId(zoneId);
    if (profile) {
      void progressStorage.saveProfile({ ...profile, activeZoneId: zoneId });
    }

    const currentZone = zones.find((z) => z.id === zoneId);
    if (currentZone) {
      void tts.speak(`Selamat datang di ${currentZone.title}!`);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    sfx.playClick();
    tts.cancel();
    navigate(`/lesson/${lessonId}`);
  };

  if (!profile) {
    return <div>Memuat peta belajar...</div>;
  }

  const activeZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0];
  const activeLessons = getLessonsByZone(selectedZoneId);
  const finishedLessons = activeLessons.filter((lesson) =>
    completedSet.has(lesson.id),
  ).length;

  return (
    <div className={styles.container}>
      {/* Bar Navigasi Atas: Tombol Kembali & Info Profil */}
      <div className={styles.topNav}>
        <Button
          variant="secondary"
          size="normal"
          onClick={() => {
            sfx.playClick();
            tts.cancel();
            navigate('/');
          }}
          ariaLabel="Kembali ke Beranda"
        >
          <span>⬅️</span>
          <span>Kembali ke Beranda</span>
        </Button>

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

      <header className={styles.welcome}>
        <span className={styles.eyebrow}>AYO MEMBACA!</span>
        <h1>Petualangan membaca</h1>
        <p>Halo, {profile.name}. Mau belajar apa hari ini?</p>
      </header>
      {/* All zones remain selectable. */}
      <div
        className={styles.zoneTabs}
        role="group"
        aria-label="Pilihan Zona Belajar"
      >
        {zones.map((z) => {
          const isSelected = z.id === selectedZoneId;

          const tabClass = [
            styles.zoneTab,
            isSelected ? styles.zoneTabActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={z.id}
              type="button"
              className={tabClass}
              onClick={() => handleZoneTabClick(z.id)}
              aria-pressed={isSelected}
              aria-label={z.title}
            >
              <span>{z.icon}</span>
              <span>{z.title}</span>
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
          <div className={styles.zoneDescription}>
            <h2>{activeZone.title}</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {activeZone.id === 'zone_1' &&
                'Belajar bentuk dan bunyi 26 huruf alfabet bersama Bu Delia!'}
              {activeZone.id === 'zone_2' &&
                'Belajar menggabungkan huruf konsonan dan vokal menjadi suku kata!'}
              {activeZone.id === 'zone_3' &&
                'Membaca dan menyusun kata-kata pertamamu yang bergambar!'}
              {activeZone.id === 'zone_4' &&
                'Membaca kata lebih panjang dan pola suku kata tertutup!'}
              {activeZone.id === 'zone_5' &&
                'Membaca kalimat pendek bergambar dengan lancar!'}
              {activeZone.id === 'zone_6' &&
                'Membaca cerita mini yang menyenangkan bersama Bu Delia!'}
            </p>
          </div>
        </div>
      )}

      {activeLessons.length > 0 && (
        <div className={styles.progressSummary}>
          <span>Langkah kecil, kemajuan besar</span>
          <strong>
            {finishedLessons} / {activeLessons.length} selesai
          </strong>
          <progress
            value={finishedLessons}
            max={activeLessons.length}
            aria-label="Kemajuan pelajaran zona"
          />
        </div>
      )}
      {/* Lesson Path */}
      <div className={styles.mapPath}>
        {activeLessons.length === 0 ? (
          <div className={styles.emptyNotice}>
            <span style={{ fontSize: '3rem' }}>🌟</span>
            <h3>Zona {activeZone?.title} Segera Hadir!</h3>
            <p>Materi untuk zona ini sedang disiapkan Bu Delia.</p>
            <p>
              Ayo selesaikan dulu Zona 1, 2, dan 3 yang penuh petualangan seru!
            </p>
            <Button
              variant="primary"
              size="normal"
              onClick={() => handleZoneTabClick('zone_1')}
            >
              Ke Zona 1 (Kenal Huruf) 🔤
            </Button>
          </div>
        ) : (
          activeLessons.map((lesson, index) => {
            const isCompleted = completedSet.has(lesson.id);
            const stars = profile.lessonStars[lesson.id] ?? 0;
            const cardClass = styles.nodeCard;

            return (
              <button
                type="button"
                key={lesson.id}
                className={cardClass}
                onClick={() => handleLessonClick(lesson.id)}
                aria-label={`Pelajaran ${lesson.title}, ${isCompleted ? `${stars} bintang` : 'Belum selesai'}`}
              >
                <span className={styles.nodeInfo}>
                  <span className={styles.nodeNumber}>{index + 1}</span>
                  <span>
                    <span className={styles.nodeTitle}>{lesson.title}</span>
                    <span className={styles.nodeSubtitle}>
                      {lesson.itemIds.length} Materi ·{' '}
                      {lesson.activities.length} Aktivitas Ceria
                    </span>
                  </span>
                </span>

                <span className={styles.nodeAction}>
                  {isCompleted ? (
                    <StarBar stars={stars} size="normal" />
                  ) : (
                    <span className={styles.startLabel}>
                      Mulai <span aria-hidden="true">&#8594;</span>
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
      {/* Mascot Prompt */}
      <div className={styles.mascotFooter}>
        <Mascot
          mood="semangat"
          speechBubble={`Ayo ${profile.name}, pilih pelajaran di ${activeZone?.title} yuk!`}
          size={100}
          onClick={() => {
            sfx.playClick();
            void tts.speak(
              'Pilih kartu pelajaran untuk mulai petualangan membaca!',
            );
          }}
        />
      </div>
    </div>
  );
};
