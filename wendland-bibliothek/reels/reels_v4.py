"""Mind-Merit reels v4.
Hook: Poppins '3D' / 'WEBSITES' + hero 'MOTION' where every letter has its own font + 3D material (chrome, slime, water,
fire, glass, grass ...), rapid per-letter font/material cycling with shutters, a cursor that inflates each letter,
3D orbiting browser recordings, word-by-word full-screen punches. Then tracked website footage.
Main reel: Nectarline first, montage, futuristic logo finale + tagline. Single reels: one website each."""
import subprocess, os, sys, math, random
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import mats
os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs("out", exist_ok=True)
W, H, FPS, SR = 1080, 1920, 30, 44100
PSB, PB, PR = mats.fp("Poppins-SemiBold.ttf"), mats.fp("Poppins-Bold.ttf"), mats.fp("Poppins-Regular.ttf")
ORANGE = (238, 98, 40); CREAM = (242, 236, 228)
LOGO = r"C:\Users\PC\AppData\Local\Temp\claude\5e3cb61bb2ef9af0\8e9580ad-3f0c-4ed0-a775-be4801e596e3\images\2.png"
SFX = "C:\\Users\\PC\\.claude\\skills\\sound-effects\\sfx\\"
MUSIC = "audio/music_460.mp3"
RECS = ["nl", "wb", "rw", "tp", "kw", "kv"]
font = mats.font

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
    img = img.copy(); img.putalpha(img.getchannel("A").point(lambda v: int(v * max(0, a)))); return img
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

# ---------------- audio ----------------
def load_audio(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
_ac = {}
def sfx(name):
    if name not in _ac:
        a = load_audio(SFX + name); _ac[name] = a / (np.abs(a).max() or 1)
    return _ac[name]
def keystrokes():
    a = sfx("typing/fs-447909-keyboard-typing.ogg"); m = np.abs(a.mean(1))
    env = np.convolve(m, np.ones(88) / 88, mode="same"); thr = env.max() * 0.35
    peaks, last = [], -10 ** 9
    for i in range(1, len(env) - 1):
        if env[i] > thr and env[i] >= env[i - 1] and env[i] >= env[i + 1] and i - last > SR * 0.09: peaks.append(i); last = i
    out = []
    for p in peaks[:20]:
        s0 = max(0, p - int(SR * 0.006)); sl = a[s0:s0 + int(SR * 0.09)].copy()
        sl *= np.linspace(1, 0, len(sl))[:, None] ** 1.5; out.append(sl / (np.abs(sl).max() or 1))
    return out
def beat_grid():
    a = load_audio(MUSIC).mean(1)
    lo = np.convolve(a, np.ones(220) / 220, mode="same")
    hop = 44; n = len(lo) // hop * hop
    env = np.sqrt(np.convolve((lo[:n].reshape(-1, hop) ** 2).mean(1), np.ones(10) / 10, mode="same"))
    on = np.maximum(0, np.diff(env, prepend=env[0])); fr = SR / hop
    def score(bpm):
        per = fr * 60 / bpm; idx = np.arange(0, len(on) - 1, per)
        return max(on[(idx + ph).astype(int).clip(0, len(on) - 1)].sum() for ph in np.arange(0, per, per / 24))
    bpm = max(np.arange(70, 160, 0.05), key=score)
    while bpm < 95: bpm *= 2
    while bpm > 150: bpm /= 2
    per = fr * 60 / bpm
    sc = [on[(np.arange(0, len(on) - 1, per) + ph).astype(int).clip(0, len(on) - 1)].sum() for ph in np.arange(0, per, 1.0)]
    phase = float(np.argmax(sc)) / fr
    cs = np.concatenate([[0], np.cumsum(a.astype(np.float64) ** 2)])
    rms = np.array([math.sqrt((cs[min(len(a), i + SR)] - cs[i]) / SR) for i in range(0, len(a), SR // 10)])
    return bpm, phase, rms, len(a) / SR
BPM, PHASE, MRMS, MDUR = beat_grid(); B = 60.0 / BPM
print(f"music: {BPM:.2f} BPM, first beat {PHASE:.3f}s", flush=True)

# ---------------- background ----------------
BW, BH = 108, 192
gyy, gxx = np.mgrid[0:BH, 0:BW].astype(np.float32)
GRID = Image.new("L", (W + 120, H + 120), 0); gd = ImageDraw.Draw(GRID)
for x in range(0, W + 120, 120): gd.line((x, 0, x, H + 120), fill=255)
for y in range(0, H + 120, 120): gd.line((0, y, W + 120, y), fill=255)
_rng = np.random.default_rng(1)
GRAIN = Image.fromarray(_rng.integers(0, 255, (H, W), dtype=np.uint8)); GRAIN_RGBA = Image.merge("RGBA", (GRAIN, GRAIN, GRAIN, Image.new("L", (W, H), 7)))
def bg(t, pulse=0.0):
    img = np.zeros((BH, BW, 3), np.float32) + np.array([8, 4, 4], np.float32); e = 1.0 + 0.5 * pulse
    for col, cx, cy, r, a in [(ORANGE, 0.5 + 0.42 * math.sin(t * 0.47), 0.18 + 0.12 * math.sin(t * 0.37 + 1), 30, 0.34),
                              ((170, 32, 18), 0.5 + 0.45 * math.sin(t * 0.29 + 2.2), 0.84 + 0.10 * math.cos(t * 0.41), 40, 0.45),
                              ((255, 150, 60), 0.5 + 0.44 * math.cos(t * 0.53 + 0.7), 0.5 + 0.34 * math.sin(t * 0.23 + 3), 22, 0.16)]:
        d2 = (gxx - cx * BW) ** 2 + (gyy - cy * BH) ** 2
        img += np.array(col, np.float32) * (a * e * np.exp(-d2 / (2 * r * r)))[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).convert("RGBA")
    ox, oy = int(t * 9) % 120, int(t * 5) % 120; a = 10 + 4 * math.sin(2 * math.pi * t / 4.0)
    im.paste((255, 255, 255, 255), (0, 0), GRID.crop((ox, oy, ox + W, oy + H)).point([int(v * a / 255) for v in range(256)]))
    im.alpha_composite(GRAIN_RGBA)
    return im

# ---------------- gradient text helpers ----------------
PAL = np.array([CREAM, CREAM, (255, 214, 170), (250, 150, 90), ORANGE, (250, 150, 90), (255, 214, 170), CREAM], np.float32)
def grad(t, w, h):
    gw, gh = max(2, w // 4), max(2, h // 4)
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    ph = ((xx * 0.8 + yy * 0.6) / (270 * 1.3) + t * 0.28) % 1.0
    idx = ph * (len(PAL) - 1); i0 = np.floor(idx).astype(int); f = (idx - i0)[..., None]
    col = PAL[i0] * (1 - f) + PAL[np.minimum(i0 + 1, len(PAL) - 1)] * f
    return Image.fromarray(col.astype(np.uint8)).resize((w, h), Image.BILINEAR)
def shine_band(w, h, pos, width=0.05):
    gw, gh = max(2, w // 4), max(2, h // 4)
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
    u = (xx / gw) * 0.8 + (yy / max(gw, 1)) * 0.45
    return Image.fromarray((np.exp(-((u - pos) ** 2) / (2 * width ** 2)) * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
def text_layer(mask, t, glow=1.0, shine=None):
    w, h = mask.size; lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if glow > 0:
        sm = mask.resize((w // 4, h // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(7)).resize((w, h), Image.BILINEAR)
        gl = Image.new("RGBA", (w, h), ORANGE + (0,)); gl.putalpha(sm.point(lambda v: min(255, int(v * 0.85 * glow)))); lay.alpha_composite(gl)
    fill = grad(t, w, h).convert("RGBA"); fill.putalpha(mask); lay.alpha_composite(fill)
    if shine is not None and -0.2 < shine < 1.6:
        sb = ImageChops.multiply(shine_band(w, h, shine), mask)
        wl = Image.new("RGBA", (w, h), (255, 250, 244, 0)); wl.putalpha(sb.point(lambda v: int(v * 0.9))); lay.alpha_composite(wl)
    return lay
def fit(word, fp_, wmax, s=400):
    while font(fp_, s).getlength(word) > wmax: s -= 2
    return s

# ---------------- headline layout ----------------
SZW = fit("WEBSITES", PSB, 560)
capS = font(PSB, SZW).getbbox("H")[3] - font(PSB, SZW).getbbox("H")[1]
MC = 220; GAP = 64
total = capS + GAP + MC + GAP + capS; top = 960 - total / 2
LINE_CY = [top + capS / 2, top + capS + GAP + MC / 2, top + capS + GAP + MC + GAP + capS / 2]
BASE = {0: LINE_CY[0] + capS / 2, 2: LINE_CY[2] + capS / 2}
REG_Y0 = int(top - 150); REG_H = int(total + 300)
LETTERS = []; MOT_T = []; k = 0
for li, word in enumerate(["3D", "MOTION", "WEBSITES"]):
    for ci, ch in enumerate(word):
        t0 = 0.25 + k * 0.058; k += 1
        if li == 1: MOT_T.append(t0); continue
        f = font(PSB, SZW); x0 = 540 - f.getlength(word) / 2; x = x0 + f.getlength(word[:ci]); a_, d_ = f.getmetrics()
        g = Image.new("L", (int(f.getlength(ch)) + 60, a_ + d_ + 60), 0); ImageDraw.Draw(g).text((30, a_ + 30), ch, font=f, fill=255, anchor="ls")
        LETTERS.append(dict(li=li, ch=ch, x=x - 30, y=BASE[li] - a_ - 30 - REG_Y0, g=g, t0=t0, xr=x + f.getlength(ch)))
TYPE_END = 0.25 + (k - 1) * 0.058 + 0.15
def letters_mask(t):
    m = Image.new("L", (W, REG_H), 0)
    for L in LETTERS:
        dt = t - L["t0"]
        if dt < 0: continue
        p = clamp(dt / 0.16); s = 1.35 - 0.35 * eob(p); a = clamp(dt / 0.06); g = L["g"]
        if abs(s - 1) > 0.01:
            gs = g.resize((max(1, int(g.width * s)), max(1, int(g.height * s))), Image.BILINEAR)
            x = L["x"] + g.width / 2 - gs.width / 2; y = L["y"] + g.height / 2 - gs.height / 2
        else: gs, x, y = g, L["x"], L["y"]
        m.paste(int(255 * a), (int(x), int(y)), gs)
    return m
_FULLM = None
def full_mask():
    global _FULLM
    if _FULLM is None: _FULLM = letters_mask(99)
    return _FULLM

# ---------------- MOTION letters ----------------
FINAL_M = [("M", "Bungee-Regular.ttf", "chrome"), ("O", "RubikBubbles-Regular.ttf", "slime"), ("T", "AbrilFatface-Regular.ttf", "water"),
           ("I", "TitanOne-Regular.ttf", "fire"), ("O", "Chango-Regular.ttf", "glass"), ("N", "Shrikhand-Regular.ttf", "grass")]
TYPED_M = [(c, "Poppins-Bold.ttf", "balloon") for c in "MOTION"]
DISP = ["Bungee-Regular.ttf", "RubikBubbles-Regular.ttf", "AbrilFatface-Regular.ttf", "TitanOne-Regular.ttf", "Chango-Regular.ttf",
        "Shrikhand-Regular.ttf", "Monoton-Regular.ttf", "Pacifico-Regular.ttf", "Lobster-Regular.ttf", "BagelFatOne-Regular.ttf",
        "RubikMoonrocks-Regular.ttf", "RubikWetPaint-Regular.ttf", "RubikPuddles-Regular.ttf", "BungeeShade-Regular.ttf", "Creepster-Regular.ttf",
        "KaushanScript-Regular.ttf", "Righteous-Regular.ttf", "Fascinate-Regular.ttf", "BowlbyOne-Regular.ttf", "YesevaOne-Regular.ttf",
        "Frijole-Regular.ttf", "Modak-Regular.ttf", "Sniglet-ExtraBold.ttf", "RampartOne-Regular.ttf", "RubikVinyl-Regular.ttf",
        "ClimateCrisis.ttf", "RubikGlitch-Regular.ttf", "BungeeInline-Regular.ttf"]
PIX = ["PressStart2P-Regular.ttf", "Silkscreen-Bold.ttf", "VT323-Regular.ttf", "DotGothic16-Regular.ttf"]
MATL = ["chrome", "gold", "slime", "water", "glass", "fire", "rock", "grass", "balloon"]
_r = random.Random(42); CYCLE = []
for j in range(12):
    if j in (2, 6, 10): CYCLE.append([(c, _r.choice(PIX), "pixel") for c in "MOTION"])
    else:
        ms = _r.sample(MATL, 6); CYCLE.append([(c, _r.choice(DISP), ms[i]) for i, c in enumerate("MOTION")])

def ink_w(spec, capH):
    ch, f, _ = spec; return mats.glyph(ch, mats.fp(f), int(capH)).shape[1] - 2 * mats.P
def row_layout(specs, capH):
    sp = 18 * capH / 220; inks = [ink_w(s, capH) for s in specs]
    tot = sum(inks) + sp * (len(specs) - 1); x = 540 - tot / 2; cx = []
    for w in inks: cx.append(x + w / 2); x += w + sp
    return cx, tot
FULL_ROW_W = row_layout(FINAL_M, MC)[1]
MCF = MC * 1000 / FULL_ROW_W
def draw_row(im, specs, capH, cy, t, scales=None, infls=None, alphas=None, cx_override=None, maxw=900):
    wnow = row_layout(specs, int(capH))[1]
    if wnow > maxw: capH = capH * maxw / wnow
    capH = int(round(capH / 6) * 6) if capH > MC + 6 else int(capH)
    cx, _ = row_layout(specs, capH) if cx_override is None else (cx_override, 0)
    for i, sp in enumerate(specs):
        a = 1.0 if alphas is None else alphas[i]
        if a <= 0.01: continue
        img = mats.render(sp[0], mats.fp(sp[1]), sp[2], capH, t=t, infl=0.25 if infls is None else infls[i], seed=i)
        s = 1.0 if scales is None else scales[i]
        if abs(s - 1) > 0.01: img = img.resize((max(2, int(img.width * s)), max(2, int(img.height * s))), Image.BILINEAR)
        ac(im, amul(img, a), cx[i] - img.width / 2, cy - img.height / 2)
    return cx

# ---------------- hook timing (beat-locked) ----------------
C0 = 1.45                    # cycling start (on a beat)
CSTEP = B / 4; CEND = C0 + 12 * CSTEP          # = C0 + 3B
HOV = [CEND + B / 2 + i * B / 2 for i in range(6)]
T0 = CEND + 4 * B            # first full-screen word
T_SITE = T0 + 3 * B
FS3D = fit("3D", PB, 1000, 1500); FSWEB = fit("WEBSITES", PB, 1000, 600)
CUR = [(0, 0), (0, 34), (9, 26), (15, 40), (21, 37), (15, 24), (27, 24)]
def cursor(im, x, y, press=1.0):
    s = 1.7 * press; pts = [(x + px * s, y + py * s) for px, py in CUR]
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im); d.polygon([(px + 4, py + 6) for px, py in pts], fill=(0, 0, 0, 90))
    d.polygon(pts, fill=(255, 255, 255, 255), outline=(10, 10, 10, 255)); d.line(pts + [pts[0]], fill=(10, 10, 10, 255), width=3)
def puff(d):
    if d < 0: return 0.0
    return (1 - math.exp(-9 * d) * math.cos(16 * d)) * (0.35 + 0.65 * math.exp(-3 * d))

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
    def __init__(s): s.cr = [None] * len(RECS)
    def cards(s, t):
        out = []
        if t < 0.55 or t > T0 + 0.5: return out
        fly = eio(seg(t, T0 - 0.05, T0 + 0.4)); nC = len(RECS)
        for i, key in enumerate(RECS):
            ta = 0.6 + 0.1 * i
            if t < ta: continue
            if s.cr[i] is None: s.cr[i] = Reader(f"rec/{key}.webm", 2.6 + (i % 3) * 0.8, CWc, CHc)
            fr = s.cr[i].get(int((t - ta) * FPS))
            th = 2 * math.pi * i / nC + 0.85 * t - 1.2
            rx, ry = 500 * (1 + 1.4 * fly), 640 * (1 + 1.0 * fly)
            x = 540 + rx * math.cos(th); y = 960 + ry * math.sin(th); depth = math.sin(th)
            sc = (0.62 + 0.38 * (depth + 1) / 2) * eob(seg(t, ta, ta + 0.35)) * (1 + 0.4 * fly)
            if sc < 0.05: continue
            card = Image.new("RGBA", (CWc, CHc), (0, 0, 0, 0)); card.paste(dim(fr, 0.6 + 0.4 * (depth + 1) / 2), (0, 0), CMASK)
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
            m = full_mask() if t >= TYPE_END else letters_mask(t)
            shine = (t - HOV[-1] - 0.1) / 0.6 * 1.6 - 0.2 if t > HOV[-1] else None
            ac(im, text_layer(m, t, glow=0.9, shine=shine), 0, REG_Y0)
            cy = LINE_CY[1]
            if t < C0:
                sc = [1.35 - 0.35 * eob(clamp((t - MOT_T[i]) / 0.16)) if t >= MOT_T[i] else 0 for i in range(6)]
                al = [clamp((t - MOT_T[i]) / 0.06) for i in range(6)]
                draw_row(im, TYPED_M, MC, cy, t, scales=[max(0.01, v) for v in sc], alphas=al)
            elif t < CEND:
                j = min(11, int((t - C0) / CSTEP)); u = (t - C0 - j * CSTEP) / CSTEP
                draw_row(im, CYCLE[j], MC, cy, t, scales=[1.0 + 0.08 * (1 - eo(u * 2.5))] * 6)
            else:
                pk = [puff(t - h) for h in HOV]
                cx = draw_row(im, FINAL_M, MC, cy, t, scales=[1 + 0.2 * p for p in pk], infls=[0.25 + 0.6 * p for p in pk])
                # cursor path
                if t < T0 - 0.1:
                    pts = [(1010, 1560, CEND)] + [(cx[i] + 8, cy + 10, HOV[i]) for i in range(6)] + [(1160, 1380, HOV[-1] + B)]
                    for a_, b_ in zip(pts, pts[1:]):
                        if a_[2] <= t <= b_[2]:
                            u = eio(seg(t, a_[2] + (b_[2] - a_[2]) * 0.35, b_[2])); x = lerp(a_[0], b_[0], u); y = lerp(a_[1], b_[1], u)
                            press = 0.86 if any(0 <= t - h < 0.08 for h in HOV) else 1.0
                            cursor(im, x, y, press); break
            if t < TYPE_END and int(t * 6) % 2 == 0:
                last = [L for L in LETTERS if L["t0"] <= t]
                if last and (t < MOT_T[0] or t > MOT_T[-1] + 0.05):
                    L = last[-1]; li = L["li"]; b = BASE[li]
                    ImageDraw.Draw(im).rectangle((L["xr"] + 8, b - capS, L["xr"] + 15, b + 6), fill=CREAM + (255,))
        else:
            if t < T0 + 0.18:
                fa = 1 - seg(t, T0, T0 + 0.18)
                ac(im, text_layer(full_mask().point(lambda v: int(v * fa)), t), 0, REG_Y0)
                draw_row(im, FINAL_M, MC, LINE_CY[1], t, alphas=[fa] * 6)
            k = int((t - T0) / B)
            if k < 3:
                u = (t - T0 - k * B) / B; a = 1.0; cy = 960
                if u < 0.45:
                    e = eo(u / 0.45)
                    if k == 0: sf = e; cy = lerp(LINE_CY[0], 960, e)
                    else: sf = e; a = eo(u / 0.2)
                    sz = lerp(0.55, 1.0, sf) if k else None
                elif u < 0.8: sz = 1 + 0.04 * (u - 0.45) / 0.35; sf = 1
                else: sz = 1.04 * (1 + 1.1 * eio((u - 0.8) / 0.2)); a = 1 - (u - 0.8) / 0.2; sf = 1
                if k == 1:
                    capH = MCF * (lerp(0.55, 1.0, sf) if u < 0.45 else sz)
                    draw_row(im, FINAL_M, capH, 960, t, alphas=[a] * 6, infls=[0.4] * 6, maxw=1040 * (sz if u >= 0.45 else 1))
                else:
                    word = "3D" if k == 0 else "WEBSITES"; ff = FS3D if k == 0 else FSWEB
                    if u < 0.45: fs = lerp(SZW, ff, sf) if k == 0 else ff * lerp(0.55, 1.0, sf)
                    else: fs = ff * sz
                    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).text((540, cy), word, font=font(PB, fs), fill=int(255 * a), anchor="mm")
                    ac(im, text_layer(m, t, glow=1.1, shine=(u - 0.35) / 0.4 * 1.6 - 0.2), 0, 0)
        for d, c, x, y in cs:
            if d >= 0: ac(im, c, x, y)
        if t < 0.3: im = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), im, eo(t / 0.3))
        return im
    def close(s):
        for r in s.cr:
            if r: r.close()

HOVER_SFX = ["ding/kenney-interface-glass-001.ogg", "pop/fs-447910-plop.ogg", "pop/fs-258269-mouth-pop.ogg",
             "transition/fs-816262-broomstick-whoosh-3-quiet-okm1.ogg", "ding/kenney-interface-glass-002.ogg", "tick/fs721514.ogg"]
def hook_sfx(ev, ks):
    for i, L in enumerate(LETTERS): ev.append((L["t0"], ks[i % len(ks)], 0.42))
    for i, t0 in enumerate(MOT_T): ev.append((t0, ks[(i + 7) % len(ks)], 0.42))
    for i in range(len(RECS)): ev.append((0.6 + 0.1 * i, "pop/kenney-interface-pluck-00%d.ogg" % (1 + i % 2), 0.2))
    for j in range(12):
        ev.append((C0 + j * CSTEP, "click/kenney-interface-toggle-00%d.ogg" % (1 + j % 2), 0.55))
        ev.append((C0 + j * CSTEP + 0.028, "tick/fs384187.ogg", 0.3))
    ev.append((CEND, "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.5))
    for i, h in enumerate(HOV):
        ev.append((h, "click/kenney-interface-click-001.ogg", 0.4)); ev.append((h + 0.02, HOVER_SFX[i], 0.5))
    ev.append(("END", T0, "riser/fs-685256-riser-sound-effect-short-wav.ogg", 0.4))
    ev.append((T0 - 0.07, "whoosh/fs-683101-quick-woosh.ogg", 0.6))
    for k, (w_, im_) in enumerate([("transition/fs-786514-swoosh-v2.ogg", "impact/kenney-impact-impactpunch-heavy-000.ogg"),
                                   ("whoosh/fs-127197-fast-simple-chop-5-aif.ogg", "impact/kenney-impact-impactsoft-heavy-001.ogg"),
                                   ("transition/fs-786514-swoosh-v2.ogg", "impact/kenney-impact-impactpunch-heavy-001.ogg")]):
        if k: ev.append((T0 + k * B - 0.06, w_, 0.5))
        ev.append((T0 + k * B + 0.16, im_, 0.5))
    ev.append((T_SITE - 0.08, "whoosh/fs-169867-swoosh.ogg", 0.6))
    ev.append((T_SITE + 0.42, "impact/fs-177242-cinematic-impact.ogg", 0.55))

# ---------------- reveal ----------------
def reveal(im, fr, p):
    e = eo(p); sc = lerp(0.3, 1.0, e); w, h = int(W * sc), int(H * sc)
    card = fr.resize((w, h), Image.BILINEAR).convert("RGBA")
    r = int(60 * (1 - e)); card.putalpha(rr_mask(w, h, r) if r > 1 else Image.new("L", (w, h), 255))
    sb = shine_band(w, h, p * 1.8 - 0.3, 0.06)
    wl = Image.new("RGBA", (w, h), (255, 248, 240, 0)); wl.putalpha(ImageChops.multiply(sb, card.getchannel("A")).point(lambda v: int(v * 0.45)))
    card.alpha_composite(wl); ac(im, card, 540 - w / 2, 960 - h / 2)
    return im

# ---------------- futuristic logo finale ----------------
logo = Image.open(LOGO).convert("RGBA"); logo = logo.crop(logo.getbbox())
LH, PAD = 320, 160; LCX, LCY = 540, 800
L_ = logo.resize((round(logo.width * LH / logo.height), LH), Image.LANCZOS)
CWL, CHL = L_.width + 2 * PAD, L_.height + 2 * PAD
LC = Image.new("RGBA", (CWL, CHL), (0, 0, 0, 0)); LC.paste(L_, (PAD, PAD)); la = LC.getchannel("A")
bin_ = la.point(lambda v: 255 if v > 110 else 0)
EDGE = np.array(bin_.filter(ImageFilter.MaxFilter(5)), np.float32) - np.array(bin_.filter(ImageFilter.MinFilter(5)), np.float32)
yy_, xx_ = np.mgrid[0:CHL, 0:CWL]
ANG = ((np.arctan2(yy_ - CHL / 2, xx_ - CWL / 2) + math.pi / 2) % (2 * math.pi)) / (2 * math.pi)
GLOWA = np.array(la.filter(ImageFilter.GaussianBlur(40)), np.float32); LCA = np.array(la, np.float32)
_pr = np.random.default_rng(5)
ys, xs = np.nonzero(np.array(la) > 128); sel = _pr.choice(len(xs), 900, replace=False)
PT = np.stack([xs[sel] + LCX - CWL / 2, ys[sel] + LCY - CHL / 2], 1).astype(np.float32)
ang0 = _pr.random(900) * 2 * math.pi; rad0 = 650 + _pr.random(900) * 700
PS = np.stack([LCX + np.cos(ang0) * rad0, LCY + np.sin(ang0) * rad0 * 1.3], 1).astype(np.float32)
PD = _pr.random(900) * 0.45; PCOL = _pr.random(900)
TG = 1.75  # glitch hit
TAG1, TAG2, URL = "Erlebe die immersive", "Seite des Internets.", "mind-merit.com"
def reveal_line(im, text, f, base, p, fill=CREAM):
    if p <= 0: return
    asc, desc = f.getmetrics(); h = asc + desc + 10; top = base - asc
    lay = Image.new("RGBA", (W, h), (0, 0, 0, 0)); ImageDraw.Draw(lay).text((540, asc + (1 - eo(p)) * h), text, font=f, fill=fill, anchor="ms")
    ac(im, lay, 0, top)
def glitch(im, amt, seed):
    r, g, b, a = im.split(); im = Image.merge("RGBA", (ImageChops.offset(r, amt, 0), g, ImageChops.offset(b, -amt, 0), a))
    rnd = random.Random(seed)
    for _ in range(7):
        y = rnd.randint(0, H - 60); hh = rnd.randint(8, 54); dx = rnd.randint(-46, 46)
        im.paste(ImageChops.offset(im.crop((0, y, W, y + hh)), dx, 0), (0, y))
    return im
def finale(t, gt):
    im = bg(gt, pulse=max(0, 1 - abs(t - TG) / 0.5))
    # particles converge
    if t < 2.4:
        u = np.clip((t - PD) / 0.8, 0, 1); e = 1 - (1 - u) ** 3
        sw = np.sin(np.pi * u)[:, None] * 120
        perp = np.stack([-(PT[:, 1] - PS[:, 1]), PT[:, 0] - PS[:, 0]], 1); perp /= (np.linalg.norm(perp, axis=1, keepdims=True) + 1e-6)
        pos = PS + (PT - PS) * e[:, None] + perp * sw
        pa = clamp(1 - (t - 1.8) / 0.6)
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        for (x, y), c, uu in zip(pos, PCOL, u):
            if uu <= 0 or not (-10 < x < W + 10 and -10 < y < H + 10): continue
            col = (255, 236, 220) if c > 0.6 else ORANGE; r_ = 2.6 if uu < 1 else 1.8
            d.ellipse((x - r_, y - r_, x + r_, y + r_), fill=col + (int(255 * pa),))
        gl = lay.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(4)).resize((W, H), Image.BILINEAR)
        im.alpha_composite(gl); im.alpha_composite(lay)
    p = eio(seg(t, 0.9, 2.0)); fill = eo(seg(t, TG, TG + 0.55))
    gl_ = eo(seg(t, TG - 0.1, TG + 0.9)) * (0.85 + 0.15 * math.cos(2 * math.pi * (t - 2.6) / 2.0) if t > 2.6 else 1)
    lay = Image.new("RGBA", (CWL, CHL), (0, 0, 0, 0))
    if gl_ > 0:
        g = Image.new("RGBA", (CWL, CHL), ORANGE + (0,)); g.putalpha(Image.fromarray(np.clip(GLOWA * gl_, 0, 255).astype(np.uint8))); lay.alpha_composite(g)
    if p > 0:
        sa = Image.fromarray(np.clip(EDGE * (ANG <= p) * (1 - 0.7 * fill), 0, 255).astype(np.uint8))
        sg = Image.new("RGBA", (CWL, CHL), ORANGE + (0,)); sg.putalpha(sa.filter(ImageFilter.GaussianBlur(9)).point(lambda v: min(255, v * 2))); lay.alpha_composite(sg)
        st = Image.new("RGBA", (CWL, CHL), CREAM + (0,)); st.putalpha(sa); lay.alpha_composite(st)
    if fill > 0:
        f2 = LC.copy(); f2.putalpha(Image.fromarray((LCA * fill).astype(np.uint8))); lay.alpha_composite(f2)
    hs = seg(t, 2.05, 2.7)
    if 0 < hs < 1:  # holographic scan line
        yb = int(hs * CHL); band = np.zeros((CHL, CWL), np.float32); band[max(0, yb - 6):yb + 6] = 1
        band = cv2.GaussianBlur(band, (0, 0), 4) * (LCA / 255)
        wl = Image.new("RGBA", (CWL, CHL), (255, 244, 230, 0)); wl.putalpha(Image.fromarray(np.clip(band * 255, 0, 255).astype(np.uint8))); lay.alpha_composite(wl)
    sc = 0.92 + 0.08 * eo(seg(t, 0.9, 2.8)); lay = lay.resize((int(CWL * sc), int(CHL * sc)), Image.BICUBIC)
    ac(im, lay, LCX - lay.width / 2, LCY + 6 * math.sin(gt * 1.6) - lay.height / 2)
    ra = eo(seg(t, TG + 0.1, TG + 0.8))
    if ra > 0:  # HUD rings
        hud = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(hud)
        for R, sp_, ln, wd, al in [(300, 40, 70, 2, 170), (340, -26, 120, 2, 110), (372, 18, 30, 3, 200)]:
            a0 = gt * sp_
            for q in range(3):
                st_ = a0 + q * 120; d.arc((LCX - R, LCY - R, LCX + R, LCY + R), st_, st_ + ln * ra, fill=ORANGE + (int(al * ra),), width=wd)
        for q in range(24):
            aa = math.radians(q * 15 + gt * 10); r1, r2 = 392, 400 if q % 2 else 410
            d.line((LCX + r1 * math.cos(aa), LCY + r1 * math.sin(aa), LCX + r2 * math.cos(aa), LCY + r2 * math.sin(aa)), fill=CREAM + (int(90 * ra),), width=2)
        im.alpha_composite(hud)
    reveal_line(im, TAG1, font(PSB, 58), 1290, seg(t, 2.55, 3.05))
    reveal_line(im, TAG2, font(PSB, 58), 1366, seg(t, 2.7, 3.2), fill=(255, 200, 160))
    po = eo(seg(t, 3.25, 3.6))
    if po > 0:
        l2 = Image.new("RGBA", (W, 150), (0, 0, 0, 0)); d = ImageDraw.Draw(l2)
        d.rounded_rectangle((300, 25, 780, 125), 50, outline=(170, 100, 80, int(255 * po)), width=3, fill=(24, 12, 10, int(200 * po)))
        n = int(clamp((t - 3.5) / 0.75) * len(URL)); txt = URL[:n]
        f = font(PR, 40); d.text((540, 75), txt, font=f, fill=CREAM + (255,), anchor="mm")
        if t < 4.6 and int(t * 6) % 2 == 0:
            xr = 540 + f.getlength(txt) / 2 + 6; d.rectangle((xr, 52, xr + 4, 98), fill=ORANGE + (255,))
        ac(im, l2, 0, 1450 + 20 * (1 - po))
    if TG <= t < TG + 0.16: im = glitch(im, int(18 * (1 - (t - TG) / 0.16)) + 4, int(t * 100))
    return im
FIN_LEN = 5.4
def finale_sfx(ev, t0, ks):
    ev.append(("END", t0 + TG, "riser/fs-464250-echo-chromatic-riser-wav.ogg", 0.35))
    ev.append((t0 + 0.05, "whoosh/fs-264777-swoosh.ogg", 0.4))
    ev.append((t0 + TG, "glitch/kenney-interface-glitch-002.ogg", 0.6)); ev.append((t0 + TG, "impact/fs-177242-cinematic-impact.ogg", 0.6))
    ev.append((t0 + TG + 0.5, "ding/kenney-interface-glass-002.ogg", 0.25))
    ev.append((t0 + 2.55, "whoosh/fs810485.ogg", 0.3)); ev.append((t0 + 3.25, "pop/kenney-interface-pluck-001.ogg", 0.3))
    for i in range(len(URL)): ev.append((t0 + 3.5 + 0.75 * i / len(URL), ks[i % len(ks)], 0.38))

# ---------------- render ----------------
def encoder(path):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
def render_single(site, name):
    nf = nframes(f"clips/trk_{site}.mp4"); total = T_SITE + nf / FPS
    hk = Hook(); rd = Reader(f"clips/trk_{site}.mp4", 0, W, H); enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < T_SITE: im = hk.frame(t)
        else:
            fr = rd.get(int((t - T_SITE) * FPS)); p = seg(t, T_SITE, T_SITE + 0.5)
            im = reveal(bg(t), fr, p) if p < 1 else fr.convert("RGBA")
        if t > total - 0.4: im = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), im, clamp((total - t) / 0.4))
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait(); hk.close(); rd.close()
    ks = keystrokes(); ev = []; hook_sfx(ev, ks)
    return total, ev

MAIN_SHOTS = [("IMG_6721", 0.0), ("IMG_6709", 0.3), ("IMG_6704", 0.0), ("IMG_6712", 0.0), ("IMG_6711", 6.0)]
SHOT = 6 * B; TR = 0.36
def render_main(name):
    starts = [T_SITE + SHOT * i for i in range(len(MAIN_SHOTS))]; cuts = starts[1:]
    T_FIN = T_SITE + SHOT * len(MAIN_SHOTS); total = T_FIN + FIN_LEN
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
            i = min(len(MAIN_SHOTS) - 1, max(j for j in range(len(starts)) if starts[j] - TR / 2 <= t))
            if t < T_SITE + 0.5: im = reveal(bg(t), shot(0, t), seg(t, T_SITE, T_SITE + 0.5))
            elif i > 0 and t < starts[i] + TR / 2:
                p = seg(t, starts[i] - TR / 2, starts[i] + TR / 2)
                A = zoom(shot(i - 1, t), 1 + 0.22 * eio(p)); Bf = zoom(shot(i, t), 1.14 - 0.14 * eo(p))
                im = Image.blend(A, Bf, eio(p)).convert("RGBA")
                wl = Image.new("RGBA", (W, H), (255, 236, 220, 0)); wl.putalpha(shine_band(W, H, p * 1.9 - 0.4, 0.07).point(lambda v: int(v * 0.4 * math.sin(math.pi * p))))
                im.alpha_composite(wl)
            else: im = shot(i, t).convert("RGBA")
            if t > T_FIN - 0.3: im = Image.blend(im, finale(t - (T_FIN - 0.3), t), eio(seg(t, T_FIN - 0.3, T_FIN + 0.3)))
        else: im = finale(t - (T_FIN - 0.3), t)
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait(); hk.close()
    for r in rds:
        if r: r.close()
    ks = keystrokes(); ev = []; hook_sfx(ev, ks)
    sw = ["transition/fs-702773-swipe-wav.ogg", "whoosh/fs-683101-quick-woosh.ogg", "transition/fs-683096-woosh.ogg", "whoosh/fs810485.ogg"]
    for j, c in enumerate(cuts): ev.append((c - TR / 2 - 0.05, sw[j % 4], 0.5))
    finale_sfx(ev, T_FIN - 0.3, ks)
    return total, ev

def mix_and_mux(name, total, ev):
    n = int(total * SR) + SR; bus = np.zeros((n, 2), np.float32)
    for e in ev:
        if e[0] == "END": _, tend, s, g = e; a = sfx(s); t0 = tend - len(a) / SR
        else:
            t0, s, g = e; a = s if isinstance(s, np.ndarray) else sfx(s)
        i = int(max(0, t0) * SR); j = min(n, i + len(a)); bus[i:j] += a[: j - i] * g
    mus = load_audio(MUSIC); mus /= np.abs(mus).max()
    need = total + 0.5; cand = np.arange(4.0, max(4.1, MDUR - need), 0.5)
    o = cand[int(np.argmax([MRMS[int(c * 10):int((c + need) * 10)].mean() for c in cand]))]
    o = max(0.0, PHASE + round((o + C0 - PHASE) / B) * B - C0)
    m = mus[int(o * SR): int(o * SR) + n]; m = np.pad(m, ((0, n - len(m)), (0, 0)))
    tt = np.arange(n) / SR; m *= (np.minimum(1, tt / 0.25) * np.clip((total - tt) / 1.2, 0, 1))[:, None]
    for tag, audio in (("", bus + m * 0.4), ("_SFX-only", bus)):
        audio = audio[: int(total * SR)]; raw = f"out/{name}{tag}.f32"; audio.astype(np.float32).tofile(raw)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"out/{name}_v.mp4", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw,
                        "-af", "loudnorm=I=-16:TP=-4:LRA=11", "-ar", "48000", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                        "-shortest", "-movflags", "+faststart", f"out/{name}{tag}.mp4"], check=True)
        os.remove(raw)
    os.remove(f"out/{name}_v.mp4"); print(name, "music offset", round(o, 2), flush=True)

JOBS = {"main": ("1_MindMerit_Main_Reel", None), "nl": ("2_MindMerit_Nectarline", "IMG_6721"), "kv": ("3_MindMerit_KV-Fracht", "IMG_6704"),
        "wb": ("4_MindMerit_Wendland-Bibliothek", "IMG_6709"), "rw": ("5_MindMerit_Runway", "IMG_6712"), "tp": ("6_MindMerit_Tiefenpfad", "IMG_6711")}
if __name__ == "__main__":
    if sys.argv[1:2] == ["still"]:  # quick preview frames: still t1 t2 ...
        hk = Hook(); ims = []
        for tt in map(float, sys.argv[2:]):
            im = None
            for f in range(int(tt * FPS) - 2, int(tt * FPS) + 1): im = hk.frame(max(0, f / FPS))
            ims.append(im.convert("RGB").resize((360, 640)))
        sh = Image.new("RGB", (360 * len(ims), 640))
        for i, x in enumerate(ims): sh.paste(x, (360 * i, 0))
        sh.save("out/_still.jpg", quality=90); print("T0", T0, "T_SITE", T_SITE); sys.exit()
    if sys.argv[1:2] == ["finale"]:
        ims = [finale(tt, tt).convert("RGB").resize((360, 640)) for tt in map(float, sys.argv[2:])]
        sh = Image.new("RGB", (360 * len(ims), 640))
        for i, x in enumerate(ims): sh.paste(x, (360 * i, 0))
        sh.save("out/_finale.jpg", quality=90); sys.exit()
    for k in (sys.argv[1:] or JOBS.keys()):
        nm, site = JOBS[k]
        tot, ev = render_main(nm) if site is None else render_single(site, nm)
        mix_and_mux(nm, tot, ev)
    print("ok")
