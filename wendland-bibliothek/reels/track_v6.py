"""v6: NO warp / stretch / re-stabilisation. Writes the untouched phone footage (only trimmed, speed-ramped, 30fps) to
clips/raw_<name>.mp4 and tracks the monitor in every frame -> clips/raw_<name>.json (screen quad TL,TR,BR,BL in 1080x1920 px).
The quad is used to pin the hook text to the wall just above the monitor light bar, so it moves with the camera."""
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
    "VID_1249": (0.0, 7.2, 1.0, [(20, 282), (420, 435), (452, 700), (20, 720)]),   # Container Villmar (2026-11-10)
}
CLIPS["VID_1238"] = (0.0, 17.6, 1.0, [(47, 172), (455, 337), (484, 592), (31, 625)])   # Container Villmar full scroll (2026-11-10)
EXT = {"VID_1249": "mp4", "VID_1238": "mp4"}
RIGID = {"IMG_6711"}   # dark site: track the room (desk/keyboard/bezel) with a similarity model, ignore screen content

def frames(name, ss, dur, sp):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(ss), "-t", str(dur), "-i", f"src/{name}.{EXT.get(name, 'MOV')}", "-an",
                          "-vf", f"setpts=PTS/{sp},fps=30,scale={W}:{H}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                         stdout=subprocess.PIPE, bufsize=10 ** 8)
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)

def scale_quad(q, sx, sy):
    c = q.mean(0); return (q - c) * [sx, sy] + c

def track(name):
    ss, dur, sp, q0 = CLIPS[name]
    q = np.array(q0, np.float32) * 2
    quads = []; prev = None; pts = None; rigid = name in RIGID
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                            "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-pix_fmt", "yuv420p", f"clips/raw_{name}.mp4"], stdin=subprocess.PIPE)
    for fr in frames(name, ss, dur, sp):
        g = cv2.cvtColor(cv2.resize(fr, (W // 2, H // 2), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        if prev is not None and pts is not None and len(pts) >= 8:
            nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pts, None, winSize=(21, 21), maxLevel=4)
            ok = st.ravel() == 1
            if ok.sum() >= 8:
                if rigid:
                    A, _ = cv2.estimateAffinePartial2D(pts[ok], nxt[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
                    Hm = None if A is None else np.vstack([A, [0, 0, 1]])
                else:
                    Hm, _ = cv2.findHomography(pts[ok], nxt[ok], cv2.RANSAC, 2.0)
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
        enc.stdin.write(fr.tobytes())
    enc.stdin.close(); enc.wait()
    Q = np.array(quads)
    k = np.exp(-np.arange(-3, 4) ** 2 / (2 * 1.2 ** 2)); k /= k.sum()   # light smoothing only (keeps the pin glued)
    Qp = np.pad(Q, ((3, 3), (0, 0), (0, 0)), mode="edge")
    Qs = np.stack([np.tensordot(k, Qp[i:i + 7], axes=(0, 0)) for i in range(len(Q))])
    json.dump(Qs.round(2).tolist(), open(f"clips/raw_{name}.json", "w"))
    print(name, len(Q), "frames", flush=True)

for n in (sys.argv[1:] or CLIPS.keys()): track(n)
