#!/usr/bin/env python3
"""Original cinematic underscore. Composed for this video — not sampled from other works."""
import math
import struct
import wave
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent / "music.wav"
SR = 44100
DURATION = 96.0


def env_adsr(n, a=0.08, d=0.18, s=0.7, r=0.25):
    t = np.linspace(0, 1, n, endpoint=False)
    attack = np.clip(t / max(a, 1e-6), 0, 1)
    decay = 1 - (1 - s) * np.clip((t - a) / max(d, 1e-6), 0, 1)
    release = np.clip((1 - t) / max(r, 1e-6), 0, 1)
    return np.minimum(np.minimum(attack, decay), np.maximum(release, s * (t < 1 - r)))


def sine(freq, t):
    return np.sin(2 * np.pi * freq * t)


def chord_pad(freqs, t, amp=0.11):
    sig = np.zeros_like(t)
    for f in freqs:
        sig += sine(f, t)
        sig += 0.35 * sine(f * 2.002, t)
        sig += 0.12 * sine(f * 0.5, t)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)
    return amp * lfo * sig / max(len(freqs), 1)


def bell(freq, t, amp=0.08):
    e = np.exp(-2.8 * t)
    return amp * e * (sine(freq, t) + 0.25 * sine(freq * 2.01, t) + 0.1 * sine(freq * 3.02, t))


def main():
    n = int(SR * DURATION)
    t = np.arange(n) / SR
    mix = np.zeros(n, dtype=np.float64)

    # Cinematic progression in C minor, original voicing.
    progression = [
        ([65.41, 77.78, 98.00, 130.81, 155.56], 8.0),   # Cm
        ([51.91, 77.78, 103.83, 155.56, 207.65], 8.0),  # Ab
        ([87.31, 103.83, 130.81, 174.61], 8.0),         # Fm
        ([98.00, 123.47, 146.83, 196.00], 8.0),         # G
    ]
    pos = 0.0
    while pos < DURATION:
        for freqs, hold in progression:
            start = int(pos * SR)
            end = min(n, int((pos + hold) * SR))
            if start >= n:
                break
            sl = slice(start, end)
            local = t[sl] - t[sl][0]
            pad = chord_pad(freqs, local)
            pad *= env_adsr(end - start, a=0.12, d=0.2, s=0.85, r=0.18)
            mix[sl] += pad
            pos += hold
        if pos < 0.01:
            break

    # Sparse original motif (C minor pentatonic), not a known melody.
    motif = [261.63, 311.13, 392.00, 415.30, 392.00, 311.13, 261.63, 196.00]
    motif_starts = np.arange(3.5, DURATION - 6, 8.0)
    for i, start in enumerate(motif_starts):
        freq = motif[i % len(motif)]
        s0 = int(start * SR)
        length = int(2.4 * SR)
        s1 = min(n, s0 + length)
        local = np.arange(s1 - s0) / SR
        mix[s0:s1] += bell(freq, local, amp=0.045 if i % 2 == 0 else 0.032)

    # Soft air / hall texture (synthetic, not a recording).
    rng = np.random.default_rng(2026)
    noise = rng.normal(0, 1, n)
    kernel = np.hanning(2201)
    kernel /= kernel.sum()
    whoosh = np.convolve(noise, kernel, mode="same") * 0.018
    mix += whoosh * (0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.04 * t)))

    # Fade and gentle limiter.
    fade_in = np.clip(t / 2.2, 0, 1)
    fade_out = np.clip((DURATION - t) / 4.5, 0, 1)
    mix *= fade_in * fade_out
    peak = np.max(np.abs(mix)) or 1.0
    mix = np.tanh(mix / peak * 1.35) * 0.72

    stereo = np.column_stack((mix * 0.98, mix * 1.02))
    pcm = np.clip(stereo * 32767, -32767, 32767).astype(np.int16)
    with wave.open(str(OUT), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", OUT, f"{DURATION:.0f}s")


if __name__ == "__main__":
    main()
