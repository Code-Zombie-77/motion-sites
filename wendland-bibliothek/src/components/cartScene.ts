import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { renderToStaticMarkup } from 'react-dom/server';
import { BookEntry } from '../data/books';
import { bookMaterial, coverMotif } from './BookArtwork';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const BASE_YAW = 0.5;

// Point on the tapered basket. t: front to rear, h: floor to rim, s: -1..1 across the width
function P(t: number, h: number, s: number) {
  return V(
    lerp(lerp(-0.82, 0.62, t), lerp(-0.98, 0.92, t), h),
    lerp(0.95, lerp(1.8, 1.88, t), h),
    s * lerp(lerp(0.44, 0.5, t), lerp(0.55, 0.66, t), h)
  );
}

const seg = (a: THREE.Vector3, b: THREE.Vector3, r: number) =>
  new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, r, 6, false);

const curve = (pts: THREE.Vector3[], r: number, closed = false, n = 48) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed, 'centripetal'), n, r, 10, closed);

// Closed loop with tightly rounded corners
function loop(corners: THREE.Vector3[], r: number) {
  const pts: THREE.Vector3[] = [];
  corners.forEach((c, i) => {
    const prev = corners[(i + corners.length - 1) % corners.length];
    const next = corners[(i + 1) % corners.length];
    pts.push(c.clone().lerp(prev, 0.07), c.clone(), c.clone().lerp(next, 0.07));
  });
  return curve(pts, r, true, 120);
}

function buildCart() {
  const chrome = new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 1, roughness: 0.13 });
  const wireMat = new THREE.MeshStandardMaterial({ color: '#bfc2c6', metalness: 1, roughness: 0.22 });
  const red = new THREE.MeshPhysicalMaterial({ color: '#a5121f', roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.14 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#25262a', roughness: 0.78 });
  const hub = new THREE.MeshStandardMaterial({ color: '#b9bcc0', metalness: 0.85, roughness: 0.3 });

  const wires: THREE.BufferGeometry[] = [];
  const rails: THREE.BufferGeometry[] = [];

  // Upright wires on all four walls
  for (let i = 0; i <= 11; i++) {
    const t = i / 11;
    wires.push(seg(P(t, 0, 1), P(t, 1, 1), 0.011), seg(P(t, 0, -1), P(t, 1, -1), 0.011));
  }
  for (let i = 1; i < 7; i++) {
    const s = -1 + (2 * i) / 7;
    wires.push(seg(P(0, 0, s), P(0, 1, s), 0.011), seg(P(1, 0, s), P(1, 1, s), 0.011));
  }
  // Floor grid
  for (let i = 0; i <= 7; i++) {
    const s = -1 + (2 * i) / 7;
    wires.push(seg(P(0, 0, s), P(1, 0, s), 0.01));
  }
  for (let i = 0; i <= 13; i++) wires.push(seg(P(i / 13, 0, -1), P(i / 13, 0, 1), 0.01));
  // Horizontal hoops, heavier rim
  const hoop = (h: number) => [P(0, h, -1), P(1, h, -1), P(1, h, 1), P(0, h, 1)];
  wires.push(loop(hoop(0.34), 0.012), loop(hoop(0.66), 0.012), loop(hoop(0), 0.016));
  rails.push(loop(hoop(1), 0.034));

  // Handle uprights continue from the rear wall
  [-1, 1].forEach((s) => {
    rails.push(curve([P(1, 0, s), P(1, 0.5, s), P(1, 1, s), V(1.06, 2.1, s * 0.68), V(1.16, 2.28, s * 0.69)], 0.038));
    // S-shaped legs from basket to base
    rails.push(curve([V(-0.1, 0.94, s * 0.44), V(0.3, 0.78, s * 0.48), V(0.62, 0.5, s * 0.52), V(0.5, 0.34, s * 0.56), V(0.1, 0.32, s * 0.56)], 0.046));
  });
  // Base frame
  rails.push(loop([V(-0.88, 0.32, -0.56), V(0.7, 0.32, -0.56), V(0.7, 0.32, 0.56), V(-0.88, 0.32, 0.56)], 0.044));

  const cart = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    cart.add(m);
    return m;
  };
  add(mergeGeometries(wires), wireMat);
  add(mergeGeometries(rails), chrome);

  // Red handle grip with end caps
  const grip = add(new THREE.CylinderGeometry(0.058, 0.058, 1.3, 24), red);
  grip.rotation.x = Math.PI / 2;
  grip.position.set(1.18, 2.31, 0);
  [-1, 1].forEach((s) => {
    const cap = add(new RoundedBoxGeometry(0.34, 0.17, 0.11, 5, 0.05), red);
    cap.position.set(1.16, 2.28, s * 0.69);
    cap.rotation.z = -0.95;
  });

  // Red front plate with a recessed panel
  const plate = add(new RoundedBoxGeometry(0.08, 0.4, 1.02, 5, 0.03), red);
  plate.position.set(-0.95, 1.42, 0);
  plate.rotation.z = -0.19;
  const inset = add(new RoundedBoxGeometry(0.02, 0.29, 0.88, 3, 0.008), new THREE.MeshPhysicalMaterial({ color: '#b01a26', roughness: 0.42, clearcoat: 0.6 }));
  inset.position.set(-0.995, 1.414, 0);
  inset.rotation.z = -0.19;

  // Casters
  const wheels: THREE.Object3D[] = [];
  [[-0.82, 0.56], [-0.82, -0.56], [0.64, 0.56], [0.64, -0.56]].forEach(([x, z]) => {
    const bracket = add(new RoundedBoxGeometry(0.2, 0.17, 0.11, 3, 0.025), red);
    bracket.position.set(x + 0.02, 0.24, z);
    bracket.rotation.z = -0.4;
    const wheel = new THREE.Group();
    wheel.position.set(x, 0.135, z);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.075, 28), rubber);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.082, 20), hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.09, 12), red);
    // Off-centre marker so a rolling wheel visibly turns
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.086, 8), rubber);
    lug.position.x = 0.056;
    [tyre, rim, cap, lug].forEach((m) => {
      m.castShadow = true;
      wheel.add(m);
    });
    wheel.rotation.x = Math.PI / 2;
    cart.add(wheel);
    wheels.push(wheel);
  });
  return { cart, wheels };
}

// Studio for reflections: a dark room with bright softboxes gives chrome its hard light/dark contrast
function studio() {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.SphereGeometry(20, 24, 16), new THREE.MeshBasicMaterial({ color: '#34302b', side: THREE.BackSide })));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: '#8d8578' }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  room.add(floor);
  ([[0, 12, 0, 16, 7, 10], [-13, 4, 6, 3, 12, 7], [13, 5, -3, 2, 12, 5], [3, 3, 14, 12, 2, 5]] as const).forEach(([x, y, z, w, h, power]) => {
    const light = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power * 0.96, power * 0.9), side: THREE.DoubleSide }));
    light.position.set(x, y, z);
    light.lookAt(0, 0, 0);
    room.add(light);
  });
  return room;
}

// ---- Books as true solid volumes, printed from the same artwork as the shelf
const covers = new Map<string, THREE.CanvasTexture>();

function coverTexture(book: BookEntry) {
  const hit = covers.get(book.id);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = 400;
  cv.height = 580;
  const g = cv.getContext('2d')!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.center.set(0.5, 0.5);
  tex.rotation = -Math.PI / 2;
  const card = bookMaterial(book.id) === 'card';

  const paint = (motif?: HTMLImageElement) => {
    g.fillStyle = book.clothBg;
    g.fillRect(0, 0, 400, 580);
    if (motif) g.drawImage(motif, 50, 130, 310, 362);
    g.fillStyle = 'rgba(0,0,0,.22)';
    g.fillRect(24, 0, 7, 580);
    g.strokeStyle = '#c5a55a';
    g.lineWidth = 3;
    if (!card) g.strokeRect(50, 20, 330, 540);
    if (card) {
      g.fillStyle = '#eadfc6';
      g.fillRect(80, 34, 270, 92);
    }
    g.fillStyle = card ? '#3a1016' : '#dcc27b';
    g.textAlign = 'center';
    const size = book.title.length > 20 ? 30 : 44;
    g.font = `700 ${size}px UnifrakturCook, serif`;
    const lines: string[] = [];
    book.title.split(' ').forEach((w) => {
      const last = lines[lines.length - 1];
      if (last && g.measureText(`${last} ${w}`).width < 270) lines[lines.length - 1] = `${last} ${w}`;
      else lines.push(w);
    });
    lines.slice(0, 3).forEach((l, i) => g.fillText(l, 215, 72 + i * (size + 2) - (lines.length - 1) * 12));
    tex.needsUpdate = true;
  };
  paint();
  const markup = renderToStaticMarkup(coverMotif(book.id)).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="420" ');
  const img = new Image();
  img.onload = () => paint(img);
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  covers.set(book.id, tex);
  return tex;
}

function pagesTexture() {
  const cv = document.createElement('canvas');
  cv.width = 8;
  cv.height = 32;
  const g = cv.getContext('2d')!;
  for (let y = 0; y < 32; y++) {
    g.fillStyle = y % 2 ? '#d6caae' : '#f0e7d2';
    g.fillRect(0, y, 8, 1);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createCartScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(studio(), 0.02);
  scene.environment = env.texture;

  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 40);

  const sun = new THREE.DirectionalLight('#fff4e2', 1.15);
  sun.position.set(-1.1, 7.5, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 7;
  sun.shadow.blurSamples = 18;
  sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 14 });
  scene.add(sun);

  // Cast shadow plus tight contact occlusion on the paper floor
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShadowMaterial({ color: '#1c130a', opacity: 0.42 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const blobCv = document.createElement('canvas');
  blobCv.width = blobCv.height = 128;
  const bg = blobCv.getContext('2d')!;
  const grad = bg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(24,16,8,.62)');
  grad.addColorStop(0.55, 'rgba(24,16,8,.24)');
  grad.addColorStop(1, 'rgba(24,16,8,0)');
  bg.fillStyle = grad;
  bg.fillRect(0, 0, 128, 128);
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 1.9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobCv), transparent: true, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.003;
  scene.add(blob);

  const { cart, wheels } = buildCart();
  scene.add(cart);
  const stack = new THREE.Group();
  cart.add(stack);

  const pages = new THREE.MeshStandardMaterial({ map: pagesTexture(), roughness: 0.9 });
  const bookGeo = new RoundedBoxGeometry(0.66, 0.09, 0.46, 2, 0.007);
  let shown = 0;
  let pointerX = 0;
  let pointerY = 0;
  let yaw = BASE_YAW;
  let camY = 3.7;
  let roll = 0;
  let extraYaw = 0;
  let raf = 0;
  let running = false;

  const resize = () => {
    const r = canvas.parentElement!.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };

  const frame = () => {
    yaw += (BASE_YAW + pointerX * 0.55 + extraYaw - yaw) * 0.08;
    camY += (3.7 - pointerY * 0.9 - camY) * 0.08;
    cart.rotation.y = yaw;
    blob.rotation.z = yaw;
    camera.position.set(0.15, camY, 7.5);
    camera.lookAt(0, 1.02, 0);
    if (Math.abs(roll) > 0.002) {
      wheels.forEach((w) => (w.rotation.y += roll));
      roll *= 0.965;
    }
    stack.children.forEach((b) => {
      b.position.y += (b.userData.y - b.position.y) * 0.16;
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  resize();
  renderer.render(scene, camera);

  return {
    resize,
    pointer(nx: number, ny: number) {
      pointerX = nx;
      pointerY = ny;
    },
    spin(dx: number) {
      extraYaw += dx * 0.012;
    },
    setRunning(on: boolean) {
      if (on === running) return;
      running = on;
      if (on) {
        roll = 0.42;
        frame();
      } else cancelAnimationFrame(raf);
    },
    // Lie books flat in two piles on the floor grid; they stay below the rim at real scale
    setBooks(books: BookEntry[]) {
      const list = books.slice(-10);
      stack.clear();
      list.forEach((book, i) => {
        const pile = i % 2;
        const level = Math.floor(i / 2);
        const cloth = new THREE.MeshStandardMaterial({ color: book.clothBg, roughness: 0.68 });
        const cover = new THREE.MeshStandardMaterial({ map: coverTexture(book), roughness: bookMaterial(book.id) === 'leather' ? 0.52 : 0.8 });
        // Box faces: +x -x +y -y +z -z
        const mesh = new THREE.Mesh(bookGeo, [pages, pages, cover, cloth, pages, cloth]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const y = 1.02 + level * 0.094;
        mesh.userData.y = y;
        const isNew = books.length > shown && i === list.length - 1;
        mesh.position.set(pile ? 0.24 : -0.46, isNew ? y + 0.8 : y, ((i * 37) % 7) * 0.008 - 0.024);
        mesh.rotation.y = (((i * 53) % 9) - 4) * 0.018;
        stack.add(mesh);
      });
      shown = books.length;
    },
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
