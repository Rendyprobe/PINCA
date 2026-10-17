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

---

## ADR 005: Aktivitas Interaktif Zona 2–3 & Aksesibilitas Drag-and-Drop (Milestone 2)

* **Tanggal**: 2026-10-16
* **Status**: Diterima
* **Konteks**:
  Penyusunan suku kata menjadi kata membutuhkan interaksi geser-tarik (drag-and-drop). Namun motorik halus anak usia 5–6 tahun sering kali kesulitan menahan jari sambil menggeser di layar sentuh perangkat mobile.
* **Keputusan**:
  1. Implementasi aktivitas **Susun Suku Kata** mendukung *Pointer Events* untuk drag-and-drop dan **fallback ketuk-pilih (tap-to-place)** secara bersamaan. Anak dapat mengetuk kartu suku kata untuk langsung memasukkannya ke slot target yang kosong.
  2. Pemisahan suku kata kata diambil eksplisit dari data JSON (`syllables: ["bo", "la"]`) dan bukan ditebak saat runtime.
  3. Pembagian zona otomatis terbuka jika rata-rata penguasaan zona sebelumnya mencapai $\ge 80\%$, disertai sakelar pembuka manual bagi orang tua/guru.

---

## ADR 006: Pengenalan Suara (Web Speech API), State Machine, & Privasi (Milestone 3)

* **Tanggal**: 2026-10-16
* **Status**: Diterima
* **Konteks**:
  Fitur inti "Baca & Cek" mengecek bacaan suara anak secara langsung. Pengenalan suara peramban memiliki keterbatasan akurasi untuk suara anak dan suku kata/huruf tunggal, serta variasi dukungan antar peramban (Chrome vs Safari/Firefox).
* **Keputusan**:
  1. **Privasi Penuh & Nol Perekaman Audio**: Tidak ada rekaman suara atau transkrip audio mentah yang disimpan secara persisten atau dikirim ke server pihak ketiga. Hanya transkrip teks sementara dari browser Web Speech API yang diproses di memori klien.
  2. **Abstraksi Recognizer Mockable (`ISpeechRecognizer`)**: Mengisolasi Web Speech API di balik antarmuka yang memungkinkan simulasi deterministik pada tes otomatis headless/CI.
  3. **Pencocokan Fuzzy & Fonetik Multi-Sinyal**: Menggabungkan jarak edit Levenshtein, penyetaraan fonetik khas Indonesia (`phoneticKey`), alias terdaftar di JSON (`acceptedAliases`), dan strategi multi-opsi untuk huruf tunggal (menerima bunyi huruf, nama huruf, atau kata contohnya).
  4. **Pewarnaan Monoton Bertahap**: Menghitung `commonPrefixFuzzy` dari hasil interim secara monoton; huruf/suku kata yang sudah berstatus `done` tidak pernah berkedip mundur ke `pending`.
  5. **Koordinasi Audio Guard**: Mikrofon dilarang aktif saat TTS masih berbunyi; diselipkan jeda 300ms setelah pengucapan TTS selesai sebelum rekognisi dimulai.
  6. **Ketahanan & Zero-Failure**:
     - Jika recognizer tidak didukung atau izin mic ditolak: otomatis beralih ke **Mode Ketuk** tanpa menghentikan anak.
     - Jika anak mencoba hingga 3 kali belum tepat: otomatis beralih ke mode **Baca Bersama (Assisted)** dengan pemandu TTS dan tetap memberikan 1 bintang keberhasilan.





### 2026-10-17 - Guide audio and speech capture coordination

- Prioritize curriculum `audioSrc` MP3 recordings, cache up to 128 audio elements per session, and settle playback promises on completion or cancellation. The existing Google Translate stream remains a synthesized fallback; it is not a human recording or a guaranteed service. No human recordings are currently bundled.
- Browser fallback prefers Indonesian Natural/Neural voices, fixes pitch at 1 and rate at 0.85, and splits long prompts into bounded phrases. Playback errors/timeouts release the queue.
- Block new guide audio and effects while requesting/listening; wait for current guide completion followed by 400 ms silence before recognition. Cancel pending starts and ignore retired recognition callbacks on stop, item changes, and unmount.
- Use transposition-aware edit distance, accent normalization, Indonesian phonetic variants, five recognition alternatives, and base pass thresholds 0.45/0.55/0.65 for letters/syllables/words. Assistance starts after two attempts, including empty sessions.
- The optional microphone meter computes live RMS amplitude with Web Audio, never stores audio, and stops all tracks on cleanup. Recognition still works when meter capture is unavailable.
- Badges use normal card flow, reading cards wrap within a 600 px container, microphone diameter is 96 px, and mascot size is 100 px.
- Automated validation: content validation, typecheck, lint, production build, and 61 tests passed. Browser UI inspection was unavailable because the connected browser inventory was empty. Real child speech, perceived voice warmth, mobile layout, and network/offline playback still require device testing.


### 2026-10-17 - Local AI motherly voice and focused reading UI

- User clarified that natural AI speech is acceptable and selected a warm motherly voice. Added 973 local Gadis Neural MP3 clips (19.22 MiB), a text-to-asset manifest, and an optional build-time generator. No application dependency, backend, or runtime TTS API credential was added.
- Guide audio now prefers local neural assets; removed the undocumented Google Translate streaming URL. Unknown text falls back to the best Indonesian browser voice. Fixed public map greeting avoids transmitting profile names to a voice provider.
- Success feedback is concise and uses the generated praise bank. Reading and activity prompts resolve to local clips; explicit item audioSrc overrides remain supported.
- Reworked the learning map into zone choices, progress summary, and native lesson buttons. Reading uses a central card, reserved badge space, a circular 96 px microphone, and a small mascot footer. Reduced nested mobile padding and improved button text contrast.
- Native microphone status now follows recognition onstart; abort detaches retired callbacks and closes sessions even after error. Item keys reset repeated texts. Interim matched characters can light up within a syllable.
- See docs/guide-voice.md for asset regeneration and verification limits. Connected browser inventory was empty, so visual mobile inspection and perceptual listening remain manual checks.


### 2026-10-17 - Page scrolling and render responsiveness

- User reported intermittent scroll freezing on the learning map. No wheel/touch cancellation or document scroll lock exists in the current map source. Connected browser inventory was empty, so the map symptom could not be reproduced live.
- Explicit native document vertical scrolling and non-shrinking page/main flex sizing keep long content in document flow. The profile overlay now scrolls independently and remains reachable on short screens.
- Separately found and fixed a definite render loop in SoundGuess: getWordById returns a fresh parsed object, which retriggered an effect that sets state on every render. Memoized the lookup by exampleWordId.
- Added regression checks for stable sound-activity initialization and switching map zones without repeated profile loading. Real wheel/touch scrolling remains a manual verification item; jsdom cannot validate layout scrolling.


### 2026-10-17 - Bu Delia, explicit reading correction, and navigation layout

- User renamed the guide Bu Delia. Updated active copy, accessibility labels, content feedback, guide metadata, specification name, and regenerated changed voice lines. The active pack is still Gadis Neural, now 978 manifest entries; a warmer premium voice has not been generated.
- Added a standard-library-only ElevenLabs audition generator and a three-sample dry-run plan. The API key and Indonesian voice IDs are required to generate actual auditions. No paid provider request was made. Plugin discovery returned no ElevenLabs plugin; API access remains the missing input.
- Short units preserve vowels during fuzzy matching. Changed vowels in longer word candidates cannot receive a passing score unless explicitly accepted as an alias. Sentence matching now uses ordered alignment and penalizes extra words. Interim progress no longer treats an unrelated leading substring or a changed vowel as fully read.
- Tap fallback and assisted completion report assisted results, never a fabricated exact recognition score. Added separate verified/assisted completion copy, re-example after retries, no-speech messaging, retry microphone action, micEnabled handling, and visibility cleanup.
- Lesson speech checking enables microphone use by default, but capture begins only from the child tapping the control. Explicit mic-disabled settings remain respected.
- Replaced the placeholder owl with a rounded lavender-and-cream teacher carrying a book, seven distinct expressions, and reduced-motion support. Rendered and visually inspected a standalone SVG preview of all seven states.
- Navigation buttons no longer allow arbitrary letter wrapping or flex shrinking. The lesson header reserves columns for back/stage controls and moves long titles to their own row at smaller widths.
- Browser inventory was empty, so interactive desktop/mobile layout and real child speech remain unverified on device. SVG preview and automated regression checks provide limited verification, not perceptual voice validation.

### 2026-10-17 - Preserve recognition results and require explicit assisted practice

- User reported speaking the correct word with microphone permission enabled but receiving no recognition. Found concrete lifecycle defects: reading deadlines aborted instead of requesting final results, the listening indicator relied on service startup, and syllable mode rejected an exact whole-word reading. These fixes do not establish the cause on the user's device.
- Capture now starts the reading deadline; graceful stop allows a bounded two-second final-result window. Combine result segments, preserve interim text for diagnostics, and distinguish missing final text from actual mismatches and technical errors.
- Empty results never increment mismatch retries. No retry count automatically enters assisted mode. The user chooses practice without assessment; its completion remains assisted. Updated the specification to reflect this explicit user direction.
- Removed automatic concurrent amplitude capture during recognition. A separate opt-in microphone check and collapsed stage diagnostics help distinguish device input, detected speech, and returned text without recording or storing audio.
- Added regression cases for delayed final results, startup timeout, final/interim segments, whole-word acceptance during syllable reading, repeated empty sessions, and absence of concurrent getUserMedia during ASR. Automated suite: 91 tests pass; lint and content validation pass. Hardware capture and provider transcription remain a manual check.

### 2026-10-17 - User selected local Supertonic F3 for Bu Delia

- Generated comparable F1/F2/F3 auditions locally on an i5-8365U laptop with 8 GB RAM. User listened and chose F3. Audition measurements and the standalone player are preserved for review.
- Generated and activated all 978 existing guide-text entries with Supertonic 3 F3, Indonesian, speed 0.95, eight steps, seed 42, two CPU threads. Assets total 37.54 MiB of MP3; model weights and the Python environment remain outside the repository and are not needed in the browser.
- Pack creation and full waveform/file verification completed in 1561.711 seconds. Each clip was verified before the active manifest changed atomically. All previous text keys remain covered; filenames include a hash of text and voice configuration so existing Gadis audio caches cannot masquerade as F3.
- Added an offline, resumable generator and setup/provenance documentation. The original Gadis files remain available for rollback; browser speech synthesis is still the fallback for text absent from the local pack.
- The selected audition establishes the user's character preference. Individual curriculum pronunciation, especially isolated letters and syllables, still requires listening review. No child recording or cloud inference was used to generate these assets.

### 2026-10-18 - Remediation of audit blockers (ListenTap syllable support, lesson locking, keyboard a11y, 404 fallback)

- Polimorfik ListenTap: Generalize `ListenTap` component to accept both `LetterItem` and `SyllableItem`. In syllable mode, distractors are chosen from syllables, prompts use syllable pronunciation text, and options render syllable text cleanly without undefined labels. Added unit test suite `tests/listen-tap.test.tsx`.
- Enforce lesson prerequisites: `LearningMap` now evaluates `lesson.unlockAfter`. Locked lessons display a lock icon (🔒), disabled state, and screen reader-friendly guidance, with Bu Delia prompting the child to complete prerequisites first.
- Accessible Cards: Clickable `Card` components now include `role="button"`, `tabIndex={0}`, and handle `Enter`/`Space` key presses for full keyboard accessibility.
- 404 Route handling: Added wildcard redirect (`<Route path="*" element={<Navigate to="/" replace />} />`) in `routes.tsx` to prevent blank screens on invalid URLs.
- Activity-item validation: `scripts/validate-content.ts` now verifies that activity types within lessons are compatible with the curriculum item levels (letters vs syllables vs words).
- Formatting: Formatted all files with Prettier so `npm run format:check` passes cleanly.

### 2026-10-18 - Parent Settings Modal & Parental Gate (P1 Remediation)

- Added a dedicated Parent Settings Modal (`ParentSettingsModal.tsx`) accessible from the learning map via the "Orang Tua" header action.
- Implemented a Parental Gate with a randomized arithmetic verification challenge (`num1 + num2 = ?`) to ensure children do not accidentally modify curriculum or audio settings.
- Configurable settings include:
  - Speech & Microphone toggle (`micEnabled`), enabling child to switch between interactive speech check and tap-to-complete mode.
  - Difficulty threshold (`easy`, `normal`, `strict`), controlling phonetic/fuzzy similarity thresholds for speech recognition.
  - Reading mode preference (`syllables` vs `whole-word`).
  - Bu Delia guide speech tempo (`ttsRate`: slow `0.7`, medium `0.85`, normal `1.0`), wired into both audio playback rate and browser fallback voice rate via `tts.setDefaultRate()`.
  - Manual curriculum unlock toggle (`unlockedAllLessons`), allowing parents or teachers to unlock all lessons without prerequisite gates when needed.
- Propagated active profile `settings` from `progressStorage` into `LessonRunner.tsx` and dynamically passed down to all activity components.
- Added automated unit test suite `tests/parent-settings.test.tsx` verifying parental gate math challenge, security blocking on wrong answer, setting adjustments, and profile persistence.

