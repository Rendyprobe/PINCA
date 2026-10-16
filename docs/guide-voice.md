# Suara pemandu Bu Delia

Pemandu memakai audio AI perempuan Indonesia `id-ID-GadisNeural`, dengan tempo
`-12%`, pitch asli, dan volume `-5%`. Paket berisi 978 entri audio lokal
untuk materi, contoh bacaan, instruksi, dan pujian. Audio dimuat sesuai kebutuhan;
seluruh paket tidak diunduh saat halaman pertama dibuka.

Contoh: `public/audio/ibu/6e282d230f3d337185a6.mp3`.

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

Generator opsional hanya diperlukan saat menyiapkan aset, bukan saat menjalankan
aplikasi. Ia memakai [edge-tts](https://github.com/rany2/edge-tts) untuk membuat
audio materi publik; tidak mengirim nama profil atau audio anak.

```powershell
python -m pip install edge-tts
python scripts/generate-guide-voice.py
```

Generator melanjutkan dari MP3 yang sudah ada. Jika karakter suara atau parameter
generator berubah, pindahkan paket lama ke lokasi cadangan sebelum membuat ulang.
Manifest hanya berisi klip yang berhasil dibuat. Setelah menambah materi, jalankan
generator dan pemeriksaan proyek lagi.

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

Paket Gadis Neural di atas masih menjadi suara aktif. Nama baru dan maskot tidak
mengubah karakter model suara tersebut. Penggantian ke model ekspresif belum
selesai karena kredensial dan pilihan voice layanan belum tersedia.

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
