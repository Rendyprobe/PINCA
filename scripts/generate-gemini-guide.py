"""Generate Bu Delia voice assets using Google Gemini 2.5 Flash TTS with Kore voice.

Usage:
  python scripts/generate-gemini-guide.py [--max N] [--activate] [--key API_KEY]
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "src/content/guide-audio.json"
OUTPUT_DIR = ROOT / "public/audio/delia-kore"
DEFAULT_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.5-flash-preview-tts"
VOICE_NAME = "Kore"


def hash_text(text: str) -> str:
    return hashlib.sha256(f"gemini-{VOICE_NAME}:{text.strip().lower()}".encode("utf-8")).hexdigest()[:20]


def generate_speech(text: str, api_key: str, max_retries: int = 5) -> bytes:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={api_key}"
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

    delay = 4
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                b64 = res["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                return base64.b64decode(b64)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = delay * (attempt + 1)
                print(f" [Rate limit 429] Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                body = e.read().decode("utf-8", errors="ignore")
                print(f" [HTTPError {e.code}] {body}")
                raise
        except Exception as e:
            print(f" [Error] {e}. Retrying in {delay}s...")
            time.sleep(delay)

    raise RuntimeError(f"Failed to generate speech for text '{text}' after {max_retries} retries.")


def save_wav(pcm_data: bytes, dest_path: Path):
    with wave.open(str(dest_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(24000)
        wf.writeframes(pcm_data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key", default=os.environ.get("GEMINI_API_KEY", DEFAULT_KEY), help="Gemini API Key")
    parser.add_argument("--max", type=int, default=0, help="Max entries to generate (0 for all)")
    parser.add_argument("--activate", action="store_true", help="Update guide-audio.json immediately")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    entries = manifest.get("entries", {})
    total = len(entries)
    print(f"Found {total} entries in manifest. Output: {OUTPUT_DIR}")

    # Prioritize key UI phrases first
    def priority_score(item):
        k, v = item
        txt = v.get("text", "")
        # High priority: greetings, feedback, map prompts, activity prompts
        if any(w in txt.lower() for w in ["halo", "hebat", "pintar", "selamat", "hampir", "coba lagi", "dengarkan", "pilih"]):
            return 0
        if len(txt.split()) > 2:
            return 1
        return 2

    sorted_entries = sorted(entries.items(), key=priority_score)
    if args.max > 0:
        sorted_entries = sorted_entries[:args.max]

    generated_count = 0
    skipped_count = 0

    for idx, (k, item) in enumerate(sorted_entries, 1):
        text = item.get("text", "")
        if not text:
            continue

        h = hash_text(text)
        dest_filename = f"{h}.wav"
        dest_path = OUTPUT_DIR / dest_filename
        rel_src = f"audio/delia-kore/{dest_filename}"

        if dest_path.exists() and dest_path.stat().st_size > 1000:
            skipped_count += 1
            if args.activate:
                entries[k]["src"] = rel_src
            continue

        print(f"[{idx}/{len(sorted_entries)}] Generating '{text}'...")
        pcm = generate_speech(text, args.key)
        save_wav(pcm, dest_path)
        generated_count += 1

        if args.activate:
            entries[k]["src"] = rel_src
            # Save manifest periodically
            if generated_count % 5 == 0:
                with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
                    json.dump(manifest, f, ensure_ascii=False, indent=2)

        # Gentle delay between requests to stay within RPM limits
        time.sleep(3.5)

    if args.activate:
        manifest["voice"] = f"Gemini-{VOICE_NAME}"
        manifest["model"] = MODEL_NAME
        manifest["sample_rate"] = 24000
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        print("Manifest successfully updated with Gemini Kore audio!")

    print(f"\nDone! Generated: {generated_count}, Skipped (already existed): {skipped_count}.")


if __name__ == "__main__":
    main()
