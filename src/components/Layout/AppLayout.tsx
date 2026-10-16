import React, { useState } from 'react';
import styles from './AppLayout.module.css';
import { Button } from '@/components/Button/Button';
import { tts } from '@/lib/audio/tts';
import { sfx } from '@/lib/audio/sfx';

export interface AppLayoutProps {
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  headerAction,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    tts.setMuted(nextMuted);
    sfx.setMuted(nextMuted);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span style={{ fontSize: '2rem' }} role="img" aria-label="Buku">
            📖
          </span>
          <h1 className={styles.brandTitle}>Ayo Membaca!</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            ariaLabel={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
            title={isMuted ? 'Nyalakan suara' : 'Matikan suara'}
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
          </Button>
          {headerAction}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>Ayo Membaca! Belajar membaca dengan ceria dan percaya diri 🦉</p>
      </footer>
    </div>
  );
};
