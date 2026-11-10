#!/usr/bin/env python3
"""Build a Bangla walkthrough video aligned to on-screen website sections."""
import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

import edge_tts
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "tutorial"
FRAMES = OUT / "frames"
AUDIO = OUT / "audio"
CLIPS = OUT / "clips"
VIDEO = ROOT / "assets" / "tutorial" / "Array-Architects-Bangla-Overview.mp4"
BASE = "http://localhost/2026/array-architects"
VOICE = "bn-BD-NabanitaNeural"
RATE = "-12%"
W, H = 1920, 1080
FPS = 30
GOLD = (212, 175, 55)
DARK = (14, 16, 20)
WHITE = (245, 245, 245)
MUTED = (200, 200, 200)

FONT_PATH = "/System/Library/Fonts/KohinoorBangla.ttc"
FONT_LATIN = "/System/Library/Fonts/Supplemental/Times New Roman.ttf"

SCENES = [
    {
        "id": "01-intro",
        "kind": "card",
        "title": "Atelier Nova",
        "subtitle": "Website tutorial",
        "label": "পরিচিতি",
        "text": "আসসালামু আলাইকুম। আজকে আমি Atelier Nova ওয়েবসাইটটা দেখাব। এটা ঢাকার একটি আর্কিটেকচার ফার্মের সাইট। আমি পেজগুলো দেখাব, আর ঠিক যে জিনিসটা স্ক্রিনে আছে, সেটাই বলব। শেষে বলব কিভাবে এই প্রজেক্ট খুলে ব্যবহার করবেন।",
    },
    {
        "id": "02-home-hero",
        "kind": "shot",
        "file": "home.png",
        "label": "হোমপেজ",
        "text": "এখন হোমপেজ দেখা যাচ্ছে। মাঝে বড় করে লেখা Atelier Nova। নিচে ইংরেজিতে লেখা, We turn ideas into works of art। মানে, আপনার আইডিয়াকে সুন্দর ডিজাইনে রূপ দেওয়া। পেছনে বিল্ডিং এর ছবি।",
    },
    {
        "id": "03-navbar",
        "kind": "shot",
        "file": "navbar.png",
        "label": "উপরের মেনু",
        "text": "এখন উপরের মেনু দেখুন। বামে লোগো Atelier Nova। মাঝে পেজের নাম—Home, About, Services, Projects, Contact, Careers। যে পেজে আছেন সেটা হলুদ করে হাইলাইট হয়। ডানদিকে সবুজ Call Now বাটন। এখানে চাপলে ফোন যাবে, নম্বর শূন্য এক আট চার চার, পাঁচ দুই শূন্য দুই শূন্য এক।",
    },
    {
        "id": "04-hero-buttons",
        "kind": "shot",
        "file": "hero-cta.png",
        "label": "হোম বাটন",
        "text": "হিরো সেকশনে দুইটা বাটন দেখা যাচ্ছে। সোনালি বাটন লেখা Start Your Project। এটা Contact পেজে নিয়ে যায়। পাশের বাটন View Our Work। এটা প্রজেক্টের ছবি দেখায়।",
    },
    {
        "id": "05-stats",
        "kind": "shot",
        "file": "stats.png",
        "label": "পরিসংখ্যান",
        "text": "এখন নিচের তিনটা নম্বর দেখুন। পাঁচশোর বেশি প্রজেক্ট কমপ্লিট। পনেরো বছরের অভিজ্ঞতা। আর আটানব্বই শতাংশ ক্লায়েন্ট সন্তুষ্টি। এগুলো বিশ্বাস তৈরি করে।",
    },
    {
        "id": "06-floating",
        "kind": "shot",
        "file": "floating.png",
        "label": "কল ও হোয়াটসঅ্যাপ",
        "text": "ডান পাশে নিচে তিনটা গোল বাটন ভাসছে। সবুজটা ফোন। আরেকটা সবুজ হোয়াটসঅ্যাপ। সোনালিটা ইমেইল। যেকোনো পেজ থেকেই ক্লায়েন্ট এখানে চাপতে পারবে।",
    },
    {
        "id": "07-services-home",
        "kind": "shot",
        "file": "home-services.png",
        "label": "হোম — সার্ভিস",
        "text": "স্ক্রিনে Our Services কার্ডগুলো। চারটা কাজ—Architectural Design, Interior Design, Urban Planning, আর Project Consultation। Learn More চাপলে বিস্তারিত Services পেজে যাবে।",
    },
    {
        "id": "08-featured",
        "kind": "shot",
        "file": "home-projects.png",
        "label": "হোম — প্রজেক্ট",
        "text": "এখন Featured Projects। তিনটা কাজের ছবি—রেসিডেনশিয়াল কমপ্লেক্স, অফিস, আর ভিলা। View Project চাপলে পুরো পোর্টফোলিও খুলবে।",
    },
    {
        "id": "09-about",
        "kind": "shot",
        "file": "about.png",
        "label": "অ্যাবাউট পেজ",
        "text": "এখন About পেজ খোলা। এখানে ফার্মের পরিচয়। লেখা আছে, দুই হাজার দশ সাল থেকে কাজ করছে। ভিশন, মিশন, আর ভ্যালু—Excellence, Innovation, Sustainability, Integrity।",
    },
    {
        "id": "10-services",
        "kind": "shot",
        "file": "services.png",
        "label": "সার্ভিস পেজ",
        "text": "এখন Services পেজ। উপরে লেখা Our Services। নিচে চারটা সার্ভিস বিস্তারিত। আরও নিচে কাজের ধাপ—Consultation, Design Development, Documentation, Construction। মানে পরামর্শ থেকে নির্মাণ পর্যন্ত।",
    },
    {
        "id": "11-filters",
        "kind": "shot",
        "file": "project-filters.png",
        "label": "প্রজেক্ট ফিল্টার",
        "text": "এখন Projects পেজের ফিল্টার দেখুন। All Projects, Residential, Commercial, Institutional, Interior Design। যে বাটনে চাপবেন, শুধু সেই ধরনের কাজ দেখাবে।",
    },
    {
        "id": "12-grid",
        "kind": "shot",
        "file": "project-grid.png",
        "label": "প্রজেক্ট গ্রিড",
        "text": "এগুলো প্রজেক্টের ছবির গ্রিড। রেসিডেনশিয়াল, কমার্শিয়াল, ইনস্টিটিউশনাল, ইন্টিরিয়র—সব একসাথে। যেকোনো কার্ডে ক্লিক করলে বড় করে খুলবে।",
    },
    {
        "id": "13-modal",
        "kind": "shot",
        "file": "project-modal.png",
        "label": "প্রজেক্ট ডিটেইলস",
        "text": "ক্লিক করার পর এই পপআপ খোলে। এখানে প্রজেক্টের নাম, লোকেশন, বছর, সাইজ, স্ট্যাটাস আর ফিচার দেখা যায়। Start Similar Project চাপলে Contact ফর্মে যাবে।",
    },
    {
        "id": "14-contact",
        "kind": "shot",
        "file": "contact-form.png",
        "label": "যোগাযোগ ফর্ম",
        "text": "এখন Contact পেজের ফর্ম। এখানে নাম, ইমেইল, ফোন বা হোয়াটসঅ্যাপ, প্রজেক্ট টাইপ, লোকেশন, বাজেট, আর কাজের বিবরণ লিখতে হয়। খালি রাখলে সাইট এরর দেখাবে।",
    },
    {
        "id": "15-contact-side",
        "kind": "shot",
        "file": "contact-info.png",
        "label": "অফিস ও হোয়াটসঅ্যাপ",
        "text": "ফর্মের পাশে অফিসের ঠিকানা, ফোন নম্বর, ইমেইল, খোলার সময়। উপরে সরাসরি কল আর হোয়াটসঅ্যাপ বাটনও আছে। মানে ফর্ম না ভরেও যোগাযোগ করা যায়।",
    },
    {
        "id": "16-careers",
        "kind": "shot",
        "file": "careers-jobs.png",
        "label": "চাকরির খবর",
        "text": "এখন Careers পেজ। দুইটা চাকরির কার্ড দেখা যাচ্ছে। একটা Lumion অ্যানিমেশন স্পেশালিস্ট। আরেকটা আর্কিটেকচার আর ইন্টিরিয়র ডিজাইন। Apply Now চাপলে নিচের ফর্মে পদের নাম বসে যাবে।",
    },
    {
        "id": "17-apply",
        "kind": "shot",
        "file": "careers-form.png",
        "label": "আবেদন ফর্ম",
        "text": "এই আবেদন ফর্ম। নাম, ইমেইল, ফোন, কোন পদে আবেদন, পোর্টফোলিও লিংক, আর কভার মেসেজ। জমা দিলে টিম পরে যোগাযোগ করতে পারবে।",
    },
    {
        "id": "18-mobile",
        "kind": "shot",
        "file": "mobile.png",
        "label": "মোবাইল ভিউ",
        "text": "মোবাইলে সাইট এমন দেখায়। উপরে লোগো আর মেনু আইকন। নিচে কল আর হোয়াটসঅ্যাপ বাটন থাকে। ফোন থেকেও পুরো সাইট ব্যবহার করা যায়।",
    },
    {
        "id": "19-footer",
        "kind": "shot",
        "file": "footer.png",
        "label": "ফুটার",
        "text": "পেজের একদম নিচে ফুটার। কপিরাইট Atelier Nova। পাশে লেখা Developed by Udoy। Udoy শব্দটা সোনালি লিংক। ক্লিক করলে ডেভেলপারের ওয়েবসাইট খুলবে, udoyweb.netlify.app।",
    },
    {
        "id": "20-how-to",
        "kind": "card",
        "title": "কিভাবে খুলবেন",
        "subtitle": "XAMPP local server",
        "body": "1. XAMPP চালান\n2. ফোল্ডার রাখুন htdocs-এ\n3. ব্রাউজারে খুলুন\nlocalhost/2026/array-architects/",
        "label": "ব্যবহার",
        "text": "প্রজেক্ট ব্যবহার করা সহজ। এটা শুধু HTML, CSS আর JavaScript। আলাদা বিল্ড লাগে না। XAMPP চালিয়ে htdocs-এ array-architects ফোল্ডার রাখুন। তারপর ব্রাউজারে লিখুন localhost স্ল্যাশ 2026 স্ল্যাশ array-architects।",
    },
    {
        "id": "21-files",
        "kind": "card",
        "title": "ফাইলগুলো",
        "subtitle": "কোন পেজ কোন ফাইল",
        "body": "index.html    হোম\nabout.html    অ্যাবাউট\nservices.html সার্ভিস\nprojects.html প্রজেক্ট\ncontact.html  যোগাযোগ\ncareers.html  চাকরি",
        "label": "ফোল্ডার",
        "text": "ফোল্ডারে এই HTML ফাইলগুলো আছে। index মানে হোম। about, services, projects, contact, careers। ছবি, স্টাইল আর স্ক্রিপ্ট আছে assets ফোল্ডারে। কোন পেজ বদলাতে চাইলে সেই HTML খুললেই হবে।",
    },
    {
        "id": "22-live",
        "kind": "card",
        "title": "লাইভ ওয়েবসাইট",
        "subtitle": "array-architects.onrender.com",
        "label": "লাইভ লিংক",
        "text": "লাইভ সাইট আছে Render-এ। লিংক array-architects.onrender.com। এই লিংকে গেলে হোম, অ্যাবাউট, সার্ভিস, প্রজেক্ট, কন্টাক্ট, ক্যারিয়ার সব ঘুরে দেখতে পারবেন।",
    },
    {
        "id": "23-end",
        "kind": "card",
        "title": "ধন্যবাদ",
        "subtitle": "Atelier Nova  •  Developed by Udoy",
        "label": "শেষ",
        "text": "এই ছিল পুরো ওয়েবসাইটের ওভারভিউ। পেজ ঘুরে দেখুন, ফর্ম ব্যবহার করুন, আর লাইভ লিংক শেয়ার করুন। আল্লাহ হাফেজ।",
    },
]


def font(size, bangla=True, index=0):
    path = FONT_PATH if bangla else FONT_LATIN
    try:
        return ImageFont.truetype(path, size, index=index)
    except TypeError:
        return ImageFont.truetype(path, size)


def wrap(draw, text, fnt, max_width):
    lines, line = [], ""
    for ch in text:
        trial = line + ch
        if draw.textlength(trial, font=fnt) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = ch.lstrip()
    if line:
        lines.append(line)
    return lines


def make_card(scene, path):
    img = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, W, 8), fill=GOLD)
    draw.rectangle((0, H - 8, W, H), fill=GOLD)
    title_f = font(72)
    sub_f = font(36, bangla=False)
    body_f = font(40)
    label_f = font(28)
    draw.text((80, 70), scene.get("label", ""), font=label_f, fill=GOLD)
    draw.text((80, 160), scene["title"], font=title_f, fill=WHITE)
    if scene.get("subtitle"):
        draw.text((80, 270), scene["subtitle"], font=sub_f, fill=GOLD)
    if scene.get("body"):
        y = 380
        for raw in scene["body"].split("\n"):
            draw.text((80, y), raw, font=body_f, fill=MUTED)
            y += 70
    img.save(path, "PNG")


def fit_frame(src, dest, label):
    im = Image.open(src).convert("RGB")
    canvas = Image.new("RGB", (W, H), DARK)
    max_w, max_h = W - 80, H - 140
    ratio = min(max_w / im.width, max_h / im.height)
    nw, nh = max(1, int(im.width * ratio)), max(1, int(im.height * ratio))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x, y = (W - nw) // 2, 90 + (max_h - nh) // 2
    canvas.paste(im, (x, y))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, W, 72), fill=(20, 22, 26))
    draw.rectangle((0, 72, W, 76), fill=GOLD)
    draw.text((40, 18), label, font=font(32), fill=GOLD)
    draw.text((W - 40, 22), "Atelier Nova", font=font(26, bangla=False), fill=MUTED, anchor="ra")
    canvas.save(dest, "PNG")


async def capture():
    from playwright.sync_api import sync_playwright  # noqa: F401

    sys.path.insert(0, "/tmp/aa-shots/node_modules")
    # Use node playwright via a small helper instead if python playwright missing
    raise RuntimeError("use node capture")


def capture_with_node():
    script = r'''
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost/2026/array-architects';
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, file, selector) {
  const loc = page.locator(selector).first();
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await new Promise((r) => setTimeout(r, 500));
  await loc.screenshot({ path: path.join(OUT, file) });
  console.log('shot', file);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage();
  const go = async (p) => {
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1800));
  };

  await go('/');
  await page.screenshot({ path: path.join(OUT, 'home.png') });
  await shot(page, 'navbar.png', 'nav.navbar');
  await shot(page, 'hero-cta.png', '.hero-cta');
  await shot(page, 'stats.png', '.hero-stats');
  await shot(page, 'floating.png', '.floating-contact');
  await shot(page, 'home-services.png', '.services-section');
  await shot(page, 'home-projects.png', '.projects-section');

  await go('/about.html');
  await page.screenshot({ path: path.join(OUT, 'about.png') });

  await go('/services.html');
  await page.screenshot({ path: path.join(OUT, 'services.png') });

  await go('/projects.html');
  await shot(page, 'project-filters.png', '.portfolio-filter');
  await shot(page, 'project-grid.png', '#portfolioGrid');
  await page.locator('.portfolio-item').first().click();
  await new Promise((r) => setTimeout(r, 900));
  const modal = page.locator('#projectModal .project-modal-content, #projectModal .modal-content, #projectModal').first();
  await modal.screenshot({ path: path.join(OUT, 'project-modal.png') }).catch(async () => {
    await page.screenshot({ path: path.join(OUT, 'project-modal.png') });
  });

  await go('/contact.html');
  await shot(page, 'contact-form.png', '#projectInquiryForm');
  await shot(page, 'contact-info.png', '.contact-info');

  await go('/careers.html');
  await shot(page, 'careers-jobs.png', '.job-card');
  await page.locator('.job-card').nth(1).screenshot({ path: path.join(OUT, 'careers-jobs.png') }).catch(()=>{});
  const jobs = page.locator('section.section').first();
  await jobs.screenshot({ path: path.join(OUT, 'careers-jobs.png') });
  await shot(page, 'careers-form.png', '#careerApplicationForm');

  await page.locator('.footer-bottom').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, 'footer.png', 'footer.footer');

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  await m.screenshot({ path: path.join(OUT, 'mobile.png') });

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
'''
    js = OUT / "_capture.js"
    js.write_text(script)
    env = os.environ.copy()
    env["NODE_PATH"] = "/tmp/aa-shots/node_modules"
    env["BASE"] = BASE
    subprocess.check_call(["node", str(js), str(FRAMES / "raw")], env=env)


async def tts_all():
    AUDIO.mkdir(parents=True, exist_ok=True)
    for scene in SCENES:
        dest = AUDIO / f"{scene['id']}.mp3"
        print("tts", scene["id"])
        comm = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
        await comm.save(str(dest))


def duration(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        text=True,
    ).strip()
    return float(out)


def build_clips():
    CLIPS.mkdir(parents=True, exist_ok=True)
    framedir = FRAMES / "fitted"
    framedir.mkdir(parents=True, exist_ok=True)
    raw = FRAMES / "raw"
    concat = []
    for scene in SCENES:
        frame = framedir / f"{scene['id']}.png"
        if scene["kind"] == "card":
            make_card(scene, frame)
        else:
            src = raw / scene["file"]
            if not src.exists():
                raise SystemExit(f"missing screenshot {src}")
            fit_frame(src, frame, scene["label"])
        audio = AUDIO / f"{scene['id']}.mp3"
        dur = duration(audio) + 0.45
        clip = CLIPS / f"{scene['id']}.mp4"
        fade_out = max(0.05, dur - 0.28)
        vf = (
            f"format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st={fade_out:.3f}:d=0.25"
        )
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-framerate", str(FPS), "-i", str(frame),
            "-i", str(audio),
            "-vf", vf,
            "-t", f"{dur:.3f}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            str(clip),
        ]
        print("clip", scene["id"], f"{dur:.1f}s")
        subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        concat.append(f"file '{clip}'")
    list_path = CLIPS / "list.txt"
    list_path.write_text("\n".join(concat) + "\n")
    VIDEO.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            str(VIDEO),
        ]
    )
    print("WROTE", VIDEO)


def main():
    FRAMES.mkdir(parents=True, exist_ok=True)
    AUDIO.mkdir(parents=True, exist_ok=True)
    step = sys.argv[1] if len(sys.argv) > 1 else "all"
    if step in ("all", "capture"):
        capture_with_node()
    if step in ("all", "tts"):
        asyncio.run(tts_all())
    if step in ("all", "video"):
        build_clips()
    (OUT / "scenes.json").write_text(json.dumps(SCENES, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
