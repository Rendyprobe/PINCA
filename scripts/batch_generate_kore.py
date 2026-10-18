"""Batch audio generation using Gemini 2.5 Flash TTS (Kore voice) with audio splitting.
Efficiently generates multiple phrases per single API request to maximize Free Tier quota.
"""
import array
import base64
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "src/content/guide-audio.json"
OUTPUT_DIR = ROOT / "public/audio/delia-kore"
MODEL_NAME = "gemini-2.5-flash-preview-tts"
VOICE_NAME = "Kore"


def guide_key(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[.!?,;:…]", " ", text.lower())).strip()


def hash_text(text: str) -> str:
    return hashlib.sha256(f"gemini-{VOICE_NAME}:{text.strip().lower()}".encode("utf-8")).hexdigest()[:20]


def call_gemini_tts(text: str, api_key: str, max_retries: int = 3):
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

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=75) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                candidates = res.get("candidates", [])
                if not candidates:
                    return None
                parts = candidates[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "inlineData" in p:
                        return base64.b64decode(p["inlineData"]["data"])
                return None
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="ignore")
            print(f" [HTTP {e.code}] {body[:200]}")
            if e.code == 429:
                wait_time = 20 * (attempt + 1)
                print(f" Rate limited. Sleeping {wait_time}s...")
                time.sleep(wait_time)
            else:
                time.sleep(5)
        except Exception as e:
            print(f" [Error] {e}")
            time.sleep(5)
    return None


def split_audio_by_silence(raw_pcm: bytes, expected_count: int, sample_rate: int = 24000):
    samples = array.array("h", raw_pcm)
    window_size = int(sample_rate * 0.05)  # 50ms window
    energies = []
    for i in range(0, len(samples) - window_size, window_size):
        chunk = samples[i:i + window_size]
        rms = (sum(s * s for s in chunk) / len(chunk)) ** 0.5
        energies.append((i / sample_rate, rms))

    # Grid search across energy threshold and merge gap
    rms_thresholds = [300, 250, 350, 400, 200, 500]
    gap_thresholds = [0.25, 0.22, 0.20, 0.28, 0.18, 0.30, 0.32, 0.15]

    for thresh in rms_thresholds:
        in_speech = False
        speech_start = 0
        raw_segments = []
        for sec, rms in energies:
            if rms > thresh:
                if not in_speech:
                    in_speech = True
                    speech_start = sec
            else:
                if in_speech:
                    in_speech = False
                    raw_segments.append((speech_start, sec))
        if in_speech:
            raw_segments.append((speech_start, len(samples) / sample_rate))

        for gap in gap_thresholds:
            merged = []
            for start, end in raw_segments:
                if not merged:
                    merged.append([start, end])
                else:
                    if start - merged[-1][1] < gap:
                        merged[-1][1] = end
                    else:
                        merged.append([start, end])

            if len(merged) == expected_count:
                return merged, samples

    # Fallback to closest match if exact is not found
    return [], samples


def save_wav(samples_slice: array.array, dest_path: Path, sample_rate: int = 24000):
    with wave.open(str(dest_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(samples_slice.tobytes())


def slice_and_save(samples: array.array, segments: list, items: list[str], sample_rate: int = 24000):
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    entries = manifest.setdefault("entries", {})

    for idx, (s, e) in enumerate(segments):
        text = items[idx]
        h = hash_text(text)
        dest = OUTPUT_DIR / f"{h}.wav"
        k = guide_key(text)

        p_start = max(0, int((s - 0.08) * sample_rate))
        p_end = min(len(samples), int((e + 0.15) * sample_rate))
        slice_samples = samples[p_start:p_end]

        save_wav(slice_samples, dest, sample_rate)
        entries[k] = {"text": text, "src": f"audio/delia-kore/{h}.wav"}
        print(f"  [{idx+1}/{len(items)}] '{text}' -> {dest.name} ({len(slice_samples)/sample_rate:.2f}s)")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


def process_batch(items: list[str], api_key: str):
    """Generate audio for a batch of phrases and slice them into individual files."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    entries = manifest.setdefault("entries", {})

    needed = []
    for text in items:
        h = hash_text(text)
        dest = OUTPUT_DIR / f"{h}.wav"
        if not (dest.exists() and dest.stat().st_size > 1000):
            needed.append(text)
        else:
            k = guide_key(text)
            entries[k] = {"text": text, "src": f"audio/delia-kore/{h}.wav"}

    if not needed:
        print("All items in this batch already exist!")
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        return True

    print(f"\nProcessing batch of {len(needed)} phrases...")
    joined_text = " ... ... ".join(needed)
    pcm = call_gemini_tts(joined_text, api_key)
    if not pcm:
        print("Failed to get audio from Gemini.")
        return False

    segments, samples = split_audio_by_silence(pcm, len(needed))
    if len(segments) != len(needed):
        print(f"Warning: Could not match exact count ({len(segments)} != {len(needed)}).")
        debug_wav = OUTPUT_DIR / f"debug_batch_{int(time.time())}.wav"
        save_wav(samples, debug_wav)
        print(f"Saved debug audio to {debug_wav}")
        return False

    slice_and_save(samples, segments, needed)
    print("Batch saved and manifest updated successfully!")
    return True
