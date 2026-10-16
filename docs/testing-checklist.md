# Checklist Pengujian Manual Multi-Device & Aksesibilitas

Digunakan untuk memverifikasi kualitas aplikasi di setiap rilis milestone.

---

## 1. Browser & Perangkat
- [ ] Chrome di Android (smartphone layar sedang/kecil 360x640)
- [ ] Chrome di Desktop
- [ ] Microsoft Edge di Desktop
- [ ] Safari di iOS (verifikasi fallback mode ketuk & TTS)
- [ ] Firefox Desktop (verifikasi fallback mode ketuk)

## 2. Mikrofon & Web Speech API
- [ ] Izin mikrofon diberikan pertama kali
- [ ] Izin mikrofon ditolak $\rightarrow$ beralih ke Fallback Mode Ketuk dengan ramah
- [ ] Izin mikrofon dicabut saat aplikasi berjalan
- [ ] Perangkat offline saat membuka aktivitas bersuara $\rightarrow$ beralih ke Mode Ketuk

## 3. Aksesibilitas & UI
- [ ] Navigasi keyboard penuh (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`)
- [ ] Indikator fokus terlihat jelas di semua elemen interaktif
- [ ] Pembaca layar mengumumkan umpan balik via live regions (`aria-live="polite"`)
- [ ] `prefers-reduced-motion` aktif $\rightarrow$ animasi gerak ditiadakan, diganti transisi warna lembut
- [ ] Zoom teks browser 200% tanpa layout pecah atau teks terpotong
- [ ] Orientasi Portrait dan Landscape pada perangkat mobile/tablet

## 4. Integritas Data & Zero Failure
- [ ] Tidak ada kata "salah", "gagal", atau warna merah untuk umpan balik bacaan anak
- [ ] Tidak ada rekaman audio tersimpan di IndexedDB, LocalStorage, atau dikirim ke jaringan
- [ ] Validasi konten lulus (`npm run validate:content`)

