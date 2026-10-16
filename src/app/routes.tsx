import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { Mascot, type MascotMood } from '@/components/Mascot/Mascot';
import { getZones, getRandomPraise } from '@/content';
import { LearningMap } from '@/features/map/LearningMap';
import { LessonRunner } from '@/features/lesson/LessonRunner';
import { ProfileSelector } from '@/features/profiles/ProfileSelector';
import {
  progressStorage,
  type ChildProfile,
} from '@/lib/storage/progressStorage';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [mascotMood, setMascotMood] = useState<MascotMood>('senang');
  const [speech, setSpeech] = useState<string>(
    'Halo! Ayo belajar membaca bersama Bu Hantu!',
  );
  const zones = getZones();

  const handleMascotClick = () => {
    sfx.playClick();
    setMascotMood('merayakan');
    const praise = getRandomPraise();
    setSpeech(praise);
    void tts.speak(praise);
    setTimeout(() => {
      setMascotMood('idle');
    }, 2500);
  };

  const handleStartAdventure = () => {
    sfx.playClick();
    void tts.speak('Ayo kita mulai petualangan membaca!');
    navigate('/map');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '24px 12px 12px',
        }}
      >
        <Mascot
          mood={mascotMood}
          speechBubble={speech}
          size={160}
          onClick={handleMascotClick}
        />
        <div style={{ marginTop: '24px' }}>
          <Button
            variant="primary"
            size="large"
            onClick={handleStartAdventure}
            ariaLabel="Mulai petualangan membaca"
          >
            <span>🚀</span>
            <span>Mulai Petualangan!</span>
          </Button>
        </div>
      </section>

      <section>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          Peta Petualangan Membaca
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {zones.map((zone) => (
            <Card
              key={zone.id}
              clickable
              onClick={() => {
                sfx.playClick();
                if (zone.id === 'zone_1') {
                  navigate('/map');
                } else {
                  void tts.speak(
                    `${zone.title} masih terkunci. Yuk selesaikan Zona 1 dulu!`,
                  );
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg)',
                  }}
                  role="img"
                  aria-label={zone.title}
                >
                  {zone.icon}
                </span>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)' }}>
                    {zone.title}
                  </h3>
                  <p
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Zona {zone.order} · {zone.lessonIds.length} Pelajaran
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    void progressStorage.getActiveProfile().then((p) => setProfile(p));
  }, []);

  const profileHeaderButton = profile ? (
    <Button
      variant="ghost"
      size="normal"
      onClick={() => setShowProfileModal(true)}
      ariaLabel={`Profil ${profile.name}`}
    >
      <span style={{ fontSize: '1.4rem' }}>{profile.avatar}</span>
      <span>{profile.name}</span>
    </Button>
  ) : undefined;

  return (
    <AppLayout headerAction={profileHeaderButton}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/map"
          element={
            <LearningMap onOpenProfile={() => setShowProfileModal(true)} />
          }
        />
        <Route path="/lesson/:lessonId" element={<LessonRunner />} />
      </Routes>

      {showProfileModal && profile && (
        <ProfileSelector
          initialProfile={profile}
          onSave={(updated) => {
            setProfile(updated);
            setShowProfileModal(false);
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </AppLayout>
  );
};
