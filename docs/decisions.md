# Architecture Decision Records (ADR) - Proyek "Ayo Membaca!"

Dokumen ini mencatat keputusan arsitektur dan teknis penting proyek sesuai GEMINI.md.

---

## ADR 001: Fondasi Stack Teknis (Milestone 0)

* **Tanggal**: 2026-10-16
* **Status**: Diterima
* **Konteks**:
  Aplikasi web dirancang untuk anak 5–7 tahun belajar membaca bahasa Indonesia. Kebutuhan utama adalah responsivitas tinggi, minim overhead di perangkat kelas menengah-bawah, pemisahan konten dari kode, dan privasi penuh (tanpa backend/pelacak).
* **Keputusan**:
  1. Menggunakan **Vite + React 18 + TypeScript (strict mode)**.
  2. Routing berbasis `HashRouter` (`react-router-dom`) agar kompatibel dengan hosting statis & PWA tanpa konfigurasi server rewrite khusus.
  3. Styling menggunakan **CSS Modules + CSS Custom Properties (CSS variables)** untuk menjaga bundle tetap ringan tanpa framework CSS eksternal.
  4. Tipografi menggunakan font lokal via `@fontsource/baloo-2` dan `@fontsource/nunito` agar dapat diakses sepenuhnya offline dan tanpa pelacak pihak ketiga.
  5. Pengujian menggunakan **Vitest + React Testing Library + jsdom**.
  6. Validasi data kurikulum menggunakan **Zod** dan skrip mandiri `scripts/validate-content.ts`.
* **Konsekuensi**:
  - Kode type-safe dan minim dependensi pihak ketiga yang tidak perlu.
  - Skrip pengujian dan validasi cepat dijalankan secara lokal.

---

## ADR 002: Standarisasi Desain Tokens dan Aksesibilitas Warna

* **Tanggal**: 2026-10-16
* **Status**: Diterima
* **Konteks**:
  Anak usia dini membutuhkan antarmuka visual yang ceria namun tidak melelahkan mata. Prinsip zero-failure melarang penggunaan warna merah untuk umpan balik bacaan anak. Rasio kontras teks bacaan terhadap latar minimal 4.5:1 (target 7:1 untuk teks besar).
* **Keputusan**:
  Mendefinisikan token CSS di `src/styles/tokens.css` dengan palet ramah anak:
  - Latar: `#FFF8E7`
  - Permukaan: `#FFFFFF`
  - Primer: `#4DABF7`
  - Aksen/Sekunder: `#FFA94D`
  - Sukses (bacaan terbaca): `#40C057`
  - Sedang dibaca/progres: `#FFD43B`
  - Petunjuk lembut: `#9775FA`
  - Teks utama: `#2B2B3A`
  - Teks pendukung: `#6B6B80`
  Menyediakan dukungan penuh untuk `prefers-reduced-motion` dan target sentuh minimal 64×64px untuk tombol anak.

---

## ADR 003: Arsitektur Audio & Text-to-Speech (Milestone 1)

* **Tanggal**: 2026-10-16
* **Status**: Diterima
* **Konteks**:
  Seluruh teks instruksi anak harus dibacakan lewat suara. Dibutuhkan efek suara interaktif tanpa menambah latensi atau ketergantungan aset eksternal.
* **Keputusan**:
  1. Menggunakan **Web Speech Synthesis (`speechSynthesis`)** dengan wrapper singleton `tts`.
  2. Resolusi voice asinkron (`voiceschanged`) dengan prioritas voice `id-ID` dan fallback ke voice default sistem.
  3. Pemanggilan `cancel()` sebelum ucapan baru untuk mencegah tumpang tindih antrean suara.
  4. Efek suara (klik tombol, ting berhasil, pop bintang, selebrasi) disintesis secara murni melalui **Web Audio API** oscillator, menjamin 0 KB aset tambahan dan 100% offline.
* **Konsekuensi**:
  - Respon suara instan tanpa jeda download jaringan.
  - Aman bagi privasi anak tanpa ada transmisi audio ke server pihak ketiga.

---

## ADR 004: Penyimpanan Data Progres & Profil (Milestone 1)

* **Tanggal**: 2026-10-16
* **Status**: Diterima
* **Konteks**:
  Data progres anak (bintang pelajaran dan penguasaan per huruf) harus bertahan setelah muat ulang halaman atau saat offline, tanpa backend server.
* **Keputusan**:
  1. Menggunakan **IndexedDB** melalui library `idb` sebagai penyimpanan utama terstruktur.
  2. Menyediakan mekanisme **fallback otomatis ke `localStorage`** jika IndexedDB tidak tersedia atau diblokir pada mode penyamaran (private mode).
  3. Nilai penguasaan (*mastery*) dihitung menggunakan rata-rata terbobot eksponensial dari maksimal 10 riwayat percobaan terbaru.
  4. Anak selalu mendapatkan minimal 1 bintang saat menyelesaikan pelajaran (prinsip zero-failure).


