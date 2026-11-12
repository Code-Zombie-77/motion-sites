from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math
os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs("gfx", exist_ok=True)
W, H = 1080, 1920
LOGO = r"C:\Users\PC\AppData\Local\Temp\claude\5e3cb61bb2ef9af0\8e9580ad-3f0c-4ed0-a775-be4801e596e3\images\2.png"
F = r"C:\Windows\Fonts\segoeuib.ttf"; FR = r"C:\Windows\Fonts\segoeui.ttf"; FL = r"C:\Windows\Fonts\segoeuil.ttf"
ORANGE = (238, 98, 40)
def font(p, s): return ImageFont.truetype(p, s)

logo = Image.open(LOGO).convert("RGBA")
logo = logo.crop(logo.getbbox())

def logo_at(h):
    return logo.resize((round(logo.width * h / logo.height), h), Image.LANCZOS)

# background
bg = Image.new("RGB", (W, H), (10, 6, 5))
glow = Image.new("RGB", (W, H), (0, 0, 0))
g = ImageDraw.Draw(glow)
g.ellipse((-500, -400, 900, 1100), fill=(92, 30, 14))
g.ellipse((500, 1300, 1500, 2300), fill=(45, 14, 8))
glow = glow.filter(ImageFilter.GaussianBlur(260))
bg = Image.blend(bg, glow, 1.0)
bg = Image.fromarray if False else bg
px = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(px)
for x in range(0, W, 120): d.line((x, 0, x, H), fill=(255, 255, 255, 7))
for y in range(0, H, 120): d.line((0, y, W, y), fill=(255, 255, 255, 7))
bg = Image.alpha_composite(bg.convert("RGBA"), px)
bg.save("gfx/bg.png")

def rr_mask(w, h, r, path):
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), r * 4, fill=255)
    m.resize((w, h), Image.LANCZOS).save(path)

def header(im, pill):
    d = ImageDraw.Draw(im)
    lg = logo_at(78); im.alpha_composite(lg, (78, 118))
    d.text((78 + lg.width + 34, 157), "Mind-Merit", font=font(FR, 52), fill=(235, 232, 228), anchor="lm")
    tw = d.textlength("Mind-Merit", font=font(FR, 52))
    d.text((78 + lg.width + 34 + tw + 4, 134), "®", font=font(FR, 26), fill=(235, 232, 228), anchor="lm")
    f = font(FR, 34); pw = d.textlength(pill, font=f) + 70
    d.rounded_rectangle((1002 - pw, 122, 1002, 192), 35, outline=(120, 80, 70), width=3, fill=(20, 10, 8))
    d.text((1002 - pw / 2, 157), pill, font=f, fill=(235, 232, 228), anchor="mm")

# intro logo
logo_at(330).save("gfx/logo_intro.png")

# scene overlays: panel 984x738 at (48, 560)
PX, PY, PWD, PHT = 48, 560, 984, 738
rr_mask(PWD, PHT, 34, "gfx/mask_panel.png")
projects = [
    ("kv", "KV FRACHT", "Logistik in Bewegung"),
    ("wb", "WENDLAND BIBLIOTHEK", "Ein Bücherregal zum Scrollen"),
    ("rw", "RUNWAY", "Mode, neu inszeniert"),
    ("tp", "TIEFENPFAD", "Höhlentouren in Deutschland"),
    ("nl", "NECTARLINE", "Supply-Chain unter Wasser"),
]
for i, (k, name, sub) in enumerate(projects):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    header(im, "Web & Motion")
    d.text((78, 330), "PROJEKT", font=font(F, 30), fill=ORANGE, anchor="lm")
    size = 92
    while d.textlength(name, font=font(F, size)) > 924: size -= 4
    d.text((76, 440), name, font=font(F, size), fill=(236, 232, 226), anchor="lm")
    # shadow + border around panel
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((PX + 10, PY + 30, PX + PWD - 10, PY + PHT + 40), 40, fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(30))
    im = Image.alpha_composite(sh, im); d = ImageDraw.Draw(im)
    # cut shadow inside panel area so video shows cleanly (video drawn over anyway)
    d.rounded_rectangle((PX - 2, PY - 2, PX + PWD + 1, PY + PHT + 1), 36, outline=(255, 255, 255, 40), width=2)
    d.rectangle((78, 1388, 78 + 120, 1394), fill=ORANGE)
    d.text((78, 1460), sub, font=font(FL, 46), fill=(210, 204, 198), anchor="lm")
    d.text((W // 2, 1790), "www.mind-merit.com", font=font(FR, 32), fill=(160, 150, 144), anchor="mm")
    im.save(f"gfx/scene_{k}.png")

# outro
BOX = (272, 372); BY = 1180; BXS = [96, 404, 712]
rr_mask(BOX[0], BOX[1], 26, "gfx/mask_box.png")
def outro(path, names):
    im = Image.open("gfx/bg.png").convert("RGBA")
    header(im, "Web & Motion")
    d = ImageDraw.Draw(im)
    d.text((78, 390), "3D MOTION-", font=font(F, 128), fill=(232, 228, 222), anchor="ls")
    d.text((78, 540), "WEBSITES", font=font(F, 128), fill=(232, 228, 222), anchor="ls")
    d.rectangle((84, 618, 84 + 140, 624), fill=ORANGE)
    d.text((80, 708), "Interaktive Websites, die", font=font(FL, 48), fill=(215, 208, 200), anchor="ls")
    d.text((80, 772), "Besucher in Kunden verwandeln.", font=font(FL, 48), fill=(215, 208, 200), anchor="ls")
    # back window
    d.rounded_rectangle((150, 940, 1010, 1520), 30, fill=(18, 10, 8, 255), outline=(70, 45, 38), width=2)
    for j in range(3): d.ellipse((190 + j * 26, 970, 202 + j * 26, 982), fill=(90, 70, 64))
    # card
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((70, 1060, 1010, 1640), 34, fill=(0, 0, 0, 200))
    sh = sh.filter(ImageFilter.GaussianBlur(28)); im = Image.alpha_composite(im, sh); d = ImageDraw.Draw(im)
    d.rounded_rectangle((70, 1040, 1010, 1620), 34, fill=(30, 18, 15, 255), outline=(85, 58, 50), width=2)
    d.text((104, 1110), "Unsere Projekte", font=font(F, 46), fill=(240, 236, 230), anchor="lm")
    f = font(FR, 30); t = "Made by Mind-Merit"; tw = d.textlength(t, font=f)
    d.text((976, 1110), t, font=f, fill=(200, 190, 182), anchor="rm")
    cx = 976 - tw - 30; cy = 1110
    d.polygon([(cx, cy - 16), (cx + 5, cy - 5), (cx + 16, cy), (cx + 5, cy + 5), (cx, cy + 16), (cx - 5, cy + 5), (cx - 16, cy), (cx - 5, cy - 5)], fill=ORANGE)
    for x in BXS:
        d.rounded_rectangle((x - 2, BY - 2, x + BOX[0] + 1, BY + BOX[1] + 1), 28, outline=(95, 68, 60), width=2)
    # button
    d.rounded_rectangle((300, 1720, 780, 1820), 50, outline=(120, 80, 70), width=3)
    d.text((540, 1770), "www.mind-merit.com", font=font(FR, 36), fill=(235, 232, 228), anchor="mm")
    im.save(path)
    # labels over boxes (transparent)
    lb = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lb)
    for x, n in zip(BXS, names):
        grad = Image.new("RGBA", BOX, (0, 0, 0, 0)); gd = ImageDraw.Draw(grad)
        for yy in range(150): gd.line((0, BOX[1] - 150 + yy, BOX[0], BOX[1] - 150 + yy), fill=(12, 6, 5, int(yy * 1.5)))
        m = Image.open("gfx/mask_box.png"); grad.putalpha(Image.composite(grad.getchannel("A"), Image.new("L", BOX, 0), m))
        lb.alpha_composite(grad, (x, BY))
        d.text((x + 20, BY + BOX[1] - 42), n, font=font(F, 26), fill=(240, 236, 230), anchor="lm")
        ox, oy = x + BOX[0] - 40, BY + BOX[1] - 42
        d.ellipse((ox - 20, oy - 20, ox + 20, oy + 20), outline=(240, 236, 230), width=3)
        d.line((ox - 9, oy, ox + 9, oy), fill=(240, 236, 230), width=3); d.line((ox, oy - 9, ox, oy + 9), fill=(240, 236, 230), width=3)
    lb.save(path.replace(".png", "_lbl.png"))

outro("gfx/outro1.png", ["KV Fracht", "Bibliothek", "Runway"])
outro("gfx/outro2.png", ["Tiefenpfad", "Nectarline", "KV Fracht"])
print("ok")
