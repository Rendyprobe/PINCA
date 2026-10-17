"""Generate the complete Bu Delia F3 pack offline, resumably and sequentially.

Use the Supertonic audition venv. --activate replaces the active manifest only
after every requested clip has passed file/waveform verification.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import time

import numpy as np
import psutil
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/content/guide-audio.json"
OUTPUT = ROOT / "public/audio/delia-f3"
CONFIG = {"voice": "Supertonic3-F3", "language": "id", "speed": 0.95, "steps": 8, "seed": 42}


def atomic_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def validate_audio(path):
    data, rate = sf.read(path, dtype="float32")
    if rate != 44100 or data.ndim != 1 or len(data) < rate * 0.1:
        raise RuntimeError(f"Unexpected audio format: {path}")
    if not np.isfinite(data).all() or np.max(np.abs(data)) <= 0.0001:
        raise RuntimeError(f"Invalid or silent waveform: {path}")
    return len(data) / rate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(os.environ["LOCALAPPDATA"]) / "PINCA/supertonic3")
    parser.add_argument("--activate", action="store_true")
    args = parser.parse_args()
    source = json.loads(MANIFEST.read_text(encoding="utf-8"))
    spec = importlib.util.spec_from_file_location("audition_supertonic", ROOT / "scripts/audition-supertonic.py")
    audition = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(audition)
    audition.verify_local_assets(args.root)
    started = time.perf_counter()
    model, helper = audition.load_model(args.root)
    style = helper.load_voice_style([str(args.root / "assets/voice_styles/F3.json")])
    OUTPUT.mkdir(parents=True, exist_ok=True)
    process = psutil.Process()
    stats_path = OUTPUT / "generation.json"
    stats = json.loads(stats_path.read_text(encoding="utf-8")) if stats_path.exists() else {}
    entries = {}
    total = len(source["entries"])
    fingerprint = json.dumps({**CONFIG, "revision": audition.REVISION}, sort_keys=True)
    for index, (key, entry) in enumerate(source["entries"].items(), 1):
        text = entry["text"]
        filename = hashlib.sha256((fingerprint + "\n" + text).encode()).hexdigest()[:20] + ".mp3"
        destination = OUTPUT / filename
        cached = False
        if destination.exists():
            try:
                validate_audio(destination)
                cached = True
            except (RuntimeError, sf.LibsndfileError):
                pass
        if not cached:
            np.random.seed(CONFIG["seed"])
            clip_start = time.perf_counter()
            wave, duration = model(text, "id", style, CONFIG["steps"], CONFIG["speed"])
            wave = wave[0, :int(model.sample_rate * float(duration[0]))]
            if not np.isfinite(wave).all() or not np.any(wave):
                raise RuntimeError(f"Invalid generated waveform: {text}")
            peak = float(np.max(np.abs(wave)))
            wave *= min(1.0, 0.98 / peak)
            temporary = destination.with_suffix(".mp3.part")
            sf.write(temporary, wave, model.sample_rate, format="MP3", subtype="MPEG_LAYER_III", bitrate_mode="CONSTANT", compression_level=0.65)
            seconds = validate_audio(temporary)
            temporary.replace(destination)
            stats[key] = {"text": text, "file": filename, "duration_seconds": round(seconds, 3), "generation_seconds": round(time.perf_counter() - clip_start, 3)}
        entries[key] = {"text": text, "src": f"audio/delia-f3/{filename}"}
        if index % 10 == 0 or index == total:
            atomic_json(stats_path, stats)
            print(f"Ready {index}/{total}; elapsed {time.perf_counter() - started:.0f}s; RAM {process.memory_info().rss / 1024**2:.0f} MiB; latest: {text}", flush=True)

    # Verify the whole pack before changing the active application's manifest.
    total_seconds = sum(validate_audio(ROOT / "public" / e["src"]) for e in entries.values())
    manifest = {**CONFIG, "model": audition.REPO, "revision": audition.REVISION, "sample_rate": model.sample_rate, "entries": entries}
    atomic_json(OUTPUT / "manifest.json", manifest)
    helper_hash = audition.sha256_file(args.root / "source/py/helper.py")
    summary = {**CONFIG, "model": audition.REPO, "revision": audition.REVISION, "source_helper_sha256": helper_hash, "completed_at": datetime.now(timezone.utc).isoformat(), "clips": len(entries), "total_audio_seconds": round(total_seconds, 3), "elapsed_seconds_this_run": round(time.perf_counter() - started, 3), "threads": 2, "license": "OpenRAIL-M", "listening_review": "User selected F3 audition; individual curriculum clips still require listening review."}
    atomic_json(OUTPUT / "pack-info.json", summary)
    if args.activate:
        atomic_json(MANIFEST, manifest)
        print(f"Activated {len(entries)} F3 clips.", flush=True)
    else:
        print("Pack verified; active manifest unchanged. Use --activate to select it.", flush=True)
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
