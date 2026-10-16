"""Generate local guide assets. Requires optional build-time `pip install edge-tts`.

Only public curriculum text is sent to the provider; never child recordings or names.
Run from any directory with: python scripts/generate-guide-voice.py
"""
import asyncio
import hashlib
import json
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/audio/ibu'
MANIFEST = ROOT / 'src/content/guide-audio.json'
VOICE = 'id-ID-GadisNeural'


def key(text):
    return re.sub(r'\s+', ' ', re.sub(r'[.!?,;:…]', ' ', text.lower())).strip()


def load(relative):
    return json.loads((ROOT / 'src/content' / relative).read_text(encoding='utf-8'))


def collect():
    texts = {}

    def add(text):
        if key(text):
            texts.setdefault(key(text), text)

    letters = load('letters.json')
    words = load('words/zone1-words.json') + load('words/zone3-words.json')
    items = letters + load('syllables.json') + words
    word_by_id = {word['id']: word for word in words}
    for item in items:
        pronunciation = item.get('ttsText', item.get('soundTts', item['text']))
        add(pronunciation)
        add(f'Ayo baca {pronunciation}')
        for syllable in item.get('syllables', []):
            add(syllable)
    for letter in letters:
        add(f"Dengarkan ya... Mana huruf {letter['soundTts']}?")
        add(f"Huruf {letter['soundTts']}")
        add(f"Ini huruf besar {letter['upper']}. Mana huruf kecilnya?")
        add(f"Ini huruf {letter['upper']}!")
        word = word_by_id[letter['exampleWordId']]['text']
        add(f'Ini gambar {word}. Huruf awal kata {word} adalah...?')
        add(f'Kata {word}. Huruf awalnya apa ya?')
    for word in words:
        add(f"Lengkapi kata {word['text']}! Suku kata apa yang hilang?")
        add(f"Ini gambar {word['text']}. Mana tulisannya?")
        add(f"Ini kata {word['text']}!")
        add(f"Susun suku kata untuk kata: {word['text']}!")
        add(f"Kata {word['text']}: {'... '.join(word['syllables'])}")
    for texts_in_bank in load('feedback.json').values():
        for text in texts_in_bank:
            add(text)
    for zone in load('zones.json'):
        add(f"Selamat datang di {zone['title']}!")
    for text in [
        'Halo, sayang. Yuk, kita belajar membaca bersama. Pelan-pelan saja, ya.',
        'Halo, Teman! Ayo kita lanjutkan petualangan membaca.',
        'Halo! Ayo belajar membaca bersama Bu Delia!',
        'Aku belum mendengar dengan jelas. Coba lagi, ya.',
        'Sudah cocok. Hebat sekali!',
        'Yuk, ulang bagian ini pelan-pelan.',
        'Yuk, kita belajar membaca bersama Bu Delia.',
        'Pilih kartu pelajaran untuk mulai petualangan membaca!',
        'Pilih kata yang cocok dengan gambar ini ya!',
        'Ayo baca bersama!', 'Dengarkan dulu, ya.', 'Sekarang giliranmu, ya.',
        'Yuk kita baca bareng!', 'Ayo coba lagi!', 'Coba lagi ya!',
        'Dengarkan', 'Pelajaran tidak ditemukan!', 'Hore! Kamu hebat sekali!',
        'Kamu mendapat satu bintang!', 'Kamu mendapat dua bintang!', 'Kamu mendapat tiga bintang!',
    ]:
        add(text)
    return texts


async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    entries = {}
    semaphore = asyncio.Semaphore(4)
    texts = collect()
    completed = 0
    failures = []

    async def generate(normalized, text):
        nonlocal completed
        filename = hashlib.sha256(normalized.encode()).hexdigest()[:20] + '.mp3'
        target = OUTPUT / filename
        async with semaphore:
            if not target.exists() or target.stat().st_size < 1000:
                for attempt in range(3):
                    try:
                        await asyncio.wait_for(edge_tts.Communicate(
                            text, VOICE, rate='-12%', pitch='+0Hz', volume='-5%',
                        ).save(str(target)), timeout=35)
                        break
                    except Exception as error:
                        if attempt == 2:
                            failures.append(f'{text}: {error}')
                            return
                        await asyncio.sleep(attempt + 1)
            entries[normalized] = {'text': text, 'src': f'audio/ibu/{filename}'}
            completed += 1
            if completed % 25 == 0:
                print(f'Generated {completed}/{len(texts)} clips', flush=True)

    await asyncio.gather(*(generate(normalized, text) for normalized, text in texts.items()))
    MANIFEST.write_text(json.dumps({
        'voice': VOICE, 'rate': '-12%', 'pitch': '+0Hz', 'volume': '-5%',
        'entries': dict(sorted(entries.items())),
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Saved {len(entries)} clips; {len(failures)} unavailable', flush=True)
    if failures:
        raise RuntimeError('\n'.join(failures))


if __name__ == '__main__':
    asyncio.run(main())
