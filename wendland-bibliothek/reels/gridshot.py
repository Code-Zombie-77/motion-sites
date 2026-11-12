import subprocess, sys
from PIL import Image, ImageDraw, ImageFont
# usage: gridshot.py out.jpg clip:ss [clip:ss ...]   -> source frames at 540x960 with labelled 40px grid
out = sys.argv[1]; tiles = []
f = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 11)
for a in sys.argv[2:]:
    n, ss = a.split(":")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", ss, "-i", f"src/{n}.MOV", "-frames:v", "1", "-vf", "scale=540:960", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    im = Image.frombytes("RGB", (540, 960), raw); d = ImageDraw.Draw(im)
    for x in range(0, 540, 20): d.line((x, 0, x, 960), fill=(255, 255, 0) if x % 100 == 0 else (90, 90, 0))
    for y in range(0, 960, 20): d.line((0, y, 540, y), fill=(255, 255, 0) if y % 100 == 0 else (90, 90, 0))
    for x in range(0, 540, 100):
        for y in range(0, 960, 100): d.text((x + 2, y + 2), f"{x},{y}", font=f, fill=(0, 255, 255))
    d.text((5, 940), a, font=f, fill=(255, 0, 255)); tiles.append(im)
sheet = Image.new("RGB", (540 * len(tiles), 960))
for i, t in enumerate(tiles): sheet.paste(t, (540 * i, 0))
sheet.save(out, quality=92)
