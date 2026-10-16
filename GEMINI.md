# GEMINI.md — Panduan Proyek "Ayo Membaca!" (nama sementara)

> Dokumen ini adalah **sumber kebenaran tunggal** untuk proyek. Baca SELURUHNYA sebelum menulis kode.
> Jika ada konflik antara permintaan di chat dan dokumen ini, **tanyakan dulu**, jangan menebak.
> Jika dokumen ini perlu diubah (karena keputusan baru), usulkan perubahannya dan tunggu persetujuan.

---

## 0. CARA KERJA AGENT (WAJIB DIPATUHI)

1. **Kerjakan satu milestone pada satu waktu** (lihat Bagian 17). Jangan loncat ke milestone berikutnya sebelum diminta.
2. **Sebelum menulis kode** untuk sebuah milestone: tulis rencana singkat (file apa yang akan dibuat/diubah, keputusan desain, risiko). Tunggu konfirmasi jika ada keputusan besar yang belum tercakup di dokumen ini.
3. **Kerjakan dalam langkah kecil** yang bisa dijalankan dan diuji. Setelah tiap langkah, pastikan `npm run dev` jalan tanpa error dan `npm run typecheck` + `npm run lint` bersih.
4. **Jangan mengarang**: jika tidak yakin tentang perilaku API browser, versi library, atau aturan bahasa Indonesia, katakan tidak yakin dan sarankan cara memverifikasi.
5. **Jangan menambah dependensi** di luar daftar Bagian 11 tanpa meminta izin dan menjelaskan alasannya.
6. **Jangan menulis ulang file yang sudah berfungsi** tanpa alasan jelas. Ubah seperlunya (diff kecil).
7. **Setiap akhir milestone**, berikan laporan sesuai template di Bagian 19.
8. **Bahasa**:
   - Teks yang dilihat anak/orang tua: **Bahasa Indonesia** yang ramah anak.
   - Kode, nama variabel, nama file, komentar kode: **Bahasa Inggris**.
   - Penjelasan kepada developer (aku): **Bahasa Indonesia**.
9. Jika tugas terlalu besar untuk satu respons, **pecah** dan selesaikan bagian pertama dengan baik, bukan semuanya setengah-setengah.

---

## 1. VISI, TARGET PENGGUNA, DAN TUJUAN

### 1.1 Visi
Aplikasi web belajar membaca bahasa Indonesia yang **menyenangkan, interaktif, dan mendengarkan**. Anak membaca dengan suara keras, aplikasi mengecek bacaannya, dan huruf/suku kata berubah warna dengan animasi saat terbaca. Belajar terasa seperti bermain, bukan ujian.

### 1.2 Pengguna
- **Pengguna utama: anak usia 5–7 tahun** (TK B sampai SD kelas 1–2), mulai dari belum mengenal huruf sampai bisa membaca kalimat pendek.
- **Pengguna kedua: orang tua/guru** yang mendampingi, melihat progres, dan mengatur pengaturan.

### 1.3 Tujuan pembelajaran
Anak mampu secara bertahap: mengenal huruf dan bunyinya → membaca suku kata → membaca kata → membaca kalimat pendek → membaca cerita pendek.

### 1.4 Prinsip produk
- **Anak tidak pernah merasa gagal.** Tidak ada layar merah, tidak ada kata "salah", tidak ada hukuman.
- **Sesi pendek** (5–10 menit), selesai dengan perasaan berhasil.
- **Mandiri tapi aman**: anak bisa menjalankan sendiri, tapi orang tua tetap punya kendali.
- **Konten terpisah dari kode**: menambah materi = menambah JSON, bukan mengubah kode.

### 1.5 Di luar cakupan (JANGAN dibuat)
- Akun online, login, backend, database server (versi awal murni di browser).
- Iklan, analitik pihak ketiga, chat, media sosial, tautan keluar.
- Perekaman atau penyimpanan audio anak.
- Pembelian dalam aplikasi.

---

## 2. PRINSIP DESAIN VISUAL DAN UX

### 2.1 Nuansa
Ceria, hangat, bulat, penuh warna, tetapi **tidak ramai berlebihan**. Satu layar = satu fokus utama. Hindari elemen dekoratif yang mengalihkan perhatian dari teks yang dibaca.

### 2.2 Palet warna (token CSS, boleh disetel agar kontras lolos)
Definisikan sebagai CSS variables di `src/styles/tokens.css`:

| Token | Fungsi | Saran awal |
|---|---|---|
| `--color-bg` | latar utama | krem hangat `#FFF8E7` |
| `--color-surface` | kartu/panel | putih `#FFFFFF` |
| `--color-primary` | tombol utama | biru langit `#4DABF7` |
| `--color-secondary` | aksen | oranye `#FFA94D` |
| `--color-success` | huruf/kata terbaca | hijau `#40C057` |
| `--color-progress` | sedang dibaca/disorot | kuning `#FFD43B` |
| `--color-hint` | petunjuk lembut | ungu `#9775FA` |
| `--color-text` | teks utama | `#2B2B3A` |
| `--color-text-muted` | teks pendukung | `#6B6B80` |

Aturan:
- **Jangan memakai merah** untuk umpan balik bacaan. Merah hanya boleh untuk error teknis yang dilihat orang tua.
- Rasio kontras teks bacaan terhadap latar **minimal 4.5:1** (target 7:1 untuk teks besar yang dibaca anak).
- Warna **tidak boleh menjadi satu-satunya pembeda** status: tambahkan juga animasi, ikon centang, atau garis bawah (untuk anak buta warna).

### 2.3 Tipografi
- Font: **Baloo 2** untuk judul/tombol, **Nunito** untuk teks umum. Untuk teks yang dibaca anak, pertimbangkan font yang membedakan `I` (i besar) dan `l` (L kecil), serta `b`/`d`/`p`/`q`. Jika diperlukan, sediakan opsi font "Lexend" atau "Atkinson Hyperlegible" di pengaturan orang tua.
- **Font harus di-bundle lokal** (paket `@fontsource/*`), bukan dimuat dari CDN, agar bisa offline dan privat.
- Ukuran teks bacaan utama: **minimal 48px** di mobile untuk kata, **64–120px** untuk huruf tunggal. Ada pengaturan ukuran (Kecil/Sedang/Besar/Sangat Besar).
- Jarak antar huruf diperlebar sedikit (`letter-spacing: 0.04em`), tinggi baris 1.5+.
- Gunakan **huruf kecil sebagai default** untuk kata/kalimat (anak belajar dari teks sehari-hari), dan huruf kapital di awal kalimat/nama. Level pengenalan huruf menampilkan keduanya (A / a).

### 2.4 Bentuk, jarak, interaksi
- Sudut membulat besar (`border-radius` 16–28px), bayangan lembut.
- **Target sentuh minimal 64×64px** (tombol anak), 48×48px untuk elemen sekunder.
- Tombol utama selalu **satu** per layar, di posisi konsisten (bawah-tengah).
- Navigasi anak: **ikon besar + label**, maksimal 3–4 pilihan per layar. Tanpa menu bersarang.
- Tanpa gestur tersembunyi (swipe-only). Selalu ada tombol terlihat.
- Tanpa teks panjang untuk anak. Instruksi singkat (≤ 8 kata) **dan dibacakan** lewat suara.

### 2.5 Animasi dan gerak
- Durasi mikro-interaksi 150–400ms, easing lembut (spring/ease-out).
- Gunakan **CSS transitions/animations atau Framer Motion** (lihat Bagian 11). Hanya animasikan `transform` dan `opacity` bila memungkinkan (performa HP murah).
- **Hormati `prefers-reduced-motion`**: jika aktif, ganti animasi gerak dengan perubahan warna sederhana tanpa goyang/loncat/konfeti.
- Dilarang: animasi berkedip cepat (> 3 kali/detik), karena risiko kejang fotosensitif.

### 2.6 Suara dan musik
- Efek suara singkat dan lembut (klik, "ting" berhasil, "pop" bintang). Volume default sedang.
- Musik latar **opsional dan default MATI** (mengganggu pengenalan suara!). **Selama mikrofon aktif, semua suara aplikasi dimatikan/diredam** agar tidak masuk ke mikrofon.
- Aset audio kecil (< 50KB per efek), format `.mp3` atau `.ogg`. Jika belum ada aset, buat efek sederhana via Web Audio API (oscillator) sebagai placeholder.

### 2.7 Nada bahasa (copywriting)
- Hangat, memberi semangat, kalimat pendek, kata sederhana, tanpa sarkasme.
- **Dilarang**: "Salah", "Gagal", "Kurang tepat", "Jelek", "Bodoh", "Sayang sekali".
- **Dipakai**: "Hampir!", "Ayo coba lagi!", "Dengarkan dulu ya", "Hebat!", "Kamu pintar!", "Keren sekali!", "Satu lagi ya!".
- Variasikan pujian (minimal 8 variasi) supaya tidak terasa robotik. Simpan di `src/content/feedback.json`.
- Sapa anak dengan nama panggilan yang diisi orang tua (opsional, default "Teman").

---

## 3. MASKOT

- Satu maskot hewan ramah (usulan: **burung hantu kecil bernama "Bu Delia"/ atau kelinci "Kiko"**; developer boleh memilih, konsisten di seluruh aplikasi). Dibuat dalam **SVG inline** dengan beberapa ekspresi: `idle`, `senang`, `semangat`, `berpikir`, `mendengar` (telinga/telinga tegak, ikon mikrofon kecil), `merayakan`, `istirahat` (menguap).
- Maskot **berekasi pada state**: menyambut saat buka aplikasi, mendengar saat mic aktif, berpikir saat memproses, bersorak saat berhasil, menyemangati saat gagal.
- Maskot **tidak menutupi teks bacaan**. Posisikan di sudut atau di bawah area bacaan.
- Maskot punya "gelembung ucapan" singkat yang **juga dibacakan TTS** (bisa dimatikan).
- Di dalam kode: komponen `<Mascot mood="..." />` dengan prop `mood` bertipe union. Seluruh ekspresi bisa dikontrol lewat state.

---

## 4. ALUR BELAJAR DAN KURIKULUM

### 4.1 Struktur
Aplikasi punya **peta belajar** (learning map) berbentuk jalur bertahap dengan "pulau"/zona. Tiap zona berisi beberapa pelajaran; tiap pelajaran berisi beberapa aktivitas.

```
Zona 1: Kenal Huruf     → Zona 2: Suku Kata → Zona 3: Kata Pertama
→ Zona 4: Kata Lebih Panjang → Zona 5: Kalimat Pendek → Zona 6: Cerita Mini
```

Zona berikutnya **terkunci** sampai zona sebelumnya mencapai ambang penguasaan (Bagian 4.3), **tetapi orang tua bisa membuka kunci manual** di pengaturan (anak mungkin sudah bisa sebagian).

### 4.2 Detail zona

**Zona 1 — Kenal Huruf (vokal dulu, lalu konsonan)**
- Urutan perkenalan (usulan, dari bunyi mudah & kata umum): `a, i, u, e, o` → `b, m, p, t, d, k, g, s, l, r, n, h, j, c, w, y, f, v, z` → huruf gabungan `ng, ny, sy, kh` belakangan.
- Per huruf: tampilkan bentuk kapital + kecil, bunyi (TTS **mengucapkan bunyi huruf**, bukan nama huruf, misalnya "b" dibaca /be/ sebagai bunyi "bə"; sediakan juga mode nama huruf "bé"), gambar contoh (emoji/SVG) dan kata contoh ("a — apel 🍎").
- Aktivitas: dengar & ketuk, tebak huruf dari bunyi, cocokkan huruf kapital-kecil, telusuri bentuk huruf (tracing sederhana opsional di milestone akhir), ucapkan bunyi huruf (cek suara — level paling toleran).
- Catatan: **pengenalan suara untuk satu huruf sangat tidak akurat**. Lihat Bagian 5.8 untuk strategi (cocokkan terhadap kata contoh atau terima variasi nama huruf).

**Zona 2 — Suku Kata**
- Mulai suku kata terbuka konsonan+vokal (KV): `ba bi bu be bo`, lalu `ma mi mu me mo`, `pa pi pu pe po`, dst. per kelompok 2–3 konsonan.
- Aktivitas: dengar & ketuk, gabungkan huruf jadi suku kata (b + a = ba), pilih suku kata yang benar, ucapkan suku kata (cek suara per suku kata).
- Pewarnaan: tiap huruf dalam suku kata menyala berurutan lalu seluruh suku kata menjadi hijau.

**Zona 3 — Kata Pertama (2 suku kata KV-KV)**
- Contoh: `ibu, bapa/ayah, bola, buku, mata, kaki, sapi, bebek, kuda, topi`.
- Gambar emoji/SVG wajib mendampingi setiap kata.
- Aktivitas: cocokkan gambar-kata, susun huruf/suku kata menjadi kata (drag & drop dengan **fallback ketuk-untuk-pilih**), baca kata (cek suara), pilih kata yang benar.

**Zona 4 — Kata Lebih Panjang**
- Suku kata tertutup dan pola lain: `KVK` (`bu-lan`, `ma-kan`), kata 3 suku kata (`se-pe-da`, `ke-bun`), gabungan `ng/ny` (`bu-nga`, `nya-ta`), diftong `ai/au/oi` (`pi-sau`/`pantai`), dan konsonan rangkap awal ringan (`sekolah`, `kelinci`).

**Zona 5 — Kalimat Pendek**
- 2–4 kata, lalu 5–7 kata. Contoh: `Ini bola.` / `Ibu masak nasi.` / `Adik minum susu.`
- Tanda baca dikenalkan (titik, tanda tanya, tanda seru) dengan intonasi TTS yang sesuai.
- Mode "baca bersama" (karaoke) dan "baca sendiri" dengan cek suara per kata.

**Zona 6 — Cerita Mini**
- 3–6 kalimat, tiap halaman satu gambar (SVG/emoji komposisi) + 1–2 kalimat.
- Setelah cerita: **2–3 pertanyaan pemahaman** pilihan ganda bergambar ("Siapa yang makan apel?").
- Tema aman, positif (keluarga, hewan, sekolah, bermain, alam, sopan santun).

### 4.3 Penguasaan (mastery) dan kenaikan level
- Setiap **item** (huruf/suku kata/kata/kalimat) punya skor penguasaan 0–100% berdasarkan beberapa percobaan terakhir (lihat 8.2).
- Pelajaran dianggap **selesai** jika ≥ 80% item mencapai tingkat "lancar" dalam sesi tersebut, atau anak secara eksplisit menyelesaikan latihan bersama dengan hasil bantuan.
- **Kesulitan adaptif**: setelah 3 keberhasilan berturut-turut tanpa petunjuk → naikkan tingkat bantuan lebih sedikit/kata lebih sulit; setelah 3 kegagalan berturut-turut → turunkan ke item yang lebih mudah, aktifkan bantuan otomatis, atau ulang dengan mode dengar-dulu.
- **Pengulangan berjarak (spaced repetition ringan)**: item yang sering terlewat muncul kembali di sesi berikutnya (Bagian 8.3).
- Anak **tidak pernah terjebak**: setelah N percobaan tidak cocok (default 3), aplikasi menyarankan latihan bersama. Anak tetap dapat mencoba mikrofon. Selesai dengan bantuan hanya setelah memilih dan mengonfirmasi latihan tanpa penilaian, bukan otomatis karena hitungan percobaan.

---

## 5. SPESIFIKASI FITUR UTAMA: "BACA & CEK" (SPEECH CHECK)

Ini fitur inti. Implementasikan dengan hati-hati, modular, dan **dengan jalur cadangan**.

### 5.1 Teknologi dan batasan jujur
- Gunakan **Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)** dengan `lang = 'id-ID'`.
- Fakta penting yang HARUS diingat agent:
  1. API mengembalikan **teks hasil kenali (transcript)**, **bukan** deteksi huruf per huruf atau waktu per fonem. Jadi "pewarnaan per huruf" adalah **animasi yang dipicu oleh hasil pencocokan**, bukan deteksi bunyi nyata per huruf.
  2. Dukungan terbaik di **Chrome/Edge (Chromium)**; Safari/Firefox terbatas atau tidak ada. Harus ada **feature detection** dan **fallback**.
  3. Butuh **izin mikrofon**, **HTTPS atau localhost**, dan di banyak peramban **koneksi internet** (audio diproses di server penyedia peramban).
  4. Akurasi untuk **suara anak** dan **huruf/suku kata tunggal** rendah. Hasil sering berupa kata lain yang mirip bunyi. Maka **pencocokan longgar** wajib.
  5. Hasil `interim` (sementara) bisa berubah-ubah dan tidak selalu tersedia untuk suara pendek.
- **Jangan pernah** mengirim audio ke layanan selain yang disediakan peramban. **Jangan merekam atau menyimpan audio.** Hanya simpan hasil pencocokan (skor, benar/hampir/belum) tanpa transcript mentah (atau transcript hanya di memori sesi).

### 5.2 Diagram state mesin (WAJIB diimplementasikan sebagai state machine eksplisit)

```
idle → (tap mic) → requestingPermission → listening
listening → (hasil interim) → listening (update progress)
listening → (hasil final cocok) → success
listening → (hasil final tidak cocok) → retry (hitungan++)
listening → (batas waktu / tombol selesai) → evaluating (tunggu hasil final)
listening / evaluating → (tanpa teks final) → noSpeech (tidak menambah hitungan salah)
retry → hint → listening (tidak otomatis lulus setelah sejumlah percobaan)
permissionDenied / unsupported / networkError → speechError (coba mikrofon lagi)
idle / retry / noSpeech / speechError → (pilih latihan tanpa penilaian) → assisted
assisted → (konfirmasi latihan bersama) → completedWithHelp (bukan terverifikasi)
pengaturan mikrofon mati → fallbackTap (mode ketuk, hasil bantuan)
success → celebrate → next
```

Gunakan `useReducer` atau library state machine ringan (XState **hanya jika disetujui**). State harus bisa dites tanpa mikrofon sungguhan (inject hasil palsu).

### 5.3 Normalisasi teks
Sebelum membandingkan transcript dengan target:
1. `toLowerCase()`, hapus tanda baca, trim, rapatkan spasi.
2. Normalisasi angka ke kata jika perlu ("1" → "satu"), hati-hati agar tidak merusak.
3. Hilangkan kata pengisi yang sering muncul ("eh", "em", "hmm").
4. Normalisasi variasi ejaan umum bahasa Indonesia (lihat 5.6).
5. Untuk huruf tunggal: peta variasi (lihat 5.8).

### 5.4 Algoritma pencocokan (skor 0–1)
Hitung `score` gabungan beberapa sinyal, ambil yang terbaik di antara semua **alternatif** (`maxAlternatives = 5`):

1. **Kecocokan persis** setelah normalisasi → 1.0
2. **Similarity berbasis edit distance** (Levenshtein/Damerau): `1 - dist / max(len(a), len(b))`
3. **Kecocokan fonetik sederhana** (aturan Indonesia): samakan `c`↔`ch`, `y`↔`j` (hati-hati), `sy`↔`sh`, `kh`↔`h`/`k`, `v`↔`f`, `z`↔`j`, `e` taling vs pepet diabaikan, `i`↔`ie` dsb. Bandingkan setelah normalisasi fonetik.
4. **Kecocokan token**: untuk kalimat, cocokkan per kata dengan alignment (LCS/DP), bukan perbandingan string utuh. Kata yang terlewat/ekstra mengurangi skor secara proporsional.
5. **Kecocokan awalan (prefix)** untuk progres interim (Bagian 5.5).

**Ambang (threshold) berdasarkan level** — simpan di config `src/config/thresholds.ts`, bisa diubah orang tua (mode Mudah/Normal/Ketat):

| Level | Unit | Lulus (≥) | "Hampir" (≥) |
|---|---|---|---|
| Huruf | huruf tunggal | 0.50* | 0.35 |
| Suku kata | suku kata | 0.60 | 0.45 |
| Kata pendek (≤4 huruf) | kata | 0.70 | 0.55 |
| Kata panjang | kata | 0.75 | 0.60 |
| Kalimat | per kata, rata-rata | 0.75 | 0.60 |
| Cerita | per kalimat | 0.70 | 0.55 |

\*Untuk huruf tunggal, pakai strategi khusus 5.8.

Mode Mudah: kurangi semua ambang 0.10. Mode Ketat: tambah 0.05. **Default = Mudah untuk anak 5 tahun.**

### 5.5 Animasi pewarnaan huruf/suku kata (fitur khas)

Tampilan teks target dipecah menjadi **unit** sesuai level, dan setiap unit punya status:

```ts
type UnitStatus = 'pending' | 'active' | 'done' | 'almost';
```

- **Level huruf**: satu huruf besar. Saat berhasil → huruf berubah warna dari netral ke `--color-success` dengan animasi "pop" + centang.
- **Level suku kata / kata**: kata dipecah per suku kata (dari data JSON, **bukan** dari algoritma tebakan), tiap suku kata dipecah per huruf. Contoh `IBU` → `I` | `BU`.
- **Aturan pewarnaan saat mendengarkan (listening)**:
  1. Saat mic mulai: suku kata pertama berstatus `active` (disorot kuning lembut/berdenyut halus), sisanya `pending`.
  2. Saat hasil **interim** masuk: hitung **panjang awalan terbaik** antara transcript ternormalisasi dan target (fuzzy prefix). Konversikan ke jumlah suku kata yang "tercakup". Suku kata tercakup → huruf-hurufnya **menyala berurutan** (stagger 60–120ms per huruf) menjadi `done` (hijau).
  3. Pewarnaan **tidak boleh mundur** dalam satu percobaan (monoton): setelah huruf `done`, tidak kembali `pending` meski interim berubah. (Menghindari kedip membingungkan.)
  4. Saat hasil **final** cocok (skor ≥ ambang): seluruh sisa unit langsung `done` dengan gelombang animasi + konfeti/bintang.
  5. Jika final tidak cocok tapi skor ≥ ambang "hampir": unit yang tidak terbaca ditandai `almost` (ungu lembut/garis bawah putus-putus), maskot: "Hampir! Dengar dulu ya", lalu **TTS membacakan** dan kata dibaca ulang per suku kata dengan sorotan.
  6. Jika skor di bawah "hampir": reset lembut tanpa pewarnaan negatif, maskot menyemangati, tawarkan bantuan.
- **Mode baca per suku kata (opsional, disarankan untuk pemula)**: tiap suku kata dikenali **secara terpisah** (anak membaca "i", jeda, "bu"), karena itu jauh lebih andal dengan Web Speech API daripada mengandalkan interim kata utuh. Tampilkan penunjuk giliran (panah/maskot) ke suku kata aktif. Orang tua bisa memilih mode: `suku-kata-satu-satu` atau `kata-utuh`.
- Pewarnaan harus bisa berjalan **tanpa mikrofon** (mode ketuk & mode baca bersama), memakai komponen yang sama dengan sumber status berbeda.

### 5.6 Variasi ejaan dan pengenalan khas Indonesia
Buat modul `src/lib/speech/normalizeId.ts` berisi:
- peta variasi (mis. "ayah"/"aya", "bapak"/"bapa", "nggak"/"enggak" tidak relevan; fokus kata yang ada di kurikulum),
- daftar **alias yang diterima per item** di JSON (`acceptedAliases`) — misalnya pengenalan suara sering menulis "ibu" sebagai "i bu", "ibu" atau "ibuh". Item JSON boleh mendaftarkan alias manual agar mudah ditala.
- fungsi `phoneticKey(word)` untuk kunci fonetik sederhana.

### 5.7 Pengaturan sesi mendengarkan
- `continuous = false`, `interimResults = true`, `maxAlternatives = 5`.
- Batas waktu mendengar: huruf/suku kata 6 detik, kata 8 detik, kalimat `5 + 1.5 × jumlah kata` detik (maks 20).
- **Timeout tanpa suara** (tidak ada hasil) → state `noSpeech` → "Aku belum dengar, ayo ulangi" (bukan salah).
- Setelah `onend` tanpa hasil final → perlakukan sebagai `noSpeech`.
- **Satu percobaan = satu sesi recognition.** Cegah dobel-start (`InvalidStateError`) dengan guard.
- Bersihkan listener saat komponen unmount; hentikan recognition saat tab tersembunyi (`visibilitychange`).
- Tampilkan **indikator visual mikrofon aktif** yang jelas (pulsa, maskot mendengar) — transparansi untuk anak dan orang tua.

### 5.8 Strategi khusus huruf tunggal
Web Speech API buruk dalam mengenali satu huruf. Terapkan salah satu (atau kombinasi), diatur di config:
1. **Cocokkan terhadap "kata contoh"**: tampilkan `A — apel`, anak diminta mengucapkan huruf *atau* kata contoh. Terima jika transcript cocok dengan huruf, nama huruf, bunyi huruf, **atau** kata contoh.
2. **Tabel alias** per huruf (nama huruf Indonesia "a, be, ce, de, e, ef, ge, ha, i, je, ka, el, em, en, o, pe, ki, er, es, te, u, ve, we, eks, ye, zet") + bunyi umum ("ba", "bu", "ibu" untuk "i", dst.) di `letters.json` → `acceptedAliases`.
3. **Tidak menghukum**: tawarkan latihan bersama setelah beberapa percobaan. Hasil "hampir" tidak otomatis dianggap benar. Latihan bersama dipilih eksplisit dan dicatat sebagai bantuan, sesuai arahan pengguna 17 Oktober 2026.
4. Tawarkan **"mode dengar-tiru"** (TTS bunyi → anak meniru → langsung dihitung tanpa pengecekan ketat) untuk anak yang tidak nyaman dengan mic.

### 5.9 Fallback dan ketahanan (WAJIB)
- **Tidak didukung** (`!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)`): tampilkan pesan ramah ke orang tua dan aktifkan **mode ketuk** (anak membaca dengan lantang bersama TTS/orang tua; tombol "Sudah baca" / ketuk tiap suku kata untuk menyalakan warnanya).
- **Izin ditolak**: layar bantuan ramah untuk orang tua dengan langkah mengaktifkan izin mikrofon + tombol "Lanjut tanpa mikrofon".
- **Offline / error jaringan**: deteksi `error === 'network'`, beri tahu singkat, otomatis mode ketuk.
- **Error lain** (`audio-capture`, `not-allowed`, `service-not-allowed`, `aborted`, `no-speech`, `language-not-supported`): tangani semua secara eksplisit dengan pesan yang ramah dan jalur lanjut.
- Selalu ada tombol **"Lewati / Nanti saja"** yang mudah diakses (tanpa menghukum).
- Aplikasi **tidak boleh crash atau macet** apa pun hasil dari API.

### 5.10 Kesalahan umum yang HARUS dihindari agent
- Jangan menganggap interim result sebagai kebenaran akhir.
- Jangan mencocokkan huruf tunggal dengan perbandingan string ketat.
- Jangan menyalakan mic sambil TTS/efek suara masih berbunyi (masuk ke mic → hasil palsu). Tunggu TTS selesai (`onend`) + jeda 300ms baru mulai mendengar.
- Jangan menyimpan transcript mentah ke penyimpanan permanen.
- Jangan membuat mekanisme di mana anak tidak bisa lanjut karena mic bermasalah.

---

## 6. TEXT-TO-SPEECH (TTS)

- Gunakan **Web Speech Synthesis (`speechSynthesis`)** dengan voice `id-ID`. Pilih voice terbaik yang tersedia (prioritas yang berlabel Indonesia; fallback ke voice default). **Voice berbeda di tiap perangkat**: tangani daftar voice yang dimuat asinkron (`voiceschanged`).
- Wrapper `src/lib/audio/tts.ts` dengan API: `speak(text, { rate, pitch, lang })` yang mengembalikan Promise selesai (resolve di `onend`), `cancel()`, dan `isAvailable()`.
- Kecepatan default untuk anak: `rate ≈ 0.8` (huruf/suku kata `0.7`), pitch sedikit lebih tinggi (`1.1`). Orang tua bisa menyesuaikan.
- **Membacakan huruf/suku kata dengan benar**: TTS cenderung membaca "b" sebagai "be". Untuk bunyi huruf, gunakan **kamus pelafalan** di JSON (`ttsText`), misalnya `ba` → ucapkan "baa", huruf `b` → bunyi "bə" lewat teks hampiran seperti "be pendek"/"beh". Developer perlu **menguji di perangkat nyata** dan mencatat penyesuaian di JSON. Opsi lanjutan: rekaman suara manusia (`audioSrc`) yang diutamakan bila ada, TTS sebagai cadangan.
- **Mode karaoke (baca bersama)**: gunakan `onboundary` jika tersedia untuk menyorot kata. Karena tidak semua voice mendukung `boundary`, siapkan **fallback timer** berbasis perkiraan durasi (rate × panjang suku kata).
- Pastikan satu antrean suara: sebelum `speak` baru, `cancel()` yang lama agar tidak bertumpuk. Hindari bug Chrome di mana `speechSynthesis` berhenti diam-diam pada ucapan panjang (pecah per kalimat).
- Ada tombol global **"bisukan suara"** dan pengaturan volume.

---

## 7. AKTIVITAS INTERAKTIF (SELAIN CEK BACA)

Semua aktivitas berbagi antarmuka yang sama (lihat 11.4): menerima item dari JSON, melaporkan hasil (`ActivityResult`) ke mesin progres.

1. **Dengar & Ketuk** — TTS mengucapkan unit; anak mengetuk kartu yang cocok dari 2–4 pilihan.
2. **Cocokkan Gambar–Kata** — tarik/ketuk kata ke gambar yang tepat. Pilihan acak, distraktor wajar (tidak membingungkan secara bunyi pada level awal).
3. **Susun Huruf/Suku Kata** — potongan di bawah, slot kosong di atas; **drag & drop dengan dukungan sentuh dan keyboard**, plus alternatif **ketuk-untuk-tempatkan** (aksesibilitas, anak kecil sulit drag presisi). Umpan balik lembut saat potongan salah slot (potongan kembali dengan goyang halus, bukan buzzer).
4. **Pilih Jawaban** — pilihan ganda bergambar (maks 3–4 pilihan).
5. **Baca Kata (cek suara)** — fitur Bagian 5.
6. **Baca Bersama (karaoke)** — teks dibacakan, kata disorot berurutan; anak ikut membaca (tanpa cek). Tersedia kecepatan lambat/normal.
7. **Tebak Huruf Awal** — gambar ditampilkan; pilih huruf awal kata ("🍎 → ?").
8. **Cari Kata yang Sama / Memori** — permainan kartu pasangan huruf-kapital/kecil atau kata-gambar.
9. **Lengkapi Kata** — kata dengan satu suku kata hilang ("bo-_"), pilih suku kata yang tepat.
10. **Urutkan Kata Jadi Kalimat** — kata acak disusun menjadi kalimat (Zona 5+).
11. **Pertanyaan Pemahaman** — setelah cerita (Zona 6).
12. **(Opsional, M6) Telusuri Huruf** — menjiplak bentuk huruf dengan jari pada canvas, dengan panduan titik/arah. Cek toleran.

Aturan semua aktivitas:
- 5–8 soal per aktivitas; selesai < 3 menit.
- Setiap soal punya **tombol dengar ulang (🔊)**.
- Respons salah selalu lembut + **petunjuk bertingkat**: (1) ulang pertanyaan, (2) sorot pilihan benar samar, (3) tunjukkan jawaban dan latih bersama.
- Soal acak dari bank item dengan **seed** agar bisa diuji deterministik.

---

## 8. PROGRES, GAMIFIKASI, DAN DASBOR ORANG TUA

### 8.1 Gamifikasi (ramah, bukan adiktif)
- **Bintang** (1–3) per pelajaran berdasarkan keberhasilan dan jumlah bantuan.
- **Lencana** (stiker koleksi): pertama kali membaca kata, 5 hari berturut-turut belajar, menamatkan zona, dst. Daftar di `badges.json`.
- **Album stiker/koleksi hewan** yang terbuka seiring bintang (motivasi intrinsik, tanpa kompetisi antar anak).
- **Streak harian lembut**: "Kamu belajar 3 hari berturut-turut!" Tanpa hukuman bila putus (bahasa: "Ayo mulai lagi!").
- **Dilarang**: papan peringkat, hitung mundur menekan, hilangnya nyawa/hati, notifikasi mendesak, pola gelap (dark pattern).
- Pengingat istirahat setelah 10 menit sesi aktif: maskot menguap, "Istirahat dulu yuk!" (orang tua bisa mengubah durasi 5–20 menit atau mematikan).

### 8.2 Model data progres per item
Per item (`itemId`) simpan:
```ts
interface ItemProgress {
  itemId: string;
  attempts: number;            // total percobaan
  successes: number;           // lulus tanpa bantuan
  assistedSuccesses: number;   // lulus dengan bantuan
  recent: Array<'ok' | 'almost' | 'miss' | 'assisted'>; // maks 10 terakhir
  mastery: number;             // 0..1, dihitung dari recent (bobot lebih besar untuk yang terbaru)
  lastSeenAt: number;          // epoch ms
  nextDueAt: number;           // untuk pengulangan berjarak
  confusions?: string[];       // item yang sering tertukar (mis. b vs d), hanya id item, tanpa transcript
}
```
`mastery` = rata-rata berbobot eksponensial; status: `baru` (<0.2), `belajar` (0.2–0.6), `hampir lancar` (0.6–0.85), `lancar` (≥0.85).

### 8.3 Penjadwal item ("pengulangan berjarak ringan")
- Sesi dibentuk dari: ~60% materi baru/aktif, ~30% pengulangan item `belajar`/`jatuh tempo`, ~10% item `lancar` untuk rasa percaya diri.
- Item `lancar` dijadwalkan ulang dengan jarak yang meningkat (1, 3, 7, 14 hari), item sulit diulang lebih cepat.
- Mulai dan akhiri sesi dengan item **mudah** (efek positif).

### 8.4 Multi-profil anak
- Satu perangkat bisa punya **beberapa profil anak** (nama panggilan + avatar hewan, tanpa data pribadi lain). Profil dipilih di layar awal dengan ikon besar.
- Data tiap profil terpisah di penyimpanan lokal.

### 8.5 Dasbor Orang Tua / Guru
Diakses lewat **gerbang orang tua** (parent gate): soal hitungan sederhana acak ("7 + 5 = ?") atau tahan tombol 3 detik **plus** hitungan. Gerbang tidak boleh bisa ditebak anak 5 tahun dan tidak boleh memakai PIN yang tersimpan polos (opsional PIN dengan hash sederhana, lihat 14).

Isi dasbor (per profil):
- Ringkasan: total waktu belajar, hari aktif, item dikuasai, zona saat ini.
- **Grafik** sederhana (minggu terakhir) waktu belajar dan jumlah item lancar. (Gunakan SVG sendiri atau library ringan yang disetujui.)
- **Item perlu latihan**: daftar huruf/suku kata/kata dengan mastery rendah dan pasangan yang sering tertukar.
- Riwayat sesi singkat (tanggal, durasi, bintang) — **tanpa menyimpan audio/transcript**.
- Pengaturan: mode ketat/mudah, ukuran huruf, font, kecepatan TTS, mikrofon aktif/mati, musik, durasi istirahat, nama panggilan, buka kunci zona, reset progres per profil, **ekspor/impor data (file JSON)** sebagai cadangan.
- Tips singkat bagi orang tua untuk mendampingi (konten statis).
- Penjelasan privasi (ringkas, 1 layar): audio hanya diproses peramban, tidak direkam/disimpan aplikasi.

---

## 9. KONTEN DAN STRUKTUR DATA (JSON)

### 9.1 Prinsip
- **Semua materi di JSON** di `src/content/`. Kode tidak boleh berisi daftar kata hard-coded.
- **Pemenggalan suku kata disimpan eksplisit** di data (sumber kebenaran), bukan dihitung saat runtime. Ada skrip validasi yang memeriksa konsistensi (gabungan suku kata = kata).
- Validasi JSON saat build/dev dengan **Zod** (atau skema TypeScript + skrip validator) agar salah ketik konten cepat ketahuan.

### 9.2 Skema (TypeScript)

```ts
type Level = 'letter' | 'syllable' | 'word' | 'sentence' | 'story';

interface BaseItem {
  id: string;                  // unik & stabil, mis. "w_ibu"
  level: Level;
  text: string;                // teks tampil, mis. "ibu"
  ttsText?: string;            // jika pelafalan TTS perlu disetel
  audioSrc?: string;           // rekaman manusia (opsional, diutamakan jika ada)
  acceptedAliases?: string[];  // variasi hasil pengenalan suara yang diterima
  image?: ImageRef;            // emoji atau SVG
  tags?: string[];             // tema: "keluarga", "hewan", ...
  difficulty: 1 | 2 | 3 | 4 | 5;
}

interface ImageRef { type: 'emoji' | 'svg'; value: string; alt: string } // alt WAJIB

interface LetterItem extends BaseItem {
  level: 'letter';
  upper: string; lower: string;
  soundTts: string;            // bunyi huruf
  nameTts: string;             // nama huruf
  exampleWordId: string;       // referensi ke WordItem
}

interface SyllableItem extends BaseItem {
  level: 'syllable';
  letters: string[];           // ["b","a"]
}

interface WordItem extends BaseItem {
  level: 'word';
  syllables: string[];         // ["i","bu"]  (join('') === text, divalidasi)
  imageRequired: boolean;
}

interface SentenceItem extends BaseItem {
  level: 'sentence';
  words: string[];             // ["Ibu","masak","nasi"]
  punctuation: '.' | '?' | '!';
  wordIds?: (string | null)[]; // tautan ke WordItem jika ada
}

interface StoryItem {
  id: string; title: string; level: 'story';
  pages: Array<{ sentenceIds: string[]; illustration: ImageRef }>;
  questions: Array<{ prompt: string; options: Array<{ text: string; image?: ImageRef }>; answerIndex: number }>;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

interface Lesson {
  id: string; zoneId: string; title: string;
  itemIds: string[];
  activities: ActivityConfig[];   // urutan aktivitas
  unlockAfter?: string[];         // id pelajaran prasyarat
}

interface Zone { id: string; title: string; icon: string; lessonIds: string[]; order: number }
```

### 9.3 Contoh data

```json
// src/content/words/zone3.json (cuplikan)
[
  { "id": "w_ibu", "level": "word", "text": "ibu", "syllables": ["i","bu"], "difficulty": 1,
    "tags": ["keluarga"], "image": { "type": "emoji", "value": "👩", "alt": "ibu" },
    "imageRequired": true, "acceptedAliases": ["i bu","ibuh","ibu ibu"] },
  { "id": "w_bola", "level": "word", "text": "bola", "syllables": ["bo","la"], "difficulty": 1,
    "tags": ["mainan"], "image": { "type": "emoji", "value": "⚽", "alt": "bola" }, "imageRequired": true },
  { "id": "w_buku", "level": "word", "text": "buku", "syllables": ["bu","ku"], "difficulty": 1,
    "tags": ["sekolah"], "image": { "type": "emoji", "value": "📘", "alt": "buku" }, "imageRequired": true }
]
```

### 9.4 Bank konten awal (minimum untuk M1–M3, agent boleh memperluas)
- **Huruf**: seluruh alfabet a–z + ng, ny, sy, kh, masing-masing dengan kata contoh bergambar.
- **Suku kata KV**: kombinasi konsonan (b, m, p, t, d, k, g, s, l, r, n, h, j, c, w, y) × vokal (a, i, u, e, o).
- **Kata Zona 3 (≥ 40 kata)**: ibu, bapa, ayah, adik, kakak, nenek, kaki, mata, mulut, hidung, tangan, buku, bola, topi, sapu, meja, kursi, pintu, bebek, kuda, sapi, kucing(c-ing: untuk Zona 4), ular, ikan, bunga, daun, apel, jeruk, roti, susu, nasi, mama, papa, baju, sepatu, tas, pena, bulan, bintang, dll. (Pisahkan per tingkat kesulitan.)
- **Kalimat Zona 5 (≥ 30)**: "Ini bola." "Itu buku." "Ibu masak nasi." "Adik minum susu." "Kakak baca buku." "Ayah pergi ke kantor." dst. (kata-kata kalimat sebaiknya sudah dikenalkan di zona sebelumnya.)
- **Cerita Zona 6 (≥ 5 cerita)**, 3–6 kalimat, tema aman dan positif.
- **Umpan balik** (`feedback.json`): ≥ 10 pujian, ≥ 8 penyemangat, ≥ 6 petunjuk lembut.
- Semua konten **diperiksa kewajaran bahasanya** (ejaan baku PUEBI/EYD, tidak ada kata kasar/konotasi negatif).
- Catat di `docs/content-notes.md` kata-kata yang pelafalan TTS-nya perlu disetel.

---

## 10. ATURAN SUKU KATA & FONOLOGI BAHASA INDONESIA (referensi untuk pembuat konten/validator)

Gunakan sebagai **panduan pembuat data dan validator**, bukan satu-satunya sumber (data JSON tetap menang).

1. **Huruf vokal**: a, i, u, e, o. **Diftong**: ai, au, oi (satu inti suku kata, mis. `pan-tai`, `pi-sau`, `amboi`). Namun urutan vokal lain dipenggal (`ma-in`, `ta-at`, `bu-ah`). Pembuat data harus memutuskan eksplisit untuk kata ambigu.
2. **Gabungan huruf yang dihitung satu konsonan**: `ng`, `ny`, `sy`, `kh` (mis. `bu-nga`, `ba-nyak`, `sya-ri`, `kha-wa-tir`).
3. **Pola umum**:
   - V-KV → `a-pa`, `i-bu`
   - KV-KV → `bo-la`, `bu-ku`
   - KV-KVK → `bu-lan`, `ma-kan`
   - VK-KV (dua konsonan di tengah dipenggal di antaranya) → `man-di`, `pak-sa`, `kan-tor`
   - Tiga konsonan di tengah: `in-stru-men`, `kon-struk-si` (jarang untuk anak, hindari di level awal).
4. **Konsonan rangkap di awal** (`sekolah` = `se-ko-lah`; `kre-ta`, `tra-ktor` lanjut), dikenalkan bertahap dan akhir kurikulum.
5. **Huruf e**: pepet (`e` seperti `sedang`) vs taling (`é` seperti `meja`/`bebek`). Jangan memakai tanda diakritik di antarmuka anak, tetapi tandai di data untuk kata ambigu (`eNote: "taling"`), dan uji TTS.
6. **Hindari di Zona 1–3**: huruf q, x (kecuali untuk huruf/alfabet), kata serapan sulit, singkatan.
7. **Validator** (`scripts/validate-content.ts`) memastikan: `syllables.join('') === text` (tanpa spasi/tanda), tiap id unik, `exampleWordId` ada, `image.alt` tidak kosong, tidak ada referensi `itemIds` yatim.

---

## 11. STACK TEKNIS, STRUKTUR FOLDER, DAN ATURAN KODE

### 11.1 Stack (tetap, jangan diubah tanpa izin)
- **Vite + React 18 + TypeScript (strict)**
- **Routing**: `react-router-dom` (HashRouter agar mudah di-host statis/PWA)
- **State**: React Context + `useReducer` (state machine sederhana); Zustand **hanya** jika diminta
- **Styling**: **CSS Modules + CSS variables** (token Bagian 2.2). Tanpa framework UI berat. (Tailwind **tidak** dipakai kecuali disetujui.)
- **Animasi**: CSS animations + (opsional, disetujui) `framer-motion`
- **Drag & drop**: pakai Pointer Events buatan sendiri, atau `@dnd-kit/core` (disetujui) — wajib mendukung sentuh dan keyboard
- **Validasi data**: `zod`
- **Penyimpanan**: `localStorage` untuk pengaturan kecil; **IndexedDB via `idb`** (disetujui) untuk progres/riwayat
- **PWA**: `vite-plugin-pwa`
- **Font lokal**: `@fontsource/baloo-2`, `@fontsource/nunito` (opsional `@fontsource/lexend`)
- **Tes**: `vitest` + `@testing-library/react`; e2e ringan `playwright` (M5)
- **Lint/format**: ESLint (+ `eslint-plugin-jsx-a11y`) dan Prettier

Tanpa jQuery, tanpa library animasi/konfeti besar (buat konfeti sederhana via canvas/CSS, atau `canvas-confetti` bila disetujui).

### 11.2 Struktur folder

```
/
├─ GEMINI.md                    ← dokumen ini
├─ docs/
│  ├─ content-notes.md
│  ├─ decisions.md              ← log keputusan teknis (ADR ringkas)
│  └─ testing-checklist.md      ← daftar uji manual per perangkat
├─ public/
│  ├─ icons/                    ← ikon PWA
│  └─ audio/                    ← efek suara
├─ scripts/
│  └─ validate-content.ts
├─ src/
│  ├─ app/                      ← App.tsx, router, providers
│  ├─ components/               ← UI generik (Button, Card, Modal, Mascot, StarBar…)
│  ├─ features/
│  │  ├─ map/                   ← peta belajar & zona
│  │  ├─ lesson/                ← runner pelajaran
│  │  ├─ activities/            ← tiap aktivitas satu folder
│  │  ├─ readAloud/             ← fitur Baca & Cek (komponen + hooks)
│  │  ├─ rewards/               ← bintang, lencana, album
│  │  ├─ parent/                ← gerbang & dasbor
│  │  └─ profiles/
│  ├─ lib/
│  │  ├─ speech/                ← recognition wrapper, matcher, normalizeId, phonetic
│  │  ├─ audio/                 ← tts, sfx
│  │  ├─ progress/              ← model & scheduler
│  │  ├─ storage/               ← wrapper localStorage/IndexedDB
│  │  └─ util/
│  ├─ content/                  ← JSON materi + loader + skema zod
│  ├─ config/                   ← thresholds, constants
│  ├─ styles/                   ← tokens.css, global.css
│  ├─ types/
│  └─ main.tsx
└─ tests/
```

### 11.3 Aturan kode
- TypeScript `strict: true`, **dilarang `any`** (gunakan `unknown` + penyempitan tipe).
- Komponen fungsional + hooks. Satu komponen per file, nama file = nama komponen.
- **Pisahkan logika dari tampilan**: logika bisnis (pencocokan, penjadwal, progres) di `lib/` sebagai **fungsi murni** yang mudah dites; komponen hanya merender.
- Tidak ada akses langsung `window.SpeechRecognition` di komponen: selalu lewat wrapper `lib/speech/recognizer.ts` yang bisa di-mock.
- Tidak ada magic number: konstanta di `config/`.
- Komentar menjelaskan **mengapa**, bukan **apa**. Fungsi nontrivial punya JSDoc singkat.
- Hindari file > 300 baris; pecah jika membengkak.
- Penanganan error eksplisit, tanpa `catch {}` kosong.
- Semua efek samping (listener, timer, recognition, TTS) **dibersihkan** di cleanup `useEffect`.
- Aksesibilitas bawaan di setiap komponen (Bagian 13).
- Commit kecil dan bermakna (jika agent mengelola git): format `feat(readAloud): add prefix-based interim coloring`.

### 11.4 Kontrak aktivitas (agar mudah menambah aktivitas baru)

```ts
interface ActivityProps<TItem extends BaseItem = BaseItem> {
  items: TItem[];
  onComplete: (result: ActivityResult) => void;
  onProgress?: (info: { index: number; total: number }) => void;
  settings: UserSettings;
}
interface ActivityResult {
  activityType: string;
  perItem: Array<{ itemId: string; outcome: 'ok' | 'almost' | 'miss' | 'assisted'; attempts: number; hintsUsed: number }>;
  durationMs: number;
}
```
Registri aktivitas (`activityRegistry`) memetakan `type` → komponen, sehingga pelajaran di JSON bisa menyusun aktivitas hanya lewat konfigurasi.

### 11.5 Kinerja
- Target: berjalan mulus di **HP Android kelas menengah-bawah**.
- Bundle awal < 250KB gzip (di luar font dan aset audio), lazy-load rute dan aktivitas besar.
- Gambar: SVG/emoji; tanpa gambar bitmap besar. Emoji dirender dengan font sistem (catat bahwa tampilan emoji berbeda antar OS; sediakan SVG untuk item penting jika konsistensi diperlukan).
- Hindari re-render berlebihan pada pewarnaan huruf (memoize unit, animasikan via CSS class).

---

## 12. PENYIMPANAN DATA

- **Lokal saja.** Tidak ada permintaan jaringan ke server milik kita.
- `localStorage`: pengaturan global ringan (`settings.v1`).
- `IndexedDB`: profil, progres per item, riwayat sesi, lencana (`db: ayo-membaca`, versi bermigrasi).
- **Versi skema + migrasi**: setiap struktur punya `schemaVersion`; sediakan fungsi migrasi.
- Ekspor/impor cadangan: satu file JSON (tanpa transcript/audio) dengan validasi Zod saat impor.
- Tangani kuota penuh / penyimpanan diblokir (mode privat): jatuh ke memori sementara + beri tahu orang tua bahwa progres tidak akan tersimpan.

---

## 13. AKSESIBILITAS

- Target **WCAG 2.2 AA** sebisa mungkin.
- Semua kontrol dapat dijangkau **keyboard** (Tab/Enter/Space/Esc) dan punya fokus terlihat.
- Elemen interaktif memakai elemen semantik (`button`, `a`), label ARIA bila perlu, `alt` untuk semua gambar (`image.alt` wajib).
- Area live region (`aria-live="polite"`) untuk umpan balik ("Hebat!") agar pembaca layar mengumumkan.
- **Mode kontras tinggi**, **ukuran teks** yang dapat diatur, **opsi font ramah disleksia**, **kurangi gerak**.
- Tidak mengandalkan warna saja (ikon/pola tambahan).
- Pesan error ramah dan jelas.
- Teks tetap terbaca saat zoom 200%.
- Dukungan **portrait dan landscape** pada HP/tablet.

---

## 14. PRIVASI DAN KEAMANAN ANAK

- **Tanpa pelacak, tanpa analitik pihak ketiga, tanpa iklan, tanpa SDK eksternal.**
- **Audio tidak direkam, tidak disimpan, tidak dikirim oleh aplikasi.** Dijelaskan di layar privasi: "Peramban kamu memproses suara untuk mengenali bacaan; aplikasi ini tidak menyimpan suara."
- Data anak minimal: **nama panggilan + avatar**. Tidak ada nama lengkap, foto, lokasi, tanggal lahir lengkap.
- Tidak ada tautan keluar; jika ada (mis. kebijakan privasi), berada di balik gerbang orang tua.
- Semua permintaan izin mikrofon dijelaskan dulu kepada orang tua sebelum memicu prompt peramban.
- Gerbang orang tua tidak boleh dilewati lewat URL langsung (guard di rute).
- Content Security Policy ketat di `index.html`/header hosting (default-src 'self'; media/font lokal).
- Jangan menaruh rahasia/API key di kode. (Tidak ada API berbayar di versi ini.)
- Jika PIN opsional diterapkan: simpan sebagai hash (Web Crypto `SHA-256` + salt), bukan teks polos.

---

## 15. PWA DAN OFFLINE

- `vite-plugin-pwa` dengan strategi `generateSW`, precache aset inti, font, konten JSON, ikon, dan audio efek.
- Manifest: nama, ikon (192/512 + maskable), `display: standalone`, `orientation: any`, warna tema dari token.
- Halaman/overlay "Pasang di layar utama" yang ramah (hanya di balik gerbang orang tua/ pengaturan).
- Penanganan pembaruan versi: tampilkan prompt "Ada versi baru, muat ulang?" di dasbor orang tua, bukan memotong sesi anak.
- **Perilaku offline yang jujur**:
  - Seluruh aplikasi, peta, aktivitas, dan TTS **(tergantung voice perangkat)** bisa jalan offline.
  - **Cek suara bisa membutuhkan internet** → bila offline, otomatis mode ketuk dengan pesan ramah.
- Uji instal dan offline sebagai bagian kriteria M5.

---

## 16. PENGUJIAN DAN KUALITAS

### 16.1 Tes otomatis (vitest)
Wajib untuk logika murni:
- `matcher`: tabel kasus (persis, typo ringan, alias, kata terlalu beda, kalimat dengan kata hilang/ekstra, huruf tunggal via alias).
- `normalizeId` dan `phoneticKey`.
- Pemetaan **prefix interim → unit yang diwarnai** (termasuk sifat monoton).
- State machine Baca & Cek: setiap transisi, termasuk `permissionDenied`, `noSpeech`, `unsupported`.
- `scheduler` penjadwal item (distribusi 60/30/10, tanggal jatuh tempo).
- Perhitungan `mastery`.
- Validator konten (kasus lulus dan gagal).
- Pewarnaan tidak mundur (invarian).

### 16.2 Tes komponen
- Aktivitas dasar (render, jawab benar/salah, hasil dilaporkan).
- Fallback mode ketuk muncul saat `SpeechRecognition` tidak ada (mock).

### 16.3 Uji manual (`docs/testing-checklist.md`) — wajib dilaporkan hasilnya oleh developer
- Chrome Android (HP), Chrome desktop, Edge, Safari iOS (perilaku fallback), Firefox (fallback).
- Izin mikrofon: izinkan, tolak, blokir permanen, dicabut saat jalan.
- Offline / koneksi lemah.
- Layar kecil (360×640), tablet, landscape.
- `prefers-reduced-motion`, kontras tinggi, zoom 200%, navigasi keyboard.
- Suara anak sebenarnya (uji dengan 2–3 anak jika memungkinkan) untuk menala ambang.

### 16.4 Skrip npm yang harus ada
`dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `validate:content`, `format`.
**Definition of Done umum**: typecheck, lint, test, validate:content semuanya hijau.

---

## 17. MILESTONE, RUANG LINGKUP, DAN KRITERIA SELESAI

> Kerjakan **satu per satu**. Di akhir tiap milestone: laporan (Bagian 19), tunggu persetujuan.

### M0 — Fondasi proyek
**Ruang lingkup**: scaffold Vite+React+TS strict, ESLint/Prettier, struktur folder, `tokens.css`, `global.css`, font lokal, router dasar, layout kerangka, komponen dasar (`Button`, `Card`, `Mascot` placeholder), loader konten + skema Zod + validator, `docs/decisions.md`.
**Selesai jika**: `npm run dev` menampilkan layar awal ramah; typecheck/lint/test/validate hijau; struktur sesuai Bagian 11.2.

### M1 — Peta belajar + TTS + Zona 1 (Huruf)
**Ruang lingkup**: layar pilih profil sederhana (1 profil dulu), peta belajar, wrapper TTS (dengan penanganan voice asinkron), data huruf a–z lengkap, pelajaran huruf dengan aktivitas **Dengar & Ketuk**, **Cocokkan Huruf Kapital–Kecil**, dan **Tebak Huruf dari Bunyi**; bintang & penyimpanan progres dasar (localStorage dulu atau IndexedDB), efek suara dasar, maskot SVG dengan ≥ 4 ekspresi.
**Selesai jika**: anak dapat menyelesaikan satu pelajaran huruf dari awal sampai akhir, mendengar bunyi huruf, mendapat bintang, progres bertahan setelah muat ulang; semua teks anak dibacakan; navigasi jelas; `prefers-reduced-motion` dihormati.

### M2 — Aktivitas interaktif Zona 2–3 (Suku kata & Kata)
**Ruang lingkup**: data suku kata KV dan ≥ 40 kata bergambar, aktivitas **Cocokkan Gambar–Kata**, **Susun Suku Kata/Huruf** (drag & drop + ketuk-tempatkan + keyboard), **Pilih Jawaban**, **Lengkapi Kata**, mode **Baca Bersama (karaoke)** dengan pewarnaan per suku kata dan per huruf, pengunci zona, petunjuk bertingkat.
**Selesai jika**: Zona 2 dan 3 dapat dimainkan penuh tanpa mikrofon; karaoke menyorot dengan benar (dengan fallback timer); drag & drop berfungsi di sentuh dan keyboard; kunci zona bekerja.

### M3 — Baca & Cek (inti)
**Ruang lingkup**: seluruh Bagian 5: wrapper recognizer (mockable), normalisasi, matcher, ambang per level, state machine, pewarnaan interim monoton per suku kata & huruf, mode baca per suku kata dan kata utuh, strategi huruf tunggal, semua fallback (tidak didukung, izin ditolak, offline, error), koordinasi dengan TTS (tidak mic saat bicara), UI mikrofon + maskot mendengar, kalibrasi ambang (Mudah/Normal/Ketat). Integrasikan ke Zona 1–3 dan buka Zona 4–5 (kata panjang & kalimat) dengan cek per kata.
**Selesai jika**: semua tes unit matcher/state machine lulus; di Chrome HP anak bisa membaca kata dan hurufnya berubah warna sesuai spesifikasi; setiap jalur error menghasilkan pengalaman yang tetap bisa lanjut; tidak ada audio yang disimpan (verifikasi kode); dokumentasikan hasil uji manual.

### M4 — Gamifikasi, profil, dan dasbor orang tua
**Ruang lingkup**: multi-profil, lencana, album stiker, streak lembut, pengingat istirahat, penjadwal item adaptif (8.3), kesulitan adaptif, gerbang orang tua, dasbor (8.5) dengan grafik, pengaturan lengkap, ekspor/impor, layar privasi, Zona 5 penuh dan Zona 6 (cerita + pemahaman).
**Selesai jika**: progres per profil terpisah dan akurat; dasbor menampilkan item yang perlu latihan dari data nyata; pengaturan memengaruhi perilaku (ukuran huruf, mode ketat, TTS rate); ekspor-impor bolak-balik berhasil.

### M5 — PWA, aksesibilitas, performa, dan polishing
**Ruang lingkup**: PWA instal & offline, audit aksesibilitas (jsx-a11y, uji keyboard, kontras), optimasi performa, CSP, tes e2e alur utama (Playwright), perapian animasi, penyempurnaan copywriting, dokumentasi README (cara menjalankan, menambah konten, menambah aktivitas, batasan Web Speech API).
**Selesai jika**: dapat dipasang dan dipakai offline (kecuali cek suara yang diberi fallback); skor Lighthouse PWA/Accessibility/Performance baik (target ≥ 90 di perangkat uji); checklist uji manual lengkap terisi.

### M6 (opsional) — Peningkatan
Telusuri huruf (tracing), rekaman suara manusia untuk bunyi huruf, lebih banyak konten, tema visual tambahan, ekspor laporan PDF untuk guru, bahasa daerah (jika diminta). **Tidak dikerjakan tanpa permintaan eksplisit.**

---

## 18. DAFTAR LARANGAN (RINGKAS)

Agent **DILARANG**:
1. Menambah backend, akun, atau layanan cloud.
2. Menyimpan/merekam/mengirim audio anak atau transcript mentah secara permanen.
3. Menambah iklan, pelacak, analitik, atau tautan keluar.
4. Menampilkan kata "salah/gagal" atau warna merah untuk bacaan anak, hukuman, nyawa, papan peringkat, atau timer yang menekan.
5. Menghard-code materi belajar di dalam komponen.
6. Memakai `any`, mematikan aturan lint, atau mengabaikan error TypeScript.
7. Memuat font/aset dari CDN pihak ketiga.
8. Mengklaim bahwa pewarnaan huruf mendeteksi bunyi per huruf secara nyata (itu animasi dari hasil pencocokan).
9. Menyalakan mikrofon saat aplikasi masih mengeluarkan suara.
10. Membuat anak terjebak (tanpa jalan lanjut) ketika mic/pengenalan gagal.
11. Menggunakan animasi berkedip cepat atau mengabaikan `prefers-reduced-motion`.
12. Mengerjakan milestone di luar yang diminta, atau mengubah stack/struktur tanpa izin.
13. Mengubah file konten pelajaran yang sudah disetujui secara massal tanpa diminta.
14. Mengarang fakta (versi library, perilaku API, aturan bahasa) tanpa menandai ketidakpastian.

---

## 19. TEMPLATE LAPORAN AGENT (di akhir tiap milestone/langkah besar)

```
## Laporan Milestone <N>
**Yang selesai**: (daftar singkat per fitur)
**File utama yang dibuat/diubah**: (daftar)
**Cara menjalankan & menguji**: (perintah + langkah manual)
**Hasil cek**: typecheck ✅/❌ · lint ✅/❌ · test ✅/❌ (jumlah) · validate:content ✅/❌
**Keputusan teknis yang diambil**: (dan alasannya; tambahkan ke docs/decisions.md)
**Batasan / yang belum sempurna**: (jujur)
**Risiko / hal yang perlu diuji manusia**: (mis. uji suara anak di HP)
**Pertanyaan untuk developer**: (maks 3, spesifik)
**Usulan langkah berikutnya**:
```

---

## 20. LAMPIRAN

### 20.1 Kerangka kode matcher (referensi, boleh disempurnakan)

```ts
// src/lib/speech/matcher.ts
export interface MatchInput {
  target: string;                 // teks target (sudah ternormalisasi di pemanggil atau di sini)
  aliases?: string[];
  heard: string[];                // semua alternatif dari recognizer (urut confidence)
  level: 'letter' | 'syllable' | 'word' | 'sentence';
}

export interface MatchResult {
  score: number;                  // 0..1 terbaik
  outcome: 'ok' | 'almost' | 'miss';
  bestHeard: string | null;
  matchedPrefixChars: number;     // untuk pewarnaan interim
}

export function levenshtein(a: string, b: string): number { /* implementasi DP standar */ return 0; }

export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

export function commonPrefixFuzzy(heard: string, target: string, tolerance = 1): number {
  // Kembalikan jumlah karakter awal target yang "tercakup" oleh heard,
  // dengan toleransi `tolerance` kesalahan. Harus monoton terhadap panjang heard.
  return 0; // TODO: implementasikan + tes
}

export function matchSpeech(input: MatchInput, thresholds: Thresholds): MatchResult {
  // 1) normalisasi target, alias, dan tiap heard
  // 2) hitung skor = max( exact, similarity, similarity(phoneticKey) ) di antara semua heard & alias
  // 3) untuk kalimat: alignment per kata (DP), rata-ratakan
  // 4) tentukan outcome berdasarkan thresholds[level]
  throw new Error('implement me');
}
```
Agent **wajib** menulis tes tabel untuk fungsi ini sebelum menganggapnya selesai.

### 20.2 Pemetaan prefix → unit yang diwarnai (konsep)

```ts
// Diberi: unit = [{ text:'i' }, { text:'bu' }], matchedPrefixChars = 2 ("ib" tercakup)
// Aturan: suku kata dianggap done jika SEMUA hurufnya tercakup ("i" done; "bu" baru 1 dari 2 huruf → huruf 'b' menyala, 'u' belum).
// Pewarnaan per huruf boleh parsial dalam suku kata aktif; pewarnaan suku kata (blok) hanya saat lengkap.
```

### 20.3 Contoh pengalaman (acuan perilaku)

**Kata "IBU" (Zona 3, mode suku-kata-satu-satu)**
1. Layar menampilkan gambar 👩 dan teks besar `I · BU`. Maskot: "Ayo baca kata ini!" (dibacakan). Suku kata `I` berdenyut kuning.
2. Anak ketuk 🎤, maskot mendengar. Anak berkata "i". Hasil cocok → huruf `I` menyala hijau dengan "pop" kecil. Sorotan pindah ke `BU`.
3. Anak berkata "bu". Cocok → `B` lalu `U` menyala berurutan, seluruh kata hijau, ✅, bintang terbang ke bilah bintang, konfeti, maskot bersorak: "Hebat! IBU!". TTS mengucapkan "ibu" sebagai penegasan.
4. Jika anak berkata "bo": skor "hampir" → suku kata `BU` ungu lembut, maskot: "Hampir! Dengar ya… bu". TTS "bu". Anak coba lagi.
5. Jika beberapa kali belum berhasil: tawarkan "Yuk kita baca bareng!". Anak dapat tetap mencoba mikrofon atau memilih latihan tanpa penilaian. Hanya pilihan eksplisit yang membuka konfirmasi selesai dengan bantuan; tanpa teks final tidak dihitung sebagai bacaan salah.

### 20.4 Daftar periksa "Selesai" sebelum menyatakan fitur beres
- [ ] Berjalan tanpa error di konsol
- [ ] Tes terkait ditulis dan lulus
- [ ] Jalur error/fallback ditangani
- [ ] Teks anak dibacakan dan bernada ramah
- [ ] Mendukung keyboard dan `prefers-reduced-motion`
- [ ] Tidak menyimpan audio/transcript mentah
- [ ] Konten dari JSON, bukan hard-coded
- [ ] Dokumentasi/keputusan dicatat

---

*Versi dokumen: 1.0 — perubahan dilakukan lewat persetujuan developer dan dicatat di `docs/decisions.md`.*
