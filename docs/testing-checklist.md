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



## Suara ibu AI dan UI bacaan
- [ ] Dengarkan contoh suara, kemudian uji vokal, bunyi konsonan, suku kata, dan kata.
- [ ] Pastikan suara ibu yang sama terdengar pada petunjuk, contoh bacaan, dan pujian.
- [ ] Ketuk mikrofon saat pemandu masih berbicara: mic menunggu audio selesai dan 400 ms hening.
- [ ] Batalkan saat menunggu izin/mulai mendengar; tidak boleh muncul sesi mic terlambat.
- [ ] Tolak izin atau putuskan jaringan; anak tetap bisa melanjutkan dengan tombol sentuh.
- [ ] Periksa kartu, lencana, navigasi zona, dan tombol di 360 px, 768 px, serta zoom 200%.

Catatan sesi implementasi: browser tidak terhubung; pemeriksaan visual dan suara
langsung di perangkat belum dilakukan. Paket MP3 dan alur aplikasi diperiksa otomatis.


## Bu Delia dan koreksi bacaan
- [ ] Pastikan label Kembali tetap utuh pada desktop, layar 360 px, dan zoom 200%.
- [ ] Dengarkan perkenalan Bu Delia dan petunjuk yang menyebut nama pendamping.
- [ ] Uji target ba dengan bacaan bi, bu dengan bo, dan bola dengan bula; jangan langsung lulus.
- [ ] Uji urutan kalimat dan kata tambahan; pastikan skor berkurang.
- [ ] Pastikan mode ketuk tercatat sebagai bantuan dan mode mic yang cocok tercatat sebagai terverifikasi.
- [ ] Tolak izin mikrofon, lalu coba lagi setelah izin diberikan lewat browser.
- [ ] Pindah tab saat menunggu mic; tidak boleh ada capture terlambat.

Hasil otomatis pembaruan Bu Delia: 80 tes, typecheck, lint, validate:content, dan
build lulus. Tujuh ekspresi SVG sudah dirender dan diperiksa. Pengujian interaktif
browser dan kualitas suara ekspresif belum selesai; browser tidak terhubung dan
kredensial ElevenLabs belum tersedia.

## Hasil pengenalan dan pilihan latihan eksplisit

- [ ] Ketuk Mulai bicara, tunggu "Aku mendengarkan", lalu baca kata lengkap saat sorotan suku kata aktif; kata tepat harus terverifikasi.
- [ ] Hentikan mikrofon setelah bicara; hasil final yang terlambat tetap diterima selama jendela penyelesaian.
- [ ] Diam selama tiga sesi; tidak boleh menambah hitungan bacaan salah atau menampilkan Aku Sudah Baca secara otomatis.
- [ ] Baca kata berbeda beberapa kali; tetap dapat mencoba lagi, tanpa lulus otomatis.
- [ ] Pilih Latihan tanpa penilaian; konfirmasi selesai harus tercatat sebagai bantuan.
- [ ] Buka Status mikrofon dan bantuan; periksa tahap input, suara, ucapan, dan teks ketika bacaan tidak muncul.
- [ ] Jalankan Periksa input mikrofon; indikator merespons suara. Selesaikan pemeriksaan sebelum memulai penilaian.
- [ ] Tolak izin atau putuskan jaringan; tampilkan bantuan teknis dan pilihan latihan eksplisit, tanpa menilai bacaan salah.

91 tes otomatis lulus. Pemeriksaan mikrofon fisik dan hasil transkripsi di perangkat
pengguna belum dapat diverifikasi dari lingkungan ini.

## Paket suara F3 pilihan pengguna

- [x] Pengguna mendengarkan audisi dan memilih preset F3.
- [x] Buat seluruh 978 klip secara lokal dan pertahankan seluruh key teks lama.
- [x] Dekode seluruh MP3 dan validasi waveform sebelum mengaktifkan manifest F3.
- [x] Periksa HTTP 200 untuk contoh instruksi, huruf, dan pujian F3.
- [x] Jalankan 92 tes, termasuk keberadaan semua aset pada manifest F3.
- [ ] Dengarkan sampel huruf, suku kata, kata, dan instruksi langsung dari aktivitas setelah refresh.
- [ ] Periksa pelafalan contoh pendek dan pemenggalan seluruh materi yang akan digunakan anak.
