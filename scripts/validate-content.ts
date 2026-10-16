import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  zonesFileSchema,
  feedbackFileSchema,
  letterItemsFileSchema,
  syllableItemsFileSchema,
  wordItemsFileSchema,
  lessonsFileSchema,
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

  // 3. Validasi words (zone1-words.json & zone3-words.json)
  const wordIds = new Set<string>();
  const wordFiles = ['words/zone1-words.json', 'words/zone3-words.json'];
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

  // 6. Validasi lessons (zone1, zone2, zone3)
  const allItemIds = new Set([...letterIds, ...syllableIds, ...wordIds]);
  const lessonFiles = [
    'lessons/zone1-lessons.json',
    'lessons/zone2-lessons.json',
    'lessons/zone3-lessons.json',
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
