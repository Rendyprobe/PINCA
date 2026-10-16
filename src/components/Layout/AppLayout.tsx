import React from 'react';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  headerAction,
}) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span style={{ fontSize: '2rem' }} role="img" aria-label="Buku">
            📖
          </span>
          <h1 className={styles.brandTitle}>Ayo Membaca!</h1>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>Ayo Membaca! Belajar membaca dengan ceria dan percaya diri 🦉</p>
      </footer>
    </div>
  );
};
