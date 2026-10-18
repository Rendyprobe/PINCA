"""Generate core UI phrases, feedback, and key words using Gemini Kore.
"""
import base64
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "src/content/guide-audio.json"
OUTPUT_DIR = ROOT / "public/audio/delia-kore"
API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.5-flash-preview-tts"
VOICE_NAME = "Kore"

CORE_TEXTS = [
    # Sapaan & Navigasi Peta
    "Halo, Teman! Ayo kita lanjutkan petualangan membaca.",
    "Pilih kartu pelajaran untuk mulai petualangan membaca!",
    "Pelajaran ini masih terkunci. Selesaikan pelajaran sebelumnya dulu ya!",
    "Selamat datang di Kenal Huruf!",
    "Selamat datang di Suku Kata!",
    "Selamat datang di Kata Pertama!",
    "Selamat datang di Kata Lebih Panjang!",
    "Selamat datang di Kalimat Pendek!",
    "Selamat datang di Cerita Mini!",
    "Ayo kita mulai petualangan membaca!",
    "Ayo kita coba bersama!",

    # Feedback & Pujian
    "Hebat sekali!",
    "Kamu pintar!",
    "Kamu pintar sekali!",
    "Luar biasa! Kamu pintar sekali!",
    "Hore! Kamu hebat sekali!",
    "Bagus sekali!",
    "Keren sekali!",
    "Mantap!",
    "Wah, luar biasa!",
    "Pintar membaca!",
    "Bintang bersinar untukmu!",
    "Satu jempol untukmu!",
    "Jagoan hebat!",
    "Satu lagi ya!",

    # Penyemangat & Petunjuk
    "Ayo coba lagi ya!",
    "Ayo coba lagi!",
    "Coba lagi ya!",
    "Hampir! Ayo coba lagi!",
    "Dengarkan dulu ya",
    "Yuk, dengarkan Bu Delia dulu",
    "Pelan-pelan saja ya",
    "Sedikit lagi, pasti bisa!",
    "Dengarkan bunyinya baik-baik ya",
    "Perhatikan bentuk hurufnya ya",
    "Ikuti suaranya pelan-pelan ya",
    "Aku belum mendengar dengan jelas. Coba lagi, ya.",

    # Instruksi Aktivitas
    "Pilih kata yang cocok dengan gambar ini ya!",
    "Gambar apakah ini?",
    "Ini kata ibu!",
    "Ini kata bapa!",
    "Ini kata bola!",
    "Ini kata buku!",
    "Ini kata sapi!",
    "Ini kata kuda!",
    "Ayo baca ibu",
    "Ayo baca bapa",
    "Ayo baca bola",
    "Ayo baca buku",
    "Ayo baca sapi",
    "Ayo baca kuda",

    # Kata Kunci Keluarga & Kata Pertama
    "ibu",
    "bapa",
    "mama",
    "papa",
    "bibi",
    "bola",
    "buku",
    "topi",
    "kuda",
    "sapi",
    "kaki",
    "mata",
    "gigi",
    "dadu"
]


def guide_key(text: str) -> str:
    import re
    return re.sub(r"\s+", " ", re.sub(r"[.!?,;:…]", " ", text.lower())).strip()


def hash_text(text: str) -> str:
    return hashlib.sha256(f"gemini-{VOICE_NAME}:{text.strip().lower()}".encode("utf-8")).hexdigest()[:20]


def generate_speech(text: str, max_retries: int = 4):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": VOICE_NAME
                    }
                }
            }
        }
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                candidates = res.get("candidates", [])
                if not candidates:
                    return None
                parts = candidates[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "inlineData" in p:
                        b64 = p["inlineData"]["data"]
                        return base64.b64decode(b64)
                return None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = 15 * (attempt + 1)
                print(f" [Rate limit 429] Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f" [HTTPError {e.code}]")
                time.sleep(5)
        except Exception as e:
            print(f" [Error] {e}")
            time.sleep(5)

    return None


def save_wav(pcm_data: bytes, dest_path: Path):
    with wave.open(str(dest_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(pcm_data)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    entries = manifest.setdefault("entries", {})
    manifest["voice"] = f"Gemini-{VOICE_NAME}"
    manifest["model"] = MODEL_NAME
    manifest["sample_rate"] = 24000

    success_count = 0
    skipped_count = 0

    print(f"Targeting {len(CORE_TEXTS)} core phrases with Gemini Kore...")

    for idx, text in enumerate(CORE_TEXTS, 1):
        k = guide_key(text)
        h = hash_text(text)
        dest_filename = f"{h}.wav"
        dest_path = OUTPUT_DIR / dest_filename
        rel_src = f"audio/delia-kore/{dest_filename}"

        if dest_path.exists() and dest_path.stat().st_size > 1000:
            entries[k] = {"text": text, "src": rel_src}
            skipped_count += 1
            print(f"[{idx}/{len(CORE_TEXTS)}] Already exists: '{text}'")
            continue

        print(f"[{idx}/{len(CORE_TEXTS)}] Generating: '{text}'...")
        pcm = generate_speech(text)
        if pcm:
            save_wav(pcm, dest_path)
            entries[k] = {"text": text, "src": rel_src}
            success_count += 1
            print(f" -> Saved {dest_filename} ({len(pcm)} bytes)")
            # Save manifest on each success
            with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=2)
        else:
            print(f" -> Failed to generate: '{text}'")

        # 5 second delay to stay safely under RPM
        time.sleep(5.0)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\nAll done! New generated: {success_count}, Existing: {skipped_count}.")


if __name__ == "__main__":
    main()

