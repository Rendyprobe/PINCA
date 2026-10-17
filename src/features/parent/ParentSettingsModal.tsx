import React, { useState } from 'react';
import styles from './ParentSettingsModal.module.css';
import { Button } from '@/components/Button/Button';
import type { ChildProfile } from '@/lib/storage/progressStorage';
import type { UserSettings } from '@/types/content';
import { sfx } from '@/lib/audio/sfx';

export interface ParentSettingsModalProps {
  profile: ChildProfile;
  onSave: (updated: ChildProfile) => void;
  onClose: () => void;
}

export const ParentSettingsModal: React.FC<ParentSettingsModalProps> = ({
  profile,
  onSave,
  onClose,
}) => {
  // Parental Gate Challenge (random addition)
  const [num1] = useState(() => Math.floor(Math.random() * 5) + 3);
  const [num2] = useState(() => Math.floor(Math.random() * 5) + 2);
  const [gateAnswer, setGateAnswer] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [gateError, setGateError] = useState(false);

  // Form State
  const initialSettings = profile.settings ?? {
    readingMode: 'syllables',
    difficultyThreshold: 'easy',
    ttsRate: 0.85,
    fontSize: 'large',
    fontFamily: 'default',
    soundEnabled: true,
    micEnabled: true,
  };

  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [unlockedAll, setUnlockedAll] = useState(
    Boolean(profile.unlockedAllLessons),
  );

  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(gateAnswer, 10) === num1 + num2) {
      sfx.playSuccessDing();
      setIsUnlocked(true);
      setGateError(false);
    } else {
      sfx.playClick();
      setGateError(true);
      setGateAnswer('');
    }
  };

  const handleSave = () => {
    sfx.playClick();
    const updated: ChildProfile = {
      ...profile,
      settings,
      unlockedAllLessons: unlockedAll,
    };
    onSave(updated);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Orang Tua"
    >
      <div className={styles.modal}>
        <h2 className={styles.title}>Pengaturan Orang Tua / Guru</h2>

        {!isUnlocked ? (
          <form onSubmit={handleVerifyGate} className={styles.gateBox}>
            <p>
              Halaman ini khusus untuk pendamping. Silakan jawab pertanyaan
              berikut untuk melanjutkan:
            </p>
            <div className={styles.gateQuestion}>
              {num1} + {num2} = ?
            </div>
            <input
              type="number"
              className={styles.gateInput}
              value={gateAnswer}
              onChange={(e) => setGateAnswer(e.target.value)}
              placeholder="Jawaban"
              aria-label="Jawaban pertanyaan keamanan orang tua"
            />
            {gateError && (
              <p style={{ color: '#d9480f', fontWeight: 700, margin: 0 }}>
                Jawaban belum tepat, silakan coba lagi.
              </p>
            )}
            <div
              style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
            >
              <Button variant="ghost" size="normal" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="normal">
                Buka Pengaturan 🔓
              </Button>
            </div>
          </form>
        ) : (
          <>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span>🎙️</span>
                <span>Pengecekan Suara & Mikrofon</span>
              </h3>

              <div className={styles.row}>
                <div>
                  <span className={styles.label}>Aktifkan Mikrofon</span>
                  <div className={styles.sublabel}>
                    Mengecek bacaan anak dengan suara
                  </div>
                </div>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={settings.micEnabled}
                    aria-label="Aktifkan Mikrofon"
                    onChange={(e) =>
                      setSettings({ ...settings, micEnabled: e.target.checked })
                    }
                  />
                  <span>
                    {settings.micEnabled ? 'Aktif' : 'Nonaktif (Mode Ketuk)'}
                  </span>
                </label>
              </div>

              <div className={styles.row}>
                <div>
                  <span className={styles.label}>
                    Tingkat Toleransi Penilaian
                  </span>
                  <div className={styles.sublabel}>
                    Sensitivitas kemiripan suara anak
                  </div>
                </div>
                <select
                  className={styles.select}
                  value={settings.difficultyThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      difficultyThreshold: e.target.value as
                        'easy' | 'normal' | 'strict',
                    })
                  }
                >
                  <option value="easy">Mudah (Anak 5-6 tahun / Pemula)</option>
                  <option value="normal">Normal (Standar)</option>
                  <option value="strict">Ketat (Fokus artikulasi rapi)</option>
                </select>
              </div>

              <div className={styles.row}>
                <div>
                  <span className={styles.label}>Mode Membaca Kata</span>
                  <div className={styles.sublabel}>
                    Urutan bimbingan saat mengecek bacaan
                  </div>
                </div>
                <select
                  className={styles.select}
                  value={settings.readingMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      readingMode: e.target.value as 'syllables' | 'whole-word',
                    })
                  }
                >
                  <option value="syllables">Per Suku Kata (I - BU)</option>
                  <option value="whole-word">Kata Utuh Langsung (IBU)</option>
                </select>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span>🔊</span>
                <span>Suara Pemandu Bu Delia</span>
              </h3>

              <div className={styles.row}>
                <div>
                  <span className={styles.label}>Kecepatan Bicara</span>
                  <div className={styles.sublabel}>Tempo instruksi pemandu</div>
                </div>
                <select
                  className={styles.select}
                  value={settings.ttsRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ttsRate: parseFloat(e.target.value),
                    })
                  }
                >
                  <option value={0.7}>Pelan (Ramah anak pemula)</option>
                  <option value={0.85}>Sedang (Direkomendasikan)</option>
                  <option value={1.0}>Normal / Cepat</option>
                </select>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span>🔓</span>
                <span>Kendali Kurikulum</span>
              </h3>

              <div className={styles.row}>
                <div>
                  <span className={styles.label}>Buka Kunci Manual</span>
                  <div className={styles.sublabel}>
                    Buka semua pelajaran agar anak dapat memilih bebas
                  </div>
                </div>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={unlockedAll}
                    aria-label="Buka Kunci Manual"
                    onChange={(e) => setUnlockedAll(e.target.checked)}
                  />
                  <span>
                    {unlockedAll ? 'Semua Terbuka' : 'Mengikuti Urutan'}
                  </span>
                </label>
              </div>
            </section>

            <div className={styles.actions}>
              <Button variant="ghost" size="normal" onClick={onClose}>
                Batal
              </Button>
              <Button variant="primary" size="large" onClick={handleSave}>
                Simpan Pengaturan 💾
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
