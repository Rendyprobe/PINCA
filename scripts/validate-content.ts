import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  zonesFileSchema,
  feedbackFileSchema,
  letterItemsFileSchema,
  syllableItemsFileSchema,
  wordItemsFileSchema,
  sentenceItemsFileSchema,
  storyItemsFileSchema,
  lessonsFileSchema,
  badgesFileSchema,
} from '../src/content/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateContent() {
  console.log('🔍 Memeriksa integritas file konten...');
  let hasErrors = false;
  const contentDir = path.resolve(__dirname, '../src/content');

  // 1. Validasi zones.json
  const zonesPath = path.join(contentDir, 'zones.json');
  let zoneIds = new Set<string>();
  if (fs.existsSync(zonesPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(zonesPath, 'utf-8'));
      const zones = zonesFileSchema.parse(raw);
      zoneIds = new Set(zones.map((z) => z.id));
      console.log(`✅ zones.json valid (${zones.length} zona terdefinisi)`);
    } catch (err) {
      console.error('❌ Gagal validasi zones.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File zones.json tidak ditemukan!');
    hasErrors = true;
  }

  // 2. Validasi feedback.json
  const feedbackPath = path.join(contentDir, 'feedback.json');
  if (fs.existsSync(feedbackPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
      feedbackFileSchema.parse(raw);
      console.log('✅ feedback.json valid (pujian & penyemangat ramah anak)');
    } catch (err) {
      console.error('❌ Gagal validasi feedback.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File feedback.json tidak ditemukan!');
    hasErrors = true;
  }

  // 2b. Validasi badges.json
  const badgesPath = path.join(contentDir, 'badges.json');
  if (fs.existsSync(badgesPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(badgesPath, 'utf-8'));
      const badges = badgesFileSchema.parse(raw);
      const badgeIds = new Set<string>();
      badges.forEach((b) => {
        if (badgeIds.has(b.id)) {
          console.error(`❌ Duplikat lencana ID: ${b.id}`);
          hasErrors = true;
        }
        badgeIds.add(b.id);
        if (b.targetZoneId && !zoneIds.has(b.targetZoneId)) {
          console.error(
            `❌ Lencana ${b.id} merujuk targetZoneId tidak valid: ${b.targetZoneId}`,
          );
          hasErrors = true;
        }
      });
      console.log(`✅ badges.json valid (${badges.length} lencana terdefinisi)`);
    } catch (err) {
      console.error('❌ Gagal validasi badges.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File badges.json tidak ditemukan!');
    hasErrors = true;
  }

  // 3. Validasi words (zone1-words.json, zone3-words.json, zone4-words.json)
  const wordIds = new Set<string>();
  const wordFiles = [
    'words/zone1-words.json',
    'words/zone3-words.json',
    'words/zone4-words.json',
  ];
  for (const wf of wordFiles) {
    const fullPath = path.join(contentDir, wf);
    if (fs.existsSync(fullPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const words = wordItemsFileSchema.parse(raw);
        words.forEach((w) => {
          if (wordIds.has(w.id)) {
            console.error(`❌ Duplikat kata ID: ${w.id} di ${wf}`);
            hasErrors = true;
          }
          wordIds.add(w.id);
        });
        console.log(`✅ ${wf} valid (${words.length} kata terverifikasi)`);
      } catch (err) {
        console.error(`❌ Gagal validasi ${wf}:`, err);
        hasErrors = true;
      }
    } else {
      console.error(`❌ File ${wf} tidak ditemukan!`);
      hasErrors = true;
    }
  }

  // 4. Validasi letters.json
  const lettersPath = path.join(contentDir, 'letters.json');
  const letterIds = new Set<string>();
  if (fs.existsSync(lettersPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(lettersPath, 'utf-8'));
      const letters = letterItemsFileSchema.parse(raw);

      letters.forEach((l) => {
        if (letterIds.has(l.id)) {
          console.error(`❌ Duplikat huruf ID: ${l.id}`);
          hasErrors = true;
        }
        letterIds.add(l.id);

        if (!wordIds.has(l.exampleWordId)) {
          console.error(
            `❌ Huruf ${l.text} merujuk exampleWordId tidak valid: ${l.exampleWordId}`,
          );
          hasErrors = true;
        }
      });

      console.log(`✅ letters.json valid (${letters.length} huruf terverifikasi)`);
    } catch (err) {
      console.error('❌ Gagal validasi letters.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File letters.json tidak ditemukan!');
    hasErrors = true;
  }

  // 5. Validasi syllables.json
  const syllablesPath = path.join(contentDir, 'syllables.json');
  const syllableIds = new Set<string>();
  if (fs.existsSync(syllablesPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(syllablesPath, 'utf-8'));
      const syllables = syllableItemsFileSchema.parse(raw);

      syllables.forEach((s) => {
        if (syllableIds.has(s.id)) {
          console.error(`❌ Duplikat suku kata ID: ${s.id}`);
          hasErrors = true;
        }
        syllableIds.add(s.id);
      });

      console.log(
        `✅ syllables.json valid (${syllables.length} suku kata terverifikasi)`,
      );
    } catch (err) {
      console.error('❌ Gagal validasi syllables.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File syllables.json tidak ditemukan!');
    hasErrors = true;
  }

  // 5b. Validasi sentences (sentences/zone5-sentences.json)
  const sentenceIds = new Set<string>();
  const sentencesPath = path.join(contentDir, 'sentences/zone5-sentences.json');
  if (fs.existsSync(sentencesPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(sentencesPath, 'utf-8'));
      const sentences = sentenceItemsFileSchema.parse(raw);
      sentences.forEach((s) => {
        if (sentenceIds.has(s.id)) {
          console.error(`❌ Duplikat kalimat ID: ${s.id}`);
          hasErrors = true;
        }
        sentenceIds.add(s.id);
      });
      console.log(
        `✅ sentences/zone5-sentences.json valid (${sentences.length} kalimat terverifikasi)`,
      );
    } catch (err) {
      console.error('❌ Gagal validasi sentences/zone5-sentences.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File sentences/zone5-sentences.json tidak ditemukan!');
    hasErrors = true;
  }

  // 5c. Validasi stories (stories/zone6-stories.json)
  const storyIds = new Set<string>();
  const storiesPath = path.join(contentDir, 'stories/zone6-stories.json');
  if (fs.existsSync(storiesPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));
      const stories = storyItemsFileSchema.parse(raw);
      stories.forEach((st) => {
        if (storyIds.has(st.id)) {
          console.error(`❌ Duplikat cerita ID: ${st.id}`);
          hasErrors = true;
        }
        storyIds.add(st.id);
        // Validasi rujukan kalimat di halaman cerita
        st.pages.forEach((pg) => {
          pg.sentenceIds.forEach((sid) => {
            if (!sentenceIds.has(sid)) {
              console.error(
                `❌ Cerita ${st.id} merujuk sentenceId tidak valid: ${sid}`,
              );
              hasErrors = true;
            }
          });
        });
      });
      console.log(
        `✅ stories/zone6-stories.json valid (${stories.length} cerita mini terverifikasi)`,
      );
    } catch (err) {
      console.error('❌ Gagal validasi stories/zone6-stories.json:', err);
      hasErrors = true;
    }
  } else {
    console.error('❌ File stories/zone6-stories.json tidak ditemukan!');
    hasErrors = true;
  }

  // 6. Validasi lessons (zone1, zone2, zone3, zone4, zone5, zone6)
  const allItemIds = new Set([
    ...letterIds,
    ...syllableIds,
    ...wordIds,
    ...sentenceIds,
    ...storyIds,
  ]);
  const lessonFiles = [
    'lessons/zone1-lessons.json',
    'lessons/zone2-lessons.json',
    'lessons/zone3-lessons.json',
    'lessons/zone4-lessons.json',
    'lessons/zone5-lessons.json',
    'lessons/zone6-lessons.json',
  ];

  for (const lf of lessonFiles) {
    const fullPath = path.join(contentDir, lf);
    if (fs.existsSync(fullPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const lessons = lessonsFileSchema.parse(raw);

        lessons.forEach((ls) => {
          if (!zoneIds.has(ls.zoneId)) {
            console.error(
              `❌ Pelajaran ${ls.id} merujuk zoneId tidak valid: ${ls.zoneId}`,
            );
            hasErrors = true;
          }

          ls.itemIds.forEach((itemId) => {
            if (!allItemIds.has(itemId)) {
              console.error(
                `❌ Pelajaran ${ls.id} di ${lf} merujuk itemId tidak valid: ${itemId}`,
              );
              hasErrors = true;
            }
          });

          ls.activities.forEach((act) => {
            if (act.type === 'match_case' || act.type === 'sound_guess') {
              const invalid = ls.itemIds.filter((id) => !letterIds.has(id));
              if (invalid.length > 0) {
                console.error(
                  `❌ Pelajaran ${ls.id} memiliki aktivitas ${act.type} tetapi merujuk item non-huruf: ${invalid.join(', ')}`,
                );
                hasErrors = true;
              }
            }
            if (
              act.type === 'match_picture_word' ||
              act.type === 'arrange_syllables' ||
              act.type === 'complete_word'
            ) {
              const invalid = ls.itemIds.filter((id) => !wordIds.has(id));
              if (invalid.length > 0) {
                console.error(
                  `❌ Pelajaran ${ls.id} memiliki aktivitas ${act.type} tetapi merujuk item non-kata: ${invalid.join(', ')}`,
                );
                hasErrors = true;
              }
            }
            if (act.type === 'listen_tap') {
              const invalid = ls.itemIds.filter(
                (id) => !letterIds.has(id) && !syllableIds.has(id),
              );
              if (invalid.length > 0) {
                console.error(
                  `❌ Pelajaran ${ls.id} memiliki aktivitas listen_tap tetapi merujuk item yang tidak didukung: ${invalid.join(', ')}`,
                );
                hasErrors = true;
              }
            }
            if (act.type === 'story_reader') {
              const invalid = ls.itemIds.filter((id) => !storyIds.has(id));
              if (invalid.length > 0) {
                console.error(
                  `❌ Pelajaran ${ls.id} memiliki aktivitas story_reader tetapi merujuk item non-cerita: ${invalid.join(', ')}`,
                );
                hasErrors = true;
              }
            }
          });
        });

        console.log(`✅ ${lf} valid (${lessons.length} pelajaran terverifikasi)`);
      } catch (err) {
        console.error(`❌ Gagal validasi ${lf}:`, err);
        hasErrors = true;
      }
    } else {
      console.error(`❌ File ${lf} tidak ditemukan!`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n🚨 Validasi konten GAGAL! Periksa kesalahan di atas.');
    process.exit(1);
  } else {
    console.log('\n✨ Semua file konten valid dan lulus verifikasi!');
    process.exit(0);
  }
}

validateContent();
