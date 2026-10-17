"""Download and audition pinned Supertonic 3 assets; never changes active audio.

Run in a separate Python 3.11 environment with numpy, onnxruntime, soundfile,
and psutil installed. Model/source files stay outside the repository.
"""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import threading
import time
import urllib.request

REVISION = "aafc6e32416a594460b32413efc49d7fe4ce6d46"
REPO = "supertone-oss-archive/supertonic-3"
ASSETS = {
    "onnx/duration_predictor.onnx": 3700147,
    "onnx/text_encoder.onnx": 36416150,
    "onnx/vector_estimator.onnx": 256534781,
    "onnx/vocoder.onnx": 101424195,
    "onnx/tts.json": 8253,
    "onnx/unicode_indexer.json": 277676,
    "voice_styles/F1.json": 292046,
    "voice_styles/F2.json": 292423,
    "voice_styles/F3.json": 290794,
    "LICENSE": 15007,
}
TEXT = (
    "Halo, aku Bu Delia. Yuk, kita belajar bersama. "
    "Ini kata ibu. I... bu... ibu. "
    "Iya, tepat! Kamu sudah membacanya dengan baik."
)


def sha256_file(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def download(root):
    """Fetch sequentially, with verified SHA-256 for LFS model files."""
    endpoint = f"https://huggingface.co/api/models/{REPO}/tree/{REVISION}?recursive=true"
    with urllib.request.urlopen(endpoint, timeout=60) as response:
        listing = {entry["path"]: entry for entry in json.load(response)}
    verified_hashes = {}
    for name, expected_size in ASSETS.items():
        destination = root / "assets" / name
        expected_hash = listing[name].get("lfs", {}).get("oid")
        if destination.exists() and destination.stat().st_size == expected_size:
            if not expected_hash or sha256_file(destination) == expected_hash:
                verified_hashes[name] = sha256_file(destination)
                print(f"Already downloaded: {name}", flush=True)
                continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(destination.suffix + ".part")
        print(f"Downloading {name} ({expected_size / 1024**2:.1f} MiB)", flush=True)
        digest = hashlib.sha256()
        request = urllib.request.Request(
            f"https://huggingface.co/{REPO}/resolve/{REVISION}/{name}",
            headers={"User-Agent": "PINCA-local-voice-audition"},
        )
        with urllib.request.urlopen(request, timeout=120) as response, temporary.open("wb") as target:
            while chunk := response.read(1024 * 1024):
                digest.update(chunk)
                target.write(chunk)
        if temporary.stat().st_size != expected_size:
            raise RuntimeError(f"Incomplete download: {name}")
        if expected_hash and digest.hexdigest() != expected_hash:
            raise RuntimeError(f"SHA-256 mismatch: {name}")
        temporary.replace(destination)
        verified_hashes[name] = digest.hexdigest()
    (root / "assets/verified-sha256.json").write_text(json.dumps(verified_hashes, indent=2), encoding="utf-8")


def verify_local_assets(root):
    hashes = json.loads((root / "assets/verified-sha256.json").read_text(encoding="utf-8"))
    for name, expected_size in ASSETS.items():
        asset = root / "assets" / name
        if asset.stat().st_size != expected_size or sha256_file(asset) != hashes[name]:
            raise RuntimeError(f"Local asset failed verification: {name}")


def load_model(root):
    import onnxruntime as ort

    spec = importlib.util.spec_from_file_location("supertonic_helper", root / "source/py/helper.py")
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    options.enable_cpu_mem_arena = False
    options.enable_mem_pattern = False
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
    onnx_dir = str(root / "assets/onnx")
    sessions = helper.load_onnx_all(onnx_dir, options, ["CPUExecutionProvider"])
    model = helper.TextToSpeech(helper.load_cfgs(onnx_dir), helper.load_text_processor(onnx_dir), *sessions)
    return model, helper


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(os.environ["LOCALAPPDATA"]) / "PINCA/supertonic3")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "public/audio/delia-local-auditions")
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--offline", action="store_true", help="Use only previously verified local assets; no network requests")
    args = parser.parse_args()
    if args.offline:
        verify_local_assets(args.root)
    else:
        download(args.root)
    if args.download_only:
        return

    import numpy as np
    import psutil
    import soundfile as sf

    helper_path = args.root / "source/py/helper.py"
    process = psutil.Process()
    initial_rss = process.memory_info().rss
    initial_available = psutil.virtual_memory().available
    measurements = {"peak_rss": initial_rss, "minimum_available": initial_available}
    finished = threading.Event()

    def monitor():
        while not finished.wait(0.1):
            measurements["peak_rss"] = max(measurements["peak_rss"], process.memory_info().rss)
            measurements["minimum_available"] = min(measurements["minimum_available"], psutil.virtual_memory().available)

    watcher = threading.Thread(target=monitor, daemon=True)
    watcher.start()
    try:
        started = time.perf_counter()
        model, helper = load_model(args.root)
        load_seconds = time.perf_counter() - started
        args.output.mkdir(parents=True, exist_ok=True)
        samples = []
        for voice in ("F1", "F2", "F3"):
            np.random.seed(42)
            style = helper.load_voice_style([str(args.root / f"assets/voice_styles/{voice}.json")])
            started = time.perf_counter()
            print(f"Generating {voice} on CPU (2 threads)...", flush=True)
            waveform, duration = model(TEXT, "id", style, 8, 0.95)
            seconds = float(duration[0])
            waveform = waveform[0, :int(model.sample_rate * seconds)]
            if not np.isfinite(waveform).all() or not np.any(waveform):
                raise RuntimeError(f"Invalid waveform for {voice}")
            raw_peak = float(np.max(np.abs(waveform)))
            gain = min(1.0, 0.98 / raw_peak)
            waveform = waveform * gain
            filename = f"bu-delia-{voice.lower()}.wav"
            sf.write(args.output / filename, waveform, model.sample_rate, subtype="PCM_16")
            elapsed = time.perf_counter() - started
            item = {"voice": voice, "file": filename, "text": TEXT, "audio_seconds": round(seconds, 3), "generation_seconds": round(elapsed, 3), "generation_seconds_per_audio_second": round(elapsed / seconds, 3), "raw_peak_amplitude": round(raw_peak, 4), "applied_gain": round(gain, 4), "peak_amplitude": round(float(np.max(np.abs(waveform))), 4)}
            samples.append(item)
            print(json.dumps(item, ensure_ascii=False), flush=True)
        report = {
            "model": REPO, "revision": REVISION,
            "source_helper_sha256": sha256_file(helper_path),
            "provider": "CPUExecutionProvider", "threads": 2,
            "steps": 8, "speed": 0.95, "seed": 42,
            "cpu_affinity": process.cpu_affinity(), "logical_cpu_count": psutil.cpu_count(),
            "system_ram_mib": round(psutil.virtual_memory().total / 1024**2),
            "initial_available_ram_mib": round(initial_available / 1024**2),
            "load_seconds": round(load_seconds, 3),
            "python_peak_resident_ram_mib": round(measurements["peak_rss"] / 1024**2),
            "minimum_available_system_ram_mib": round(measurements["minimum_available"] / 1024**2),
            "samples": samples,
            "listening_review": "Not yet reviewed by a human; waveform checks do not establish pronunciation or naturalness.",
        }
        (args.output / "benchmark.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
    finally:
        finished.set()
        watcher.join()


if __name__ == "__main__":
    main()
