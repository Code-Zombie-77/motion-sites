import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { IconSprite } from './components/IconSprite';
import {
  DINOS,
  NAV_ITEMS,
  getEraMetrics,
  clamp01,
  inCubic,
  outCubic,
  outBack,
  dampFactor,
  findCreatureIndexByQuery,
} from './data/creatures';

interface Rig {
  pivot: THREE.Group;
  spin: THREE.Group;
  holder: THREE.Group;
  home: THREE.Quaternion;
  loaded: boolean;
  failed: boolean;
  promise?: Promise<void>;
}

const LIGHT_PRESETS = {
  day: { env: 0.95, key: 1.6, rim: 0.5, keyColor: 0xfff4e2, exposure: 1.05 },
  dusk: { env: 0.28, key: 2.6, rim: 1.9, keyColor: 0xffc98a, exposure: 1.0 },
} as const;

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [lightMode, setLightMode] = useState<'day' | 'dusk'>('day');
  const [zoomGoalState, setZoomGoalState] = useState(1);
  const [activeNavId, setActiveNavId] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const heroRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Mutable simulation & Three.js controller state
  const ctrlRef = useRef<{
    activeIndex: number;
    focusMode: boolean;
    lightMode: 'day' | 'dusk';
    zoom: number;
    zoomGoal: number;
    yawQueue: number;
    velX: number;
    velY: number;
    homing: boolean;
    lastTouch: number;
    reducedMotion: boolean;
    DUR: number;
    rigs: Rig[];
    anim: { from: number; to: number; dir: number; t0: number; t1: number };
    measure: (snap?: boolean) => void;
    setZoom: (z: number) => void;
    markTouched: () => void;
    turnBy: (dx: number, dy: number) => void;
    resetView: () => void;
    loadRig: (idx: number) => Promise<void>;
    selectSeq: number;
  }>({
    activeIndex: 0,
    focusMode: false,
    lightMode: 'day',
    zoom: 1,
    zoomGoal: 1,
    yawQueue: 0,
    velX: 0,
    velY: 0,
    homing: false,
    lastTouch: -10000,
    reducedMotion: false,
    DUR: 780,
    rigs: [],
    anim: { from: -1, to: -1, dir: 1, t0: 0, t1: 0 },
    measure: () => {},
    setZoom: () => {},
    markTouched: () => {},
    turnBy: () => {},
    resetView: () => {},
    loadRig: async () => {},
    selectSeq: 0,
  });

  // Select tab / creature handler matching Section 8
  const select = useCallback((i: number) => {
    const ctrl = ctrlRef.current;
    const from = ctrl.activeIndex;
    if (i === from || i < 0 || i >= DINOS.length) return;

    const dir = Math.sign(i - from) || 1;
    ctrl.activeIndex = i;
    setActiveIndex(i);

    const now = performance.now();
    const seq = ++ctrl.selectSeq;

    // 2. paintInfo(i)
    if (ctrl.reducedMotion) {
      setLeaving(false);
      setDisplayIndex(i);
      if (cardRef.current) cardRef.current.scrollTop = 0;
    } else {
      setLeaving(true);
      window.setTimeout(() => {
        if (ctrl.selectSeq !== seq) return;
        setDisplayIndex(i);
        setLeaving(false);
        if (cardRef.current) cardRef.current.scrollTop = 0;
      }, 200);
    }

    // 3. Add .stage.switching, clear velocity and queue, setZoom(1)
    setSwitching(true);
    ctrl.velX = 0;
    ctrl.velY = 0;
    ctrl.yawQueue = 0;
    ctrl.setZoom(1);

    // 4. anim = {from, to:-1, dir, t0:now}: old model leaves at once
    ctrl.anim = { from, to: -1, dir, t0: now, t1: now };

    const finishArrival = () => {
      if (ctrl.selectSeq !== seq) return;
      const rig = ctrl.rigs[i];
      if (rig) {
        rig.spin.quaternion.copy(rig.home);
        setFailed(rig.failed);
      }
      ctrl.anim.to = i;
      ctrl.anim.t1 = performance.now();
      setSwitching(false);
    };

    const targetRig = ctrl.rigs[i];
    if (targetRig && !targetRig.loaded) {
      setLoading(true);
      ctrl.loadRig(i).then(() => {
        if (ctrl.selectSeq !== seq) return;
        setLoading(false);
        finishArrival();
      });
    } else {
      setLoading(false);
      finishArrival();
    }
  }, []);

  // Initialize Three.js scene and animation loop once
  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    const stage = stageRef.current;
    if (!canvas || !hero || !stage) return;

    const ctrl = ctrlRef.current;
    const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    ctrl.reducedMotion = mediaReduced.matches;
    ctrl.DUR = ctrl.reducedMotion ? 1 : 780;
    const onReducedChange = () => {
      ctrl.reducedMotion = mediaReduced.matches;
      ctrl.DUR = ctrl.reducedMotion ? 1 : 780;
    };
    mediaReduced.addEventListener('change', onReducedChange);

    // Software WebGL check for headless Chromium safety
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.95;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

    const keyLight = new THREE.DirectionalLight(0xfff4e2, 1.6);
    keyLight.position.set(2.5, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbfd8ff, 0.5);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    // Build rigs for each creature
    const rigs: Rig[] = DINOS.map((d) => {
      const pivot = new THREE.Group();
      pivot.visible = false;
      const spin = new THREE.Group();
      const holder = new THREE.Group();
      const home = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(d.pitch, d.yaw, 0, 'YXZ')
      );
      spin.quaternion.copy(home);
      spin.add(holder);
      pivot.add(spin);
      scene.add(pivot);
      return {
        pivot,
        spin,
        holder,
        home,
        loaded: false,
        failed: false,
      };
    });
    ctrl.rigs = rigs;

    // GLTF + DRACO + Meshopt loader setup with persistent CacheStorage
    THREE.Cache.enabled = true;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    dracoLoader.preload();
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const openGlbDb = (): Promise<IDBDatabase> =>
      new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('No IDB'));
          return;
        }
        const req = indexedDB.open('mythen-atlas-glb-db', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('models')) {
            db.createObjectStore('models');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

    const getIdbBuffer = async (key: string): Promise<ArrayBuffer | null> => {
      try {
        const db = await openGlbDb();
        return await new Promise((resolve) => {
          const tx = db.transaction('models', 'readonly');
          const req = tx.objectStore('models').get(key);
          req.onsuccess = () =>
            resolve(req.result instanceof ArrayBuffer ? req.result : null);
          req.onerror = () => resolve(null);
        });
      } catch {
        return null;
      }
    };

    const setIdbBuffer = async (key: string, buf: ArrayBuffer): Promise<void> => {
      try {
        const db = await openGlbDb();
        await new Promise<void>((resolve) => {
          const tx = db.transaction('models', 'readwrite');
          tx.objectStore('models').put(buf, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch {
        // Ignore storage quota errors
      }
    };

    const fetchCachedGlb = async (url: string): Promise<ArrayBuffer> => {
      const cached = await getIdbBuffer(url);
      if (cached && cached.byteLength > 0) {
        return cached;
      }
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      setIdbBuffer(url, buf);
      return buf;
    };

    const loadRig = (idx: number): Promise<void> => {
      const rig = rigs[idx];
      if (!rig) return Promise.resolve();
      if (rig.promise) return rig.promise;

      const dino = DINOS[idx];
      rig.promise = new Promise<void>((resolve) => {
        const onGltfReady = (gltf: { scene: THREE.Group }) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const sphere = box.getBoundingSphere(new THREE.Sphere());
          model.position.sub(sphere.center);
          const radius = sphere.radius || 1;
          rig.holder.scale.setScalar(1 / radius);

          model.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.frustumCulled = false;
              const mats = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];
              mats.forEach((m) => {
                const stdMat = m as THREE.MeshStandardMaterial;
                if (stdMat) {
                  if (stdMat.map) {
                    stdMat.map.anisotropy = maxAnisotropy;
                  }
                  stdMat.envMapIntensity = 1;
                }
              });
            }
          });

          rig.holder.add(model);
          rig.loaded = true;
          rig.failed = false;
          resolve();
        };

        const onGltfError = (err: unknown) => {
          console.error('Fehler beim Laden des 3D-Modells:', dino.id, err);
          rig.loaded = true;
          rig.failed = true;
          if (ctrl.activeIndex === idx) {
            setFailed(true);
          }
          resolve();
        };

        fetchCachedGlb(dino.model)
          .then((buffer) => {
            gltfLoader.parse(buffer, '', onGltfReady, onGltfError);
          })
          .catch(() => {
            gltfLoader.load(dino.model, onGltfReady, undefined, onGltfError);
          });
      });
      return rig.promise;
    };
    ctrl.loadRig = loadRig;

    // Camera measurement & principal point shift
    let W = 0;
    let H = 0;
    let snapped = false;
    const goal = { cx: 0, cy: 0, px: 200, sw: 600 };
    const view = { cx: 0, cy: 0, px: 200, sw: 600 };

    const measure = (forceSnap = false) => {
      if (!heroRef.current || !stageRef.current) return;
      const h = heroRef.current.getBoundingClientRect();
      const s = ctrl.focusMode
        ? h
        : stageRef.current.getBoundingClientRect();
      const nextW = Math.max(1, h.width);
      const nextH = Math.max(1, h.height);
      const sizeChanged = Math.abs(nextW - W) > 1 || Math.abs(nextH - H) > 1;
      W = nextW;
      H = nextH;
      goal.cx = s.left - h.left + s.width / 2;
      goal.cy = s.top - h.top + s.height * (ctrl.focusMode ? 0.5 : 0.44);
      goal.px = Math.min(s.width * 0.5, s.height * 0.6) * 1.16;
      goal.sw = s.width;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;

      if (!snapped || forceSnap || sizeChanged) {
        snapped = true;
        view.cx = goal.cx;
        view.cy = goal.cy;
        view.px = goal.px;
        view.sw = goal.sw;
      }
    };
    ctrl.measure = measure;
    measure(true);

    const ro = new ResizeObserver(() => measure(false));
    ro.observe(hero);
    ro.observe(stage);
    const onOrientation = () => measure(false);
    window.addEventListener('orientationchange', onOrientation);

    // Interaction helpers
    const setZoom = (z: number) => {
      const clamped = THREE.MathUtils.clamp(z, 0.55, 3.4);
      ctrl.zoomGoal = clamped;
      setZoomGoalState(clamped);
    };
    ctrl.setZoom = setZoom;

    const markTouched = () => {
      ctrl.lastTouch = performance.now();
      ctrl.homing = false;
      setTouched(true);
    };
    ctrl.markTouched = markTouched;

    const axisY = new THREE.Vector3(0, 1, 0);
    const axisX = new THREE.Vector3(1, 0, 0);
    const qY = new THREE.Quaternion();
    const qX = new THREE.Quaternion();

    const turnBy = (dx: number, dy: number) => {
      const rig = rigs[ctrl.activeIndex];
      if (!rig) return;
      qY.setFromAxisAngle(axisY, dx);
      qX.setFromAxisAngle(axisX, dy);
      rig.spin.quaternion.premultiply(qY).premultiply(qX);
    };
    ctrl.turnBy = turnBy;

    const resetView = () => {
      ctrl.homing = true;
      ctrl.velX = 0;
      ctrl.velY = 0;
      ctrl.yawQueue = 0;
      setZoom(1);
    };
    ctrl.resetView = resetView;

    // Pointer / Touch / Wheel events on stage
    const pointers = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;

    const isInteractiveChild = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest('button, a, input, label'));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isInteractiveChild(e.target)) return;
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      markTouched();
      ctrl.yawQueue = 0;
      ctrl.velX = 0;
      ctrl.velY = 0;

      if (pointers.size === 1) {
        setDragging(true);
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      if (pointers.size === 1) {
        const k = Math.PI / Math.max(260, view.px * 1.6);
        const dx = (cur.x - prev.x) * k;
        const dy = (cur.y - prev.y) * k;
        ctrl.velX = dx;
        ctrl.velY = dy;
        turnBy(dx, dy);
        markTouched();
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastPinchDist > 0 && dist > 0) {
          setZoom(ctrl.zoomGoal * (dist / lastPinchDist));
        }
        lastPinchDist = dist;
        markTouched();
      }
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) lastPinchDist = 0;
      if (pointers.size === 0) {
        setDragging(false);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      markTouched();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
      setZoom(ctrl.zoomGoal * factor);
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUpOrCancel);
    stage.addEventListener('pointercancel', onPointerUpOrCancel);
    stage.addEventListener('wheel', onWheel, { passive: false });

    // Animation loop
    let frameId = 0;
    let disposed = false;
    let prevTime = performance.now();
    const targetKeyColor = new THREE.Color(LIGHT_PRESETS.day.keyColor);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(Math.max((now - prevTime) / 1000, 0.001), 0.05);
      prevTime = now;
      const f = (rate: number) => dampFactor(dt, rate);

      // Ease camera view metrics
      const fv = f(7);
      view.cx += (goal.cx - view.cx) * fv;
      view.cy += (goal.cy - view.cy) * fv;
      view.px += (goal.px - view.px) * fv;
      view.sw += (goal.sw - view.sw) * fv;

      // Ease zoom
      ctrl.zoom += (ctrl.zoomGoal - ctrl.zoom) * f(6);

      // Camera z and shifted principal point
      const halfFovRad = THREE.MathUtils.degToRad(26 / 2);
      camera.position.z =
        H / (2 * Math.tan(halfFovRad) * Math.max(1, view.px) * ctrl.zoom);
      camera.setViewOffset(W, H, W / 2 - view.cx, H / 2 - view.cy, W, H);

      // Inertia when pointer released
      if (pointers.size === 0 && (Math.abs(ctrl.velX) > 1e-5 || Math.abs(ctrl.velY) > 1e-5)) {
        turnBy(ctrl.velX, ctrl.velY);
        const decay = Math.exp(-dt * 4.5);
        ctrl.velX *= decay;
        ctrl.velY *= decay;
      }

      // Turn buttons queue
      if (Math.abs(ctrl.yawQueue) > 1e-4) {
        const step = ctrl.yawQueue * f(4.2);
        ctrl.yawQueue -= step;
        turnBy(step, 0);
      }

      // Homing slerp
      const activeRig = rigs[ctrl.activeIndex];
      if (ctrl.homing && activeRig) {
        activeRig.spin.quaternion.slerp(activeRig.home, f(6));
        if (activeRig.spin.quaternion.angleTo(activeRig.home) < 0.002) {
          activeRig.spin.quaternion.copy(activeRig.home);
          ctrl.homing = false;
        }
      }

      // Ease lighting preset
      const preset = LIGHT_PRESETS[ctrl.lightMode];
      const fl = f(4);
      scene.environmentIntensity += (preset.env - scene.environmentIntensity) * fl;
      keyLight.intensity += (preset.key - keyLight.intensity) * fl;
      rimLight.intensity += (preset.rim - rimLight.intensity) * fl;
      renderer.toneMappingExposure +=
        (preset.exposure - renderer.toneMappingExposure) * fl;
      targetKeyColor.setHex(preset.keyColor);
      keyLight.color.lerp(targetKeyColor, fl);

      // Outgoing / Incoming rig animations & idle hover/sway
      const s = now / 1000;
      const idle = ctrl.reducedMotion
        ? 0
        : clamp01((now - ctrl.lastTouch - 1800) / 1500);
      const slide = (goal.sw * 0.95) / Math.max(1, view.px);
      const dur = ctrl.DUR;
      const { from, to, dir, t0, t1 } = ctrl.anim;

      rigs.forEach((rig, i) => {
        let visible = false;
        let k = 1;
        let x = 0;
        let twist = 0;

        if (i === from) {
          const t = clamp01((now - t0) / (dur * 0.6));
          if (t < 1) {
            visible = rig.loaded && !rig.failed;
            const e = inCubic(t);
            k = Math.max(0.0001, 1 - e);
            x = -dir * e * slide;
            twist = -dir * e * 1.4;
          }
        }

        if (i === to) {
          visible = rig.loaded && !rig.failed;
          const t = clamp01((now - t1) / dur);
          const e = outCubic(t);
          k = Math.max(0.0001, outBack(t)) * (0.25 + 0.75 * e);
          x = dir * (1 - e) * slide;
          twist = dir * (1 - e) * 1.6;
        }

        rig.pivot.visible = visible;
        if (visible) {
          rig.pivot.scale.setScalar(k);
          const hoverY = ctrl.reducedMotion ? 0 : Math.sin(s * 1.3 + i) * 0.028;
          rig.pivot.position.set(x, hoverY, 0);
          rig.pivot.rotation.set(
            Math.sin(s * 0.9) * 0.03 * idle,
            twist + Math.sin(s * 0.55) * 0.16 * idle,
            0
          );
        }
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    // Boot sequence (Section 8): dedicate full bandwidth to active model first
    setLoading(true);
    frameId = requestAnimationFrame(tick);

    loadRig(0).then(() => {
      if (disposed) return;
      if (ctrl.activeIndex === 0) {
        setLoading(false);
        if (rigs[0].failed) setFailed(true);
        ctrl.anim = {
          from: -1,
          to: 0,
          dir: 1,
          t0: performance.now(),
          t1: performance.now(),
        };
      }
      // Warm the second model once the active model is ready
      loadRig(1);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      window.removeEventListener('orientationchange', onOrientation);
      mediaReduced.removeEventListener('change', onReducedChange);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUpOrCancel);
      stage.removeEventListener('pointercancel', onPointerUpOrCancel);
      stage.removeEventListener('wheel', onWheel);
      dracoLoader.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  // Escape key closes expanded Focus view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ctrlRef.current.focusMode) {
        ctrlRef.current.focusMode = false;
        setFocusMode(false);
        requestAnimationFrame(() => ctrlRef.current.measure(false));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleFocus = useCallback(() => {
    const next = !ctrlRef.current.focusMode;
    ctrlRef.current.focusMode = next;
    setFocusMode(next);
    ctrlRef.current.markTouched();
    requestAnimationFrame(() => ctrlRef.current.measure(false));
  }, []);

  const toggleLight = useCallback(() => {
    const next = ctrlRef.current.lightMode === 'day' ? 'dusk' : 'day';
    ctrlRef.current.lightMode = next;
    setLightMode(next);
    document.body.style.background = next === 'dusk' ? '#14170f' : '';
    ctrlRef.current.markTouched();
  }, []);

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const ctrl = ctrlRef.current;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      ctrl.markTouched();
      ctrl.turnBy(-0.18, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      ctrl.markTouched();
      ctrl.turnBy(0.18, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      ctrl.markTouched();
      ctrl.turnBy(0, -0.18);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      ctrl.markTouched();
      ctrl.turnBy(0, 0.18);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      ctrl.markTouched();
      ctrl.setZoom(ctrl.zoomGoal * 1.2);
    } else if (e.key === '-') {
      e.preventDefault();
      ctrl.markTouched();
      ctrl.setZoom(ctrl.zoomGoal / 1.2);
    } else if (e.key === '0') {
      e.preventDefault();
      ctrl.resetView();
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const nextIdx = (idx + delta + DINOS.length) % DINOS.length;
      tabRefs.current[nextIdx]?.focus();
      select(nextIdx);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    const matchIdx = findCreatureIndexByQuery(val);
    if (matchIdx !== -1 && matchIdx !== activeIndex) {
      select(matchIdx);
    }
  };

  const currentDino = DINOS[displayIndex] || DINOS[0];
  const eraMetrics = getEraMetrics(currentDino.era);
  const isZoomInOn = zoomGoalState >= 1;
  const isCloseupPressed = zoomGoalState > 2.2;

  const heroClasses = [
    'hero',
    touched ? 'touched' : '',
    focusMode ? 'focus' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stageClasses = [
    'stage',
    dragging ? 'dragging' : '',
    switching ? 'switching' : '',
    loading ? 'loading' : '',
    failed ? 'failed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <IconSprite />
      <main
        ref={heroRef}
        id="hero"
        className={heroClasses}
        data-light={lightMode}
      >
        <canvas ref={canvasRef} id="gl" />

        {/* 4.1 Left Sidebar */}
        <aside className="side" aria-label="Atlas-Kategorien">
          <div className="brand">
            Mythen-Atlas
            <small>Kryptozoologie · Bd. I</small>
          </div>

          <ul className="nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={activeNavId === item.id ? 'page' : undefined}
                  onClick={() => {
                    setActiveNavId(item.id);
                    if (
                      typeof item.creatureIndex === 'number' &&
                      item.creatureIndex !== activeIndex
                    ) {
                      select(item.creatureIndex);
                    }
                  }}
                >
                  <svg className="ico" aria-hidden="true">
                    <use href={`#${item.icon}`} />
                  </svg>
                  <span>
                    {item.label}
                    {item.sub && <small>{item.sub}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="feature">
            <div className="eyebrow">Ausgewähltes Wesen</div>
            <img
              id="featImg"
              src={currentDino.image}
              alt={currentDino.name}
              referrerPolicy="no-referrer"
            />
            <h3 id="featTitle">{currentDino.feature[0]}</h3>
            <p id="featText">{currentDino.feature[1]}</p>
            <a href="#detail">
              Mehr erfahren
              <svg className="ico" aria-hidden="true">
                <use href="#i-arrow" />
              </svg>
            </a>
          </div>
        </aside>

        {/* 4.2 Centre Column */}
        <section className="main">
          <div
            id="tabs"
            className="tabs"
            role="tablist"
            aria-label="Ausgewählte Wesen"
          >
            {DINOS.map((d, i) => {
              const selected = i === activeIndex;
              const numStr = String(i + 1).padStart(2, '0');
              return (
                <button
                  key={d.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${d.id}`}
                  className="tab"
                  data-no={numStr}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={(e) => handleTabKeyDown(e, i)}
                >
                  <img
                    src={d.image}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <b>{d.name}</b>
                  <i>{d.latin}</i>
                </button>
              );
            })}
          </div>

          <div
            ref={stageRef}
            id="stage"
            className={stageClasses}
            tabIndex={0}
            aria-label="3D-Modell des Wesens. Ziehen zum Drehen, Scrollen oder Pinch-Geste zum Zoomen, Doppelklick zum Zurücksetzen."
            onDoubleClick={() => ctrlRef.current.resetView()}
            onKeyDown={handleStageKeyDown}
          >
            <div className="plate" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="ground" aria-hidden="true" />

            <div
              id="fallback"
              className="fallback"
              style={{ backgroundImage: `url("${currentDino.image}")` }}
            />

            <div id="loader" className={`loader${loading ? ' show' : ''}`}>
              Präparat wird vorbereitet…
            </div>

            <div className="hint" aria-hidden="true">
              <svg className="ico">
                <use href="#i-hand" />
              </svg>
              Ziehen zum Drehen · Scrollen zum Zoomen
            </div>

            <div className="rail" role="toolbar" aria-label="Ansichtswerkzeuge">
              <button
                type="button"
                id="zoomIn"
                className={isZoomInOn ? 'on' : ''}
                aria-label="Vergrößern"
                onClick={() => {
                  ctrlRef.current.markTouched();
                  ctrlRef.current.setZoom(ctrlRef.current.zoomGoal * 1.35);
                }}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#i-plus" />
                </svg>
              </button>

              <button
                type="button"
                id="zoomOut"
                className={!isZoomInOn ? 'on' : ''}
                aria-label="Verkleinern"
                onClick={() => {
                  ctrlRef.current.markTouched();
                  ctrlRef.current.setZoom(ctrlRef.current.zoomGoal / 1.35);
                }}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#i-search" />
                </svg>
              </button>

              <button
                type="button"
                id="expand"
                className={focusMode ? 'on' : ''}
                aria-pressed={focusMode}
                aria-label={
                  focusMode
                    ? 'Erweiterte Ansicht schließen'
                    : 'Ansicht erweitern'
                }
                onClick={toggleFocus}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#i-expand" />
                </svg>
              </button>

              <button
                type="button"
                id="light"
                className={lightMode === 'dusk' ? 'on' : ''}
                aria-pressed={lightMode === 'dusk'}
                aria-label={
                  lightMode === 'dusk'
                    ? 'Zum Tageslicht wechseln'
                    : 'Zur Dämmerungsbeleuchtung wechseln'
                }
                onClick={toggleLight}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#i-sun" />
                </svg>
              </button>
            </div>

            <div className="turn">
              <button
                type="button"
                id="turnL"
                aria-label="Nach links drehen"
                onClick={() => {
                  ctrlRef.current.markTouched();
                  ctrlRef.current.yawQueue -= Math.PI / 2;
                }}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#i-ccw" />
                </svg>
              </button>
              <button
                type="button"
                id="turnFull"
                aria-label="Um 360 Grad drehen"
                onClick={() => {
                  ctrlRef.current.markTouched();
                  ctrlRef.current.yawQueue += Math.PI * 2;
                }}
              >
                360°
              </button>
              <button
                type="button"
                id="turnR"
                aria-label="Nach rechts drehen"
                onClick={() => {
                  ctrlRef.current.markTouched();
                  ctrlRef.current.yawQueue += Math.PI / 2;
                }}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#i-cw" />
                </svg>
              </button>
            </div>

            <div id="scale" className="scale">
              {currentDino.scale}
            </div>

            <p id="caption" className="caption">
              {currentDino.caption}
            </p>
          </div>
        </section>

        {/* 4.3 Right Info Column */}
        <section className="info">
          <div className="top">
            <label className="search">
              <svg className="ico" aria-hidden="true">
                <use href="#i-search" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Wesen, Legenden oder Regionen suchen…"
                aria-label="Wesen, Legenden oder Regionen suchen"
              />
            </label>
            <button
              type="button"
              className="iconbtn"
              aria-label="Benachrichtigungen"
              onClick={() => ctrlRef.current.markTouched()}
            >
              <svg className="ico" aria-hidden="true">
                <use href="#i-bell" />
              </svg>
            </button>
            <button
              type="button"
              className="iconbtn"
              aria-label="Konto"
              onClick={() => ctrlRef.current.markTouched()}
            >
              <span className="avatar">
                <svg className="ico" aria-hidden="true">
                  <use href="#i-user" />
                </svg>
              </span>
            </button>
          </div>

          <div ref={cardRef} className="card">
            <article
              key={currentDino.id}
              id="detail"
              className={`detail${leaving ? ' leaving' : ''}`}
              aria-live="polite"
            >
              <div
                className="eyebrow"
                style={{ '--i': 0 } as React.CSSProperties}
              >
                {currentDino.family} · Präparat {currentDino.no}
              </div>

              <h1 style={{ '--i': 1 } as React.CSSProperties}>
                {currentDino.name}
                <em>{currentDino.latin}</em>
              </h1>

              <div className="tags" style={{ '--i': 2 } as React.CSSProperties}>
                {currentDino.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <p className="lede" style={{ '--i': 3 } as React.CSSProperties}>
                {currentDino.lede}
              </p>

              <div className="era" style={{ '--i': 4 } as React.CSSProperties}>
                <div className="bar">
                  <b />
                  <b />
                  <b />
                  <u
                    className={eraMetrics.alignLeft ? 'l' : ''}
                    style={{
                      left: `${eraMetrics.left}%`,
                      width: `${eraMetrics.width}%`,
                    }}
                    data-l={currentDino.eraLabel}
                  />
                </div>
                <div className="lab">
                  <span>Antike</span>
                  <span>Mittelalter</span>
                  <span>Neuzeit</span>
                </div>
              </div>

              <h2 style={{ '--i': 5 } as React.CSSProperties}>Feldnotizen</h2>

              <dl
                className="traits"
                style={{ '--i': 6 } as React.CSSProperties}
              >
                {currentDino.traits.map(([icon, dt, dd]) => (
                  <div key={dt}>
                    <svg className="ico" aria-hidden="true">
                      <use href={`#${icon}`} />
                    </svg>
                    <dt>{dt}</dt>
                    <dd>{dd}</dd>
                  </div>
                ))}
              </dl>

              <h2 style={{ '--i': 7 } as React.CSSProperties}>Verbreitung</h2>

              <div
                className="habitat"
                style={{ '--i': 8 } as React.CSSProperties}
              >
                <svg className="ico" aria-hidden="true">
                  <use href="#t-reed" />
                </svg>
                <span>{currentDino.habitat}</span>
              </div>

              <div
                className="closeup-wrap"
                style={{ '--i': 9 } as React.CSSProperties}
              >
                <button
                  type="button"
                  id="closeup"
                  className="closeup"
                  aria-pressed={isCloseupPressed}
                  onClick={() => {
                    ctrlRef.current.markTouched();
                    const nextZ = ctrlRef.current.zoomGoal > 2.2 ? 1 : 2.6;
                    ctrlRef.current.setZoom(nextZ);
                  }}
                >
                  <span
                    className="lens"
                    style={{
                      backgroundImage: `url("${currentDino.image}")`,
                      backgroundPosition: currentDino.lens,
                    }}
                  />
                  <span>
                    <b>Detailansicht</b>
                    <small>{currentDino.closeup}</small>
                  </span>
                  <svg className="ico" aria-hidden="true">
                    <use href="#i-chev" />
                  </svg>
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
