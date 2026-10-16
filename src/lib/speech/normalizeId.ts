/**
 * Normalisasi dan kunci fonetik bahasa Indonesia untuk speech matching ramah anak.
 * Mengacu pada GEMINI.md Bagian 5.3 & 5.6.
 */

// Peta angka dasar jika pengenal suara menghasilkan digit numerik
const NUMBER_WORDS: Record<string, string> = {
  '0': 'nol',
  '1': 'satu',
  '2': 'dua',
  '3': 'tiga',
  '4': 'empat',
  '5': 'lima',
  '6': 'enam',
  '7': 'tujuh',
  '8': 'delapan',
  '9': 'sembilan',
  '10': 'sepuluh',
};

// Filler words yang biasa diucapkan anak saat ragu-ragu
const FILLER_WORDS = new Set([
  'eh',
  'em',
  'hmm',
  'uh',
  'um',
  'ah',
  'anu',
  'ehm',
]);

/**
 * Normalisasi teks input dari speech recognition:
 * - Huruf kecil
 * - Hapus tanda baca
 * - Hilangkan filler words
 * - Konversi angka satuan ke kata
 * - Rapatkan spasi ganda
 */
export function normalizeIdText(raw: string): string {
  if (!raw) return '';

  let text = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Hapus karakter tanda baca & simbol selain huruf/angka/spasi
  text = text.replace(/[^a-z0-9\s]/g, ' ');

  // Tokenisasi kata
  const tokens = text.split(/\s+/).filter(Boolean);

  const cleanedTokens = tokens
    .map((token) => NUMBER_WORDS[token] ?? token)
    .filter((token) => !FILLER_WORDS.has(token));

  return cleanedTokens.join(' ').trim();
}

/**
 * Menghilangkan spasi antar huruf tunggal yang sering dihasilkan pengenalan suara
 * Contoh: "i b u" -> "ibu", "b o l a" -> "bola"
 */
export function collapseSpacedLetters(text: string): string {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => t.length === 1)) {
    return tokens.join('');
  }
  return text;
}

/**
 * Menghasilkan representasi fonetik sederhana untuk perbandingan lafal Indonesia:
 * - Menyamakan variasi konsonan serapan dan diftong yang sering tertukar
 */
export function phoneticKey(text: string): string {
  let norm = normalizeIdText(text);

  // Jika berupa huruf tunggal spasi-spasi, rapatkan
  norm = collapseSpacedLetters(norm);

  return norm
    .replace(/\s+/g, '')
    .replace(/q/g, 'k')
    .replace(/kh/g, 'k')
    .replace(/ch/g, 'c')
    .replace(/sy/g, 's')
    .replace(/sh/g, 's')
    .replace(/ny/g, 'n')
    .replace(/ng/g, 'g')
    .replace(/v/g, 'f')
    .replace(/z/g, 'j')
    .replace(/y/g, 'i')
    .replace(/w/g, 'u')
    .replace(/é|è|ê/g, 'e');
}
