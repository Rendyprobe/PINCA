# Audisi lokal Bu Delia dengan Supertonic 3

Percobaan ini membuat tiga WAV dari preset perempuan F1/F2/F3 memakai teks yang
sama. Suara aktif, manifest materi, dan penilaian bacaan anak tidak diubah.
Halaman pembanding tersedia di `/previews-bu-delia-local.html` saat Vite berjalan.

Model dan environment Python berada di `%LOCALAPPDATA%\PINCA\supertonic3`,
di luar repositori. Tidak ada API berbayar atau audio anak yang dikirim.
Unduhan pertama memerlukan internet; inference setelahnya memakai CPU lokal.
Runner memeriksa ukuran aset dan SHA-256 yang diterbitkan untuk file LFS model.

## Menyiapkan ulang pada Windows

Gunakan Python 3.11 dan PowerShell. Unduhan model sekitar 400 MB, di luar
dependencies Python dan hasil audio.

```powershell
$voiceRoot = Join-Path $env:LOCALAPPDATA 'PINCA\supertonic3'
New-Item -ItemType Directory -Path $voiceRoot -Force | Out-Null
git clone https://github.com/supertone-oss-archive/supertonic.git (Join-Path $voiceRoot 'source')
git -C (Join-Path $voiceRoot 'source') checkout 1e9799e964ea4c0dad7cde993b65c3c813a7b373
py -3.11 -m venv (Join-Path $voiceRoot '.venv')
$voicePython = Join-Path $voiceRoot '.venv\Scripts\python.exe'
& $voicePython -m pip install numpy==2.2.6 onnxruntime==1.23.1 soundfile==0.13.1 psutil==7.0.0
& $voicePython -X utf8 scripts/audition-supertonic.py
# Setelah aset tersedia dan diverifikasi, ulangi tanpa akses jaringan:
& $voicePython -X utf8 scripts/audition-supertonic.py --offline
```

Model: `supertone-oss-archive/supertonic-3`, revision
`aafc6e32416a594460b32413efc49d7fe4ce6d46`. Sampel kode upstream berlisensi MIT;
bobot model memakai OpenRAIL-M. Lisensi model tersimpan bersama aset lokal.
[Sumber dan status arsip](https://github.com/supertone-oss-archive/supertonic)
serta [bobot dan lisensi](https://huggingface.co/supertone-oss-archive/supertonic-3).
Pengembangan resmi model ini sudah berakhir.

## Pengukuran

Runner memakai CPUExecutionProvider, dua thread intra-op, satu thread inter-op,
delapan langkah, speed 0.95, seed 42, satu suara pada satu waktu. CPU memory arena
dan memory pattern dimatikan, dengan graph optimization BASIC untuk percobaan
yang membatasi pemakaian memori. Ini bukan benchmark pengaturan tercepat.

`public/audio/delia-local-auditions/benchmark.json` mencatat waktu memuat model,
waktu membuat tiap contoh, durasi audio, puncak resident RAM proses yang diamati
setiap 100 ms, dan minimum RAM sistem tersedia. Puncak sesaat dapat terlewat dan
angka resident tidak menggambarkan seluruh committed/virtual memory. Kondisi
aplikasi lain dapat memengaruhi hasil satu sesi ini.

Validasi numerik memastikan waveform berisi nilai finite dan tidak seluruhnya
diam. Ketepatan teks, suara keibuan, pelafalan huruf/suku kata, serta kualitas
alami tetap harus didengarkan manusia sebelum suara materi diganti.

## Hasil sesi 17 Oktober 2026

Perangkat terdeteksi Intel Core i5-8365U, empat core/delapan logical processor,
RAM terlihat sistem 7.68 GiB. Inferensi dijalankan dengan `--offline` setelah aset
diverifikasi. Tiga contoh selesai dengan exit code 0.

| Preset | Durasi WAV | Waktu pembuatan |
| --- | --- | --- |
| F1 | 12.530 detik | 12.097 detik |
| F2 | 11.886 detik | 11.615 detik |
| F3 | 12.874 detik | 13.374 detik |

Memuat model: 3.596 detik. Puncak resident RAM proses yang teramati: 488 MiB.
RAM sistem tersedia sebelum model dimuat: 1011 MiB; minimum selama pengukuran:
609 MiB. Ini mendukung penggunaan untuk menghasilkan klip pendek satu per satu,
belum merupakan pengujian stabilitas pembuatan seluruh materi.

Waveform ketiganya finite, tidak diam, dan tidak melewati amplitudo PCM yang
diizinkan. Penilaian kualitas lewat pendengaran masih menunggu pengguna.

## Pilihan pengguna dan pembuatan paket

Pengguna memilih F3 setelah mendengarkan audisi. Generator paket mempertahankan
parameter audisi (speed 0.95, delapan langkah, seed 42), memakai preset F3 dan
dua thread CPU. Pemilihan karakter ini belum memverifikasi pelafalan setiap
huruf, suku kata, atau kata pada materi.

```powershell
$voicePython = Join-Path $env:LOCALAPPDATA 'PINCA\supertonic3\.venv\Scripts\python.exe'
& $voicePython -X utf8 scripts/generate-local-guide.py --activate
```

Generator bekerja tanpa permintaan jaringan dan memproses entri manifest saat
ini satu per satu. MP3 dan checkpoint tersimpan di `public/audio/delia-f3`.
File yang sudah valid dipakai ulang jika proses diulangi. Manifest aktif baru
diganti secara atomik setelah seluruh klip tersedia dan dapat didekode, tidak
diam, dan tidak berisi nilai waveform invalid. Nama file menyertakan hash teks
dan konfigurasi agar cache audio lama tidak dipakai untuk suara F3.

`manifest.json` menyimpan paket yang lengkap dan `pack-info.json` menyimpan
provenance serta ringkasan pembuatan. Tanpa `--activate`, generator hanya membuat
dan memeriksa paket. Audio Gadis lama tetap tersedia untuk kebutuhan rollback.

Pembuatan paket F3 selesai pada 17 Oktober 2026: 978 MP3, total sekitar 37.54 MiB,
durasi audio gabungan 2397.548 detik, waktu pembuatan dan verifikasi 1561.711 detik.
Seluruh key teks paket lama dipertahankan. Semua klip berhasil didekode dan lolos
validasi waveform sebelum manifest aplikasi diganti ke `Supertonic3-F3`.
