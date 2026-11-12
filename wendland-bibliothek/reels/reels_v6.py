"""Mind-Merit reels v6.
- Opens straight on the untouched phone footage (no warp, no stretch, no re-stabilisation): clips/raw_<name>.mp4 from track_v6.py.
- Entry hook: 3-4 words in a small font, pinned to the wall just above the monitor light bar and tracked with the camera.
- Tail: the '3D / MOTION / WEBSITES' letter animation (text only, no cards) + small logo on top + comment CTA
  (PROMPT / WEBSITE / 3D-WORKFLOW) that the cursor clicks."""
import subprocess, os, sys, math, random, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import mats, gl3d
os.chdir(os.path.dirname(os.path.abspath(__file__)))
G3 = gl3d.GL3D()
LANG = "en" if "--en" in sys.argv else "de"
sys.argv = [a for a in sys.argv if a not in ("--en", "--de")]
OUT = os.path.join(r"D:\Websites\motion-sites\Motion-site-reels\MindMerit_Reels_v7", {"de": "Deutsch", "en": "English"}[LANG])
os.makedirs("out", exist_ok=True)
W, H, FPS, SR = 1080, 1920, 30, 44100
PSB, PB, PR, PM = mats.fp("Poppins-SemiBold.ttf"), mats.fp("Poppins-Bold.ttf"), mats.fp("Poppins-Regular.ttf"), mats.fp("Poppins-Medium.ttf") if os.path.exists(mats.fp("Poppins-Medium.ttf")) else mats.fp("Poppins-SemiBold.ttf")
ORANGE = (249, 108, 4); CREAM = (242, 236, 228)   # ORANGE = Mind-Merit logo orange #F96C04
LOGO = r"D:\Websites\motion-sites\Motion-site-reels\Mind-Merit.png"
SFX = "C:\\Users\\PC\\.claude\\skills\\sound-effects\\sfx\\"
MUSIC = "audio/music_460.mp3"
font = mats.font

# ---- entry hooks (German audience; 3-4 words). Edit here. ----
HOOKS_ALL = {
  # v10: trending caption formats ("X in 2026", "... just cooked", "POV: ...")
  "de": {"main": "Claude Opus hat abgeliefert.", "nl": "Kunde: Bitte keine Standard-Website.\nIch: Wie finden Sie das?", "kv": "Moment… eine Logistik-Website?",
         "wb": "POV: Ihre Bibliothek in 3D", "rw": "Modemarken brauchen das.", "tp": "Darauf ist niemand vorbereitet.", "vm": "Kleiner Betrieb. Große Website."},
  "en": {"main": "Claude Opus just cooked.", "nl": "Client: I don’t want a basic website.\nMe: How’s this?", "kv": "Wait… this is a logistics site?",
         "wb": "POV: your library went 3D", "rw": "Fashion brands need this.", "tp": "Nobody is ready for this.", "vm": "Small business. Big website."},
}
HOOKS = HOOKS_ALL[LANG]
CHIPS = ["PROMPT", "WEBSITE", "3D-WORKFLOW"]
CTA1 = {"de": "Kommentieren Sie ein Wort", "en": "Comment one word below"}[LANG]
SUFFIX = {"de": "_DE", "en": "_EN"}[LANG]

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
        a = load_audio(name if os.path.isabs(name) else SFX + name); _ac[name] = a / (np.abs(a).max() or 1)
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

# ---------------- headline layout (tail) ----------------
SZW = fit("WEBSITES", PSB, 560)
capS = font(PSB, SZW).getbbox("H")[3] - font(PSB, SZW).getbbox("H")[1]
MC = 220; GAP = 64
total = capS + GAP + MC + GAP + capS; top = 840 - total / 2       # block sits a little high: CTA goes underneath
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
FINAL_M = [("M", "Bungee-Regular.ttf", "chrome"), ("O", "Poppins-Bold.ttf", "glass"), ("T", "BowlbyOne-Regular.ttf", "concrete"),
           ("I", "AbrilFatface-Regular.ttf", "gold"), ("O", "Chango-Regular.ttf", "ceramic"), ("N", "Shrikhand-Regular.ttf", "holo")]
TYPED_M = [(c, "Poppins-Bold.ttf", "ceramic") for c in "MOTION"]
DISP = ["Bungee-Regular.ttf", "RubikBubbles-Regular.ttf", "AbrilFatface-Regular.ttf", "TitanOne-Regular.ttf", "Chango-Regular.ttf",
        "Shrikhand-Regular.ttf", "Pacifico-Regular.ttf", "Lobster-Regular.ttf", "BagelFatOne-Regular.ttf", "BowlbyOne-Regular.ttf",
        "YesevaOne-Regular.ttf", "Righteous-Regular.ttf", "Sniglet-ExtraBold.ttf", "ClimateCrisis.ttf", "Fascinate-Regular.ttf",
        "KaushanScript-Regular.ttf", "Poppins-Bold.ttf", "Modak-Regular.ttf", "RubikMoonrocks-Regular.ttf"]
PIX = ["PressStart2P-Regular.ttf", "Silkscreen-Bold.ttf"]
MATL = [m for m in gl3d.MATS.keys() if m != "lava"]   # lava/marble read as messy
_r = random.Random(42); CYCLE = []
for j in range(12):
    if j in (3, 8): f_ = _r.choice(PIX); ms = _r.sample(MATL, 6); CYCLE.append([(c, f_, ms[i]) for i, c in enumerate("MOTION")])
    else:
        ms = _r.sample(MATL, 6); CYCLE.append([(c, _r.choice(DISP), ms[i]) for i, c in enumerate("MOTION")])

def ink_w(spec, capH):
    ch, f, _ = spec; return G3.sdf(ch, f)[2] * capH
def row_layout(specs, capH):
    sp = -0.075 * capH; inks = [ink_w(s, capH) for s in specs]
    tot = sum(inks) + sp * (len(specs) - 1); x = 540 - tot / 2; cx = []
    for w in inks: cx.append(x + w / 2); x += w + sp
    return cx, tot
FULL_ROW_W = row_layout(FINAL_M, MC)[1]
MC_FIT = min(MC, MC * 900 / FULL_ROW_W)
CXF = row_layout(FINAL_M, MC_FIT)[0]
def draw_row(im, specs, capH, cy, t, scales=None, puffs=None, alphas=None, maxw=900, cur=None):
    wnow = row_layout(specs, capH)[1]
    if wnow > maxw: capH = capH * maxw / wnow
    cx, _w = row_layout(specs, capH)
    for i, sp in enumerate(specs):
        a = 1.0 if alphas is None else alphas[i]
        if a <= 0.01: continue
        yaw = 0.22 * math.sin(t * 1.1 + i * 0.9); pitch = 0.10 * math.sin(t * 0.8 + i * 1.3); lift = 0.0; hs = 1.0
        if cur is not None and cur[2] > 0.05:
            dx = (cur[0] - cx[i]) / 380; dy = (cur[1] - cy) / 380; w = math.exp(-(dx * dx + dy * dy) * 1.5)
            yaw += 0.65 * clamp(dx, -1, 1) * w; pitch -= 0.45 * clamp(dy, -1, 1) * w
            hw = math.exp(-((cur[0] - cx[i]) / 95) ** 2 - ((cur[1] - cy) / 200) ** 2) * cur[2]   # hover: letter under the cursor lifts
            hw = float(hw); lift = 34 * hw; hs = 1 + 0.13 * hw; yaw += 0.35 * hw * math.sin(t * 9 + i)
        s = (1.0 if scales is None else scales[i]) * hs
        ch_ = int(round(capH * s / 4) * 4)
        if ch_ < 8: continue
        img = G3.render(sp[0], sp[1], sp[2], ch_, yaw=yaw, pitch=pitch, puff=0.0 if puffs is None else puffs[i], t=t)
        x, y = cx[i] - img.width / 2, cy - img.height / 2 - lift
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); sh.putalpha(img.getchannel("A").filter(ImageFilter.GaussianBlur(14 + lift * 0.3)).point(lambda v: int(v * 0.5 * a)))
        ac(im, sh, x + 10, y + 26 + lift * 1.4); ac(im, amul(img, a), x, y); ac(im, amul(gl3d.bloom(img), a), x, y)
    return cx

# ---------------- tail timing (beat-locked, local time) ----------------
T_CTA = 0.55                              # CTA appears together with the 3D text
C0 = 2 * B                                # cursor starts its hover sweep over MOTION (on a beat)
HSTEP = B / 2
HOV = [C0 + 0.3 + i * HSTEP for i in range(6)]   # cursor is over letter i -> it lifts and morphs into its final style
CEND = HOV[-1]
T_CHIP = HOV[-1] + 0.6                    # cursor rests on the PROMPT chip (hover, no click)
TAIL_LEN = T_CHIP + 2.4                   # hold so the viewer can read the CTA
MORPH = 0.05                              # style flicker step while hovered
def letter_spec(i, t):
    if t < HOV[i] - 0.15: return TYPED_M[i]
    if t < HOV[i] + 0.1: return CYCLE[int((t - HOV[i] + 0.15) / MORPH) % len(CYCLE)][i]
    return FINAL_M[i]
MAC = [(0, 0), (0, 22.6), (5.2, 17.6), (8.8, 26), (12.4, 24.6), (8.8, 16.4), (15.8, 16.4)]
def _cursor_sprite(scale):
    k = 4; s = scale * k; pad = 14 * k
    w, h = int(17 * s + 2 * pad), int(28 * s + 2 * pad)
    big = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
    pts = [(pad + x * s, pad + y * s) for x, y in MAC]
    d.polygon(pts, fill=(255, 255, 255, 255)); d.line(pts + [pts[0]], fill=(255, 255, 255, 255), width=int(3.4 * k), joint="curve")
    d.polygon(pts, fill=ORANGE + (255,))
    sp = big.resize((w // k, h // k), Image.LANCZOS)
    sh = Image.new("RGBA", sp.size, (0, 0, 0, 0)); sh.putalpha(sp.getchannel("A").filter(ImageFilter.GaussianBlur(5)).point(lambda v: int(v * 0.55)))
    out = Image.new("RGBA", (sp.width + 8, sp.height + 10), (0, 0, 0, 0)); out.alpha_composite(sh, (5, 8)); out.alpha_composite(sp, (0, 0))
    return out, pad // k
CURSORS = {p: _cursor_sprite(2.5 * p) for p in (1.0, 0.86)}
def cursor(im, x, y, press=1.0, alpha=1.0):
    spr, pad = CURSORS[0.86 if press < 1 else 1.0]
    ac(im, amul(spr, alpha), x - pad, y - pad)

# ---- CTA layout ----
CTA_Y1, CHIP_CY, CTA_Y3 = 1330, 1470, 1600
CF = font(PB, 46); CHIP_H = 110; CHIP_PADX = 36; CHIP_GAP = 18
_cw = [CF.getlength(c) + 2 * CHIP_PADX for c in CHIPS]
_sc = min(1.0, 900 / (sum(_cw) + CHIP_GAP * (len(CHIPS) - 1)))
if _sc < 1: CF = font(PB, int(46 * _sc)); _cw = [CF.getlength(c) + 2 * CHIP_PADX * _sc for c in CHIPS]; CHIP_H = int(CHIP_H * _sc)
_x = 540 - (sum(_cw) + CHIP_GAP * (len(CHIPS) - 1)) / 2; CHIP_X = []
for w in _cw: CHIP_X.append((_x, w)); _x += w + CHIP_GAP
CHIP_T = [T_CTA + 0.12 * (i + 1) for i in range(len(CHIPS))]
def chip_img(i, hot, breathe):
    x0, w = CHIP_X[i]; w = int(w); h = CHIP_H; P = 34
    im = Image.new("RGBA", (w + 2 * P, h + 2 * P), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    g = Image.new("L", im.size, 0); ImageDraw.Draw(g).rounded_rectangle((P, P, P + w, P + h), h // 2, outline=255, width=6)
    ga = 0.55 + 0.25 * breathe + 0.45 * hot                    # every chip glows; the hovered one glows most
    gl = Image.new("RGBA", im.size, ORANGE + (0,)); gl.putalpha(g.filter(ImageFilter.GaussianBlur(12)).point(lambda v: min(255, int(v * ga)))); im.alpha_composite(gl)
    if hot > 0:
        g2 = Image.new("L", im.size, 0); ImageDraw.Draw(g2).rounded_rectangle((P, P, P + w, P + h), h // 2, fill=int(200 * hot))
        gl2 = Image.new("RGBA", im.size, ORANGE + (0,)); gl2.putalpha(g2.filter(ImageFilter.GaussianBlur(22))); im.alpha_composite(gl2)
    fill = tuple(int(lerp(a, b, hot)) for a, b in zip((24, 12, 10), ORANGE)) + (int(lerp(215, 255, hot)),)
    d.rounded_rectangle((P, P, P + w, P + h), h // 2, fill=fill, outline=(255, 170, 120, 255), width=3)
    tc = tuple(int(lerp(a, b, hot)) for a, b in zip((255, 246, 238), (22, 10, 6)))
    d.text((P + w / 2, P + h / 2 + 1), CHIPS[i], font=CF, fill=tc + (255,), anchor="mm")
    return im, P
_TITLE = None
def title_layer():
    global _TITLE
    if _TITLE is None:
        f1 = font(PB, 60); m = Image.new("L", (W, 130), 0); ImageDraw.Draw(m).text((540, 88), CTA1, font=f1, fill=255, anchor="ms")
        lay = Image.new("RGBA", (W, 130), (0, 0, 0, 0))
        gl = Image.new("RGBA", (W, 130), ORANGE + (0,)); gl.putalpha(m.filter(ImageFilter.GaussianBlur(16)).point(lambda v: min(255, int(v * 1.4)))); lay.alpha_composite(gl)
        wt = Image.new("RGBA", (W, 130), (255, 246, 238, 0)); wt.putalpha(m); lay.alpha_composite(wt)
        _TITLE = lay
    return _TITLE
def chip_hot(i, cur):
    if cur is None: return 0.0
    x0, w = CHIP_X[i]
    return clamp(1.2 - (abs(cur[0] - (x0 + w * 0.6)) / (w * 0.55)) ** 2 - ((cur[1] - CHIP_CY) / 120) ** 2) * cur[2]
def draw_cta(im, t, cur):
    a1 = seg(t, T_CTA, T_CTA + 0.4)
    if a1 <= 0: return
    ac(im, amul(title_layer(), eo(a1)), 0, CTA_Y1 - 88 + 20 * (1 - eo(a1)))
    br = 0.5 + 0.5 * math.sin(t * 3.2)
    for i in range(len(CHIPS)):
        p = seg(t, CHIP_T[i], CHIP_T[i] + 0.35)
        if p <= 0: continue
        hot = chip_hot(i, cur) if t > HOV[-1] else 0.0
        if t > TAIL_LEN - 1.0 and i == 0: hot = max(hot, 1.0)    # PROMPT stays lit after the cursor leaves
        c, P = chip_img(i, hot, br); s = eob(p) * (1 + 0.06 * hot)
        if abs(s - 1) > 0.005: c = c.resize((max(2, int(c.width * s)), max(2, int(c.height * s))), Image.BICUBIC)
        x0, w = CHIP_X[i]; ac(im, amul(c, clamp(p * 3)), x0 + w / 2 - c.width / 2, CHIP_CY - c.height / 2)

def _cur_keys():
    cy = LINE_CY[1]; cx0, cw0 = CHIP_X[0]
    k = [(0.30, 1180, 1560), (C0 - 0.05, CXF[0] - 120, cy + 40)]
    k += [(h, CXF[i] + 4, cy + 14 + 10 * math.sin(i * 1.7)) for i, h in enumerate(HOV)]
    k += [(T_CHIP, cx0 + cw0 * 0.6, CHIP_CY + 10), (TAIL_LEN, cx0 + cw0 * 0.68, CHIP_CY + 22)]
    return k
CUR_K = _cur_keys()
def cursor_pos(t):
    if t < CUR_K[0][0]: return None
    a = 1.0 - seg(t, TAIL_LEN - 1.0, TAIL_LEN - 0.7)
    for (t1, x1, y1), (t2, x2, y2) in zip(CUR_K, CUR_K[1:]):
        if t1 <= t <= t2:
            u = eio(seg(t, t1, t2)) if t1 < C0 or t1 >= HOV[-1] else seg(t, t1, t2); return (lerp(x1, x2, u), lerp(y1, y2, u), a)
    return (CUR_K[-1][1], CUR_K[-1][2], a)

# ---- small logo on top ----
_lg = Image.open(LOGO).convert("RGBA"); _lg = _lg.crop(_lg.getbbox())
LOGO_S = _lg.resize((round(_lg.width * 120 / _lg.height), 120), Image.LANCZOS)
_lgl = Image.new("RGBA", (LOGO_S.width + 80, LOGO_S.height + 80), (0, 0, 0, 0)); _lgl.alpha_composite(LOGO_S, (40, 40))
LOGO_GLOW = Image.new("RGBA", _lgl.size, ORANGE + (0,)); LOGO_GLOW.putalpha(_lgl.getchannel("A").filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * 0.55)))
def draw_logo(im, t):
    a = eo(seg(t, 0.15, 0.7))
    if a <= 0: return
    y = 230 + 16 * (1 - a) + 3 * math.sin(t * 1.6)
    ac(im, amul(LOGO_GLOW, a), 540 - _lgl.width / 2, y - _lgl.height / 2); ac(im, amul(LOGO_S, a), 540 - LOGO_S.width / 2, y - LOGO_S.height / 2)

def tail_frame(t):
    """t = local tail time."""
    im = bg(t, pulse=max(0, 1 - abs(t - CEND - 0.15) / 0.35))
    cur = cursor_pos(t)
    draw_logo(im, t)
    m = full_mask() if t >= TYPE_END else letters_mask(t)
    shine = (t - HOV[-1] - 0.1) / 0.6 * 1.6 - 0.2 if t > HOV[-1] else None
    ac(im, text_layer(m, t, glow=0.9, shine=shine), 0, REG_Y0)
    cy = LINE_CY[1]
    sc = [max(0.01, 1.35 - 0.35 * eob(clamp((t - MOT_T[i]) / 0.16))) if t >= MOT_T[i] else 0.01 for i in range(6)]
    al = [clamp((t - MOT_T[i]) / 0.06) for i in range(6)]
    draw_row(im, [letter_spec(i, t) for i in range(6)], MC_FIT, cy, t, scales=sc, alphas=al, cur=cur)
    if t < TYPE_END and int(t * 6) % 2 == 0:
        last = [L for L in LETTERS if L["t0"] <= t]
        if last and (t < MOT_T[0] or t > MOT_T[-1] + 0.05):
            L = last[-1]; b = BASE[L["li"]]
            ImageDraw.Draw(im).rectangle((L["xr"] + 8, b - capS, L["xr"] + 15, b + 6), fill=CREAM + (255,))
    draw_cta(im, t, cur)
    if cur is not None and cur[2] > 0: cursor(im, cur[0], cur[1], 1.0, alpha=cur[2])
    fo = seg(t, TAIL_LEN - 0.45, TAIL_LEN)
    if fo > 0: im = Image.blend(im, Image.new("RGBA", (W, H), (0, 0, 0, 255)), eio(fo))
    return im

HOVER_SFX = ["ding/kenney-interface-glass-001.ogg", "ding/kenney-interface-glass-002.ogg", "impact/kenney-impact-impactsoft-heavy-001.ogg",
             "ui-blip/kenney-digital-pepsound1.ogg", "transition/fs-816262-broomstick-whoosh-3-quiet-okm1.ogg", "ui-blip/kenney-digital-threetone1.ogg"]
def tail_sfx(ev, ks, o):
    for i, L in enumerate(LETTERS): ev.append((o + L["t0"], ks[i % len(ks)], 0.42))
    for i, t0 in enumerate(MOT_T): ev.append((o + t0, ks[(i + 7) % len(ks)], 0.42))
    hov = ["ui-blip/kenney-digital-pepsound1.ogg", "ding/kenney-interface-glass-001.ogg", "ui-blip/kenney-digital-threetone1.ogg",
           "ding/kenney-interface-glass-002.ogg", "ui-blip/kenney-digital-pepsound1.ogg", "ding/kenney-interface-glass-001.ogg"]
    ev.append((o + C0 - 0.1, "whoosh/fs810485.ogg", 0.25))
    for i, h in enumerate(HOV):    # hover: soft blip + a quiet tick while the letter morphs, no clicks
        ev.append((o + h - 0.12, "tick/fs384187.ogg", 0.18)); ev.append((o + h, hov[i], 0.32))
    ev.append((o + CEND + 0.15, "impact/kenney-impact-impactsoft-heavy-000.ogg", 0.4))
    for i, c in enumerate(CHIP_T): ev.append((o + c, "pop/kenney-interface-pluck-00%d.ogg" % (1 + i % 2), 0.3))
    ev.append((o + T_CHIP - 0.05, "ding/kenney-interface-glass-002.ogg", 0.35))

# ================= END CARD v8 (overrides the tail above) =================
# charcoal + grid + Mind-Merit orange gradients, logo on top, small "3D" top-left, orange balloon MOTION (one font, one
# material, upright), "Websites" bottom-right, CTA (title + chips + one sub-line). Cursor hovers letters (no clicks).
MFONT, MMAT = "TitanOne-Regular.ttf", "mmorange"
CHAR = np.array([17, 18, 20], np.float32)
def bg(t, pulse=0.0):
    img = np.zeros((BH, BW, 3), np.float32) + CHAR
    for cx, cy, r, a in [(0.18 + 0.05 * math.sin(t * 0.4), -0.04, 26, 0.42), (0.70 + 0.05 * math.sin(t * 0.33 + 1), -0.05, 20, 0.22),
                         (-0.06, 1.0 + 0.02 * math.sin(t * 0.5), 26, 0.38), (1.06, 1.02, 28, 0.34 + 0.06 * math.sin(t * 0.7))]:
        d2 = (gxx - cx * BW) ** 2 + (gyy - cy * BH) ** 2
        img += np.array(ORANGE, np.float32) * (a * (1 + 0.4 * pulse) * np.exp(-d2 / (2 * r * r)))[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).convert("RGBA")
    ox, oy = int(t * 6) % 120, int(t * 4) % 120
    im.paste((255, 255, 255, 255), (0, 0), GRID.crop((ox, oy, ox + W, oy + H)).point([int(v * 13 / 255) for v in range(256)]))
    im.alpha_composite(GRAIN_RGBA)
    return im
ROW_CY = 830; ROW_CAP = 200
def mrow_layout(capH):
    sp = 0.02 * capH; inks = [G3.sdf(c, MFONT)[2] * capH for c in "MOTION"]
    tot = sum(inks) + sp * 5; x = 540 - tot / 2; cx = []
    for w in inks: cx.append(x + w / 2); x += w + sp
    return cx, tot
_cx, _tot = mrow_layout(ROW_CAP)
if _tot > 880: ROW_CAP = ROW_CAP * 880 / _tot
MCX, MTOT = mrow_layout(ROW_CAP); ROW_L, ROW_R = 540 - MTOT / 2, 540 + MTOT / 2
SUBF = font(PR, 66); SUBCOL = (246, 228, 208)
T_CTA = 0.55; C0 = 1.15; HSTEP = 0.22
HOV = [C0 + 0.25 + i * HSTEP for i in range(6)]; CEND = HOV[-1]
T_CHIP = HOV[-1] + 0.55; TAIL_LEN = T_CHIP + 2.5
LET_T = [0.22 + 0.07 * i for i in range(6)]
CTA_Y1, CHIP_CY, CTA_Y3 = 1250, 1385, 1505
CTA3 = {"de": "Den Workflow erhalten Sie kostenlos per DM.", "en": "We'll send you the workflow for free via DM."}[LANG]
CHIP_T = [T_CTA + 0.12 * (i + 1) for i in range(len(CHIPS))]
def draw_motion(im, t, cur):
    for i, ch in enumerate("MOTION"):
        dt = t - LET_T[i]
        if dt < 0: continue
        pop = eob(clamp(dt / 0.32)); a = clamp(dt / 0.08)
        hw = 0.0
        if cur is not None and cur[2] > 0.05:
            hw = float(math.exp(-((cur[0] - MCX[i]) / 90) ** 2 - ((cur[1] - ROW_CY) / 190) ** 2) * cur[2])
        yaw = 0.05 * math.sin(t * 1.3 + i) + 0.16 * hw * math.sin(t * 7 + i); pitch = 0.035 * math.sin(t * 1.1 + i * 0.7)
        s = (0.6 + 0.4 * pop) * (1 + 0.12 * hw); lift = float(30 * hw + 26 * (1 - pop)); t = float(t)
        img = G3.render(ch, MFONT, MMAT, int(round(ROW_CAP * s / 4) * 4), yaw=yaw, pitch=pitch, puff=0.5, t=t)
        x, y = MCX[i] - img.width / 2, ROW_CY - img.height / 2 - lift
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); sh.putalpha(img.getchannel("A").filter(ImageFilter.GaussianBlur(16 + lift * 0.3)).point(lambda v: int(v * 0.55 * a)))
        ac(im, sh, x + 6, y + 24 + lift * 1.3); ac(im, amul(img, a), x, y); ac(im, amul(gl3d.bloom(img, 0.7, 20), a * (0.6 + 0.6 * hw)), x, y)
def draw_words(im, t):
    a = eo(seg(t, 0.35, 0.75))
    if a > 0:
        lay = Image.new("RGBA", (W, 120), (0, 0, 0, 0)); ImageDraw.Draw(lay).text((ROW_L + 8, 90), "3D", font=SUBF, fill=SUBCOL + (255,), anchor="ls")
        ac(im, amul(lay, a), -24 * (1 - a), ROW_CY - ROW_CAP * 0.62 - 98)
    a = eo(seg(t, 0.6, 1.0))
    if a > 0:
        lay = Image.new("RGBA", (W, 120), (0, 0, 0, 0)); ImageDraw.Draw(lay).text((ROW_R - 8, 70), "Websites", font=SUBF, fill=SUBCOL + (255,), anchor="rs")
        ac(im, amul(lay, a), 24 * (1 - a), ROW_CY + ROW_CAP * 0.62 + 6)
def draw_cta(im, t, cur):
    a1 = seg(t, T_CTA, T_CTA + 0.4)
    if a1 <= 0: return
    ac(im, amul(title_layer(), eo(a1)), 0, CTA_Y1 - 88 + 20 * (1 - eo(a1)))
    br = 0.5 + 0.5 * math.sin(t * 3.2)
    for i in range(len(CHIPS)):
        p = seg(t, CHIP_T[i], CHIP_T[i] + 0.35)
        if p <= 0: continue
        hot = chip_hot(i, cur) if t > HOV[-1] else 0.0
        if t > TAIL_LEN - 1.0 and i == 0: hot = max(hot, 1.0)
        c, P = chip_img(i, hot, br); s = eob(p) * (1 + 0.06 * hot)
        if abs(s - 1) > 0.005: c = c.resize((max(2, int(c.width * s)), max(2, int(c.height * s))), Image.BICUBIC)
        x0, w = CHIP_X[i]; ac(im, amul(c, clamp(p * 3)), x0 + w / 2 - c.width / 2, CHIP_CY - c.height / 2)
    a3 = eo(seg(t, CHIP_T[-1] + 0.25, CHIP_T[-1] + 0.65))
    if a3 > 0:
        lay = Image.new("RGBA", (W, 70), (0, 0, 0, 0)); ImageDraw.Draw(lay).text((540, 48), CTA3, font=font(PR, 36), fill=(214, 200, 186, 255), anchor="ms")
        ac(im, amul(lay, a3), 0, CTA_Y3 - 48 + 12 * (1 - a3))
def _cur_keys():
    cx0, cw0 = CHIP_X[0]
    k = [(0.30, 1150, 1700), (C0, ROW_L - 60, ROW_CY + 70)]
    k += [(h, MCX[i] + 6, ROW_CY + 26 + 8 * math.sin(i * 1.7)) for i, h in enumerate(HOV)]
    k += [(T_CHIP, cx0 + cw0 * 0.6, CHIP_CY + 10), (TAIL_LEN, cx0 + cw0 * 0.68, CHIP_CY + 22)]
    return k
CUR_K = _cur_keys()
def draw_logo(im, t):
    a = eo(seg(t, 0.1, 0.6))
    if a <= 0: return
    y = 330 + 16 * (1 - a) + 3 * math.sin(t * 1.6)
    ac(im, amul(LOGO_GLOW, a * 0.8), 540 - _lgl.width / 2, y - _lgl.height / 2); ac(im, amul(LOGO_S, a), 540 - LOGO_S.width / 2, y - LOGO_S.height / 2)
def tail_frame(t):
    im = bg(t, pulse=max(0, 1 - abs(t - CEND - 0.15) / 0.35))
    cur = cursor_pos(t)
    draw_logo(im, t); draw_words(im, t); draw_motion(im, t, cur); draw_cta(im, t, cur)
    if cur is not None and cur[2] > 0: cursor(im, cur[0], cur[1], 1.0, alpha=cur[2])
    fo = seg(t, TAIL_LEN - 0.45, TAIL_LEN)
    if fo > 0: im = Image.blend(im, Image.new("RGBA", (W, H), (0, 0, 0, 255)), eio(fo))
    return im
def tail_sfx(ev, ks, o):
    for i, t0 in enumerate(LET_T): ev.append((o + t0, "pop/kenney-interface-pluck-00%d.ogg" % (1 + i % 2), 0.28))
    ev.append((o + 0.35, "whoosh/fs810485.ogg", 0.22))
    hov = ["ui-blip/kenney-digital-pepsound1.ogg", "ding/kenney-interface-glass-001.ogg", "ui-blip/kenney-digital-threetone1.ogg",
           "ding/kenney-interface-glass-002.ogg", "ui-blip/kenney-digital-pepsound1.ogg", "ding/kenney-interface-glass-001.ogg"]
    for i, h in enumerate(HOV): ev.append((o + h, hov[i], 0.28))
    for i, c in enumerate(CHIP_T): ev.append((o + c, "pop/kenney-interface-pluck-00%d.ogg" % (1 + i % 2), 0.25))
    ev.append((o + T_CHIP - 0.05, "ding/kenney-interface-glass-002.ogg", 0.35))

# ================= MAIN REEL END CARD: budget CTA only (no MOTION letters, no 3 chips) =================
BUD = {"de": dict(h1="Was kostet so eine", h2="Website für Sie?", pre="Kommentieren Sie", kw="BUDGET",
                  sub="Sie erhalten eine persönliche Preis-Einschätzung per DM."),
       "en": dict(h1="What would a website", h2="like this cost you?", pre="Comment", kw="BUDGET",
                  sub="You'll get a personal price estimate via DM.")}[LANG]
B_T1, B_T2, B_T3, B_TCUR, B_TSUB = 0.25, 0.45, 0.85, 1.55, 1.25
B_LEN = 5.0
_BL = {}
def glow_text(txt, fnt, col=(255, 246, 238), glow=1.3, blur=16, h=150, base=100):
    k = (txt, id(fnt))
    if k not in _BL:
        m = Image.new("L", (W, h), 0); ImageDraw.Draw(m).text((540, base), txt, font=fnt, fill=255, anchor="ms")
        lay = Image.new("RGBA", (W, h), (0, 0, 0, 0))
        g = Image.new("RGBA", (W, h), ORANGE + (0,)); g.putalpha(m.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: min(255, int(v * glow)))); lay.alpha_composite(g)
        w_ = Image.new("RGBA", (W, h), col + (0,)); w_.putalpha(m); lay.alpha_composite(w_); _BL[k] = lay
    return _BL[k]
BF1 = font(PB, fit(max(BUD["h1"], BUD["h2"], key=len), PB, 940, 84)); BFP = font(PSB, 50); BFK = font(PB, 70); BFS = font(PR, fit(BUD["sub"], PR, 900, 38))
_kw_w = int(BFK.getlength(BUD["kw"]) + 110); _kw_h = 136
B_CHIP_CY = 1290
def budget_chip(hot, br):
    P = 40; w, h = _kw_w, _kw_h
    im = Image.new("RGBA", (w + 2 * P, h + 2 * P), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    g = Image.new("L", im.size, 0); ImageDraw.Draw(g).rounded_rectangle((P, P, P + w, P + h), h // 2, fill=255)
    gl = Image.new("RGBA", im.size, ORANGE + (0,)); gl.putalpha(g.filter(ImageFilter.GaussianBlur(26)).point(lambda v: min(255, int(v * (0.45 + 0.25 * br + 0.4 * hot))))); im.alpha_composite(gl)
    fill = tuple(int(lerp(a, b, hot)) for a, b in zip((24, 12, 10), ORANGE)) + (255,)
    d.rounded_rectangle((P, P, P + w, P + h), h // 2, fill=fill, outline=(255, 170, 120, 255), width=3)
    tc = tuple(int(lerp(a, b, hot)) for a, b in zip((255, 246, 238), (22, 10, 6)))
    d.text((P + w / 2, P + h / 2 + 2), BUD["kw"], font=BFK, fill=tc + (255,), anchor="mm")
    return im
def budget_cursor(t):
    if t < 0.4: return None
    a = 1.0 - seg(t, B_LEN - 1.0, B_LEN - 0.7)
    x0, y0, x1, y1 = 1160, 1750, 540 + _kw_w * 0.18, B_CHIP_CY + 22
    u = eio(seg(t, 0.4, B_TCUR)); x = lerp(x0, x1, u) + 8 * math.sin(t * 1.3) * (u >= 1); y = lerp(y0, y1, u)
    return (x, y, a)
def budget_frame(t):
    im = bg(t, pulse=max(0, 1 - abs(t - B_TCUR) / 0.35))
    draw_logo(im, t)
    for txt, fnt, y, t0 in ((BUD["h1"], BF1, 700, B_T1), (BUD["h2"], BF1, 800, B_T1 + 0.12)):
        a = eo(seg(t, t0, t0 + 0.45))
        if a > 0: ac(im, amul(glow_text(txt, fnt), a), 0, y - 100 + 26 * (1 - a))
    a = eo(seg(t, B_T2, B_T2 + 0.4))
    if a > 0: ac(im, amul(glow_text(BUD["pre"], BFP, glow=0.0), a), 0, 1120 - 100 + 18 * (1 - a))
    p = seg(t, B_T3, B_T3 + 0.4)
    if p > 0:
        cur = budget_cursor(t); hot = clamp(seg(t, B_TCUR - 0.1, B_TCUR + 0.15)) if cur else 0.0
        c = budget_chip(hot, 0.5 + 0.5 * math.sin(t * 3.2)); s = eob(p) * (1 + 0.05 * hot * (1 + math.sin(t * 4)) / 2)
        if abs(s - 1) > 0.005: c = c.resize((max(2, int(c.width * s)), max(2, int(c.height * s))), Image.BICUBIC)
        ac(im, amul(c, clamp(p * 3)), 540 - c.width / 2, B_CHIP_CY - c.height / 2)
    a = eo(seg(t, B_TSUB, B_TSUB + 0.4))
    if a > 0:
        lay = Image.new("RGBA", (W, 70), (0, 0, 0, 0)); ImageDraw.Draw(lay).text((540, 48), BUD["sub"], font=BFS, fill=(214, 200, 186, 255), anchor="ms")
        ac(im, amul(lay, a), 0, 1440 - 48 + 12 * (1 - a))
    cur = budget_cursor(t)
    if cur is not None and cur[2] > 0: cursor(im, cur[0], cur[1], 1.0, alpha=cur[2])
    fo = seg(t, B_LEN - 0.45, B_LEN)
    if fo > 0: im = Image.blend(im, Image.new("RGBA", (W, H), (0, 0, 0, 255)), eio(fo))
    return im
def budget_sfx(ev, o):
    ev.append((o + B_T1, "whoosh/fs810485.ogg", 0.22)); ev.append((o + B_T1 + 0.12, "pop/kenney-interface-pluck-001.ogg", 0.22))
    ev.append((o + B_T3, "pop/kenney-interface-pluck-002.ogg", 0.32)); ev.append((o + B_TCUR, "ding/kenney-interface-glass-002.ogg", 0.38))

# ---------------- pinned entry hook (tracked to the monitor) ----------------
# texture covers screen-normalised u in [-0.1, 1.1], v in [V0, V1] (v=0 is the top edge of the screen; the light bar sits just above)
V0, V1 = -0.40, -0.13
TEXW = 1400; TEXH = int(TEXW * (V1 - V0) / 1.2 * 0.62)   # 0.62 ~ screen h/w in the footage (only sets texture resolution)
_HTEX = {}
T_TYPE0 = 0.2
def type_times(text):
    """human typing rhythm (deterministic jitter, a little pause after spaces/punctuation)."""
    r = random.Random(len(text) * 7 + sum(map(ord, text))); t = T_TYPE0; out = []
    for ch in text:
        out.append(t); t += 0.052 + r.uniform(-0.012, 0.022) + (0.05 if ch in " .,:?" else 0)
    return out
def hook_tex(text, t):
    """RGBA texture: typed white text with soft shadow + orange caret while typing (blinks briefly, then hides). No underline."""
    tt = type_times(text); n = sum(1 for x in tt if x <= t); done = tt[-1] + 0.06
    caret = (t < done) or (t < done + 1.4 and int((t - done) * 2.6) % 2 == 0)
    key = (text, n, caret)
    if key in _HTEX: return _HTEX[key]
    tex = Image.new("RGBA", (TEXW, TEXH), (0, 0, 0, 0))
    fs = fit(text, PSB, TEXW * 0.72, 200); fs = min(fs, int(TEXH * 0.46)); f = font(PSB, fs)
    base = TEXH * 0.66; x0 = TEXW / 2 - f.getlength(text) / 2; shown = text[:n]
    m = Image.new("L", (TEXW, TEXH), 0); ImageDraw.Draw(m).text((x0, base), shown, font=f, fill=255, anchor="ls")
    sh = Image.new("RGBA", (TEXW, TEXH), (0, 0, 0, 0)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(fs * 0.18)).point(lambda v: int(v * 0.75)))
    tex.alpha_composite(sh)
    wt = Image.new("RGBA", (TEXW, TEXH), (255, 250, 245, 0)); wt.putalpha(m); tex.alpha_composite(wt)
    if caret:
        bb = f.getbbox("H"); cap = bb[3] - bb[1]; xr = x0 + f.getlength(shown) + fs * 0.06
        ImageDraw.Draw(tex).rounded_rectangle((xr, base - cap - fs * 0.05, xr + fs * 0.075, base + fs * 0.07), fs * 0.03, fill=ORANGE + (255,))
    _HTEX[key] = tex; return tex
DARK_DEFAULT = (0.30, 0.28)                      # room brightness = DARK[0] + DARK[1] * falloff near the screen
DARKS = {"VID_1238": (0.12, 0.10), "VID_1238S": (0.12, 0.10)}              # bright room: crush everything except the screen
DARK = DARK_DEFAULT
# mask = tracked screen quad scaled around its centre; the edge must fall on the black bezel, never inside the picture
MASK_DEFAULT = ((1.015, 1.03), 2.5)
MASKS = {"VID_1238": ((1.075, 1.065), 4.0), "VID_1238S": ((1.075, 1.065), 4.0)}      # wide-angle handheld clip: generous mask + softer edge
MASK = MASK_DEFAULT
def grade(fr, quad):
    """darken the room, lift + crisp the monitor (no geometric change)."""
    a = np.asarray(fr, np.float32); q = np.array(quad, np.float32)
    (sx, sy), feather = MASK
    c = q.mean(0); qs = (q - c) * [sx, sy] + c
    m4 = np.zeros((H // 4, W // 4), np.float32); cv2.fillPoly(m4, [np.int32(qs / 4)], 1.0)
    dist = cv2.distanceTransform((m4 < 0.5).astype(np.uint8), cv2.DIST_L2, 5) * 4
    fall = cv2.resize(np.exp(-dist / 420.0).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    m = cv2.resize(cv2.GaussianBlur(m4, (0, 0), feather), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    scr = (a - 128) * 1.08 + 128 + 8
    lum = scr.mean(2, keepdims=True); scr = lum + (scr - lum) * 1.08
    bl = cv2.GaussianBlur(scr, (0, 0), 1.3); scr = scr + (scr - bl) * 0.5
    env = a * (DARK[0] + DARK[1] * fall)
    return Image.fromarray(np.clip(env * (1 - m) + scr * m, 0, 255).astype(np.uint8))
def pin_hook(frame, quad, text, t, alpha):
    frame = grade(frame, quad)
    if alpha <= 0.01: return frame.convert("RGBA")
    # upright text (no perspective, no stretch): only position + size follow the monitor; it sits above the lamp bar
    tex = hook_tex(text, t)
    q = np.array(quad, np.float64); TL, TR, BR, BL = q
    ltop = float(np.linalg.norm(TR - TL)); hs = float((np.linalg.norm(BL - TL) + np.linalg.norm(BR - TR)) / 2)
    tw_full = TEXW * 0.72                                       # text ink width inside the texture
    s = min(0.80 * ltop, 940.0) / tw_full
    cx = float((TL[0] + TR[0]) / 2); half = tw_full * s / 2; cx = min(max(cx, 40 + half), W - 40 - half)
    def edge_y(x): u = (x - TL[0]) / ((TR[0] - TL[0]) or 1e-6); return TL[1] + (TR[1] - TL[1]) * u
    base_y = min(edge_y(cx - half), edge_y(cx + half)) - 0.20 * hs
    tw, th = max(2, int(TEXW * s)), max(2, int(TEXH * s))
    if PERSP > 0:
        # follow the monitor: text runs parallel to the lamp / top edge with gentle foreshortening, size unchanged (no stretch)
        e = (TR - TL) / (np.linalg.norm(TR - TL) or 1); n = np.array([e[1], -e[0]])
        if n[1] > 0: n = -n
        hL, hR = np.linalg.norm(BL - TL), np.linalg.norm(BR - TR); hm = (hL + hR) / 2
        kL, kR = 1 + PERSP * (hL / hm - 1), 1 + PERSP * (hR / hm - 1)
        tw, th = tw * 0.86, th * 0.86                               # a touch smaller so the angled line stays inside the frame
        mid = TL + (TR - TL) * 0.46; Aa = mid + n * 0.20 * hs
        dst = np.float32([Aa - e * tw / 2 + n * .66 * th * kL, Aa + e * tw / 2 + n * .66 * th * kR,
                          Aa + e * tw / 2 - n * .34 * th * kR, Aa - e * tw / 2 - n * .34 * th * kL])
        Mh = cv2.getPerspectiveTransform(np.float32([[0, 0], [TEXW, 0], [TEXW, TEXH], [0, TEXH]]), dst)
        warped = cv2.warpPerspective(np.array(tex), Mh, (W, H), flags=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
        if alpha < 1: warped[..., 3] = (warped[..., 3] * alpha).astype(np.uint8)
        out = frame.convert("RGBA"); out.alpha_composite(Image.fromarray(warped, "RGBA")); return out
    lay = tex.resize((tw, th), Image.LANCZOS)
    if alpha < 1: lay = amul(lay, alpha)
    out = frame.convert("RGBA"); ac(out, lay, cx - tw / 2, base_y - TEXH * 0.66 * s); return out
PERSP_DEFAULT = 0.0
PERSPS = {"VID_1238S": 0.6}
PERSP = PERSP_DEFAULT
HOOK_OUT = 1e9   # stays on until the footage ends
def hook_alpha(t): return 1.0
def mac_keys():
    """soft, short laptop-style (scissor-switch) key ticks cut from the typing recording."""
    a = sfx("typing/fs-323432-typing.ogg"); m = np.abs(a.mean(1))
    env = np.convolve(m, np.ones(66) / 66, mode="same"); thr = env.max() * 0.3
    peaks, last = [], -10 ** 9
    for i in range(1, len(env) - 1):
        if env[i] > thr and env[i] >= env[i - 1] and env[i] >= env[i + 1] and i - last > SR * 0.07: peaks.append(i); last = i
    out = []
    for p in peaks[:30]:
        s0 = max(0, p - int(SR * 0.004)); sl = a[s0:s0 + int(SR * 0.06)].copy()
        sl *= np.exp(-np.linspace(0, 6, len(sl)))[:, None]; out.append(sl / (np.abs(sl).max() or 1))
    return out
def hook_sfx(ev, ks, text):
    mk = mac_keys(); r = random.Random(3)
    for i, (ch, t0) in enumerate(zip(text, type_times(text))):
        ev.append((t0, mk[(i * 7) % len(mk)], (0.42 if ch == " " else 0.3) * r.uniform(0.8, 1.05)))

# ---------------- footage -> tail transition ----------------
def outro_card(im, fr, p):
    """footage shrinks into a rounded card and fades as the tail takes over (p: 0 -> 1)."""
    e = eio(p); sc = lerp(1.0, 0.42, e); w, h = int(W * sc), int(H * sc)
    card = fr.resize((w, h), Image.BILINEAR).convert("RGBA")
    r = int(60 * e); card.putalpha(rr_mask(w, h, r).point(lambda v: int(v * (1 - eo(seg(p, 0.45, 1.0))))) if r > 1 else Image.new("L", (w, h), 255))
    ac(im, card, 540 - w / 2, 960 - h / 2 - 80 * e)
    return im
TR_OUT = 0.5

# ---------------- render ----------------
def encoder(path):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
def quads(site): return json.load(open(f"clips/raw_{site}.json"))

def render_single(key, site, name):
    global DARK, MASK, PERSP; DARK = DARKS.get(site, DARK_DEFAULT); MASK = MASKS.get(site, MASK_DEFAULT); PERSP = PERSPS.get(site, PERSP_DEFAULT)
    nf = nframes(f"clips/raw_{site}.mp4"); Q = quads(site); text = HOOKS[key]
    TS = math.floor((nf / FPS - TR_OUT) / B) * B; total = TS + TAIL_LEN
    rd = Reader(f"clips/raw_{site}.mp4", 0, W, H); enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < TS + TR_OUT:
            i = min(int(t * FPS), nf - 1); fr = rd.get(i)
            im = pin_hook(fr, Q[min(i, len(Q) - 1)], text, t, hook_alpha(t)) if t < HOOK_OUT else fr.convert("RGBA")
            if t >= TS: im = outro_card(tail_frame(t - TS), im, seg(t, TS, TS + TR_OUT))
        else: im = tail_frame(t - TS)
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait(); rd.close()
    return total, events_single(key, site)[2]

# ---- transition SFX: every whoosh is placed so its loudest moment (peak) lands on the visual transition ----
_pk = {}
def peak_t(name):
    if name not in _pk:
        a = np.abs(sfx(name).mean(1)); env = np.convolve(a, np.ones(441) / 441, mode="same"); _pk[name] = env.argmax() / SR
    return _pk[name]
def at_peak(ev, t, name, g): ev.append((t - peak_t(name), name, g))
# ================= v9: professional sound pass (sound-effects skill default kit) + end card WITHOUT the 3D MOTION text =================
# Principle: few sounds, one per cue, music leads. Curated CC0 kit (whoosh / riser / impact / pop / tick) + Mixkit laptop typing.
TYPING_FILE = os.path.abspath("audio/sound-effects-cache/typing.mp3")   # Mixkit #1392 "Fast laptop keyboard typing" (downloaded at runtime, not redistributed)
K_WHOOSH, K_RISER, K_IMPACT, K_POP, K_TICK = "kit/whoosh.ogg", "kit/riser.ogg", "kit/impact.ogg", "kit/pop.ogg", "kit/tick.ogg"
CUT_SFX = [K_WHOOSH, "transition/fs-786514-swoosh-v2.ogg"]          # alternate two soft takes so repeats don't sound robotic
def laptop_keys():
    a = sfx(TYPING_FILE); m = np.abs(a.mean(1))
    env = np.convolve(m, np.ones(66) / 66, mode="same"); thr = env.max() * 0.28
    peaks, last = [], -10 ** 9
    for i in range(1, len(env) - 1):
        if env[i] > thr and env[i] >= env[i - 1] and env[i] >= env[i + 1] and i - last > SR * 0.06: peaks.append(i); last = i
    out = []
    for p in peaks[:60]:
        s0 = max(0, p - int(SR * 0.004)); sl = a[s0:s0 + int(SR * 0.07)].copy()
        sl *= np.exp(-np.linspace(0, 5, len(sl)))[:, None]; out.append(sl / (np.abs(sl).max() or 1))
    return out
def hook_sfx(ev, ks, text):
    lk = laptop_keys(); r = random.Random(5)
    for i, (ch, t0) in enumerate(zip(text, type_times(text))):
        ev.append((t0, lk[(i * 5 + 3) % len(lk)], 0.20 * r.uniform(0.8, 1.0) * (1.15 if ch == " " else 1.0)))
def outro_sfx(ev, TS):
    land = TS + TR_OUT
    rz = sfx(K_RISER); ev.append((land - len(rz) / SR, K_RISER, 0.30))   # riser ENDS when the end card lands
    at_peak(ev, TS + 0.25, K_WHOOSH, 0.30)                              # card shrinks away
    ev.append((land, K_IMPACT, 0.55))                                   # reveal = loudest SFX

# ---- end card without the 3D MOTION text: logo + CTA only, centred ----
T_CTA = 0.30; CHIP_T = [T_CTA + 0.15 * (i + 1) for i in range(len(CHIPS))]
T_CHIP = 1.45; HOV = [T_CHIP - 0.35]; CEND = T_CHIP; TAIL_LEN = 4.6
CTA_Y1, CHIP_CY, CTA_Y3 = 930, 1075, 1200
LOGO_Y = 690
def _cur_keys():
    cx0, cw0 = CHIP_X[0]
    return [(0.30, 1150, 1700), (T_CHIP, cx0 + cw0 * 0.6, CHIP_CY + 10), (TAIL_LEN, cx0 + cw0 * 0.68, CHIP_CY + 22)]
CUR_K = _cur_keys()
def cursor_pos(t):
    if t < CUR_K[0][0]: return None
    a = 1.0 - seg(t, TAIL_LEN - 1.0, TAIL_LEN - 0.7)
    for (t1, x1, y1), (t2, x2, y2) in zip(CUR_K, CUR_K[1:]):
        if t1 <= t <= t2: u = eio(seg(t, t1, t2)); return (lerp(x1, x2, u), lerp(y1, y2, u), a)
    return (CUR_K[-1][1], CUR_K[-1][2], a)
def draw_logo(im, t, y0=None):
    a = eo(seg(t, 0.05, 0.5))
    if a <= 0: return
    y = (LOGO_Y if y0 is None else y0) + 16 * (1 - a) + 3 * math.sin(t * 1.6)
    ac(im, amul(LOGO_GLOW, a * 0.8), 540 - _lgl.width / 2, y - _lgl.height / 2); ac(im, amul(LOGO_S, a), 540 - LOGO_S.width / 2, y - LOGO_S.height / 2)
def tail_frame(t):
    t = float(t)
    im = bg(t, pulse=max(0, 1 - abs(t - T_CHIP) / 0.35))
    cur = cursor_pos(t)
    draw_logo(im, t); draw_cta(im, t, cur)
    if cur is not None and cur[2] > 0: cursor(im, cur[0], cur[1], 1.0, alpha=cur[2])
    fo = seg(t, TAIL_LEN - 0.45, TAIL_LEN)
    if fo > 0: im = Image.blend(im, Image.new("RGBA", (W, H), (0, 0, 0, 255)), eio(fo))
    return im
def tail_sfx(ev, ks, o):
    ev.append((o + CHIP_T[2] + 0.05, K_POP, 0.14))                     # chips settle (the impact already covers the card landing)
    ev.append((o + T_CHIP - 0.05, K_TICK, 0.22))                        # cursor reaches PROMPT (hover, no click)
_budget_frame_v8 = budget_frame
def budget_frame(t):
    global LOGO_Y
    keep = LOGO_Y; LOGO_Y = 330
    try: return _budget_frame_v8(float(t))
    finally: LOGO_Y = keep
def title_layer():   # bigger CTA heading now that it is the only element on the card
    global _TITLE
    if _TITLE is None:
        f1 = font(PB, fit(CTA1, PB, 940, 76)); m = Image.new("L", (W, 130), 0); ImageDraw.Draw(m).text((540, 92), CTA1, font=f1, fill=255, anchor="ms")
        lay = Image.new("RGBA", (W, 130), (0, 0, 0, 0))
        gl = Image.new("RGBA", (W, 130), ORANGE + (0,)); gl.putalpha(m.filter(ImageFilter.GaussianBlur(18)).point(lambda v: min(255, int(v * 1.4)))); lay.alpha_composite(gl)
        wt = Image.new("RGBA", (W, 130), (255, 246, 238, 0)); wt.putalpha(m); lay.alpha_composite(wt)
        _TITLE = lay
    return _TITLE
_TITLE = None
def budget_sfx(ev, o):
    ev.append((o + B_T3, K_POP, 0.18)); ev.append((o + B_TCUR - 0.05, K_TICK, 0.22))
def events_single(key, site):
    nf = nframes(f"clips/raw_{site}.mp4"); text = HOOKS[key]
    TS = math.floor((nf / FPS - TR_OUT) / B) * B; total = TS + TAIL_LEN
    ks = keystrokes(); ev = []; hook_sfx(ev, ks, text); tail_sfx(ev, ks, TS); outro_sfx(ev, TS)
    return TS, total, ev

MAIN_SHOTS = [("IMG_6721", 0.0), ("IMG_6709", 0.3), ("IMG_6704", 0.0), ("IMG_6712", 0.0), ("IMG_6711", 17.0)]
SHOT = 6 * B; FIRST = 8 * B; TR = 0.36
def render_main(name):
    text = HOOKS["main"]; QS = [quads(s[0]) for s in MAIN_SHOTS]
    starts = [0.0] + [FIRST + SHOT * i for i in range(len(MAIN_SHOTS) - 1)]; cuts = starts[1:]
    TS = FIRST + SHOT * (len(MAIN_SHOTS) - 1); total = TS + B_LEN
    rds = [None] * len(MAIN_SHOTS)
    def shot(i, t):   # every shot carries the hook, pinned to its own monitor
        if rds[i] is None: rds[i] = Reader(f"clips/raw_{MAIN_SHOTS[i][0]}.mp4", MAIN_SHOTS[i][1], W, H)
        li = max(0, int((t - starts[i]) * FPS)); fr = rds[i].get(li)
        qi = min(int(MAIN_SHOTS[i][1] * FPS) + li, len(QS[i]) - 1)
        return pin_hook(fr, QS[i][qi], text, t, hook_alpha(t)).convert("RGB")
    def zoom(fr, s):
        w, h = int(W * s), int(H * s); z = fr.resize((w, h), Image.BILINEAR)
        return z.crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H))
    enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < TS + TR_OUT:
            i = min(len(MAIN_SHOTS) - 1, max(j for j in range(len(starts)) if starts[j] - TR / 2 <= t))
            if i > 0 and t < starts[i] + TR / 2:
                p = seg(t, starts[i] - TR / 2, starts[i] + TR / 2)
                A = zoom(shot(i - 1, t), 1 + 0.22 * eio(p)); Bf = zoom(shot(i, t), 1.14 - 0.14 * eo(p))
                im = Image.blend(A, Bf, eio(p)).convert("RGBA")
                wl = Image.new("RGBA", (W, H), (255, 236, 220, 0)); wl.putalpha(shine_band(W, H, p * 1.9 - 0.4, 0.07).point(lambda v: int(v * 0.4 * math.sin(math.pi * p))))
                im.alpha_composite(wl)
            else: im = shot(i, t).convert("RGBA")
            if t >= TS: im = outro_card(budget_frame(t - TS), im, seg(t, TS, TS + TR_OUT))
        else: im = budget_frame(t - TS)
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait()
    for r in rds:
        if r: r.close()
    return total, events_main()[2]
def events_main():
    starts = [0.0] + [FIRST + SHOT * i for i in range(len(MAIN_SHOTS) - 1)]; cuts = starts[1:]
    TS = FIRST + SHOT * (len(MAIN_SHOTS) - 1); total = TS + B_LEN
    ks = keystrokes(); ev = []; hook_sfx(ev, ks, HOOKS["main"]); budget_sfx(ev, TS)
    for j, c in enumerate(cuts): at_peak(ev, c, CUT_SFX[j % len(CUT_SFX)], 0.32)
    outro_sfx(ev, TS)
    return TS, total, ev

def mix_and_mux(name, total, ev):
    n = int(total * SR) + SR; bus = np.zeros((n, 2), np.float32)
    for e in ev:
        t0, s, g = e; a = s if isinstance(s, np.ndarray) else sfx(s)
        i = int(max(0, t0) * SR); j = min(n, i + len(a)); bus[i:j] += a[: j - i] * g
    mus = load_audio(MUSIC); mus /= np.abs(mus).max()
    need = total + 0.5; cand = np.arange(4.0, max(4.1, MDUR - need), 0.5)
    o = cand[int(np.argmax([MRMS[int(c * 10):int((c + need) * 10)].mean() for c in cand]))]
    o = PHASE + round((o - PHASE) / B) * B          # video t=0 sits on a beat -> cuts and tail (multiples of B) land on beats
    m = mus[int(o * SR): int(o * SR) + n]; m = np.pad(m, ((0, n - len(m)), (0, 0)))
    tt = np.arange(n) / SR; m *= (np.minimum(1, tt / 0.25) * np.clip((total - tt) / 1.2, 0, 1))[:, None]
    os.makedirs(os.path.join(OUT, "with-music"), exist_ok=True); os.makedirs(os.path.join(OUT, "sfx-only (Instagram trending audio)"), exist_ok=True)
    for tag, audio, dst in (("", bus + m * 0.4, "with-music"), ("_SFX-only", bus, "sfx-only (Instagram trending audio)")):
        audio = audio[: int(total * SR)]; raw = f"out/{name}{tag}.f32"; audio.astype(np.float32).tofile(raw)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"out/{name}_v.mp4", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw,
                        "-af", "loudnorm=I=-16:TP=-6:LRA=11,alimiter=limit=0.5:level=false", "-ar", "48000", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                        "-shortest", "-movflags", "+faststart", os.path.join(OUT, dst, f"{name}{tag}.mp4")], check=True)
        os.remove(raw)
    os.remove(f"out/{name}_v.mp4"); print(name, "music offset", round(o, 2), flush=True)

# ================= v10: jitter-free captions + per-site screen contrast =================
# Text placement uses a lightly smoothed track (removes tracker noise, no lag: symmetric kernel), a heavily smoothed size
# (no breathing), and sub-pixel float placement (warpAffine) instead of whole-pixel pasting -> no frame-to-frame stepping.
def tquads(Q, sig_pos=2.0, sig_size=20.0):
    Q = np.array(Q, np.float64); N = len(Q)
    def gs(x, sig):
        r = int(3 * sig); k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sig ** 2)); k /= k.sum()
        return np.convolve(np.pad(x, r, mode="reflect" if N > r else "edge"), k, mode="valid")
    Qs = np.stack([np.stack([gs(Q[:, c, j], sig_pos) for j in range(2)], 1) for c in range(4)], 1)
    lt = gs(np.linalg.norm(Q[:, 1] - Q[:, 0], axis=1), sig_size)
    hs = gs((np.linalg.norm(Q[:, 3] - Q[:, 0], axis=1) + np.linalg.norm(Q[:, 2] - Q[:, 1], axis=1)) / 2, sig_size)
    return [(Qs[i], float(lt[i]), float(hs[i])) for i in range(N)]
# screen grade: black point (removes lamp glare veil), contrast, saturation
SCR_DEFAULT = (0, 1.08, 8, 1.08)                 # (black point, contrast, lift, saturation) == previous look
SCREENS = {"VID_1238": (26, 1.22, 2, 1.16), "VID_1238S": (26, 1.22, 2, 1.16)}
SCR = SCR_DEFAULT
def grade(fr, quad):
    a = np.asarray(fr, np.float32); q = np.array(quad, np.float32)
    (sx, sy), feather = MASK; bp, con, lift, sat = SCR
    c = q.mean(0); qs = (q - c) * [sx, sy] + c
    m4 = np.zeros((H // 4, W // 4), np.float32); cv2.fillPoly(m4, [np.int32(qs / 4)], 1.0)
    dist = cv2.distanceTransform((m4 < 0.5).astype(np.uint8), cv2.DIST_L2, 5) * 4
    fall = cv2.resize(np.exp(-dist / 420.0).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    m = cv2.resize(cv2.GaussianBlur(m4, (0, 0), feather), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    scr = (a - bp) * (255.0 / (255.0 - bp)) if bp else a
    scr = (scr - 128) * con + 128 + lift
    lum = scr.mean(2, keepdims=True); scr = lum + (scr - lum) * sat
    bl = cv2.GaussianBlur(scr, (0, 0), 1.3); scr = scr + (scr - bl) * 0.5
    env = a * (DARK[0] + DARK[1] * fall)
    return Image.fromarray(np.clip(env * (1 - m) + scr * m, 0, 255).astype(np.uint8))
def type_times(text):
    r = random.Random(len(text) * 7 + sum(map(ord, text))); t = T_TYPE0; out = []
    for ch in text:
        out.append(t); t += 0.052 + r.uniform(-0.012, 0.022) + (0.05 if ch in " .,:?" else 0) + (0.35 if ch == "\n" else 0)
    return out
_HTEX2 = {}
def hook_tex(text, t):
    """multi-line aware caption texture; the LAST line's baseline keeps the single-line position (TEXH*0.34 above the bottom)."""
    tt = type_times(text); n = sum(1 for x in tt if x <= t); done = tt[-1] + 0.06
    caret = (t < done) or (t < done + 1.4 and int((t - done) * 2.6) % 2 == 0)
    key = (text, n, caret)
    if key in _HTEX2: return _HTEX2[key]
    lines = text.split("\n"); nl_ = len(lines)
    fs = min(min(fit(L, PSB, TEXW * 0.72, 200) for L in lines), int(TEXH * 0.46)); f = font(PSB, fs)
    lh = fs * 1.32; Ht = int(TEXH + lh * (nl_ - 1)); base_last = Ht - TEXH * 0.34
    tex = Image.new("RGBA", (TEXW, Ht), (0, 0, 0, 0)); m = Image.new("L", (TEXW, Ht), 0); dm = ImageDraw.Draw(m)
    shown = text[:n].split("\n"); cpos = None
    for li, L in enumerate(lines):
        base = base_last - lh * (nl_ - 1 - li); x0 = TEXW / 2 - f.getlength(L) / 2
        if li < len(shown):
            dm.text((x0, base), shown[li], font=f, fill=255, anchor="ls"); cpos = (x0 + f.getlength(shown[li]), base)
    sh = Image.new("RGBA", (TEXW, Ht), (0, 0, 0, 0)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(fs * 0.18)).point(lambda v: int(v * 0.75)))
    tex.alpha_composite(sh)
    wt = Image.new("RGBA", (TEXW, Ht), (255, 250, 245, 0)); wt.putalpha(m); tex.alpha_composite(wt)
    if caret and cpos:
        bb = f.getbbox("H"); cap = bb[3] - bb[1]; xr = cpos[0] + fs * 0.06; base = cpos[1]
        ImageDraw.Draw(tex).rounded_rectangle((xr, base - cap - fs * 0.05, xr + fs * 0.075, base + fs * 0.07), fs * 0.03, fill=ORANGE + (255,))
    if len(_HTEX2) > 400: _HTEX2.clear()
    _HTEX2[key] = tex; return tex
_HALF = {}
def pin_hook(frame, quad, text, t, alpha, tq=None):
    frame = grade(frame, quad)
    out = frame.convert("RGBA")
    if alpha <= 0.01: return out
    tex = hook_tex(text, t)
    if tq is None:
        q0 = np.array(quad, np.float64)
        tq = (q0, float(np.linalg.norm(q0[1] - q0[0])), float((np.linalg.norm(q0[3] - q0[0]) + np.linalg.norm(q0[2] - q0[1])) / 2))
    q, ltop, hs = tq; TL, TR, BR, BL = q
    tw_full = TEXW * 0.72; s = min(0.80 * ltop, 940.0) / tw_full
    arr = np.array(tex)
    if PERSP > 0:
        e = (TR - TL) / (np.linalg.norm(TR - TL) or 1); n = np.array([e[1], -e[0]])
        if n[1] > 0: n = -n
        hL, hR = np.linalg.norm(BL - TL), np.linalg.norm(BR - TR); hm = (hL + hR) / 2
        kL, kR = 1 + PERSP * (hL / hm - 1), 1 + PERSP * (hR / hm - 1)
        tw, th = TEXW * s * 0.86, TEXH * s * 0.86
        Aa = TL + (TR - TL) * 0.46 + n * 0.20 * hs
        dst = np.float32([Aa - e * tw / 2 + n * .66 * th * kL, Aa + e * tw / 2 + n * .66 * th * kR,
                          Aa + e * tw / 2 - n * .34 * th * kR, Aa - e * tw / 2 - n * .34 * th * kL])
        Mh = cv2.getPerspectiveTransform(np.float32([[0, 0], [TEXW, 0], [TEXW, TEXH], [0, TEXH]]), dst)
        warped = cv2.warpPerspective(arr, Mh, (W, H), flags=cv2.INTER_LINEAR)
        if alpha < 1: warped[..., 3] = (warped[..., 3] * alpha).astype(np.uint8)
        out.alpha_composite(Image.fromarray(warped, "RGBA")); return out
    cx = float((TL[0] + TR[0]) / 2); half = tw_full * s / 2; cx = min(max(cx, 40 + half), W - 40 - half)
    def edge_y(x): u = (x - TL[0]) / ((TR[0] - TL[0]) or 1e-6); return TL[1] + (TR[1] - TL[1]) * u
    base_y = float(min(edge_y(cx - half), edge_y(cx + half)) - 0.20 * hs)
    k = 1.0
    if s < 0.55:                                  # pre-shrink so bilinear never down-samples below 0.55 (no aliasing)
        if id(tex) not in _HALF: _HALF.clear(); _HALF[id(tex)] = np.array(tex.resize((TEXW // 2, tex.height // 2), Image.LANCZOS))
        arr = _HALF[id(tex)]; k = TEXW / (TEXW // 2)
    Ht = tex.height
    ox, oy = cx - TEXW / 2 * s, base_y - (Ht - TEXH * 0.34) * s    # float destination of texture origin (last baseline on base_y)
    x0, y0 = max(0, int(math.floor(ox)) - 2), max(0, int(math.floor(oy)) - 2)
    x1, y1 = min(W, int(math.ceil(ox + TEXW * s)) + 2), min(H, int(math.ceil(oy + Ht * s)) + 2)
    if x1 <= x0 or y1 <= y0: return out
    M = np.float32([[s * k, 0, ox - x0], [0, s * k, oy - y0]])
    roi = cv2.warpAffine(arr, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    if alpha < 1: roi[..., 3] = (roi[..., 3] * alpha).astype(np.uint8)
    out.alpha_composite(Image.fromarray(roi, "RGBA"), (x0, y0)); return out
def render_single(key, site, name):
    global DARK, MASK, PERSP, SCR; DARK = DARKS.get(site, DARK_DEFAULT); MASK = MASKS.get(site, MASK_DEFAULT); PERSP = PERSPS.get(site, PERSP_DEFAULT); SCR = SCREENS.get(site, SCR_DEFAULT)
    nf = nframes(f"clips/raw_{site}.mp4"); Q = quads(site); TQ = tquads(Q); text = HOOKS[key]
    TS = math.floor((nf / FPS - TR_OUT) / B) * B; total = TS + TAIL_LEN
    rd = Reader(f"clips/raw_{site}.mp4", 0, W, H); enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < TS + TR_OUT:
            i = min(int(t * FPS), nf - 1); fr = rd.get(i); j = min(i, len(Q) - 1)
            im = pin_hook(fr, Q[j], text, t, hook_alpha(t), TQ[j])
            if t >= TS: im = outro_card(tail_frame(t - TS), im, seg(t, TS, TS + TR_OUT))
        else: im = tail_frame(t - TS)
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait(); rd.close()
    return total, events_single(key, site)[2]
def render_main(name):
    global SCR, DARK, MASK, PERSP
    text = HOOKS["main"]; QS = [quads(s[0]) for s in MAIN_SHOTS]; TQS = [tquads(q) for q in QS]
    starts = [0.0] + [FIRST + SHOT * i for i in range(len(MAIN_SHOTS) - 1)]
    TS = FIRST + SHOT * (len(MAIN_SHOTS) - 1); total = TS + B_LEN
    rds = [None] * len(MAIN_SHOTS)
    def shot(i, t):
        global SCR, DARK, MASK, PERSP
        site = MAIN_SHOTS[i][0]; SCR = SCREENS.get(site, SCR_DEFAULT); DARK = DARKS.get(site, DARK_DEFAULT); MASK = MASKS.get(site, MASK_DEFAULT); PERSP = PERSPS.get(site, PERSP_DEFAULT)
        if rds[i] is None: rds[i] = Reader(f"clips/raw_{site}.mp4", MAIN_SHOTS[i][1], W, H)
        li = max(0, int((t - starts[i]) * FPS)); fr = rds[i].get(li)
        qi = min(int(MAIN_SHOTS[i][1] * FPS) + li, len(QS[i]) - 1)
        return pin_hook(fr, QS[i][qi], text, t, hook_alpha(t), TQS[i][qi]).convert("RGB")
    def zoom(fr, s):
        w, h = int(W * s), int(H * s); z = fr.resize((w, h), Image.BILINEAR)
        return z.crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H))
    enc = encoder(f"out/{name}_v.mp4")
    for f in range(int(total * FPS)):
        t = f / FPS
        if t < TS + TR_OUT:
            i = min(len(MAIN_SHOTS) - 1, max(j for j in range(len(starts)) if starts[j] - TR / 2 <= t))
            if i > 0 and t < starts[i] + TR / 2:
                p = seg(t, starts[i] - TR / 2, starts[i] + TR / 2)
                A = zoom(shot(i - 1, t), 1 + 0.22 * eio(p)); Bf = zoom(shot(i, t), 1.14 - 0.14 * eo(p))
                im = Image.blend(A, Bf, eio(p)).convert("RGBA")
                wl = Image.new("RGBA", (W, H), (255, 236, 220, 0)); wl.putalpha(shine_band(W, H, p * 1.9 - 0.4, 0.07).point(lambda v: int(v * 0.4 * math.sin(math.pi * p))))
                im.alpha_composite(wl)
            else: im = shot(i, t).convert("RGBA")
            if t >= TS: im = outro_card(budget_frame(t - TS), im, seg(t, TS, TS + TR_OUT))
        else: im = budget_frame(t - TS)
        enc.stdin.write(im.convert("RGB").tobytes())
        if f % 90 == 0: print(name, f"{t:.1f}/{total:.1f}s", flush=True)
    enc.stdin.close(); enc.wait()
    for r in rds:
        if r: r.close()
    return total, events_main()[2]

# ================= v11: per-reel start hook + per-reel end CTA card (user's caption table, no emoji / hashtags) =================
HOOKS_ALL = {
  "en": {"main": "Claude Opus just cooked", "nl": "Client wanted “not basic”,\nso I built this 3D website", "kv": "A logistics website\nthat isn’t boring",
         "wb": "POV: your library\ngot a 3D website", "rw": "The future of\nfashion brand websites", "tp": "Walk the trail in 3D\nbefore you book", "vm": "Small business,\nbig website"},
  "de": {"main": "Claude Opus hat geliefert", "nl": "Kunde wollte keine Standard-Website,\nalso baute ich diese 3D-Website", "kv": "Eine Logistik-Website,\ndie nicht langweilig ist",
         "wb": "POV: Deine Bibliothek hat\njetzt eine 3D-Website", "rw": "Die Zukunft für Websites\nvon Modemarken", "tp": "Geh den Weg in 3D,\nbevor du buchst", "vm": "Kleines Unternehmen,\ngroße Website"}}
HOOKS = HOOKS_ALL[LANG]
ENDS_ALL = {
  "en": {"main": ("What would a website", "like this cost you?", "BUDGET", "You’ll get your price via DM."),
         "nl": ("Get the exact", "prompt for free", "PROMPT", "I’ll send it to you via DM."),
         "kv": ("See how I built it,", "step by step", "3D-WORKFLOW", "I’ll send the workflow via DM."),
         "wb": ("Build one like", "this today", "PROMPT", "The prompt comes via DM."),
         "rw": ("Want this for", "your brand?", "WEBSITE", "Let’s talk via DM."),
         "tp": ("Get the full", "workflow for free", "3D-WORKFLOW", "I’ll send it to you via DM."),
         "vm": ("Your business", "is next.", "WEBSITE", "Let’s talk via DM.")},
  "de": {"main": ("Was würde dich so", "eine Website kosten?", "BUDGET", "Du bekommst deinen Preis per DM."),
         "nl": ("Den exakten Prompt", "gratis bekommen", "PROMPT", "Ich schicke ihn dir per DM."),
         "kv": ("So habe ich sie gebaut,", "Schritt für Schritt", "3D-WORKFLOW", "Den Workflow schicke ich dir per DM."),
         "wb": ("Bau so eine", "noch heute", "PROMPT", "Den Prompt bekommst du per DM."),
         "rw": ("Willst du das für", "deine Marke?", "WEBSITE", "Schreib mir per DM."),
         "tp": ("Den kompletten Workflow", "gratis bekommen", "3D-WORKFLOW", "Ich schicke ihn dir per DM."),
         "vm": ("Dein Business ist", "als Nächstes dran.", "WEBSITE", "Schreib mir per DM.")}}
PRE = {"en": "Comment", "de": "Kommentiere"}[LANG]
def set_card(key):
    """point the end card (budget_frame) at this reel's CTA text."""
    global BUD, BF1, BFS, BFK, _kw_w
    h1, h2, kw, sub = ENDS_ALL[LANG][key]
    BUD = dict(h1=h1, h2=h2, pre=PRE, kw=kw, sub=sub); _BL.clear()
    BF1 = font(PB, fit(max(h1, h2, key=len), PB, 940, 84)); BFK = font(PB, 64 if len(kw) > 7 else 70); BFS = font(PR, fit(sub, PR, 900, 38))
    _kw_w = int(BFK.getlength(kw) + 110)
TAIL_LEN = B_LEN
def tail_frame(t): return budget_frame(t)
def tail_sfx(ev, ks, o): budget_sfx(ev, o)

JOBS = {"main": ("1_MindMerit_Main_Reel", None), "nl": ("2_MindMerit_Nectarline", "IMG_6721"), "kv": ("3_MindMerit_KV-Fracht", "IMG_6704"),
        "wb": ("4_MindMerit_Wendland-Bibliothek", "IMG_6709"), "rw": ("5_MindMerit_Runway", "IMG_6712"), "tp": ("6_MindMerit_Tiefenpfad", "IMG_6711"),
        "vm": ("7_MindMerit_Container-Villmar", "VID_1238S")}
if __name__ == "__main__":
    if sys.argv[1:2] == ["tail"]:   # preview: tail t1 t2 ...
        ims = [tail_frame(tt).convert("RGB").resize((360, 640)) for tt in map(float, sys.argv[2:])]
        sh = Image.new("RGB", (360 * len(ims), 640))
        for i, x in enumerate(ims): sh.paste(x, (360 * i, 0))
        sh.save("out/_tail.jpg", quality=90); print("TAIL_LEN", round(TAIL_LEN, 2), "T_CTA", round(T_CTA, 2), "T_CHIP", round(T_CHIP, 2)); sys.exit()
    if sys.argv[1:2] == ["budget"]:   # preview: budget t1 t2 ...
        set_card(os.environ.get("CARD", "main")); ims = [budget_frame(tt).convert("RGB").resize((360, 640)) for tt in map(float, sys.argv[2:])]
        sh = Image.new("RGB", (360 * len(ims), 640))
        for i, x in enumerate(ims): sh.paste(x, (360 * i, 0))
        sh.save("out/_budget.jpg", quality=90); sys.exit()
    if sys.argv[1:2] == ["hook"]:   # preview: hook <key> t1 t2 ...
        key = sys.argv[2]; site = JOBS[key][1] or MAIN_SHOTS[0][0]; Q = quads(site); DARK = DARKS.get(site, DARK_DEFAULT); MASK = MASKS.get(site, MASK_DEFAULT); PERSP = PERSPS.get(site, PERSP_DEFAULT); SCR = SCREENS.get(site, SCR_DEFAULT); TQ = tquads(Q); rd = Reader(f"clips/raw_{site}.mp4", 0, W, H); ims = []
        for tt in map(float, sys.argv[3:]):
            i = int(tt * FPS); j = min(i, len(Q) - 1); ims.append(pin_hook(rd.get(i), Q[j], HOOKS[key], tt, 1.0, TQ[j]).convert("RGB").resize((540, 960)))
        sh = Image.new("RGB", (540 * len(ims), 960))
        for i, x in enumerate(ims): sh.paste(x, (540 * i, 0))
        sh.save(f"out/_hook_{key}.jpg", quality=90); sys.exit()
    if sys.argv[1:2] == ["remix"]:   # re-do only the audio of already rendered reels: remix [keys...]
        for k in (sys.argv[2:] or JOBS.keys()):
            nm, site = JOBS[k]; nm += SUFFIX; set_card(k)
            src = os.path.join(OUT, "with-music", f"{nm}.mp4")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-an", "-c:v", "copy", f"out/{nm}_v.mp4"], check=True)
            _, tot, ev = events_main() if site is None else events_single(k, site)
            mix_and_mux(nm, tot, ev)
        print("ok"); sys.exit()
    for k in (sys.argv[1:] or JOBS.keys()):
        nm, site = JOBS[k]; nm += SUFFIX; set_card(k)
        tot, ev = render_main(nm) if site is None else render_single(k, site, nm)
        mix_and_mux(nm, tot, ev)
    print("ok")







