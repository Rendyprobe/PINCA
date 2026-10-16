"""Prepare or generate comparable voice auditions; no frontend API key needed.

Dry-run (no network): python scripts/preview-delia-voice.py
Generate: ELEVENLABS_API_KEY + --generate --voice-id ID [--voice-id ID ...]
"""
import argparse
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/audio/delia-auditions'
TEXT = (
    'Halo, aku Bu Delia. Yuk, kita belajar membaca bersama. '
    'Pelan-pelan saja, ya. Dengarkan dulu. Ba. Bi. Bu. Bola. Ibu. '
    'Sekarang giliranmu. Ayo baca: ibu. '
    'Sudah cocok. Hebat sekali! Yuk, kita coba satu lagi.'
)
PERSONA = (
    'Native Indonesian woman, warm and patient motherly reading teacher. '
    'Conversational delivery, gentle encouragement, natural pauses and clear vowels. '
    'Keep letter and syllable demonstrations precise, without exaggerated acting.'
)
VARIANTS = [
    ('tenang', {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.15, 'speed': 0.92}),
    ('hangat', {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.3, 'speed': 0.96}),
    ('ceria-lembut', {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.45, 'speed': 0.98}),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate', action='store_true', help='Make provider requests that may consume credits')
    parser.add_argument('--voice-id', action='append', default=[], help='An Indonesian female voice from your account; at most three')
    args = parser.parse_args()
    if len(args.voice_id) > 3:
        parser.error('Use at most three voice IDs for the audition.')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    voices = args.voice_id or [None]
    plan = {'persona': PERSONA, 'note': 'Persona is selection guidance, not an API field. Audition quality must be reviewed by listening.', 'samples': []}
    for index, (label, settings) in enumerate(VARIANTS):
        plan['samples'].append({
            'label': label, 'voice_id': voices[min(index, len(voices) - 1)],
            'file': f'{label}.mp3',
            'request': {'text': TEXT, 'model_id': 'eleven_v3', 'language_code': 'id', 'voice_settings': settings},
        })
    (OUTPUT / 'audition-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if not args.generate:
        print('Saved audition plan. No provider request or charge was made.')
        return
    api_key = os.environ.get('ELEVENLABS_API_KEY')
    if not api_key or not args.voice_id:
        parser.error('Set ELEVENLABS_API_KEY in the terminal and provide --voice-id. Never put the key in VITE_* variables.')
    for sample in plan['samples']:
        target = OUTPUT / sample['file']
        if target.exists():
            raise SystemExit(f'{target.name} already exists; move reviewed auditions to a backup folder first.')
        request = Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{quote(sample['voice_id'], safe='')}?output_format=mp3_44100_128",
            data=json.dumps(sample['request']).encode(),
            headers={'xi-api-key': api_key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'},
        )
        try:
            with urlopen(request, timeout=60) as response:
                if 'audio/' not in response.headers.get('Content-Type', ''):
                    raise SystemExit('Provider did not return audio; no file was saved.')
                audio = response.read()
            if len(audio) < 1000:
                raise SystemExit('Provider returned an empty audio sample.')
            target.write_bytes(audio)
            print(f'Saved {target.name}')
        except HTTPError as error:
            raise SystemExit(f'Provider returned HTTP {error.code}. Check account access and available credits.') from None
        except URLError:
            raise SystemExit('Cannot reach the voice provider. Existing guide assets were preserved.') from None


if __name__ == '__main__':
    main()
