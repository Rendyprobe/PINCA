import React, { useState, useEffect, useRef } from 'react';
import styles from './ParentSettingsModal.module.css';
import { Button } from '@/components/Button/Button';
import {
  progressStorage,
  type ChildProfile,
  type ItemProgress,
} from '@/lib/storage/progressStorage';
import type { UserSettings } from '@/types/content';
import { countUnlockedBadges } from '@/lib/progress/badgeService';
import { getItemById } from '@/content';
import { sfx } from '@/lib/audio/sfx';

export interface ParentSettingsModalProps {
  profile: ChildProfile;
  onSave: (updated: ChildProfile) => void;
  onClose: () => void;
}

type TabKey = 'settings' | 'stats' | 'backup';

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

  // Active Tab: default 'settings' to maintain backward compatibility & tests
  const [activeTab, setActiveTab] = useState<TabKey>('settings');

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

  // Stats & Progress State
  const [progressItems, setProgressItems] = useState<ItemProgress[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isUnlocked) {
      void progressStorage.getAllItemProgress().then(setProgressItems);
    }
  }, [isUnlocked]);

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

  // Export Progress JSON
  const handleExport = async () => {
    sfx.playClick();
    const jsonStr = await progressStorage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayo-membaca-${profile.name.toLowerCase()}-cadangan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Progress JSON
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = await progressStorage.importData(text);
      sfx.playCelebrate();
      onSave(imported);
    } catch {
      alert('Gagal memulihkan file cadangan. Pastikan file berformat JSON yang valid.');
    }
  };

  // Reset Progress
  const handleResetProgress = async () => {
    sfx.playClick();
    const clean = await progressStorage.resetProfileProgress(profile);
    setConfirmReset(false);
    onSave(clean);
  };

  // Stats calculation
  const totalStars = Object.values(profile.lessonStars ?? {}).reduce(
    (a, b) => a + (b ?? 0),
    0,
  );
  const { unlocked: badgeUnlocked, total: badgeTotal } =
    countUnlockedBadges(profile);
  const masteredItems = progressItems.filter((it) => it.mastery >= 0.85);
  const practiceItems = progressItems.filter(
    (it) => it.mastery < 0.85 && it.attempts > 0,
  );

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
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setActiveTab('settings');
                }}
                role="tab"
                aria-selected={activeTab === 'settings'}
              >
                <span>⚙️</span>
                <span>Pengaturan</span>
              </button>

              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'stats' ? styles.activeTab : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setActiveTab('stats');
                }}
                role="tab"
                aria-selected={activeTab === 'stats'}
              >
                <span>📊</span>
                <span>Kemajuan Belajar</span>
              </button>

              <button
                type="button"
                className={`${styles.tabButton} ${activeTab === 'backup' ? styles.activeTab : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setActiveTab('backup');
                }}
                role="tab"
                aria-selected={activeTab === 'backup'}
              >
                <span>💾</span>
                <span>Cadangan Data</span>
              </button>
            </div>

            {activeTab === 'settings' && (
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
                            | 'easy'
                            | 'normal'
                            | 'strict',
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
                          readingMode: e.target.value as
                            | 'syllables'
                            | 'whole-word',
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
                    <span>🔤</span>
                    <span>Tampilan & Ukuran Huruf</span>
                  </h3>

                  <div className={styles.row}>
                    <div>
                      <span className={styles.label}>Ukuran Teks Bacaan</span>
                      <div className={styles.sublabel}>
                        Ukuran huruf saat membaca kata dan kalimat
                      </div>
                    </div>
                    <select
                      className={styles.select}
                      value={settings.fontSize ?? 'large'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          fontSize: e.target.value as
                            | 'small'
                            | 'medium'
                            | 'large'
                            | 'xlarge',
                        })
                      }
                    >
                      <option value="medium">Sedang (Standar)</option>
                      <option value="large">Besar (Direkomendasikan)</option>
                      <option value="xlarge">Sangat Besar (Ekstra Jelas)</option>
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

            {activeTab === 'stats' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles.statGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statIcon}>⭐</span>
                    <span className={styles.statNumber}>{totalStars}</span>
                    <span className={styles.statLabel}>Bintang Terkumpul</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statIcon}>📚</span>
                    <span className={styles.statNumber}>
                      {profile.completedLessonIds?.length ?? 0}
                    </span>
                    <span className={styles.statLabel}>Pelajaran Selesai</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statIcon}>🏆</span>
                    <span className={styles.statNumber}>
                      {badgeUnlocked}/{badgeTotal}
                    </span>
                    <span className={styles.statLabel}>Stiker Prestasi</span>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statIcon}>🎯</span>
                    <span className={styles.statNumber}>{masteredItems.length}</span>
                    <span className={styles.statLabel}>Materi Lancar</span>
                  </div>
                </div>

                <div className={styles.tipsBox}>
                  <h4>💡 Tips Mendampingi Anak Membaca</h4>
                  <ul>
                    <li>
                      <strong>Sesi Pendek:</strong> Cukup 5–10 menit per hari saat anak sedang ceria dan tidak lelah.
                    </li>
                    <li>
                      <strong>Fokus Usaha:</strong> Puji keberanian anak membaca dengan suara lantang, bukan kesempurnaan.
                    </li>
                    <li>
                      <strong>Kaitkan Lingkungan:</strong> Tunjuk benda di rumah yang berawalan huruf/kata yang baru dipelajari.
                    </li>
                  </ul>
                </div>

                {practiceItems.length > 0 && (
                  <div className={styles.backupCard}>
                    <h4>📝 Materi yang Perlu Latihan Santai:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {practiceItems.slice(0, 12).map((item) => {
                        const targetItem = getItemById(item.itemId);
                        const label = targetItem ? targetItem.text : item.itemId;
                        return (
                          <span
                            key={item.itemId}
                            style={{
                              background: '#fff',
                              border: '1px solid #ced4da',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className={styles.backupCard}>
                  <h4>💾 Ekspor Cadangan Data</h4>
                  <p className={styles.backupDesc}>
                    Unduh file cadangan kemajuan anak dalam format JSON. Anda dapat
                    memindahkannya ke perangkat lain kapan saja.
                  </p>
                  <div>
                    <Button variant="secondary" size="normal" onClick={handleExport}>
                      <span>📥</span>
                      <span>Unduh File Cadangan (.JSON)</span>
                    </Button>
                  </div>
                </div>

                <div className={styles.backupCard}>
                  <h4>🔄 Pulihkan Cadangan Data</h4>
                  <p className={styles.backupDesc}>
                    Pilih file JSON cadangan untuk mengembalikan progres dan bintang
                    anak.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                  />
                  <div>
                    <Button
                      variant="secondary"
                      size="normal"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span>📂</span>
                      <span>Pilih File Cadangan</span>
                    </Button>
                  </div>
                </div>

                <div className={styles.dangerBox}>
                  <h4>⚠️ Mulai Belajar Dari Awal (Reset)</h4>
                  <p className={styles.backupDesc}>
                    Menghapus seluruh bintang dan riwayat pelajaran anak di profil ini.
                    Pengaturan nama dan avatar tetap tersimpan.
                  </p>
                  <div>
                    {!confirmReset ? (
                      <Button
                        variant="ghost"
                        size="normal"
                        onClick={() => setConfirmReset(true)}
                      >
                        Reset Progres Profil
                      </Button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c92a2a' }}>
                          Yakin ingin reset?
                        </span>
                        <Button
                          variant="primary"
                          size="normal"
                          onClick={handleResetProgress}
                        >
                          Ya, Reset Sekarang
                        </Button>
                        <Button
                          variant="ghost"
                          size="normal"
                          onClick={() => setConfirmReset(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
