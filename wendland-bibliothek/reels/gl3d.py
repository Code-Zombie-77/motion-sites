"""Real 3D letters on the GPU (moderngl): glyph -> signed distance field -> extruded + beveled SDF, ray-marched with a
procedural studio HDRI. Materials: chrome, gold, glass (iridescent, dispersion), concrete, lava, slime, holo, ceramic, water."""
import os, math
import numpy as np, cv2, moderngl
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
def fp(n): return os.path.join(HERE, "fonts", n)
MATS = {"chrome": 0, "gold": 1, "glass": 2, "concrete": 3, "lava": 4, "slime": 5, "holo": 6, "ceramic": 7, "water": 8, "mmorange": 9}
# per-material geometry: (half depth, bevel radius)   units: glyph ink height = 1
GEO = {"chrome": (0.16, 0.035), "gold": (0.13, 0.03), "glass": (0.17, 0.13), "concrete": (0.24, 0.012), "lava": (0.2, 0.025),
       "slime": (0.17, 0.12), "holo": (0.15, 0.04), "ceramic": (0.17, 0.11), "water": (0.17, 0.12), "mmorange": (0.19, 0.15)}

VS = """#version 330
in vec2 pos; out vec2 uv; void main(){ uv = pos; gl_Position = vec4(pos,0,1); }"""
FS = """#version 330
uniform sampler2D sdf; uniform vec2 halfe; uniform float depth, rad, puff, fovt, camd, aspect, time; uniform mat3 rot; uniform int mat;
in vec2 uv; out vec4 frag;
float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
float sd2(vec2 p){ vec2 t = p/(2.0*halfe)+0.5; float d = texture(sdf, clamp(t,0.0,1.0)).r; vec2 q = abs(p)-halfe; return d + length(max(q,0.0)); }
float map(vec3 pw){ vec3 p = rot*pw;
  float r = rad + puff*0.05;
  float d = sd2(p.xy) + r - puff*0.02;
  vec2 w = vec2(d, abs(p.z) - depth - puff*0.04 + r);
  float e = min(max(w.x,w.y),0.0) + length(max(w,0.0)) - r;
  if(mat==5) e += 0.010*sin(p.x*16.0+time*3.0)*sin(p.y*13.0-time*2.2);
  if(mat==3) e += 0.004*(vnoise(p*38.0)-0.5);
  return e; }
vec3 nrm(vec3 p){ vec2 e = vec2(0.0012,0); return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx))); }
vec3 env(vec3 d){
  vec3 c = vec3(0.004,0.004,0.005);
  c += vec3(1.0,0.34,0.07)*pow(clamp(-d.y*0.9-0.05,0.0,1.0),2.0)*0.9;                       // orange floor bounce
  c += vec3(1.0,0.98,0.96)*6.0*smoothstep(0.92,0.985, dot(d, normalize(vec3(-0.55,0.62,0.56)))); // key softbox
  float vs = smoothstep(0.035,0.0,abs(d.x-0.55)) + smoothstep(0.03,0.0,abs(d.x+0.42));
  c += vec3(0.95,0.97,1.0)*3.2*vs*smoothstep(-0.5,0.0,d.y)*smoothstep(0.9,0.45,d.y)*step(0.0,d.z);  // strip lights
  c += vec3(1.0,0.98,0.95)*2.2*smoothstep(0.02,0.0,abs(d.y-0.38))*step(0.0,d.z)*smoothstep(0.95,0.3,abs(d.x)); // top line
  c += vec3(0.6,0.62,0.66)*0.10*smoothstep(-0.1,0.9,d.y);                                      // soft sky
  c += vec3(0.92,0.92,0.95)*0.55*smoothstep(0.25,1.0,d.z)*smoothstep(-0.7,0.9,d.y);            // front gradient panel
  c += vec3(1.0,0.45,0.15)*1.3*smoothstep(0.75,0.97, dot(d, normalize(vec3(0.75,0.1,-0.65))));  // orange rim (back)
  return c; }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec3 ro = vec3(0,0,camd); vec3 rd = normalize(vec3(uv.x*aspect*fovt, uv.y*fovt, -1.0));
  float t = camd-1.6; bool hit=false; vec3 p;
  for(int i=0;i<160;i++){ p = ro+rd*t; float d = map(p); if(d<0.0006){hit=true;break;} t += d*0.9; if(t>camd+1.6) break; }
  if(!hit){ frag = vec4(0); return; }
  vec3 n = nrm(p); vec3 po = rot*p; vec3 no = rot*n;
  float ndv = clamp(dot(n,-rd),0.0,1.0); float fr = 0.04 + 0.96*pow(1.0-ndv,5.0);
  vec3 r = reflect(rd,n); vec3 L = normalize(vec3(-0.5,0.62,0.6)); float dif = clamp(dot(n,L),0.0,1.0);
  float ao = clamp(map(p+n*0.06)/0.06,0.0,1.0)*0.5+0.5;
  vec3 col;
  if(mat==0){ col = env(r)*mix(vec3(0.82,0.83,0.86),vec3(1.0),fr); }
  else if(mat==1){ float sc = fbm(po*vec3(60,4,4)); col = env(r)*vec3(1.0,0.68,0.26)*(0.9+0.25*sc)*1.15 + vec3(1.0,0.6,0.2)*0.04; }
  else if(mat==2 || mat==8){
    vec3 tint = mat==2 ? vec3(0.96,0.97,1.0) : vec3(0.35,0.75,1.0);
    vec3 rf; float ior = 1.47;
    rf.r = env(refract(rd,n,1.0/(ior-0.03))).r; rf.g = env(refract(rd,n,1.0/ior)).g; rf.b = env(refract(rd,n,1.0/(ior+0.04))).b;
    vec3 iri = 0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + (1.0-ndv)*1.6 + po.y*0.6));
    col = (rf + vec3(0.06))*tint*0.9 + env(r)*(0.35+0.65*fr) + iri*(mat==2?0.30:0.10)*pow(1.0-ndv,1.5);
    if(mat==8){ float ca = pow(1.0-abs(2.0*fbm(po*5.0+vec3(0,0,time*0.6))-1.0),8.0); col += vec3(0.6,0.9,1.0)*ca*0.9; } }
  else if(mat==3){ float n1 = fbm(po*5.0); float pores = smoothstep(0.80,0.86,vnoise(po*55.0));
    float plank = 0.06*sin(po.x*14.0+fbm(po*3.0)*3.0);
    vec3 alb = vec3(0.46,0.45,0.44)*(0.72+0.38*n1+plank) - pores*0.2;
    col = alb*(0.08 + 0.9*dif)*ao + env(r)*0.03 + vec3(1.0,0.42,0.14)*0.12*clamp(-n.y*0.8+0.2,0.0,1.0); }
  else if(mat==4){ float n1 = fbm(po*4.5+vec3(0,time*0.25,0)); float crack = smoothstep(0.045,0.0,abs(n1-0.5));
    vec3 rock = vec3(0.07,0.055,0.05)*(0.6+0.8*fbm(po*12.0));
    col = rock*(0.3+1.2*dif)*ao + env(r)*0.06*fr + mix(vec3(1.0,0.25,0.02),vec3(1.0,0.85,0.3),crack)*crack*3.0; }
  else if(mat==5){ vec3 alb = vec3(0.30,0.92,0.12); float w = clamp(dot(n,L)*0.5+0.5,0.0,1.0);
    col = alb*(0.12+0.95*w) + env(r)*(0.10+0.6*fr) + vec3(0.55,1.0,0.25)*0.35*(1.0-ndv); }
  else if(mat==6){ vec3 iri = 0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + dot(n,vec3(0.6,0.8,0.0))*1.2 + po.x*0.4 + time*0.1));
    col = env(r)*mix(iri,vec3(1.0),0.35)*1.05; }
  else if(mat==9){  // Mind-Merit orange (#F96C04), glossy inflated balloon / candy
    vec3 alb = vec3(0.95,0.16,0.004);
    float sss = pow(1.0-ndv,2.0);
    col = alb*(0.10+0.95*dif)*ao + vec3(1.0,0.28,0.02)*0.30*sss
        + env(r)*mix(vec3(1.0,0.62,0.35),vec3(1.0),fr)*(0.18+0.82*fr)
        + vec3(1.0,0.95,0.9)*1.6*pow(clamp(dot(r,normalize(vec3(-0.5,0.62,0.6))),0.0,1.0),60.0); }
  else { vec3 alb = vec3(0.93,0.36,0.13);
    col = alb*(0.15+0.95*dif)*ao + env(r)*(0.06+0.8*fr) + vec3(1.0,0.6,0.4)*0.15*(1.0-ndv); }
  col = aces(col*1.05); col = pow(col, vec3(1.0/2.2));
  frag = vec4(col, 1.0); }"""

class GL3D:
    def __init__(s):
        s.ctx = moderngl.create_standalone_context()
        s.prog = s.ctx.program(vertex_shader=VS, fragment_shader=FS)
        vb = s.ctx.buffer(np.array([-1, -1, 1, -1, -1, 1, 1, 1], "f4").tobytes())
        s.vao = s.ctx.simple_vertex_array(s.prog, vb, "pos")
        s.fbos = {}; s.texs = {}
    def sdf(s, ch, font_file):
        k = (ch, font_file)
        if k in s.texs: return s.texs[k]
        G = 400; f = ImageFont.truetype(fp(font_file), G)
        for _ in range(3):
            bb = f.getbbox(ch); h = max(1, bb[3] - bb[1]); f = ImageFont.truetype(fp(font_file), max(20, int(f.size * G / h)))
        bb = f.getbbox(ch); w, h = bb[2] - bb[0], bb[3] - bb[1]; pad = 90
        im = Image.new("L", (w + 2 * pad, h + 2 * pad), 0); ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), ch, font=f, fill=255)
        m = (np.asarray(im) > 127).astype(np.uint8)
        din = cv2.distanceTransform(m, cv2.DIST_L2, 5); dout = cv2.distanceTransform(1 - m, cv2.DIST_L2, 5)
        sd = ((dout - din) / h).astype(np.float32)
        tex = s.ctx.texture((sd.shape[1], sd.shape[0]), 1, np.ascontiguousarray(sd[::-1]).tobytes(), dtype="f4")
        tex.filter = (moderngl.LINEAR, moderngl.LINEAR); tex.repeat_x = tex.repeat_y = False
        he = (sd.shape[1] / h / 2, sd.shape[0] / h / 2)
        s.texs[k] = (tex, he, w / h)
        return s.texs[k]
    def render(s, ch, font_file, mat, capH, yaw=0.0, pitch=0.0, roll=0.0, puff=0.0, t=0.0, ss=2):
        """returns RGBA PIL image; glyph ink height on screen ~= capH px; image is padded (centered on glyph)."""
        tex, he, asp = s.sdf(ch, font_file)
        margin = 0.55
        vh = 1.0 + 2 * margin; vw = asp + 2 * margin + 0.4
        Hp = int(capH * vh) * ss; Wp = int(capH * vw) * ss
        key = (Wp, Hp)
        if key not in s.fbos: s.fbos[key] = s.ctx.simple_framebuffer((Wp, Hp), components=4)
        fbo = s.fbos[key]; fbo.use(); fbo.clear(0, 0, 0, 0)
        camd = 6.0; fovt = (vh / 2) / camd
        cy, sy = math.cos(yaw), math.sin(yaw); cx, sx = math.cos(pitch), math.sin(pitch); cz, sz = math.cos(roll), math.sin(roll)
        Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]); Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
        R = (Rz @ Rx @ Ry).T  # world -> object
        dep, rad = GEO[mat]
        u = s.prog
        tex.use(0); u["sdf"].value = 0; u["halfe"].value = he; u["depth"].value = dep; u["rad"].value = rad; u["puff"].value = puff
        u["fovt"].value = fovt; u["camd"].value = camd; u["aspect"].value = Wp / Hp; u["time"].value = t; u["mat"].value = MATS[mat]
        u["rot"].write(R.astype("f4").T.tobytes())
        s.vao.render(moderngl.TRIANGLE_STRIP)
        a = np.frombuffer(fbo.read(components=4, dtype="f1"), np.uint8).reshape(Hp, Wp, 4)[::-1]
        img = Image.fromarray(a, "RGBA")
        if ss > 1: img = img.resize((Wp // ss, Hp // ss), Image.LANCZOS)
        return img

def bloom(img, strength=0.9, radius=18):
    """additive glow layer from bright areas of an RGBA letter"""
    a = np.asarray(img).astype(np.float32) / 255
    lum = a[..., :3].max(2) * a[..., 3]
    hi = np.clip((lum - 0.86) / 0.14, 0, 1)
    g = cv2.GaussianBlur(np.dstack([a[..., :3] * hi[..., None], hi]), (0, 0), radius) * strength
    return Image.fromarray(np.clip(np.dstack([g[..., :3] / np.maximum(g[..., 3:4], 1e-4), np.clip(g[..., 3:4] * 1.6, 0, 1)]) * 255, 0, 255).astype(np.uint8), "RGBA")

if __name__ == "__main__":
    import sys, time
    g = GL3D()
    combos = [("M", "Bungee-Regular.ttf", "chrome", 0.35, 0.12), ("O", "Poppins-Bold.ttf", "glass", -0.3, 0.1), ("T", "BowlbyOne-Regular.ttf", "concrete", 0.45, -0.15),
              ("I", "Lobster-Regular.ttf", "gold", -0.25, 0.08), ("O", "Chango-Regular.ttf", "lava", 0.3, 0.1), ("N", "Shrikhand-Regular.ttf", "holo", -0.35, -0.05),
              ("M", "RubikBubbles-Regular.ttf", "slime", 0.2, 0.1), ("O", "TitanOne-Regular.ttf", "ceramic", -0.3, 0.15), ("T", "PressStart2P-Regular.ttf", "chrome", 0.5, 0.2),
              ("I", "AbrilFatface-Regular.ttf", "water", -0.3, 0.0), ("O", "ClimateCrisis.ttf", "gold", 0.35, 0.1), ("N", "Pacifico-Regular.ttf", "glass", -0.3, 0.1)]
    t0 = time.time(); ims = [g.render(c, f, m, 220, yaw=y, pitch=p, t=1.0) for c, f, m, y, p in combos]; print("render", round(time.time() - t0, 2), "s")
    rowW = lambda L: sum(i.width for i in L) - 60 * (len(L) - 1)
    Wd = max(rowW(ims[:6]), rowW(ims[6:])) + 40; Hd = max(i.height for i in ims) * 2
    bgc = Image.new("RGBA", (Wd, Hd), (14, 7, 6, 255))
    for row, L in enumerate((ims[:6], ims[6:])):
        x = 20
        for im in L:
            y = row * Hd // 2 + (Hd // 2 - im.height) // 2
            sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); sh.putalpha(im.getchannel("A").filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * 0.55)))
            bgc.alpha_composite(sh, (x + 8, y + 22)); bgc.alpha_composite(im, (x, y)); bgc.alpha_composite(bloom(im), (x, y)); x += im.width - 60
    bgc.convert("RGB").save(sys.argv[1], quality=92)
