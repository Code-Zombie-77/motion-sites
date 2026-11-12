"""Gentle stabilisation locked to the SCREEN (the subject), no perspective warp, no stretch.
Per frame: similarity pose of the tracked monitor quad (centre, rotation, scale) -> smoothed over time (keeps the slow intended
move, removes handheld shake) -> small correcting similarity (Lanczos) + minimum uniform zoom so no border shows.
Writes clips/raw_<name>S.mp4 + .json.  Usage: python stab_v9.py VID_1238 [sigma_frames]
(A background-feature variant was tried and rejected: keyboard parallax made the screen shake MORE: 1.9 -> 2.8 px rms.)"""
import sys, os, json, subprocess, math
import numpy as np, cv2
os.chdir(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
name = sys.argv[1]; SIG = float(sys.argv[2]) if len(sys.argv) > 2 else 22.0
Q = np.array(json.load(open(f"clips/raw_{name}.json")), np.float64); N = len(Q)
def pose(q):
    c = q.mean(0); top, bot = q[1] - q[0], q[2] - q[3]
    ang = math.atan2(top[1] + bot[1], top[0] + bot[0])
    sc = (np.linalg.norm(top) + np.linalg.norm(bot) + np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 4
    return np.array([c[0], c[1], ang, math.log(sc)])
P = np.array([pose(q) for q in Q])
k = np.exp(-np.arange(-int(3 * SIG), int(3 * SIG) + 1) ** 2 / (2 * SIG ** 2)); k /= k.sum(); pad = len(k) // 2
S = np.stack([np.convolve(np.pad(P[:, j], pad, mode="reflect"), k, mode="valid") for j in range(4)], 1)
def M_of(i, zoom):
    c, a, s = P[i, :2], P[i, 2], P[i, 3]; cs, as_, ss = S[i, :2], S[i, 2], S[i, 3]
    r = as_ - a; f = math.exp(ss - s) * zoom
    R = np.array([[math.cos(r), -math.sin(r)], [math.sin(r), math.cos(r)]]) * f
    ctr = np.array([W / 2, H / 2]); t = (cs - ctr) * zoom + ctr - R @ c
    return np.hstack([R, t[:, None]])
corners = np.array([[0, 0], [W, 0], [W, H], [0, H]], np.float64)
def covers(zoom):
    for i in range(N):
        Ai = np.linalg.inv(np.vstack([M_of(i, zoom), [0, 0, 1]])); src = (Ai[:2, :2] @ corners.T).T + Ai[:2, 2]
        if (src < -0.5).any() or (src[:, 0] > W + .5).any() or (src[:, 1] > H + .5).any(): return False
    return True
zoom = 1.0
while not covers(zoom) and zoom < 1.15: zoom += 0.005
rd = subprocess.Popen(["ffmpeg", "-v", "error", "-i", f"clips/raw_{name}.mp4", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, bufsize=10 ** 8)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-pix_fmt", "yuv420p", f"clips/raw_{name}S.mp4"], stdin=subprocess.PIPE)
outq = []
for i in range(N):
    b = rd.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    M = M_of(i, zoom)
    enc.stdin.write(cv2.warpAffine(np.frombuffer(b, np.uint8).reshape(H, W, 3), M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT).tobytes())
    outq.append(((M[:, :2] @ Q[i].T).T + M[:, 2]).round(2).tolist())
enc.stdin.close(); enc.wait(); rd.kill()
json.dump(outq, open(f"clips/raw_{name}S.json", "w"))
C = np.array(outq).mean(1); kk = np.ones(45) / 45
sm = np.stack([np.convolve(np.pad(C[:, j], 22, mode="edge"), kk, "valid") for j in range(2)], 1)
C0 = Q.mean(1); sm0 = np.stack([np.convolve(np.pad(C0[:, j], 22, mode="edge"), kk, "valid") for j in range(2)], 1)
rms = lambda a, b: float(np.sqrt((np.linalg.norm(a - b, axis=1) ** 2).mean()))
print(f"{name}: screen shake {rms(C0, sm0):.2f} -> {rms(C, sm):.2f} px rms, zoom {zoom:.3f}, {len(outq)} frames")
