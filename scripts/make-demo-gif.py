from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parents[1] / "docs" / "assets" / "demo-init-to-pass.gif"
W, H = 920, 420
BG = (15, 20, 25)
PANEL = (22, 27, 34)
TERM = (13, 17, 23)
FG = (226, 232, 240)
MUTED = (148, 163, 184)
TEAL = (45, 212, 191)
CORAL = (248, 113, 113)
WHITE = (248, 250, 252)

font_paths = [
    ("C:/Windows/Fonts/consola.ttf", 18),
    ("C:/Windows/Fonts/consola.ttf", 15),
    ("C:/Windows/Fonts/segoeui.ttf", 22),
    ("C:/Windows/Fonts/seguisb.ttf", 20),
]
try:
    font = ImageFont.truetype(font_paths[0][0], 18)
    font_sm = ImageFont.truetype(font_paths[1][0], 15)
    font_title = ImageFont.truetype(font_paths[2][0], 22)
    font_bold = ImageFont.truetype(font_paths[3][0], 20)
except OSError:
    font = font_sm = font_title = font_bold = ImageFont.load_default()


def draw_window(draw, border=(48, 54, 61)):
    draw.rounded_rectangle((24, 56, W - 24, H - 24), radius=14, fill=PANEL, outline=border, width=2)
    draw.rounded_rectangle((40, 88, W - 40, H - 40), radius=10, fill=TERM, outline=(33, 38, 45), width=1)
    for i, c in enumerate([(248, 113, 113), (251, 191, 36), (45, 212, 191)]):
        draw.ellipse((56 + i * 18, 70, 66 + i * 18, 80), fill=c)


def frame_base(title, step, border=(48, 54, 61)):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((24, 18), f"{step}/4  {title}", fill=WHITE, font=font_title)
    draw_window(d, border)
    return img, d


frames = []
durations = []

img, d = frame_base("npx init — portable core", 1)
d.text((60, 116), "$ npx --yes github:Sultonisky/keep-it-out-of-git@main init", fill=FG, font=font_sm)
for i, line in enumerate(
    [
        ("wrote  .agents/skills/*", MUTED),
        ("wrote  scripts/check-sensitive-paths.sh", MUTED),
        ("wrote  gitleaks.toml", MUTED),
        ("wrote  .github/workflows/sensitive-data.yml", MUTED),
        ("patched AGENTS.md", MUTED),
        ("", MUTED),
        ("done  portable core", TEAL),
    ]
):
    d.text((60, 148 + i * 26), line[0], fill=line[1], font=font_sm)
frames.append(img)
durations.append(2200)

img, d = frame_base("files land in your repo", 2)
for i, (t, c) in enumerate(
    [
        ("my-repo/", TEAL),
        ("├─ .agents/skills/          # 4 agent skills", FG),
        ("├─ scripts/check-sensitive-paths.sh", FG),
        ("├─ gitleaks.toml", FG),
        ("├─ .github/workflows/sensitive-data.yml", FG),
        ("└─ AGENTS.md                # block added", FG),
        ("", MUTED),
        ("# untracked until git add + commit/PR", MUTED),
    ]
):
    d.text((60, 116 + i * 28), t, fill=c, font=font_sm)
frames.append(img)
durations.append(2200)

img, d = frame_base("path check FAIL — dump blocked", 3, border=(127, 29, 29))
for i, (t, c) in enumerate(
    [
        ("$ bash scripts/check-sensitive-paths.sh", FG),
        ("", MUTED),
        ("BLOCKED tracked path:", CORAL),
        ("  data/employees-export.xlsx", (253, 164, 164)),
        ("", MUTED),
        ("exit 1", CORAL),
        ("", MUTED),
        ("# move to gitignored private storage, unstage", MUTED),
    ]
):
    d.text((60, 116 + i * 28), t, fill=c, font=font_sm)
frames.append(img)
durations.append(2400)

img, d = frame_base("path check PASS — ready to PR", 4, border=(20, 83, 45))
for i, (t, c) in enumerate(
    [
        ("$ bash scripts/check-sensitive-paths.sh", FG),
        ("", MUTED),
        ("Sensitive-path check passed.", TEAL),
        ("", MUTED),
        ("# CI also runs path check + gitleaks", MUTED),
        ("# agents steer to Sample/Test fixtures", MUTED),
    ]
):
    d.text((60, 116 + i * 28), t, fill=c, font=font_sm)
d.rounded_rectangle((60, 320, 260, 360), radius=8, fill=(13, 40, 24), outline=(20, 83, 45), width=2)
d.text((88, 330), "Ready to PR", fill=TEAL, font=font_bold)
frames.append(img)
durations.append(2600)

frames[0].save(
    out,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=True,
)
print(f"wrote {out} ({out.stat().st_size} bytes)")
