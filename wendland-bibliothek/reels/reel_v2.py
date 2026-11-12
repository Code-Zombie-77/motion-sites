import subprocess, os, math, wave, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs("out", exist_ok=True)
W, H, FPS = 1080, 1920, 30
LOGO = r"C:\Users\PC\AppData\Local\Temp\claude\5e3cb61bb2ef9af0\8e9580ad-3f0c-4ed0-a775-be4801e596e3\images\2.png"
F = r"C:\Windows\Fonts\segoeuib.ttf"; FR = r"C:\Windows\Fonts\segoeui.ttf"; FL = r"C:\Windows\Fonts\segoeuil.ttf"
ORANGE = (238, 98, 40); TXT = (236, 232, 226); SUB = (215, 208, 200); MUTED = (160, 150, 144)
_fc = {}
def font(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def seg(t, a, b): return clamp((t - a) / (b - a))

def ac(im, src, x, y):
    x, y = int(round(x)), int(round(y))
    l, t = max(0, -x), max(0, -y)
    r, b = min(src.width, W - x), min(src.height, H - y)
    if r <= l or b <= t: return
    if (l, t, r, b) != (0, 0, src.width, src.height): src = src.crop((l, t, r, b))
    im.alpha_composite(src, (x + l, y + t))

def fade(img, op):
    if op >= 1: return img
    img = img.copy(); img.putalpha(img.getchannel("A").point(lambda v: int(v * op))); return img

def rr_mask(w, h, r):
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), r * 4, fill=255)
    return m.resize((w, h), Image.LANCZOS)

GRADE = "eq=contrast=1.1:saturation=0.85,curves=all='0/0 0.4/0.2 0.75/0.55 1/0.82'"
class Reader:
    def __init__(s, path, ss, w, h, loop=False):
        s.w, s.h, s.last = w, h, None
        cmd = ["ffmpeg", "-v", "error"] + (["-stream_loop", "-1"] if loop else []) + ["-ss", str(ss), "-i", path,
               "-vf", f"scale={w}:{h}:flags=lanczos,{GRADE}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
        s.p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10 ** 7)
    def read(s):
        b = s.p.stdout.read(s.w * s.h * 3)
        if len(b) == s.w * s.h * 3: s.last = Image.frombytes("RGB", (s.w, s.h), b)
        return s.last
    def close(s):
        try: s.p.kill()
        except Exception: pass

# ---------- static assets ----------
logo = Image.open(LOGO).convert("RGBA"); logo = logo.crop(logo.getbbox())
def logo_at(h): return logo.resize((round(logo.width * h / logo.height), h), Image.LANCZOS)

glow = Image.new("RGB", (W, H), (0, 0, 0)); g = ImageDraw.Draw(glow)
g.ellipse((-500, -400, 900, 1100), fill=(92, 30, 14)); g.ellipse((500, 1300, 1500, 2300), fill=(45, 14, 8))
BG = glow.filter(ImageFilter.GaussianBlur(260)).convert("RGBA")
GRID = Image.new("L", (W + 120, H + 120), 0); gd = ImageDraw.Draw(GRID)
for x in range(0, W + 120, 120): gd.line((x, 0, x, H + 120), fill=255)
for y in range(0, H + 120, 120): gd.line((0, y, W + 120, y), fill=255)

def bg_frame(t):
    im = BG.copy()
    ox, oy = int(t * 9) % 120, int(t * 5) % 120
    a = 9 + 4 * math.sin(2 * math.pi * t / 4.0)
    m = GRID.crop((ox, oy, ox + W, oy + H)).point([int(v * a / 255) for v in range(256)])
    im.paste((255, 255, 255, 255), (0, 0), m)
    return im

HEADER = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(HEADER)
lg = logo_at(78); HEADER.alpha_composite(lg, (78, 118))
d.text((78 + lg.width + 34, 157), "Mind-Merit", font=font(FR, 52), fill=TXT, anchor="lm")
tw = d.textlength("Mind-Merit", font=font(FR, 52))
d.text((78 + lg.width + 34 + tw + 4, 134), "®", font=font(FR, 26), fill=TXT, anchor="lm")
pw = d.textlength("Web & Motion", font=font(FR, 34)) + 70
d.rounded_rectangle((1002 - pw, 122, 1002, 192), 35, outline=(120, 80, 70), width=3, fill=(20, 10, 8))
d.text((1002 - pw / 2, 157), "Web & Motion", font=font(FR, 34), fill=TXT, anchor="mm")
HEADER = HEADER.crop((0, 0, W, 240))

# opening overlay: vignette + top/bottom shade + discreet logo
v = Image.new("L", (108, 192), 0); vd = ImageDraw.Draw(v)
for i in range(60): vd.rounded_rectangle((i * 0.5, i * 0.9, 108 - i * 0.5, 192 - i * 0.9), 20, fill=int(200 * (1 - i / 60) ** 2))
vig = v.resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(40))
va = np.array(vig, dtype=np.float32)
yy = np.arange(H, dtype=np.float32)[:, None]
top = np.clip((380 - yy) / 380, 0, 1) * 215; bot = np.clip((yy - 1420) / 500, 0, 1) * 235
OPEN_OV = Image.new("RGBA", (W, H), (5, 3, 3, 0))
OPEN_OV.putalpha(Image.fromarray(np.maximum(va, np.maximum(top, bot)).astype(np.uint8)))
sl = fade(logo_at(54), 0.9); OPEN_OV.alpha_composite(sl, (64, 86))
ImageDraw.Draw(OPEN_OV).text((64 + sl.width + 22, 113), "Mind-Merit", font=font(FR, 34), fill=(225, 220, 214, 220), anchor="lm")

def tracked_w(text, f, tr): return sum(f.getlength(c) + tr for c in text) - tr
def reveal_line(im, text, f, x, base, p, tr=0.0, fill=TXT, out=0.0, center=False):
    if p <= 0 or out >= 1: return
    asc, desc = f.getmetrics(); h = asc + desc + 8; top = base - asc
    lay = Image.new("RGBA", (W, h), (0, 0, 0, 0)); dd = ImageDraw.Draw(lay)
    dy = (1 - eo(p)) * h - eio(out) * h
    if center: x = x - tracked_w(text, f, tr) / 2
    for c in text:
        dd.text((x, asc + dy), c, font=f, fill=fill, anchor="ls"); x += f.getlength(c) + tr
    ac(im, lay, 0, top)

# cards
CW, CH, VW, VH = 310, 575, 294, 523
VMASK = rr_mask(VW, VH, 16)
SH = Image.new("RGBA", (CW + 160, CH + 160), (0, 0, 0, 0))
ImageDraw.Draw(SH).rounded_rectangle((80, 104, 80 + CW, 104 + CH), 26, fill=(0, 0, 0, 190))
SH = SH.filter(ImageFilter.GaussianBlur(28))
def card_base(name):
    c = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); dd = ImageDraw.Draw(c)
    dd.rounded_rectangle((0, 0, CW - 1, CH - 1), 22, fill=(30, 18, 15, 255), outline=(85, 58, 50), width=2)
    for j in range(3): dd.ellipse((16 + j * 18, 17, 26 + j * 18, 27), fill=(90, 70, 64))
    dd.text((82, 22), name, font=font(FR, 20), fill=(200, 190, 182), anchor="lm")
    return c
FINAL = [(50, 900), (385, 850), (720, 900)]
STARTS = [1.6, 2.4, 3.2]; DUR = 1.8; THETA = [0.15 * math.pi, 1.0 * math.pi, 1.65 * math.pi]

# finale logo
LH, PAD = 300, 150
L = logo_at(LH); CWL, CHL = L.width + 2 * PAD, L.height + 2 * PAD
LC = Image.new("RGBA", (CWL, CHL), (0, 0, 0, 0)); LC.paste(L, (PAD, PAD))
la = LC.getchannel("A")
bin_ = la.point(lambda v: 255 if v > 110 else 0)
EDGE = np.array(bin_.filter(ImageFilter.MaxFilter(5)), np.float32) - np.array(bin_.filter(ImageFilter.MinFilter(5)), np.float32)
gy, gx = np.mgrid[0:CHL, 0:CWL]
ANG = ((np.arctan2(gy - CHL / 2, gx - CWL / 2) + math.pi / 2) % (2 * math.pi)) / (2 * math.pi)
GLOWA = np.array(la.filter(ImageFilter.GaussianBlur(38)), np.float32)
LCA = np.array(la, np.float32)
LCX, LCY = 540, 860

class Reel:
    def __init__(s, name, cuts, cards):
        s.name, s.cuts, s.cards = name, cuts, cards
        s.cur, s.rd = -1, None
        s.cardrd = [None] * 3; s.bases = [card_base(n) for _, n in cards]

    def frameA(s, t):
        k = min(int(t / 1.0), len(s.cuts) - 1); tc = t - k
        if k != s.cur:
            if s.rd: s.rd.close()
            clip, off, _ = s.cuts[k]; s.rd = Reader(f"clips/full_{clip}.mp4", off, W, H); s.cur = k
        fr = s.rd.read()
        z = 1.0 + 0.06 * (1 - eo(tc / 0.35)) + 0.02 * tc
        fw, fh = int(W * z), int(H * z)
        im = fr.resize((fw, fh), Image.BICUBIC).crop(((fw - W) // 2, (fh - H) // 2, (fw - W) // 2 + W, (fh - H) // 2 + H)).convert("RGBA")
        im.alpha_composite(OPEN_OV)
        name = s.cuts[k][2]
        reveal_line(im, "PROJEKT", font(F, 26), 78, 1690, seg(tc, 0.03, 0.35), fill=ORANGE)
        reveal_line(im, name, font(F, 64), 76, 1772, seg(tc, 0.08, 0.45))
        return im

    def frameB(s, t, gt):
        im = bg_frame(gt)
        ac(im, fade(HEADER, eo(seg(t, 0, 0.5))), 0, 0)
        tr = 26 * (1 - eo(seg(t, 0.15, 1.6)))
        reveal_line(im, "3D MOTION-", font(F, 128), 78, 360, seg(t, 0.15, 0.9), tr)
        reveal_line(im, "WEBSITES", font(F, 128), 78, 500, seg(t, 0.35, 1.1), tr)
        lw = 140 * eo(seg(t, 1.0, 1.5))
        if lw > 1: ImageDraw.Draw(im).rectangle((84, 548, 84 + lw, 554), fill=ORANGE)
        o1 = seg(t, 5.6, 6.0)
        reveal_line(im, "Interaktive Websites, die", font(FL, 46), 80, 636, seg(t, 1.2, 1.8), fill=SUB, out=o1)
        reveal_line(im, "Besucher in Kunden verwandeln.", font(FL, 46), 80, 696, seg(t, 1.3, 1.9), fill=SUB, out=o1)
        reveal_line(im, "Unsere Projekte.", font(F, 46), 80, 636, seg(t, 5.85, 6.4), fill=TXT)
        reveal_line(im, "Gebaut von Mind-Merit.", font(FL, 46), 80, 696, seg(t, 5.95, 6.5), fill=SUB)
        for i in range(3):
            tc = t - STARTS[i]
            if tc < 0: continue
            if s.cardrd[i] is None: s.cardrd[i] = Reader(f"clips/full_{s.cards[i][0]}.mp4", 0, VW, VH, loop=True)
            vid = s.cardrd[i].read()
            u = clamp(tc / DUR); r = 1 - eio(u); th = THETA[i] + 1.6 * math.pi * eo(u)
            fx, fy = FINAL[i]
            x = fx + 420 * math.cos(th) * r
            y = fy + 220 * math.sin(th) * r + 6 * math.sin(2 * math.pi * 0.3 * gt + i * 1.3)
            sc = 1 + (0.16 * math.sin(th) - 0.12) * r
            op = eo(tc / 0.35)
            flash = max(0.0, 1 - (tc - DUR) / 0.5) * 0.85 if tc >= DUR else 0
            c = s.bases[i].copy(); c.paste(vid, (8, 44), VMASK)
            if flash > 0: ImageDraw.Draw(c).rounded_rectangle((0, 0, CW - 1, CH - 1), 22, outline=ORANGE + (int(255 * flash),), width=3)
            sh = SH
            if abs(sc - 1) > 0.002:
                c = c.resize((int(CW * sc), int(CH * sc)), Image.BILINEAR)
                sh = SH.resize((int(SH.width * sc), int(SH.height * sc)), Image.BILINEAR)
            c, sh = fade(c, op), fade(sh, op)
            cx, cy = x + CW / 2, y + CH / 2
            ac(im, sh, cx - sh.width / 2, cy - sh.height / 2)
            ac(im, c, cx - c.width / 2, cy - c.height / 2)
        uo = eo(seg(t, 6.2, 6.8))
        if uo > 0:
            lay = Image.new("RGBA", (W, 140), (0, 0, 0, 0)); dd = ImageDraw.Draw(lay)
            dd.rounded_rectangle((300, 20, 780, 120), 50, outline=(120, 80, 70, int(255 * uo)), width=3)
            dd.text((540, 70), "www.mind-merit.com", font=font(FR, 36), fill=TXT + (int(255 * uo),), anchor="mm")
            ac(im, lay, 0, 1560 + 20 * (1 - uo))
        return im

    def frameC(s, t, gt):
        im = bg_frame(gt)
        p = eio(seg(t, 0.3, 1.9))
        fill = eo(seg(t, 1.4, 2.3))
        gl = eo(seg(t, 1.1, 2.4)) * (0.85 + 0.15 * math.cos(2 * math.pi * (t - 2.4) / 2.2) if t > 2.4 else 1)
        stroke = EDGE * (ANG <= p) * (1 - 0.75 * fill)
        lay = Image.new("RGBA", (CWL, CHL), (0, 0, 0, 0))
        if gl > 0:
            gimg = Image.new("RGBA", (CWL, CHL), ORANGE + (0,)); gimg.putalpha(Image.fromarray(np.clip(GLOWA * gl * 0.95, 0, 255).astype(np.uint8)))
            lay.alpha_composite(gimg)
        if p > 0:
            sa = Image.fromarray(np.clip(stroke, 0, 255).astype(np.uint8))
            sg = Image.new("RGBA", (CWL, CHL), ORANGE + (0,)); sg.putalpha(sa.filter(ImageFilter.GaussianBlur(9)).point(lambda v: min(255, v * 2)))
            lay.alpha_composite(sg)
            st = Image.new("RGBA", (CWL, CHL), (240, 236, 230, 0)); st.putalpha(sa); lay.alpha_composite(st)
        if fill > 0:
            f2 = LC.copy(); f2.putalpha(Image.fromarray((LCA * fill).astype(np.uint8))); lay.alpha_composite(f2)
        sc = 0.94 + 0.06 * eo(seg(t, 0.3, 2.6))
        if abs(sc - 1) > 0.002: lay = lay.resize((int(CWL * sc), int(CHL * sc)), Image.BICUBIC)
        ac(im, lay, LCX - lay.width / 2, LCY - lay.height / 2)
        tr = 30 * (1 - eo(seg(t, 2.2, 3.4)))
        reveal_line(im, "Mind-Merit®", font(FR, 86), W / 2, 1240, seg(t, 2.2, 3.0), tr, center=True)
        uo = eo(seg(t, 2.9, 3.5))
        if uo > 0:
            lay = Image.new("RGBA", (W, 140), (0, 0, 0, 0)); dd = ImageDraw.Draw(lay)
            dd.rounded_rectangle((300, 20, 780, 120), 50, outline=(120, 80, 70, int(255 * uo)), width=3)
            dd.text((540, 70), "www.mind-merit.com", font=font(FR, 36), fill=TXT + (int(255 * uo),), anchor="mm")
            ac(im, lay, 0, 1330 + 20 * (1 - uo))
        return im

    def render(s):
        total = 21.0; N = int(total * FPS)
        vpath = f"out/{s.name}_v.mp4"
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                                "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", vpath], stdin=subprocess.PIPE)
        for f in range(N):
            t = f / FPS
            a = s.frameA(t) if t < 6.5 else None
            b = s.frameB(t - 6.0, t) if 6.0 <= t < 16.0 else None
            c = s.frameC(t - 15.5, t) if t >= 15.5 else None
            if a is not None and b is not None: im = Image.blend(a, b, eio(seg(t, 6.0, 6.5)))
            elif b is not None and c is not None: im = Image.blend(b, c, eio(seg(t, 15.5, 16.0)))
            else: im = a if a is not None else (b if b is not None else c)
            enc.stdin.write(im.convert("RGB").tobytes())
            if f % 60 == 0: print(s.name, f, "/", N, flush=True)
        enc.stdin.close(); enc.wait()
        for r in [s.rd] + s.cardrd:
            if r: r.close()
        music(f"out/{s.name}.wav", total, 15.8)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vpath, "-i", f"out/{s.name}.wav", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                        "-shortest", "-movflags", "+faststart", f"out/{s.name}.mp4"], check=True)
        os.remove(vpath); os.remove(f"out/{s.name}.wav")

def music(path, dur, impact):
    sr = 44100; n = int(sr * dur); out = np.zeros(n); beat = 0.5; rng = np.random.default_rng(7)
    def add(sig, t0, gn=1.0):
        i = int(t0 * sr)
        if i >= n or i < 0: return
        j = min(n, i + len(sig)); out[i:j] += sig[:j - i] * gn
    def ma(x, k): return np.convolve(x, np.ones(k) / k, mode="same")
    t = np.arange(int(.42 * sr)) / sr
    kick = np.sin(2 * np.pi * np.cumsum(46 + 110 * np.exp(-t * 32)) / sr) * np.exp(-t * 7)
    nz = rng.standard_normal(int(.35 * sr)); t3 = np.arange(len(nz)) / sr; hp = nz - ma(nz, 6)
    hat_c = hp * np.exp(-t3 * 70) * 0.22; hat_o = hp * np.exp(-t3 * 14) * 0.15
    clap = (ma(nz, 3) - ma(nz, 24)) * np.exp(-t3 * 22) * 0.55
    def tone(f, d, harm=6, dec=0.0):
        tt = np.arange(int(d * sr)) / sr
        sg = sum(np.sin(2 * np.pi * f * h * tt) / h for h in range(1, harm + 1))
        env = np.minimum(1, tt / 0.006) * np.minimum(1, np.maximum(0, d - tt) / 0.03)
        if dec: env = env * np.exp(-tt * dec)
        return sg * env
    chords = [(220, 261.63, 329.63), (174.61, 220, 261.63), (261.63, 329.63, 392), (196, 246.94, 293.66)]
    bass = [55, 43.65, 65.41, 49]; bar = 4 * beat
    for b in range(int(dur / beat) + 1):
        tb = b * beat; drop = impact - 2.0 <= tb < impact; ci = int(tb // (2 * bar)) % 4
        if not drop and tb < dur - 2.0: add(kick, tb, 0.9)
        add(hat_o, tb + beat / 2, 0.5 if drop else 1)
        for q in (0.25, 0.75): add(hat_c, tb + q * beat)
        if b % 2 == 1 and not drop: add(clap, tb)
        if not drop and tb < dur - 2.0: add(tone(bass[ci], beat * 0.42, 4, 5) * 0.32, tb + beat / 2)
    for c in range(int(dur // (2 * bar)) + 1):
        t0 = c * 2 * bar; d = min(2 * bar, dur - t0)
        if d <= 0.05: break
        pad = sum(tone(f, d, 5) + tone(f * 1.005, d, 5) for f in chords[c % 4]) * 0.03
        pad *= np.minimum(1, np.arange(len(pad)) / (sr * 0.5)); add(pad, t0)
    rd = 2.0; tt = np.arange(int(rd * sr)) / sr; rn = rng.standard_normal(len(tt))
    riser = (rn - ma(rn, 3)) * (tt / rd) ** 2 * 0.22 + np.sin(2 * np.pi * np.cumsum(200 + 900 * (tt / rd) ** 2) / sr) * (tt / rd) ** 2 * 0.07
    add(riser, impact - rd)
    ti = np.arange(int(2.0 * sr)) / sr; ni = rng.standard_normal(len(ti))
    add(np.sin(2 * np.pi * 48 * ti) * np.exp(-ti * 2.5) * 0.9 + ma(ni, 14) * np.exp(-ti * 4) * 0.6, impact)
    tw_ = np.arange(int(0.7 * sr)) / sr; nw = ma(rng.standard_normal(len(tw_)), 5)
    add(nw * np.sin(np.pi * tw_ / 0.7) ** 2 * 0.35, 5.75)
    out *= np.minimum(1, np.maximum(0, dur - np.arange(n) / sr) / 2.5)
    out = out / np.max(np.abs(out)) * 0.89
    pcm = (np.column_stack([out, out]) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())

R = {
    "1": Reel("MindMerit_Reel_1",
              [("IMG_6704", 0.0, "KV FRACHT"), ("IMG_6709", 0.6, "WENDLAND BIBLIOTHEK"), ("IMG_6712", 0.0, "RUNWAY"),
               ("IMG_6704", 2.0, "KV FRACHT"), ("IMG_6709", 3.6, "WENDLAND BIBLIOTHEK"), ("IMG_6712", 1.6, "RUNWAY")],
              [("IMG_6704", "KV Fracht"), ("IMG_6709", "Wendland Bibliothek"), ("IMG_6712", "Runway")]),
    "2": Reel("MindMerit_Reel_2",
              [("IMG_6711", 0.0, "TIEFENPFAD"), ("IMG_6721", 0.6, "NECTARLINE"), ("IMG_6711", 3.4, "TIEFENPFAD"),
               ("IMG_6721", 4.4, "NECTARLINE"), ("IMG_6711", 7.0, "TIEFENPFAD"), ("IMG_6721", 8.2, "NECTARLINE")],
              [("IMG_6711", "Tiefenpfad"), ("IMG_6721", "Nectarline"), ("IMG_6709", "Wendland Bibliothek")]),
}
for k in (sys.argv[1:] or ["1", "2"]): R[k].render()
print("ok")
