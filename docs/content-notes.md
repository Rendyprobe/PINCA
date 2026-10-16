# Catatan Konten & Fonologi - Proyek "Ayo Membaca!"

Dokumen ini mencatat keputusan linguistik, aturan suku kata, dan penalaan TTS untuk kurikulum bahasa Indonesia.

---

## 1. Prinsip Pemenggalan Suku Kata
- Suku kata disimpan secara eksplisit di file JSON di `src/content/`.
- Sifat aturan wajib: `item.syllables.join('') === item.text`.
- Diftong dihitung sebagai satu suku kata (`pan-tai`, `pi-sau`, `am-boi`).
- Vokal berurutan yang bukan diftong dipenggal (`ma-in`, `ta-at`, `bu-ah`, `i-bu`, `a-pa`).
- Digraf konsonan (`ng`, `ny`, `sy`, `kh`) dihitung sebagai satu kesatuan bunyi (`bu-nga`, `ba-nyak`, `sya-ri`).

## 2. Pelafalan Bunyi Huruf (Zona 1) vs Nama Alfabet
- Zona 1 mengajarkan bunyi huruf (fonik), misal konsonan "b" sebagai bunyi /bə/, bukan "bé".
- Pada data huruf (`letters.json` di M1), sediakan properti:
  - `soundTts`: panduan teks untuk bunyi huruf
  - `nameTts`: nama huruf resmi ("be", "ce", "de")
- Catatan pengujian suara TTS di berbagai platform dicatat di dokumen ini secara berkala.

