# 🦉 Ayo Membaca!

Aplikasi web ramah anak untuk belajar membaca Bahasa Indonesia secara bertahap, ceria, interaktif, dan tanpa rasa takut gagal.

Dirancang untuk anak usia 5–7 tahun (TK B sampai SD kelas 1–2), mulai dari mengenal huruf vokal/konsonan, membaca suku kata terbuka, hingga membaca kata dua suku kata bergambar.

---

## ✨ Fitur Saat Ini (Milestone 2)

- 🔤 **Zona 1: Kenal Huruf**
  - 26 huruf alfabet (A–Z) dengan bunyi fonetik dan kata contoh ramah anak.
  - Aktivitas: *Dengar & Ketuk*, *Cocokkan Huruf Besar–Kecil*, dan *Tebak Huruf dari Bunyi*.
- 🧩 **Zona 2: Suku Kata Terbuka (KV)**
  - 80 suku kata terbuka (ba, bi, bu, be, bo, ma, mi, mu, me, mo, dst.).
  - Aktivitas latihan memadukan huruf menjadi suku kata.
- 📖 **Zona 3: Kata Pertama (KV-KV)**
  - 44+ kata bergambar 2 suku kata berilustrasi emoji ramah anak.
  - Aktivitas:
    - **Cocokkan Gambar–Kata** (*Match Picture–Word*).
    - **Susun Suku Kata** (*Arrange Syllables* dengan interaksi geser & ketuk-pilih / *tap-to-place*).
    - **Lengkapi Kata** (*Complete Word*).
    - **Membaca Bersama / Karaoke** (kata disorot suku kata demi suku kata mengikuti suara pemandu).
- 🗺️ **Peta Belajar Bertahap (*Learning Map*)**
  - Progres per profil tersimpan aman di browser (*IndexedDB* & *localStorage*).
  - Mekanisme pembukaan zona otomatis berbasis tingkat penguasaan ($\ge 80\%$) dengan opsi kendali orang tua (*Buka Kunci Manual*).
- 🌟 **Prinsip *Zero-Failure***
  - Tidak ada warna merah, tidak ada kata "salah", dan tidak ada hukuman.
  - Maskot burung hantu interaktif yang selalu memberi semangat dan umpan balik hangat.

---

## 🛠️ Teknologi & Arsitektur

- **Frontend**: React 18, TypeScript (*strict mode*), Vite
- **Styling**: CSS Modules + Desain Token (`src/styles/tokens.css`, WCAG AA contrast ratio $\ge 4.5:1$)
- **Tipografi Lokal**: `@fontsource/baloo-2` (judul/tombol) & `@fontsource/nunito` (teks bacaan)
- **Audio & Sintesis Suara**: Web Speech Synthesis API (`id-ID`) + Web Audio API (efek suara instan)
- **Validasi Konten**: Zod schemas & skrip validator mandiri
- **Pengujian**: Vitest + React Testing Library

---

## 🚀 Memulai Proyek

### Prasyarat
- Node.js (v18+)
- npm

### Instalasi & Menjalankan Lokal

```bash
# Instalasi dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka `http://localhost:5173` di peramban Anda.

---

## 🧪 Skrip Pengujian & Kualitas

```bash
# Validasi integritas data kurikulum (JSON)
npm run validate:content

# Jalankan unit & component test
npm run test

# Pengecekan tipe data TypeScript
npm run typecheck

# Linter kode
npm run lint

# Format & periksa gaya kode
npm run format:check

# Bangun versi produksi
npm run build
```

---

## 📜 Lisensi
MIT License

