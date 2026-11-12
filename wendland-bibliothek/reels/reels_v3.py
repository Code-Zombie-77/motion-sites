"""Mind-Merit reels v3: shared hook (typed gradient-glow headline, MOTION font-cycling with shutters,
3D orbiting site cards, word-by-word full-screen punches) -> main montage reel + one reel per website."""
import subprocess, os, sys, math, json, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs("out", exist_ok=True)
W, H, FPS, SR = 1080, 1920, 30, 44100
FD = "C:\\Windows\\Fonts\\"; FB = FD + "segoeuib.ttf"
ORANGE = (238, 98, 40); CREAM = (242, 236, 228)
LOGO = r"C:\Users\PC\AppData\Local\Temp\claude\5e3cb61bb2ef9af0\8e9580ad-3f0c-4ed0-a775-be4801e596e3\images\2.png"
SFX = "C:\\Users\\PC\\.claude\\skills\\sound-effects\\sfx\\"
MUSIC = "audio/music_130.mp3"
SITES = ["IMG_6704", "IMG_6709", "IMG_6712", "IMG_6711", "IMG_6721"]
RECS = ["wb", "nl", "rw", "tp", "kw", "kv"]   # clean browser recordings (rec/*.webm) for the orbit cards
random.seed(3)

_fc = {}
def font(p, s):
    s = max(8, int(s))
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def eob(x): x = clamp(x); c1 = 1.70158; c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def seg(t, a, b): return clamp((t - a) / (b - a))
def lerp(a, b, u): return a + (b - a) * u

def ac(im, src, x, y):
    x, y = int(round(x)), int(round(y))
    l, t = max(0, -x), max(0, -y); r, b = min(src.width, W - x), min(src.height, H - y)
    if r <= l or b <= t: return
    if (l, t, r, b) != (0, 0, src.width, src.height): src = src.crop((l, t, r, b))
    im.alpha_composite(src, (x + l, y + t))
def amul(img, a):
    if a >= 0.999: return img
    img = img.copy(); img.putalpha(img.getchannel("A").point(lambda v: int(v * a))); return img
def rr_mask(w, h, r):
    m = Image.new("L", (w * 3, h * 3), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), max(1, r * 3), fill=255)
    return m.resize((w, h), Image.LANCZOS)

class Reader:
    def __init__(s, path, ss, w, h):
        s.w, s.h, s.n, s.last = w, h, 0, None
        s.p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{ss:.3f}", "-i", path, "-vf", f"fps={FPS},scale={w}:{h}:flags=lanczos",
                                "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10 ** 8)
    def get(s, idx):
        while s.n <= idx:
            b = s.p.stdout.read(s.w * s.h * 3)
            if len(b) < s.w * s.h * 3: break
            s.last = Image.frombytes("RGB", (s.w, s.h), b); s.n += 1
        return s.last
    def close(s):
        try: s.p.kill()
        except Exception: pass
def nframes(path):
    return int(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets",
                               "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip())

# ---------------- audio helpers ----------------
def load_audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
_ac = {}
def sfx(name):
    if name not in _ac:
        a = load_audio(SFX + name); pk = np.abs(a).max() or 1; _ac[name] = a / pk
    return _ac[name]
def keystrokes():
    a = sfx("typing/fs-447909-keyboard-typing.ogg"); m = np.abs(a.mean(1))
    env = np.convolve(m, np.ones(88) / 88, mode="same"); thr = env.max() * 0.35
    peaks, last = [], -10 ** 9
    for i in range(1, len(env) - 1):
        if env[i] > thr and env[i] >= env[i - 1] and env[i] >= env[i + 1] and i - last > SR * 0.09:
            peaks.append(i); last = i
    out = []
    for p in peaks[:20]:
        s0 = max(0, p - int(SR * 0.006)); sl = a[s0:s0 + int(SR * 0.09)].copy()
        sl *= np.linspace(1, 0, len(sl))[:, None] ** 1.5; out.append(sl / (np.abs(sl).max() or 1))
    return out

def beat_grid():
    a = load_audio(MUSIC).mean(1)
    lo = np.convolve(a, np.ones(220) / 220, mode="same")  # < ~200 Hz
    hop = 44; env = np.sqrt(np.convolve(lo[: len(lo) // hop * hop].reshape(-1, hop).__pow__(2).mean(1), np.ones(10) / 10, mode="same"))
    on = np.maximum(0, np.diff(env, prepend=env[0]))
    fr = SR / hop
    best = None
    for bpm in np.arange(115, 131, 0.05):
        per = fr * 60 / bpm; idx = np.arange(0, len(on) - 1, per)
        sc = max(on[(idx + ph).astype(int).clip(0, len(on) - 1)].sum() for ph in np.arange(0, per, per / 24))
        if best is None or sc > best[0]: best = (sc, bpm)
    bpm = best[1]; per = fr * 60 / bpm
    phs = np.arange(0, per, 1.0)
    scores = [on[(np.arange(0, len(on) - 1, per) + ph).astype(int).clip(0, len(on) - 1)].sum() for ph in phs]
    phase = phs[int(np.argmax(scores))] / fr
    cs = np.concatenate([[0], np.cumsum(a.astype(np.float64) ** 2)]); st = SR // 10
    rms = np.array([math.sqrt((cs[min(len(a), i + SR)] - cs[i]) / SR) for i in range(0, len(a), st)])
    return bpm, phase, rms, len(a) / SR

BPM, PHASE, MRMS, MDUR = beat_grid()
B = 60.0 / BPM
print(f"music: {BPM:.2f} BPM, first beat {PHASE:.3f}s")

# ---------------- background ----------------
BW, BH = 108, 192
gyy, gxx = np.mgrid[0:BH, 0:BW].astype(np.float32)
GRID = Image.new("L", (W + 120, H + 120), 0); gd = ImageDraw.Draw(GRID)
for x in range(0, W + 120, 120): gd.line((x, 0, x, H + 120), fill=255)
for y in range(0, H + 120, 120): gd.line((0, y, W + 120, y), fill=255)
rng = np.random.default_rng(1)
GRAIN = Image.fromarray(rng.integers(0, 255, (H, W), dtype=np.uint8)); GRAIN_RGBA = Image.merge("RGBA", (GRAIN, GRAIN, GRAIN, Image.new("L", (W, H), 7)))
def bg(t, pulse=0.0):
    img = np.zeros((BH, BW, 3), np.float32) + np.array([8, 4, 4], np.float32)
    e = 1.0 + 0.5 * pulse
    for col, cx, cy, r, a in [(ORANGE, 0.5 + 0.42 * math.sin(t * 0.47), 0.18 + 0.12 * math.sin(t * 0.37 + 1), 30, 0.34),
                              ((170, 32, 18), 0.5 + 0.45 * math.sin(t * 0.29 + 2.2), 0.84 + 0.10 * math.cos(t * 0.41), 40, 0.45),
                              ((255, 150, 60), 0.5 + 0.44 * math.cos(t * 0.53 + 0.7), 0.5 + 0.34 * math.sin(t * 0.23 + 3), 22, 0.16)]:
        d2 = (gxx - cx * BW) ** 2 + (gyy - cy * BH) ** 2
        img += np.array(col, np.float32) * (a * e * np.exp(-d2 / (2 * r * r)))[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).convert("RGBA")
    ox, oy = int(t * 9) % 120, int(t * 5) % 120
    a = 10 + 4 * math.sin(2 * math.pi * t / 4.0)
    im.paste((255, 255, 255, 255), (0, 0), GRID.crop((ox, oy, ox + W, oy + H)).point([int(v * a / 255) for v in range(256)]))
    im.alpha_composite(GRAIN_RGBA)
    return im

# ---------------- headline layout ----------------
LINES = ["3D", "MOTION", "WEBSITES"]
def fit(word, fp, wmax, s=400):
    while font(fp, s).getlength(word) > wmax: s -= 2
    return s
SZ = [fit("MOTION", FB, 860), fit("MOTION", FB, 860), fit("WEBSITES", FB, 860)]
asc = [font(FB, s).getmetrics()[0] for s in SZ]
capH = [font(FB, s).getbbox("H")[3] - font(FB, s).getbbox("H")[1] for s in SZ]
GAP = 46
total = sum(capH) + 2 * GAP; ytop = 960 - total / 2
BASE = []; yc = ytop
for i in range(3): yc += capH[i]; BASE.append(yc); yc += GAP
LINE_CY = [BASE[i] - capH[i] / 2 for i in range(3)]
REG_Y0 = int(ytop - 170); REG_H = int(total + 340)
LETTERS = []; k = 0
for li, word in enumerate(LINES):
    f = font(FB, SZ[li]); x0 = 540 - f.getlength(word) / 2
    for ci, ch in enumerate(word):
        x = x0 + f.getlength(word[:ci]); a_, d_ = f.getmetrics()
        g = Image.new("L", (int(f.getlength(ch)) + 60, a_ + d_ + 60), 0)
        ImageDraw.Draw(g).text((30, a_ + 30), ch, font=f, fill=255, anchor="ls")
        LETTERS.append(dict(li=li, x=x - 30, y=BASE[li] - a_ - 30 - REG_Y0, g=g, t0=0.25 + k * 0.062)); k += 1
TYPE_END = LETTERS[-1]["t0"] + 0.15

def letters_mask(t, skip=None):
    m = Image.new("L", (W, REG_H), 0)
    for L in LETTERS:
        if L["li"] == skip: continue
        dt = t - L["t0"]
        if dt < 0: continue
        p = clamp(dt / 0.16); s = 1.35 - 0.35 * eob(p); a = clamp(dt / 0.06)
        g = L["g"]
        if abs(s - 1) > 0.01:
            gs = g.resize((max(1, int(g.width * s)), max(1, int(g.height * s))), Image.BILINEAR)
            x = L["x"] + g.width / 2 - gs.width / 2; y = L["y"] + g.height / 2 - gs.height / 2
        else: gs, x, y = g, L["x"], L["y"]
        m.paste(int(255 * a), (int(x), int(y)), gs)
    return m
_full_masks = {}
def full_mask(skip=None):
    if skip not in _full_masks: _full_masks[skip] = letters_mask(99, skip)
    return _full_masks[skip]

PAL = np.array([CREAM, CREAM, (255, 214, 170), (250, 150, 90), ORANGE, (250, 150, 90), (255, 214, 170), CREAM], np.float32)
def grad(t, w, h):
    gw, gh = max(2, w // 4), max(2, h // 4)
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    ph = ((xx * 0.8 + yy * 0.6) / (270 * 1.3) + t * 0.28) % 1.0
    idx = ph * (len(PAL) - 1); i0 = np.floor(idx).astype(int); f = (idx - i0)[..., None]
    col = PAL[i0] * (1 - f) + PAL[np.minimum(i0 + 1, len(PAL) - 1)] * f
    return Image.fromarray(col.astype(np.uint8)).resize((w, h), Image.BILINEAR)
def shine_band(w, h, pos, width=0.05):
    gw, gh = w // 4, h // 4
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    u = (xx / gw) * 0.8 + (yy / max(gw, 1)) * 0.45
    b = np.exp(-((u - pos) ** 2) / (2 * width ** 2)) * 255
    return Image.fromarray(b.astype(np.uint8)).resize((w, h), Image.BILINEAR)
def text_layer(mask, t, glow=1.0, shine=None):
    w, h = mask.size
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if glow > 0:
        sm = mask.resize((w // 4, h // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(7)).resize((w, h), Image.BILINEAR)
        gl = Image.new("RGBA", (w, h), ORANGE + (0,)); gl.putalpha(sm.point(lambda v: min(255, int(v * 0.85 * glow)))); lay.alpha_composite(gl)
    fill = grad(t, w, h).convert("RGBA"); fill.putalpha(mask); lay.alpha_composite(fill)
    if shine is not None and -0.2 < shine < 1.6:
        sb = ImageChops.multiply(shine_band(w, h, shine), mask)
        wl = Image.new("RGBA", (w, h), (255, 250, 244, 0)); wl.putalpha(sb.point(lambda v: int(v * 0.9))); lay.alpha_composite(wl)
    return lay

# ---------------- MOTION style variants ----------------
def variant(fp, style):
    s = fit("MOTION", fp, 860, 330)
    while True:
        bb = font(fp, s).getbbox("MOTION", anchor="mm")
        if bb[3] - bb[1] <= 300: break
        s -= 4
    f = font(fp, s); cw, ch = 1080, 520
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).text((540, 260), "MOTION", font=f, fill=255, anchor="mm")
    lay = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    def solid(col, mask):
        l = Image.new("RGBA", (cw, ch), col + (0,)); l.putalpha(mask); return l
    def pattern(kind):
        p = Image.new("RGB", (cw, ch), ORANGE); d = ImageDraw.Draw(p)
        if kind == "stripes":
            for x in range(-ch, cw, 34): d.polygon([(x, 0), (x + 16, 0), (x + 16 + ch, ch), (x + ch, ch)], fill=CREAM)
        elif kind == "dots":
            for y in range(0, ch, 18):
                for x in range((y // 18) % 2 * 9, cw, 18): d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=CREAM)
        elif kind == "checker":
            for y in range(0, ch, 28):
                for x in range(0, cw, 28):
                    if (x // 28 + y // 28) % 2: d.rectangle((x, y, x + 27, y + 27), fill=(200, 52, 26))
        return p.convert("RGBA")
    glow_m = m.filter(ImageFilter.GaussianBlur(22)); lay.alpha_composite(solid(ORANGE, glow_m.point(lambda v: int(v * 0.7))))
    if style in ("extrude", "extrude2"):
        dep = 24
        for d_ in range(dep, 0, -1):
            u = 1 - d_ / dep
            c0, c1 = ((70, 20, 10), (190, 64, 28)) if style == "extrude" else ((90, 70, 60), (215, 196, 178))
            col = tuple(int(lerp(a, b, u)) for a, b in zip(c0, c1))
            lay.alpha_composite(solid(col, ImageChops.offset(m, int(d_ * 0.9), int(d_ * 1.3))))
        lay.alpha_composite(solid(CREAM if style == "extrude" else ORANGE, m))
    elif style in ("flat", "flat_o"): lay.alpha_composite(solid(CREAM if style == "flat" else ORANGE, m))
    elif style in ("grad", "grad2"):
        g = grad(0.1 if style == "grad" else 0.55, cw, ch).convert("RGBA"); g.putalpha(m); lay.alpha_composite(g)
    elif style in ("outline", "outline_g"):
        so = Image.new("L", (cw, ch), 0); ImageDraw.Draw(so).text((540, 260), "MOTION", font=f, fill=255, anchor="mm", stroke_width=6, stroke_fill=255)
        ring = ImageChops.subtract(so, m.filter(ImageFilter.MinFilter(3)))
        if style == "outline_g": lay.alpha_composite(solid(CREAM, m.point(lambda v: int(v * 0.18))))
        lay.alpha_composite(solid(CREAM if style == "outline" else ORANGE, ring))
    elif style in ("stripes", "dots", "checker"):
        p = pattern(style); p.putalpha(m); lay.alpha_composite(p)
    elif style == "glow":
        lay.alpha_composite(solid(ORANGE, m.filter(ImageFilter.GaussianBlur(10)))); lay.alpha_composite(solid((255, 214, 170), m))
    return lay
VSPEC = [("impact.ttf", "extrude"), ("georgiaz.ttf", "grad"), ("consolab.ttf", "outline"), ("ariblk.ttf", "stripes"),
         ("segoescb.ttf", "glow"), ("bahnschrift.ttf", "dots"), ("timesbd.ttf", "extrude2"), ("Inkfree.ttf", "flat_o"),
         ("trebucbd.ttf", "outline_g"), ("courbd.ttf", "checker"), ("seguibl.ttf", "flat"), ("verdanab.ttf", "grad2")]
VARS = [variant(FD + f, s) for f, s in VSPEC]

# ---------------- hook timing (beat-locked) ----------------
T0 = 3.70                      # first word punch (on a beat)
C0 = T0 - 5 * B                # font cycling start
CSTEP = B / 4; CEND = C0 + len(VARS) * CSTEP
T_SITE = T0 + 3 * B            # website reveal
FS_FULL = [fit(w, FB, 1000, 1400) for w in LINES]

# ---------------- orbit cards ----------------
CWc, CHc = 190, 338
CMASK = rr_mask(CWc, CHc, 18)
def find_coeffs(dst, src):
    A, Bv = [], []
    for (x, y), (X, Y) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); Bv += [X, Y]
    return np.linalg.solve(np.array(A, float), np.array(Bv, float)).tolist()
def persp(img, yaw):
    w, h = img.size; a = math.radians(yaw); f = 900.0; pts = []
    for x, y in [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]:
        X = x * math.cos(a); Z = x * math.sin(a); k = f / (f + Z); pts.append((X * k, y * k))
    mx, my = min(p[0] for p in pts), min(p[1] for p in pts)
    ow, oh = int(math.ceil(max(p[0] for p in pts) - mx)) + 1, int(math.ceil(max(p[1] for p in pts) - my)) + 1
    co = find_coeffs([(p[0] - mx, p[1] - my) for p in pts], [(0, 0), (w, 0), (w, h), (0, h)])
    return img.transform((ow, oh), Image.PERSPECTIVE, co, Image.BICUBIC), mx, my
_lut = {}
def dim(img, b):
    q = round(b * 20) / 20
    if q not in _lut: _lut[q] = [int(v * q) for v in range(256)] * 3
    return img.point(_lut[q])

class Hook:
    def __init__(s):
        s.cr = [None] * len(RECS)
    def cards(s, t):
        """returns list of (depth, rgba, x, y)"""
        out = []
        if t < 0.55 or t > T0 + 0.5: return out
        fly = eio(seg(t, T0 - 0.05, T0 + 0.4))
        nC = len(RECS)
        for i, key in enumerate(RECS):
            ta = 0.6 + 0.1 * i
            if t < ta: continue
            if s.cr[i] is None: s.cr[i] = Reader(f"rec/{key}.webm", 2.6 + (i % 3) * 0.8, CWc, CHc)
            fr = s.cr[i].get(int((t - ta) * FPS))
            th = 2 * math.pi * i / nC + 0.85 * t - 1.2
            rx, ry = 500 * (1 + 1.4 * fly), 600 * (1 + 1.0 * fly)
            x = 540 + rx * math.cos(th); y = 960 + ry * math.sin(th); depth = math.sin(th)
            sc = (0.62 + 0.38 * (depth + 1) / 2) * eob(seg(t, ta, ta + 0.35)) * (1 + 0.4 * fly)
            if sc < 0.05: continue
            card = Image.new("RGBA", (CWc, CHc), (0, 0, 0, 0))
            card.paste(dim(fr, 0.6 + 0.4 * (depth + 1) / 2), (0, 0), CMASK)
            ImageDraw.Draw(card).rounded_rectangle((0, 0, CWc - 1, CHc - 1), 18, outline=(255, 214, 190, 120), width=2)
            card = card.resize((max(2, int(CWc * sc)), max(2, int(CHc * sc))), Image.BILINEAR)
            pc, mx, my = persp(card, -math.cos(th) * 55)
            out.append((depth, amul(pc, 1 - fly), x + mx, y + my))
        return sorted(out, key=lambda c: c[0])
    def frame(s, t):
        im = bg(t, pulse=max(0, 1 - abs(t - CEND) / 0.3) if t < T0 else 0)
        cs = s.cards(t)
        for d, c, x, y in cs:
            if d < 0: ac(im, c, x, y)
        if t < T0:
            cyc = C0 <= t < CEND
            fade_out = 1.0
            if t >= TYPE_END: m = full_mask(1 if cyc else None)
            else: m = letters_mask(t, 1 if cyc else None)
            shine = (t - CEND) / 0.6 * 1.6 - 0.2 if t >= CEND else ((t - 1.0) / 0.5 * 1.6 - 0.2 if t < C0 + 0.2 else None)
            ac(im, text_layer(m, t, glow=0.9 + 0.3 * max(0, 1 - abs(t - CEND) / 0.4), shine=shine), 0, REG_Y0)
            if cyc:
                j = int((t - C0) / CSTEP); u = (t - C0 - j * CSTEP) / CSTEP
                v = VARS[j]; sc = 1.0 + 0.08 * (1 - eo(u * 2.5))
                if abs(sc - 1) > 0.005: v = v.resize((int(v.width * sc), int(v.height * sc)), Image.BILINEAR)
                ac(im, v, 540 - v.width / 2, LINE_CY[1] - v.height / 2)
            if t < TYPE_END and int(t * 6) % 2 == 0:
                last = [L for L in LETTERS if L["t0"] <= t]
                if last:
                    L = last[-1]; li = L["li"]; f = font(FB, SZ[li])
                    xr = L["x"] + 30 + f.getlength(LINES[li][[l for l in LETTERS if l["li"] == li].index(L)])
                    ImageDraw.Draw(im).rectangle((xr + 8, BASE[li] - capH[li], xr + 16, BASE[li] + 8), fill=CREAM + (255,))
        else:
            if t < T0 + 0.18:
                m = full_mask(0).point(lambda v: int(v * (1 - seg(t, T0, T0 + 0.18))))
                ac(im, text_layer(m, t), 0, REG_Y0)
            k = int((t - T0) / B)
            if k < 3:
                u = (t - T0 - k * B) / B; word = LINES[k]
                fs_l = SZ[k]; fs_f = FS_FULL[k]
                a = 1.0
                if u < 0.45:
                    e = eo(u / 0.45)
                    if k == 0: fs = lerp(fs_l, fs_f, e); cy = lerp(LINE_CY[0], 960, e)
                    else: fs = lerp(0.55 * fs_f, fs_f, e); cy = 960; a = eo(u / 0.2)
                elif u < 0.8: fs = fs_f * (1 + 0.04 * (u - 0.45) / 0.35); cy = 960
                else: fs = fs_f * 1.04 * (1 + 1.1 * eio((u - 0.8) / 0.2)); cy = 960; a = 1 - (u - 0.8) / 0.2
                m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).text((540, cy), word, font=font(FB, fs), fill=int(255 * a), anchor="mm")
                ac(im, text_layer(m, t, glow=1.1, shine=(u - 0.35) / 0.4 * 1.6 - 0.2), 0, 0)
        for d, c, x, y in cs:
            if d >= 0: ac(im, c, x, y)
        if t < 0.3: im = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), im, eo(t / 0.3))
        return im
    def close(s):
        for r in s.cr:
            if r: r.close()

def hook_sfx(ev):
    ks = keystrokes()
    for i, L in enumerate(LETTERS): ev.append((L["t0"], ks[i % len(ks)], 0.42))
    for i in range(len(RECS)): ev.append((0.6 + 0.1 * i, "pop/kenney-interface-pluck-00%d.ogg" % (1 + i % 2), 0.22))
    for j in range(len(VARS)):
        ev.append((C0 + j * CSTEP, "click/kenney-interface-toggle-00%d.ogg" % (1 + j % 2), 0.55))
        ev.append((C0 + j * CSTEP + 0.028, "tick/fs384187.ogg", 0.3))
    ev.append((CEND, "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.55))
    ev.append((CEND + 0.05, "ding/kenney-interface-glass-001.ogg", 0.22))
    ev.append(("END", T0, "riser/fs-685256-riser-sound-effect-short-wav.ogg", 0.4))
    ev.append((T0 - 0.07, "whoosh/fs-683101-quick-woosh.ogg", 0.6))
    for k, (w_, im_) in enumerate([("transition/fs-786514-swoosh-v2.ogg", "impact/kenney-impact-impactpunch-heavy-000.ogg"),
                                   ("whoosh/fs-127197-fast-simple-chop-5-aif.ogg", "impact/kenney-impact-impactsoft-heavy-001.ogg"),
                                   ("transition/fs-786514-swoosh-v2.ogg", "impact/kenney-impact-impactpunch-heavy-001.ogg")]):
        if k: ev.append((T0 + k * B - 0.06, w_, 0.5))
        ev.append((T0 + k * B + 0.16, im_, 0.5))
    ev.append((T_SITE - 0.08, "whoosh/fs-169867-swoosh.ogg", 0.6))
    ev.append((T_SITE + 0.42, "impact/fs-177242-cinematic-impact.ogg", 0.55))

# ---------------- site reveal + finale ----------------
def reveal(im, fr, p, t):
    """fr: full-size RGB frame; p 0..1 card->full screen"""
    e = eo(p); sc = lerp(0.3, 1.0, e)
    w, h = int(W * sc), int(H * sc)
    card = fr.resize((w, h), Image.BILINEAR).convert("RGBA")
    r = int(60 * (1 - e)); card.putalpha(rr_mask(w, h, r) if r > 1 else Image.new("L", (w, h), 255))
    sb = shine_band(w, h, p * 1.8 - 0.3, 0.06)
    wl = Image.new("RGBA", (w, h), (255, 248, 240, 0)); wl.putalpha(ImageChops.multiply(sb, card.getchannel("A")).point(lambda v: int(v * 0.45)))
    card.alpha_composite(wl)
    ac(im, card, 540 - w / 2, 960 - h / 2)
    return im

logo = Image.open(LOGO).convert("RGBA"); logo = logo.crop(logo.getbbox())
LH, PAD = 320, 160
L_ = logo.resize((round(logo.width * LH / logo.height), LH), Image.LANCZOS)
CWL, CHL = L_.width + 2 * PAD, L_.height + 2 * PAD
LC = Image.new("RGBA", (CWL, CHL), (0, 0, 0, 0)); LC.paste(L_, (PAD, PAD)); la = LC.getchannel("A")
bin_ = la.point(lambda v: 255 if v > 110 else 0)
EDGE = np.array(bin_.filter(ImageFilter.MaxFilter(5)), np.float32) - np.array(bin_.filter(ImageFilter.MinFilter(5)), np.float32)
yy_, xx_ = np.mgrid[0:CHL, 0:CWL]
ANG = ((np.arctan2(yy_ - CHL / 2, xx_ - CWL / 2) + math.pi / 2) % (2 * math.pi)) / (2 * math.pi)
GLOWA = np.array(la.filter(ImageFilter.GaussianBlur(40)), np.float32); LCA = np.array(la, np.float32)
def finale(t, gt):
    im = bg(gt, pulse=max(0, 1 - abs(t - 2.0) / 0.5))
    p = eio(seg(t, 0.25, 1.7)); fill = eo(seg(t, 1.3, 2.1))
    gl = eo(seg(t, 1.0, 2.2)) * (0.85 + 0.15 * math.cos(2 * math.pi * (t - 2.2) / 2.0) if t > 2.2 else 1)
    lay = Image.new("RGBA", (CWL, CHL), (0, 0, 0, 0))
    if gl > 0:
        g = Image.new("RGBA", (CWL, CHL), ORANGE + (0,)); g.putalpha(Image.fromarray(np.clip(GLOWA * gl, 0, 255).astype(np.uint8))); lay.alpha_composite(g)
    if p > 0:
        sa = Image.fromarray(np.clip(EDGE * (ANG <= p) * (1 - 0.75 * fill), 0, 255).astype(np.uint8))
        sg = Image.new("RGBA", (CWL, CHL), ORANGE + (0,)); sg.putalpha(sa.filter(ImageFilter.GaussianBlur(9)).point(lambda v: min(255, v * 2))); lay.alpha_composite(sg)
        st = Image.new("RGBA", (CWL, CHL), CREAM + (0,)); st.putalpha(sa); lay.alpha_composite(st)
    if fill > 0:
        f2 = LC.copy(); f2.putalpha(Image.fromarray((LCA * fill).astype(np.uint8))); lay.alpha_composite(f2)
    sh = seg(t, 2.1, 2.8)
    if 0 < sh < 1:
        sb = ImageChops.multiply(shine_band(CWL, CHL, sh * 1.8 - 0.3, 0.05), la)
        wl = Image.new("RGBA", (CWL, CHL), (255, 250, 244, 0)); wl.putalpha(sb); lay.alpha_composite(wl)
    sc = 0.92 + 0.08 * eo(seg(t, 0.25, 2.6))
    lay = lay.resize((int(CWL * sc), int(CHL * sc)), Image.BICUBIC)
    ac(im, lay, 540 - lay.width / 2, 880 - lay.height / 2)
    uo = eo(seg(t, 2.4, 3.0))
    if uo > 0:
        l2 = Image.new("RGBA", (W, 140), (0, 0, 0, 0)); d = ImageDraw.Draw(l2)
        d.rounded_rectangle((290, 20, 790, 120), 50, outline=(150, 96, 80, int(255 * uo)), width=3)
        d.text((540, 70), "www.mind-merit.com", font=font(FB.replace("segoeuib", "segoeui"), 38), fill=CREAM + (int(255 * uo),), anchor="mm")
        ac(im, l2, 0, 1180 + 24 * (1 - uo))
    return im

# ---------------- reels ----------------
def encoder(path):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)

def render_single(site, name):
    nf = nframes(f"clips/trk_{site}.mp4"); total = T_SITE + nf / FPS
    hk = Hook(); rd = Reader(f"clips/trk_{site}.mp4", 0, W, H)
    enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < T_SITE: im = hk.frame(t)
        else:
            fr = rd.get(int((t - T_SITE) * FPS)); p = seg(t, T_SITE, T_SITE + 0.5)
            im = reveal(bg(t), fr, p, t) if p < 1 else fr.convert("RGBA")
        if t > total - 0.4: im = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), im, clamp((total - t) / 0.4))
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait(); hk.close(); rd.close()
    ev = []; hook_sfx(ev)
    return total, ev

MAIN_SHOTS = [("IMG_6704", 0.0), ("IMG_6709", 0.3), ("IMG_6712", 0.0), ("IMG_6711", 6.0), ("IMG_6721", 3.0)]
SHOT = 6 * B; TR = 0.36
def render_main(name):
    cuts = [T_SITE + SHOT * i for i in range(1, len(MAIN_SHOTS))]
    T_FIN = T_SITE + SHOT * len(MAIN_SHOTS); total = T_FIN + 4.0
    starts = [T_SITE] + cuts
    hk = Hook(); rds = [None] * len(MAIN_SHOTS)
    def shot(i, t):
        if rds[i] is None: rds[i] = Reader(f"clips/trk_{MAIN_SHOTS[i][0]}.mp4", MAIN_SHOTS[i][1], W, H)
        return rds[i].get(max(0, int((t - starts[i]) * FPS)))
    def zoom(fr, s):
        w, h = int(W * s), int(H * s); z = fr.resize((w, h), Image.BILINEAR)
        return z.crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H))
    enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < T_SITE: im = hk.frame(t)
        elif t < T_FIN + 0.3:
            i = max(j for j in range(len(starts)) if starts[j] - TR / 2 <= t) if t >= starts[0] else 0
            i = min(i, len(MAIN_SHOTS) - 1)
            if t < T_SITE + 0.5: im = reveal(bg(t), shot(0, t), seg(t, T_SITE, T_SITE + 0.5), t)
            elif i > 0 and t < starts[i] + TR / 2:
                p = seg(t, starts[i] - TR / 2, starts[i] + TR / 2)
                A = zoom(shot(i - 1, t), 1 + 0.22 * eio(p)); Bf = zoom(shot(i, t), 1.14 - 0.14 * eo(p))
                im = Image.blend(A, Bf, eio(p)).convert("RGBA")
                sb = shine_band(W, H, p * 1.9 - 0.4, 0.07)
                wl = Image.new("RGBA", (W, H), (255, 236, 220, 0)); wl.putalpha(sb.point(lambda v: int(v * 0.4 * math.sin(math.pi * p)))); im.alpha_composite(wl)
            else: im = shot(i, t).convert("RGBA")
            if t > T_FIN - 0.3:
                im = Image.blend(im, finale(t - (T_FIN - 0.3), t), eio(seg(t, T_FIN - 0.3, T_FIN + 0.3)))
        else: im = finale(t - (T_FIN - 0.3), t)
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait(); hk.close()
    for r in rds:
        if r: r.close()
    ev = []; hook_sfx(ev)
    sw = ["transition/fs-702773-swipe-wav.ogg", "whoosh/fs-683101-quick-woosh.ogg", "transition/fs-683096-woosh.ogg", "whoosh/fs810485.ogg"]
    for j, c in enumerate(cuts): ev.append((c - TR / 2 - 0.05, sw[j % 4], 0.5))
    ev.append((T_FIN - 0.35, "whoosh/fs-264777-swoosh.ogg", 0.45))
    ev.append((T_FIN - 0.3 + 2.0, "impact/fs-177242-cinematic-impact.ogg", 0.55))
    ev.append((T_FIN - 0.3 + 2.15, "ding/kenney-interface-glass-002.ogg", 0.25))
    ev.append((T_FIN - 0.3 + 2.45, "pop/kenney-interface-pluck-001.ogg", 0.25))
    return total, ev

def mix_and_mux(name, total, ev):
    n = int(total * SR) + SR; bus = np.zeros((n, 2), np.float32)
    for e in ev:
        if e[0] == "END": _, tend, s, g = e; a = sfx(s); t0 = tend - len(a) / SR
        else:
            t0, s, g = e; a = s if isinstance(s, np.ndarray) else sfx(s)
            if a.ndim == 1: a = np.stack([a, a], 1)
        i = int(max(0, t0) * SR); j = min(n, i + len(a)); bus[i:j] += a[: j - i] * g
    mus = load_audio(MUSIC); mus /= np.abs(mus).max()
    # pick the loudest stretch of the track, then snap so a beat lands on T0
    need = total + 0.5; cand = np.arange(8.0, max(8.1, MDUR - need), 0.5)
    sc = [MRMS[int(c * 10):int((c + need) * 10)].mean() for c in cand]
    o = cand[int(np.argmax(sc))]
    o = PHASE + round((o + T0 - PHASE) / B) * B - T0
    o = max(0.0, o)
    m = mus[int(o * SR): int(o * SR) + n]; m = np.pad(m, ((0, n - len(m)), (0, 0)))
    tt = np.arange(n) / SR
    m *= (np.minimum(1, tt / 0.25) * np.clip((total - tt) / 1.2, 0, 1))[:, None]
    for tag, audio in (("", bus + m * 0.32), ("_SFX-only", bus)):
        audio = audio[: int(total * SR)]
        raw = f"out/{name}{tag}.f32"; audio.astype(np.float32).tofile(raw)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"out/{name}_v.mp4", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw,
                        "-af", "loudnorm=I=-16:TP=-4:LRA=11", "-ar", "48000",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", f"out/{name}{tag}.mp4"], check=True)
        os.remove(raw)
    os.remove(f"out/{name}_v.mp4")
    print(name, "music offset", round(o, 2))

JOBS = {
    "main": lambda: ("MindMerit_Main_Reel", render_main("MindMerit_Main_Reel")),
    "kv": lambda: ("MindMerit_KV-Fracht", render_single("IMG_6704", "MindMerit_KV-Fracht")),
    "wb": lambda: ("MindMerit_Wendland-Bibliothek", render_single("IMG_6709", "MindMerit_Wendland-Bibliothek")),
    "rw": lambda: ("MindMerit_Runway", render_single("IMG_6712", "MindMerit_Runway")),
    "tp": lambda: ("MindMerit_Tiefenpfad", render_single("IMG_6711", "MindMerit_Tiefenpfad")),
    "nl": lambda: ("MindMerit_Nectarline", render_single("IMG_6721", "MindMerit_Nectarline")),
}
if __name__ == "__main__":
    for k in (sys.argv[1:] or JOBS.keys()):
        nm, (tot, ev) = JOBS[k](); mix_and_mux(nm, tot, ev)
    print("ok")
