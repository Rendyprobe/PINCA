import { useEffect, useState } from 'react';

/** Live RMS amplitude only; no audio is recorded, stored, or uploaded. */
export function useMicLevel(active: boolean) {
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    setLevel(null);
    setError(null);
    if (
      !active ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.AudioContext
    ) {
      if (active)
        setError('Pemeriksaan mikrofon belum tersedia di browser ini.');
      return;
    }
    let disposed = false;
    let stream: MediaStream | undefined;
    let context: AudioContext | undefined;
    let frame = 0;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        context = new AudioContext();
        await context.resume();
        if (disposed) return;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        const update = () => {
          if (disposed) return;
          analyser.getByteTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce(
              (sum, value) => sum + ((value - 128) / 128) ** 2,
              0,
            ) / samples.length,
          );
          setLevel(Math.min(1, rms * 5));
          frame = requestAnimationFrame(update);
        };
        update();
      } catch {
        if (!disposed)
          setError(
            'Mikrofon belum dapat diakses. Periksa izin dan perangkat input browser.',
          );
        // Recognition remains usable when the optional meter is unavailable.
        stream?.getTracks().forEach((track) => track.stop());
        if (context?.state !== 'closed') void context?.close();
      }
    })();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      if (context?.state !== 'closed') void context?.close();
    };
  }, [active]);
  return { level: active ? level : null, error: active ? error : null };
}
