#!/usr/bin/env python3
"""Cinematic Ken Burns showcase with original music. No third-party samples."""
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SHOTS = Path(__file__).resolve().parent / "shots"
MUSIC = Path(__file__).resolve().parent / "music.wav"
VIDEO = ROOT / "assets" / "tutorial" / "Atelier-Nova-Cinematic-Showcase.mp4"
W, H, FPS = 1920, 1080, 30
GOLD = (212, 175, 55)
WHITE = (245, 242, 232)
MUTED = (186, 180, 168)
DARK = (10, 11, 13)

FONT_HEAD = "/System/Library/Fonts/Supplemental/Georgia.ttf"
FONT_BODY = "/System/Library/Fonts/Supplemental/Arial.ttf"


def font(size, head=False):
    path = FONT_HEAD if head else FONT_BODY
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def load(name):
    im = Image.open(SHOTS / name).convert("RGB")
    return ImageEnhance.Contrast(im).enhance(1.08)


def ken_burns(im, t, start, end):
    """Crop a 16:9 window traveling through a (possibly tall) screenshot."""
    p = ease(t)
    scale = lerp(start.get("scale", 1.0), end.get("scale", 1.12), p)
    ax = lerp(start.get("x", 0.5), end.get("x", 0.5), p)
    ay = lerp(start.get("y", 0.08), end.get("y", 0.88), p)
    src_w, src_h = im.size
    crop_w = src_w / scale
    crop_h = crop_w * H / W
    if crop_h > src_h:
        crop_h = src_h
        crop_w = crop_h * W / H
    x = ax * src_w - crop_w / 2
    y = ay * src_h - crop_h / 2
    x = max(0, min(src_w - crop_w, x))
    y = max(0, min(src_h - crop_h, y))
    crop = im.crop((int(x), int(y), int(x + crop_w), int(y + crop_h)))
    return crop.resize((W, H), Image.Resampling.LANCZOS)


def letterbox(frame, title="", kicker=""):
    frame = frame.convert("RGBA")
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0, 0, W, 78), fill=(8, 9, 11, 230))
    draw.rectangle((0, H - 118, W, H), fill=(8, 9, 11, 235))
    draw.rectangle((0, 78, W, 82), fill=GOLD + (255,))
    draw.rectangle((80, H - 118, W - 80, H - 116), fill=GOLD + (180,))
    if kicker:
        draw.text((80, 22), kicker.upper(), font=font(20), fill=GOLD + (255,))
    if title:
        draw.text((80, H - 88), title, font=font(36, head=True), fill=WHITE + (255,))
    draw.text((W - 80, 26), "ATELIER  NOVA", font=font(18), fill=MUTED + (255,), anchor="ra")
    return frame.convert("RGB")


def title_frame(t, duration):
    canvas = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(canvas)
    p = ease(min(1, t / 1.6))
    line_w = int(lerp(0, 520, p))
    cx, cy = W // 2, H // 2 - 40
    draw.rectangle((cx - line_w, cy - 2, cx + line_w, cy + 2), fill=GOLD)
    if t > 0.7:
        fade = ease(min(1, (t - 0.7) / 1.1))
        alpha = int(255 * fade)
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)
        d.text((cx, cy - 120), "ATELIER  NOVA", font=font(92, head=True), fill=WHITE + (alpha,), anchor="mm")
        d.text((cx, cy + 48), "Architecture studio website", font=font(28), fill=GOLD + (alpha,), anchor="mm")
        d.text((cx, cy + 100), "A cinematic tour of the product", font=font(22), fill=MUTED + (alpha,), anchor="mm")
        canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    if t > duration - 0.8:
        fade = 1 - ease((duration - t) / 0.8)
        canvas = Image.blend(canvas, Image.new("RGB", (W, H), DARK), fade)
    return canvas


def end_frame(t, duration):
    canvas = Image.new("RGB", (W, H), DARK)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    fade = ease(min(1, t / 1.2))
    a = int(255 * fade)
    cx, cy = W // 2, H // 2 - 20
    d.rectangle((cx - 240, cy - 90, cx + 240, cy - 86), fill=GOLD + (a,))
    d.text((cx, cy - 40), "ATELIER  NOVA", font=font(72, head=True), fill=WHITE + (a,), anchor="mm")
    d.text((cx, cy + 30), "Built for studios. Ready to present.", font=font(26), fill=GOLD + (a,), anchor="mm")
    d.text((cx, cy + 80), "array-architects.onrender.com", font=font(22), fill=MUTED + (a,), anchor="mm")
    d.text((cx, cy + 130), "Developed by Udoy", font=font(20), fill=MUTED + (a,), anchor="mm")
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    if t > duration - 0.7:
        canvas = Image.blend(canvas, Image.new("RGB", (W, H), DARK), ease((t - (duration - 0.7)) / 0.7))
    return canvas


def phone_frame(im, t):
    """Place a mobile screenshot in a cinematic device-style frame."""
    canvas = Image.new("RGB", (W, H), DARK)
    phone = im.copy()
    target_h = 900
    ratio = target_h / phone.height
    phone = phone.resize((int(phone.width * ratio), target_h), Image.Resampling.LANCZOS)
    # Slow rise
    y = int(lerp(120, 70, ease(t)))
    x = (W - phone.width) // 2
    shadow = Image.new("RGB", (phone.width + 40, phone.height + 40), (0, 0, 0))
    canvas.paste(shadow, (x - 20, y + 16))
    canvas.paste(phone, (x, y))
    return letterbox(canvas, "Responsive on every screen", "MOBILE")


SCENES = [
    {"id": "title", "kind": "title", "duration": 5.2},
    {
        "id": "home",
        "kind": "travel",
        "file": "home-full.png",
        "duration": 11.5,
        "start": {"scale": 1.02, "x": 0.5, "y": 0.08},
        "end": {"scale": 1.12, "x": 0.5, "y": 0.78},
        "title": "Home — hero, services, and featured work",
        "kicker": "01  Journey",
    },
    {
        "id": "about",
        "kind": "travel",
        "file": "about-full.png",
        "duration": 8.0,
        "start": {"scale": 1.0, "x": 0.5, "y": 0.06},
        "end": {"scale": 1.1, "x": 0.48, "y": 0.72},
        "title": "About — philosophy, vision, values",
        "kicker": "02  Studio",
    },
    {
        "id": "services",
        "kind": "travel",
        "file": "services-full.png",
        "duration": 8.5,
        "start": {"scale": 1.0, "x": 0.5, "y": 0.05},
        "end": {"scale": 1.08, "x": 0.5, "y": 0.7},
        "title": "Services — design through construction",
        "kicker": "03  Offerings",
    },
    {
        "id": "projects",
        "kind": "travel",
        "file": "projects-full.png",
        "duration": 9.0,
        "start": {"scale": 1.0, "x": 0.5, "y": 0.08},
        "end": {"scale": 1.14, "x": 0.52, "y": 0.74},
        "title": "Projects — filter, explore, inspect",
        "kicker": "04  Portfolio",
    },
    {
        "id": "contact",
        "kind": "travel",
        "file": "contact-full.png",
        "duration": 8.0,
        "start": {"scale": 1.02, "x": 0.46, "y": 0.08},
        "end": {"scale": 1.1, "x": 0.54, "y": 0.62},
        "title": "Contact — inquiry form and studio details",
        "kicker": "05  Connect",
    },
    {
        "id": "careers",
        "kind": "travel",
        "file": "careers-full.png",
        "duration": 7.5,
        "start": {"scale": 1.0, "x": 0.5, "y": 0.06},
        "end": {"scale": 1.1, "x": 0.5, "y": 0.7},
        "title": "Careers — openings and applications",
        "kicker": "06  Team",
    },
    {
        "id": "admin",
        "kind": "travel",
        "file": "admin-dashboard.png",
        "duration": 6.5,
        "start": {"scale": 1.0, "x": 0.5, "y": 0.45},
        "end": {"scale": 1.12, "x": 0.58, "y": 0.5},
        "title": "Admin — live dashboard and CMS",
        "kicker": "07  Control",
    },
    {
        "id": "editor",
        "kind": "travel",
        "file": "admin-editor.png",
        "duration": 7.0,
        "start": {"scale": 1.0, "x": 0.45, "y": 0.55},
        "end": {"scale": 1.08, "x": 0.62, "y": 0.62},
        "title": "Edit with image upload and live preview",
        "kicker": "08  Craft",
    },
    {"id": "mobile", "kind": "phone", "file": "mobile-home.png", "duration": 6.0},
    {"id": "end", "kind": "end", "duration": 6.5},
]


def frames_for(scene):
    n = int(scene["duration"] * FPS)
    kind = scene["kind"]
    if kind == "title":
        for i in range(n):
            yield title_frame(i / FPS, scene["duration"])
        return
    if kind == "end":
        for i in range(n):
            yield end_frame(i / FPS, scene["duration"])
        return
    if kind == "phone":
        im = load(scene["file"])
        for i in range(n):
            yield phone_frame(im, i / max(n - 1, 1))
        return
    im = load(scene["file"])
    for i in range(n):
        t = i / max(n - 1, 1)
        frame = ken_burns(im, t, scene["start"], scene["end"])
        yield letterbox(frame, scene["title"], scene["kicker"])


def crossfade(a, b, steps=12):
    for i in range(steps):
        t = ease((i + 1) / steps)
        yield Image.blend(a, b, t)


def render():
    VIDEO.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(MUSIC),
        "-shortest",
        "-vf", "format=yuv420p,fade=t=in:st=0:d=0.6",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(VIDEO),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    prev = None
    total = 0
    try:
        for scene in SCENES:
            print("scene", scene["id"], f"{scene['duration']:.1f}s")
            gen = frames_for(scene)
            first = next(gen)
            if prev is not None:
                for blended in crossfade(prev, first, steps=10):
                    proc.stdin.write(blended.tobytes())
                    total += 1
            proc.stdin.write(first.tobytes())
            total += 1
            last = first
            for frame in gen:
                proc.stdin.write(frame.tobytes())
                total += 1
                last = frame
            prev = last
        proc.stdin.close()
        err = proc.stderr.read().decode("utf-8", errors="ignore")
        code = proc.wait()
        if code != 0:
            print(err[-2000:])
            raise SystemExit(f"ffmpeg failed ({code})")
        print("frames", total)
        print("WROTE", VIDEO)
    except BrokenPipeError:
        err = proc.stderr.read().decode("utf-8", errors="ignore")
        raise SystemExit(err[-2000:] or "ffmpeg pipe broke")


if __name__ == "__main__":
    missing = [s["file"] for s in SCENES if s.get("file") and not (SHOTS / s["file"]).exists()]
    if missing:
        raise SystemExit("missing shots: " + ", ".join(missing))
    if not MUSIC.exists():
        raise SystemExit("run make_music.py first")
    render()
