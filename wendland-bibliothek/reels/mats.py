"""Per-letter 3D 'inflated' material renderer: chrome, gold, slime, water, glass, fire, rock, grass, balloon, pixel."""
import math, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
def fp(name): return os.path.join(FONTS, name)
_fc = {}
def font(p, s):
    s = max(8, int(s))
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]

P = 70  # padding for drips / blades / flames / glow
_gm = {}
def glyph(ch, fpath, capH):
    """float32 mask (0..1) of ch whose ink height ~= capH, padded by P."""
    capH = int(capH)
    k = (ch, fpath, capH)
    if k in _gm: return _gm[k]
    s = int(capH * 1.4)
    for _ in range(3):
        bb = font(fpath, s).getbbox(ch); h = max(1, bb[3] - bb[1]); s = max(8, int(s * capH / h))
    f = font(fpath, s); bb = f.getbbox(ch)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    im = Image.new("L", (w + 2 * P, h + 2 * P), 0)
    ImageDraw.Draw(im).text((P - bb[0], P - bb[1]), ch, font=f, fill=255)
    m = np.asarray(im, np.float32) / 255.0
    _gm[k] = m
    return m

rng = np.random.default_rng(11)
def _fbm(n=1024, oct=5):
    acc = np.zeros((n, n), np.float32); amp = 1.0; tot = 0
    for o in range(oct):
        g = 4 * 2 ** o
        r = rng.random((g + 1, g + 1)).astype(np.float32)
        acc += cv2.resize(r, (n, n), interpolation=cv2.INTER_CUBIC) * amp; tot += amp; amp *= 0.5
    acc /= tot; return (acc - acc.min()) / (acc.max() - acc.min())
NOISE = _fbm()
def noise(h, w, ox=0, oy=0, scale=1.0):
    n = NOISE
    if scale != 1.0:
        ws, hs = int(w / scale) + 2, int(h / scale) + 2
        x0, y0 = int(ox) % (1024 - ws), int(oy) % (1024 - hs)
        return cv2.resize(n[y0:y0 + hs, x0:x0 + ws], (w, h), interpolation=cv2.INTER_LINEAR)
    x0, y0 = int(ox) % (1024 - w - 1), int(oy) % (1024 - h - 1)
    return n[y0:y0 + h, x0:x0 + w]

L = np.array([-0.45, -0.62, 0.64], np.float32); L /= np.linalg.norm(L)
Hv = L + np.array([0, 0, 1], np.float32); Hv /= np.linalg.norm(Hv)

def shade(m, infl, bump=None):
    sig = 3 + 9 * infl
    h = cv2.GaussianBlur(m, (0, 0), sig)
    h = np.sqrt(np.clip(h, 0, 1)) * (0.6 + 0.8 * infl)
    if bump is not None: h = h + bump
    k = 18.0
    dx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) * k / 8
    dy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) * k / 8
    nz = 1.0 / np.sqrt(dx * dx + dy * dy + 1); nx, ny = -dx * nz, -dy * nz
    diff = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    ndh = np.clip(nx * Hv[0] + ny * Hv[1] + nz * Hv[2], 0, 1)
    rim = (1 - nz) ** 2
    return diff, ndh, rim, nx, ny, nz

def ramp(v, stops):
    xs = np.array([s[0] for s in stops], np.float32); cs = np.array([s[1] for s in stops], np.float32) / 255.0
    out = np.empty(v.shape + (3,), np.float32)
    for c in range(3): out[..., c] = np.interp(v, xs, cs[:, c])
    return out

def _drips(m, t, seed):
    r = np.random.default_rng(seed); h, w = m.shape; m = m.copy()
    cols = np.where(m.max(0) > 0.5)[0]
    if len(cols) == 0: return m
    for _ in range(3):
        x = int(r.choice(cols)); ys = np.where(m[:, x] > 0.5)[0]
        if len(ys) == 0: continue
        yb = int(ys.max()); ln = int((18 + r.random() * 40) * min(1, 0.4 + 0.6 * ((t * 0.6 + r.random()) % 1.4)))
        wd = int(7 + r.random() * 7)
        cv2.line(m, (x, yb - 4), (x, min(h - 8, yb + ln)), 1.0, wd)
        cv2.circle(m, (x, min(h - 8, yb + ln)), int(wd * 0.75), 1.0, -1)
    return m

def render(ch, fpath, mat, capH, t=0.0, infl=0.25, seed=0):
    """returns RGBA PIL image (padded by P)"""
    m = glyph(ch, fpath, capH)
    hgt, wid = m.shape
    if mat == "pixel":
        b = max(6, int(capH / 16))
        sm = cv2.resize(m, (max(1, wid // b), max(1, hgt // b)), interpolation=cv2.INTER_AREA)
        pm = (cv2.resize(sm, (wid, hgt), interpolation=cv2.INTER_NEAREST) > 0.45).astype(np.float32)
        sh = np.roll(np.roll(pm, b, 0), b, 1)
        rgb = np.zeros((hgt, wid, 3), np.float32); a = np.maximum(pm, sh)
        rgb[sh > 0] = np.array([238, 98, 40]) / 255; rgb[pm > 0] = np.array([242, 236, 228]) / 255
        return Image.fromarray(np.dstack([rgb * 255, a * 255]).astype(np.uint8), "RGBA")
    if mat == "slime": m = _drips(m, t, seed)
    bump = None
    if mat == "rock": bump = (noise(hgt, wid, seed * 37, seed * 53, 0.6) - 0.5) * 0.35
    if mat == "water": bump = (noise(hgt, wid, t * 30 + seed * 9, t * 18, 1.2) - 0.5) * 0.12
    diff, ndh, rim, nx, ny, nz = shade(m, infl, bump)
    a = m.copy()
    if mat in ("chrome", "gold"):
        yy = np.linspace(0, 1, hgt, dtype=np.float32)[:, None]
        v = np.clip(0.08 + 0.78 * yy + 0.55 * ny + 0.10 * np.sin(nx * 4 + t * 0.8), 0, 1)
        env = ramp(v, [(0, (250, 252, 255)), (0.42, (150, 158, 172)), (0.5, (28, 28, 36)), (0.6, (88, 82, 80)), (1, (226, 220, 212))])
        if mat == "gold": env = env * np.array([1.0, 0.80, 0.42], np.float32) + np.array([0.06, 0.03, 0], np.float32)
        rgb = env * (0.55 + 0.45 * diff[..., None]) + (ndh ** 70)[..., None] * 1.2
    elif mat == "slime":
        alb = np.array([0.42, 0.90, 0.22], np.float32)
        rgb = alb * (0.30 + 0.80 * diff[..., None]) + (ndh ** 90)[..., None] * 1.3 + rim[..., None] * np.array([0.5, 1.0, 0.3]) * 0.35
    elif mat == "water":
        n = noise(hgt, wid, t * 40 + seed * 11, -t * 25, 0.8)
        caus = np.clip(1 - np.abs(2 * n - 1), 0, 1) ** 8
        alb = np.array([0.10, 0.50, 0.95], np.float32)
        rgb = alb * (0.35 + 0.7 * diff[..., None]) + caus[..., None] * np.array([0.6, 0.9, 1.0]) * 0.8 + (ndh ** 120)[..., None] * 1.4 + rim[..., None] * np.array([0.4, 0.9, 1.0]) * 0.6
        a = m * (0.78 + 0.22 * rim)
    elif mat == "glass":
        xx = np.arange(wid, dtype=np.float32)[None, :]; yy = np.arange(hgt, dtype=np.float32)[:, None]
        u = ((xx + yy) / (wid + hgt) * 2.2 - (t * 0.35) % 2.6 + 0.3)
        streak = np.exp(-(u ** 2) / 0.004) + 0.5 * np.exp(-((u - 0.12) ** 2) / 0.001)
        sp = ndh ** 140
        rgb = np.array([0.90, 0.95, 1.0], np.float32) * (0.75 + 0.25 * diff[..., None]) + sp[..., None] * 1.6
        a = m * np.clip(0.07 + 2.6 * rim + streak * 0.6 + sp * 1.5, 0, 1)
    elif mat == "fire":
        n = noise(hgt, wid, seed * 21, t * 160, 0.7)
        yy = np.linspace(1, 0, hgt, dtype=np.float32)[:, None]
        v = np.clip(0.35 * yy + 0.55 * n + 0.25 * cv2.GaussianBlur(m, (0, 0), 6), 0, 1)
        fl = np.zeros_like(m)
        for k in range(1, 12): fl = np.maximum(fl, np.roll(cv2.GaussianBlur(m, (0, 0), 3 + k), -k * 7, 0) * (1 - k / 12))
        fl = fl * np.clip((n - 0.28) * 2.6, 0, 1)
        allm = np.maximum(m, fl)
        v2 = np.maximum(v * m, fl * 0.75)
        rgb = ramp(v2, [(0, (90, 10, 0)), (0.35, (200, 40, 8)), (0.6, (245, 120, 20)), (0.82, (255, 210, 80)), (1, (255, 250, 220))])
        rgb = rgb + (ndh ** 60)[..., None] * m[..., None] * 0.5
        a = np.clip(allm * (0.6 + 0.6 * v2), 0, 1)
    elif mat == "rock":
        n = noise(hgt, wid, seed * 17, seed * 29, 0.5)
        crack = (np.abs(noise(hgt, wid, seed * 7 + 300, 100, 1.3) - 0.5) < 0.02).astype(np.float32)
        alb = np.array([0.50, 0.46, 0.42], np.float32) * (0.55 + 0.7 * n[..., None]) * (1 - 0.6 * crack[..., None])
        rgb = alb * (0.25 + 0.95 * diff[..., None]) + (ndh ** 12)[..., None] * 0.12
    elif mat == "grass":
        n = noise(hgt, wid, seed * 13, 50, 0.5)
        alb = np.array([0.24, 0.62, 0.16], np.float32) * (0.6 + 0.6 * n[..., None])
        rgb = alb * (0.3 + 0.85 * diff[..., None]) + (ndh ** 20)[..., None] * 0.15
        bl = np.zeros((hgt, wid, 4), np.float32); r = np.random.default_rng(seed)
        top = np.argmax(m > 0.5, axis=0); has = (m > 0.5).any(0)
        for x in range(0, wid, 3):
            if not has[x]: continue
            y0 = int(top[x]); ln = 10 + r.random() * 22; lean = (r.random() - 0.5) * 10 + 4 * math.sin(t * 3 + x * 0.07)
            c = (np.array([0.20, 0.55, 0.12]) * (0.7 + 0.6 * r.random())).tolist() + [1.0]
            cv2.line(bl, (x, y0 + 3), (int(x + lean), int(y0 - ln)), c, 2, cv2.LINE_AA)
        ba = bl[..., 3:4]
        rgb = rgb * (1 - ba) + bl[..., :3] * ba; a = np.maximum(a, bl[..., 3])
    else:  # balloon (brand orange)
        alb = np.array([0.93, 0.38, 0.16], np.float32)
        rgb = alb * (0.35 + 0.75 * diff[..., None]) + (ndh ** 80)[..., None] * 1.2 + rim[..., None] * np.array([1.0, 0.7, 0.5]) * 0.2
    rgb = np.clip(rgb, 0, 1)
    out = np.dstack([rgb * 255, np.clip(a, 0, 1) * 255]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    if mat in ("fire", "glass", "water", "slime", "chrome"):
        gc = {"fire": (255, 120, 30), "glass": (200, 230, 255), "water": (60, 170, 255), "slime": (120, 255, 80), "chrome": (255, 255, 255)}[mat]
        ga = cv2.GaussianBlur((m if mat == "glass" else a).astype(np.float32), (0, 0), 14) * (0.9 if mat == "fire" else 0.35)
        if mat == "glass": ga = ga * (1 - m)
        gl = np.dstack([np.full_like(a, gc[0]), np.full_like(a, gc[1]), np.full_like(a, gc[2]), np.clip(ga, 0, 1) * 255]).astype(np.uint8)
        g = Image.fromarray(gl, "RGBA"); g.alpha_composite(img); img = g
    return img

if __name__ == "__main__":
    import sys
    combos = [("M", "Bungee-Regular.ttf", "chrome"), ("O", "RubikBubbles-Regular.ttf", "slime"), ("T", "AbrilFatface-Regular.ttf", "water"),
              ("I", "TitanOne-Regular.ttf", "fire"), ("O", "Chango-Regular.ttf", "glass"), ("N", "Shrikhand-Regular.ttf", "grass"),
              ("M", "RubikMoonrocks-Regular.ttf", "rock"), ("O", "PressStart2P-Regular.ttf", "pixel"), ("T", "Pacifico-Regular.ttf", "gold"),
              ("I", "Lobster-Regular.ttf", "balloon"), ("O", "Monoton-Regular.ttf", "fire"), ("N", "BagelFatOne-Regular.ttf", "water")]
    ims = [render(c, fp(f), m, 220, t=0.7, infl=0.3, seed=i) for i, (c, f, m) in enumerate(combos)]
    W = sum(i.width for i in ims[:6]) + 40; Hh = max(i.height for i in ims) * 2 + 40
    sheet = Image.new("RGBA", (max(W, sum(i.width for i in ims[6:]) + 40), Hh), (20, 10, 8, 255)); x = 20
    for i in ims[:6]: sheet.alpha_composite(i, (x, 20)); x += i.width - 2 * P + 30
    x = 20
    for i in ims[6:]: sheet.alpha_composite(i, (x, Hh // 2 + 10)); x += i.width - 2 * P + 30
    sheet.convert("RGB").save(sys.argv[1] if len(sys.argv) > 1 else "mats_test.jpg", quality=92)
