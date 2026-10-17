# Suara pemandu Bu Delia

Pengguna memilih preset perempuan **F3 dari Supertonic 3** melalui audisi lokal.
Pemandu memakai bahasa Indonesia, speed `0.95`, delapan langkah, dan seed `42`.
Paket berisi 978 entri MP3 lokal
untuk materi, contoh bacaan, instruksi, dan pujian. Audio dimuat sesuai kebutuhan;
seluruh paket tidak diunduh saat halaman pertama dibuka.

Lokasi paket: `public/audio/delia-f3/`. Model hanya dijalankan saat membuat aset,
tidak diunduh atau dijalankan di browser anak. MP3 lama Gadis tetap tersedia
sebagai cadangan; manifest aktif menentukan paket yang diputar.

## Pemutaran

1. `audioSrc` eksplisit pada item mendapat prioritas.
2. `src/content/guide-audio.json` mencari MP3 lokal dari teks yang dinormalisasi.
3. Teks di luar paket memakai voice Indonesia browser, dengan prioritas Gadis
   dan Google Indonesia. Kualitas fallback bergantung perangkat.

Stream Google Translate tidak lagi digunakan. Audio lokal dapat diputar tanpa
koneksi setelah aplikasinya tersedia; ini tidak berarti aplikasi sudah memiliki
service worker untuk pemasangan atau unduhan offline seluruh paket.

Saat mikrofon diminta, suara pemandu yang sedang berjalan ditunggu sampai selesai,
kemudian ada jeda 400 ms. Efek suara dan TTS baru dibisukan selama sesi mikrofon.
Indikator mendengar menunggu event `onaudiostart`, bukan hanya layanan recognition
mulai. Batas waktu bacaan dihitung setelah capture dimulai. Saat dihentikan,
recognizer menunggu hasil final hingga dua detik sebelum menutup sesi.
Meter amplitudo tersedia melalui pemeriksaan input terpisah, tanpa membuka stream
kedua selama pengenalan suara. Tidak ada rekaman atau penyimpanan suara anak.

Hasil kosong dan gangguan teknis tidak dihitung sebagai bacaan salah. Mode latihan
tanpa penilaian harus dipilih secara eksplisit; jumlah percobaan tidak otomatis
meloloskan bacaan. Kata lengkap yang tepat diterima meski latihan sedang menyorot
satu suku kata. Panel bantuan menunjukkan tahap capture, suara, ucapan, dan teks
agar izin mikrofon tidak disamakan dengan hasil pengenalan yang berhasil.

## Membuat ulang aset

Generator hanya diperlukan saat menyiapkan aset, bukan saat menjalankan aplikasi.
Model Supertonic 3 dan environment terpisah disiapkan sesuai
[panduan audisi lokal](local-voice-audition.md). Pembuatan materi memakai CPU
lokal tanpa permintaan jaringan atau biaya API.

```powershell
$voicePython = Join-Path $env:LOCALAPPDATA 'PINCA\supertonic3\.venv\Scripts\python.exe'
& $voicePython -X utf8 scripts/generate-local-guide.py --activate
```

Generator melanjutkan MP3 valid yang sudah ada. Hash nama file mencakup teks,
model, dan parameter. Manifest aktif hanya diganti setelah semua klip lulus
validasi file dan waveform. Generator membaca daftar teks pada manifest yang
ada; materi baru perlu ditambahkan ke daftar ini sebelum paket dibuat ulang.
`scripts/generate-guide-voice.py` adalah generator Gadis lama dan tidak diperlukan
untuk paket F3.

Daftar voice Indonesia didokumentasikan oleh
[Microsoft Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts).

## Verifikasi

Tes memeriksa prioritas voice perempuan, resolusi MP3 lokal, keberadaan aset,
penggunaan ulang cache, lifecycle mikrofon, dan pencocokan bacaan. Penilaian
intonasi, pelafalan huruf/suku kata, serta akurasi suara anak tetap memerlukan
pendengaran dan pengujian perangkat nyata. Browser UI tidak tersedia pada sesi
implementasi ini, sehingga tampilan 360 px, tablet, dan zoom 200% belum diperiksa
secara visual.


## Audisi suara Bu Delia yang lebih ekspresif

Audisi F1/F2/F3 tersedia di `/previews-bu-delia-local.html`. Pengguna memilih F3.
Detail perangkat, pemakaian RAM, durasi pembuatan, dan lisensi model tercatat di
[panduan lokal](local-voice-audition.md). Pilihan suara tidak otomatis memverifikasi
ketepatan semua huruf dan suku kata; tetap lakukan pemeriksaan lewat pendengaran.

Bagian berikut adalah alternatif audisi ElevenLabs yang sebelumnya disiapkan;
layanan tersebut tidak digunakan untuk membuat paket F3.

`python scripts/preview-delia-voice.py` membuat rencana tiga sampel yang dapat
ditinjau, tanpa mengirim permintaan atau menggunakan kredit layanan. Semua sampel
memakai naskah yang sama: sapaan, vokal/suku kata, contoh kata, giliran membaca,
dan pujian. Persona ibu adalah panduan memilih voice penutur asli Indonesia;
parameter tersebut tidak dikirim sebagai field API yang tidak didukung.

Setelah memilih ID voice perempuan Indonesia dari akun ElevenLabs, gunakan
variabel lingkungan terminal `ELEVENLABS_API_KEY`, kemudian:

```powershell
python scripts/preview-delia-voice.py --generate --voice-id ID_SUARA_1 --voice-id ID_SUARA_2 --voice-id ID_SUARA_3
```

Perintah dengan `--generate` menggunakan layanan dan dapat menghabiskan kredit.
Jangan menaruh kunci dalam variabel `VITE_*` atau mengirimkannya lewat chat.
Hasil audisi disimpan di `public/audio/delia-auditions/`; generator tidak mengganti
paket aktif. Pilih sampel lewat pendengaran sebelum membuat ulang seluruh materi.
Implementasi mengacu pada [API Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

Pratinjau tujuh ekspresi maskot: `public/previews-bu-delia.svg`.
