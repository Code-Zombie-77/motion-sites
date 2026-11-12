"""Screen camera-tracking: follows the monitor via KLT features on the static ring around/inside the screen edge,
locks it steady + mostly frontal, darkens the room and lifts the screen. Output clips/trk_<name>.mp4 (1080x1920, 30fps)."""
import subprocess, sys, json, os
import numpy as np, cv2
os.chdir(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
# name: (ss, dur, speed, quad TL,TR,BR,BL at 540x960 of first frame)
CLIPS = {
    "IMG_6704": (0.3, 13.7, 1.0, [(2, 186), (478, 183), (478, 470), (2, 532)]),
    "IMG_6709": (0.4, 9.4, 1.0, [(86, 316), (468, 330), (470, 548), (101, 592)]),
    "IMG_6712": (0.0, 3.45, 0.5, [(80, 287), (452, 292), (452, 515), (92, 546)]),
    "IMG_6711": (1.0, 36.0, 1.5, [(62, 318), (442, 298), (445, 495), (70, 560)]),
    "IMG_6721": (0.0, 43.0, 1.5, [(58, 262), (452, 268), (450, 495), (65, 515)]),
}

FOLLOW = {"IMG_6704"}  # big handheld pan: follow it smoothly instead of locking
RIGID = {"IMG_6711"}   # dark site: track the room (desk/keyboard/bezel) with a similarity model, ignore screen content

def frames(name, ss, dur, sp):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(ss), "-t", str(dur), "-i", f"src/{name}.MOV", "-an",
                          "-vf", f"setpts=PTS/{sp},fps=30,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                         stdout=subprocess.PIPE, bufsize=10 ** 8)
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)

def scale_quad(q, sx, sy):
    c = q.mean(0); return (q - c) * [sx, sy] + c

def track(name):
    ss, dur, sp, q0 = CLIPS[name]
    q = np.array(q0, np.float32) * 2  # full-res
    quads, fr_list = [], []
    prev = None; pts = None
    tmp = f"clips/_trk_{name}.raw"
    with open(tmp, "wb") as fh:
        for fr in frames(name, ss, dur, sp):
            g = cv2.cvtColor(cv2.resize(fr, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
            rigid = name in RIGID
            if prev is not None and pts is not None and len(pts) >= 8:
                nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pts, None, winSize=(21, 21), maxLevel=4)
                ok = st.ravel() == 1
                if ok.sum() >= 8:
                    if rigid:
                        A, inl = cv2.estimateAffinePartial2D(pts[ok], nxt[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
                        Hm = None if A is None else np.vstack([A, [0, 0, 1]])
                    else:
                        Hm, inl = cv2.findHomography(pts[ok], nxt[ok], cv2.RANSAC, 2.0)
                    if Hm is not None:
                        q = cv2.perspectiveTransform((q / 2).reshape(-1, 1, 2), Hm).reshape(-1, 2) * 2
            quads.append(q.copy())
            m = np.zeros_like(g)
            if rigid:
                m[:] = 255; cv2.fillPoly(m, [np.int32(scale_quad(q / 2, 1.04, 1.06))], 0)
                pts = cv2.goodFeaturesToTrack(cv2.equalizeHist(g), 500, 0.005, 6, mask=m)
            else:
                cv2.fillPoly(m, [np.int32(scale_quad(q / 2, 1.12, 1.25))], 255)
                cv2.fillPoly(m, [np.int32(scale_quad(q / 2, 0.80, 0.72))], 0)
                pts = cv2.goodFeaturesToTrack(g, 300, 0.01, 7, mask=m)
            prev = g
            fh.write(fr.tobytes())
    Q = np.array(quads)  # (N,4,2)
    # temporal smoothing (gaussian, sigma 3 frames)
    k = np.exp(-np.arange(-9, 10) ** 2 / (2 * 3.0 ** 2)); k /= k.sum()
    Qp = np.pad(Q, ((9, 9), (0, 0), (0, 0)), mode="edge")
    Qs = np.stack([np.tensordot(k, Qp[i:i + 19], axes=(0, 0)) for i in range(len(Q))])
    N = len(Qs)
    if name in FOLLOW:  # keep the camera pan (long smoothing), only remove shake -> no black borders
        kl = np.exp(-np.arange(-60, 61) ** 2 / (2 * 22.0 ** 2)); kl /= kl.sum()
        Qlp = np.pad(Q, ((60, 60), (0, 0), (0, 0)), mode="edge")
        QL = np.stack([np.tensordot(kl, Qlp[i:i + 121], axes=(0, 0)) for i in range(len(Q))])
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                            "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", f"clips/trk_{name}.mp4"], stdin=subprocess.PIPE)
    outq = []
    with open(tmp, "rb") as fh:
        for i in range(N):
            fr = np.frombuffer(fh.read(W * H * 3), np.uint8).reshape(H, W, 3)
            qs = Qs[i].astype(np.float32)
            u = i / max(1, N - 1)
            zoom = 1.0 + 0.05 * u
            rw = 1010 * zoom; rh = rw / 1.70
            cx, cy = 540 + 6 * np.sin(u * 3.1), 900 + 8 * np.sin(u * 2.3)
            R = np.array([(cx - rw / 2, cy - rh / 2), (cx + rw / 2, cy - rh / 2), (cx + rw / 2, cy + rh / 2), (cx - rw / 2, cy + rh / 2)], np.float32)
            wq = (np.linalg.norm(qs[1] - qs[0]) + np.linalg.norm(qs[2] - qs[3])) / 2
            S = (qs - qs.mean(0)) * (rw / wq) + R.mean(0)
            oq = (0.25 * S + 0.75 * R).astype(np.float32)
            if name in FOLLOW:
                ctr = np.array([540, 960], np.float32)
                oq = ((QL[i] - ctr) * (1.10 + 0.04 * u) + ctr).astype(np.float32)
            Hm = cv2.getPerspectiveTransform(qs, oq)
            o = cv2.warpPerspective(fr, Hm, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
            m = np.zeros((H // 4, W // 4), np.float32)
            cv2.fillPoly(m, [np.int32(scale_quad(oq, 1.01, 1.02) / 4)], 1.0)
            dist = cv2.distanceTransform((m < 0.5).astype(np.uint8), cv2.DIST_L2, 5) * 4
            fall = cv2.resize(np.exp(-dist / 330.0).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
            m = cv2.GaussianBlur(m, (0, 0), 5)
            m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
            of = o.astype(np.float32)
            scr = np.clip((of - 128) * 1.06 + 128 + 10, 0, 255)
            env = of * 0.45 * fall
            res = env * (1 - m) + scr * m
            bl = cv2.GaussianBlur(res, (0, 0), 1.2)
            res = np.clip(res + (res - bl) * 0.6 * m, 0, 255)
            enc.stdin.write(res.astype(np.uint8).tobytes())
            outq.append(oq.tolist())
    enc.stdin.close(); enc.wait(); os.remove(tmp)
    json.dump(outq, open(f"clips/trk_{name}.json", "w"))
    print(name, N, "frames")

for n in (sys.argv[1:] or CLIPS.keys()): track(n)
