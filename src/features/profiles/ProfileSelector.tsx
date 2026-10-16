import React, { useState } from 'react';
import styles from './ProfileSelector.module.css';
import { Button } from '@/components/Button/Button';
import {
  progressStorage,
  type ChildProfile,
} from '@/lib/storage/progressStorage';
import { sfx } from '@/lib/audio/sfx';

export interface ProfileSelectorProps {
  initialProfile: ChildProfile;
  onSave: (updated: ChildProfile) => void;
  onClose?: () => void;
}

const AVATARS = ['🦉', '🐰', '🦁', '🐼', '🐱', '🐻'];

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  initialProfile,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialProfile.name || 'Teman');
  const [selectedAvatar, setSelectedAvatar] = useState(
    initialProfile.avatar || '🦉',
  );

  const handleSelectAvatar = (avatar: string) => {
    sfx.playClick();
    setSelectedAvatar(avatar);
  };

  const handleSave = async () => {
    sfx.playClick();
    const updated: ChildProfile = {
      ...initialProfile,
      name: name.trim() || 'Teman',
      avatar: selectedAvatar,
    };
    await progressStorage.saveProfile(updated);
    onSave(updated);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Profil Anak"
    >
      <div className={styles.modal}>
        <h2 className={styles.title}>Pilih Teman Belajar</h2>

        <div className={styles.avatarGrid}>
          {AVATARS.map((av) => (
            <button
              key={av}
              type="button"
              className={`${styles.avatarBtn} ${selectedAvatar === av ? styles.avatarSelected : ''}`}
              onClick={() => handleSelectAvatar(av)}
              aria-label={`Pilih avatar ${av}`}
            >
              <span>{av}</span>
            </button>
          ))}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="child-name-input" className={styles.inputLabel}>
            Nama Panggilan:
          </label>
          <input
            id="child-name-input"
            type="text"
            className={styles.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={15}
            placeholder="Nama panggilanmu"
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {onClose && (
            <Button variant="ghost" size="normal" onClick={onClose}>
              Batal
            </Button>
          )}
          <Button variant="primary" size="large" onClick={handleSave}>
            Simpan & Mulai! 🌟
          </Button>
        </div>
      </div>
    </div>
  );
};
