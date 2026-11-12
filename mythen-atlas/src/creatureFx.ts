import * as THREE from 'three';

/**
 * Procedural, GPU-only creature animation (no rig needed):
 *  - phoenix: wing flap + tail sway in the vertex shader, flickering fire glow, rising embers
 *  - kraken:  tentacle/body undulation, underwater caustics + tint, rising bubbles
 * One shared time uniform; particles are a single Points draw call each.
 */

export const fxTime = { value: 0 };

type Kind = 'phoenix' | 'kraken';

function patchMaterial(mat: THREE.Material, kind: Kind, box: THREE.Box3) {
  const m = mat as THREE.MeshStandardMaterial;
  const min = box.min.clone();
  const size = box.getSize(new THREE.Vector3());
  // which horizontal axis is longest: wingspan (phoenix) / body length (kraken)
  const longX = size.x >= size.z;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = fxTime;
    shader.uniforms.uMin = { value: min };
    shader.uniforms.uSize = { value: size };
    const L = longX ? 'x' : 'z';
    const S = longX ? 'z' : 'x';

    const head = /* glsl */ `
      uniform float uTime; uniform vec3 uMin; uniform vec3 uSize;
      varying vec3 vFxW; varying vec3 vFxN;
    `;
    let deform = '';
    if (kind === 'phoenix') {
      deform = /* glsl */ `
        vec3 n01 = (transformed - uMin) / max(uSize, vec3(1e-4));
        float span = abs(n01.${L} * 2.0 - 1.0);              // 0 body .. 1 wingtip
        float wing = smoothstep(0.18, 1.0, span);
        float ph = uTime * 3.1 - span * 1.4;                  // tip lags behind root
        float flap = sin(ph) + 0.25 * sin(ph * 2.0);
        transformed.y += flap * wing * wing * uSize.y * 0.22;
        transformed.${S} += cos(ph) * wing * uSize.${S} * 0.04;
        float low = 1.0 - smoothstep(0.0, 0.45, n01.y);      // tail feathers
        transformed.${L} += sin(uTime * 1.7 + n01.y * 6.0) * low * low * uSize.${L} * 0.03;
        transformed.y += sin(uTime * 3.1) * uSize.y * 0.015;  // body lift with each beat
      `;
    } else {
      deform = /* glsl */ `
        vec3 n01 = (transformed - uMin) / max(uSize, vec3(1e-4));
        float t = n01.${L};
        float ends = pow(abs(t * 2.0 - 1.0), 1.6);            // tentacles + mantle tip move most
        float w = uTime * 1.6 - t * 7.0;
        transformed.y += sin(w) * (0.15 + 0.85 * ends) * uSize.y * 0.07;
        transformed.${S} += cos(w * 0.8 + n01.y * 4.0) * ends * uSize.${S} * 0.08;
        float breathe = sin(uTime * 1.2) * 0.02 * (1.0 - ends);
        transformed.y *= 1.0 + breathe; transformed.${S} *= 1.0 + breathe;
      `;
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + deform)
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvFxW = (modelMatrix * vec4(transformed,1.0)).xyz; vFxN = normalize(mat3(modelMatrix) * objectNormal);'
      );

    let frag = '';
    if (kind === 'phoenix') {
      frag = /* glsl */ `
        float fl = 0.6 + 0.4 * sin(uTime * 9.0 + vFxW.x * 14.0) * sin(uTime * 5.3 + vFxW.y * 11.0);
        float edge = pow(1.0 - abs(dot(normalize(vFxN), normalize(cameraPosition - vFxW))), 2.5);
        totalEmissiveRadiance += vec3(1.0, 0.42, 0.08) * (0.18 + edge * 0.9) * fl;
      `;
    } else {
      frag = /* glsl */ `
        vec2 p = vFxW.xz * 7.0 + vec2(uTime * 0.35, uTime * 0.22);
        float c = 0.0;
        for (int i = 0; i < 3; i++) {
          p = vec2(p.x + sin(p.y * 1.3 + uTime), p.y + cos(p.x * 1.1 - uTime * 0.8));
          c += 1.0 / (1.0 + 18.0 * abs(sin(p.x) * cos(p.y)));
        }
        float up = clamp(vFxN.y * 0.5 + 0.5, 0.0, 1.0);
        totalEmissiveRadiance += vec3(0.55, 0.85, 1.0) * pow(c / 3.0, 3.0) * 0.55 * up;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.72, 0.9, 1.05), 0.35);
      `;
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + frag);
  };
  m.customProgramCacheKey = () => 'fx-' + kind;
  m.needsUpdate = true;
}

function dotTexture(inner: string, outer: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.45, outer);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function bubbleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(220,240,255,0.9)';
  g.lineWidth = 3;
  g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(200,230,255,0.15)';
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.arc(23, 22, 6, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface CreatureFx { update(dt: number): void; dispose(): void }

/** Call once after the GLB is added. `parent` = the rig pivot (unit-scale space). */
export function attachCreatureFx(id: string, model: THREE.Object3D, parent: THREE.Object3D): CreatureFx | null {
  const kind: Kind | null = id === 'phoenix' ? 'phoenix' : id === 'kraken' ? 'kraken' : null;
  if (!kind) return null;

  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox!.clone();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => patchMaterial(m, kind, box));
  });

  // particles in the pivot's normalized space (model radius ~ 1)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = reduced ? 0 : kind === 'phoenix' ? 140 : 90;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N * 4); // speed, phase, radius, life
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const reset = (i: number, initial: boolean) => {
    const a = Math.random() * Math.PI * 2;
    const r = kind === 'phoenix' ? Math.pow(Math.random(), 0.6) * 0.75 : rnd(0.2, 1.1);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = initial ? rnd(-0.9, 1.1) : kind === 'phoenix' ? rnd(-0.7, 0.1) : -1.05;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.6;
    seed[i * 4] = kind === 'phoenix' ? rnd(0.25, 0.6) : rnd(0.12, 0.32);
    seed[i * 4 + 1] = Math.random() * 6.28;
    seed[i * 4 + 2] = r;
  };
  for (let i = 0; i < N; i++) reset(i, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: kind === 'phoenix' ? dotTexture('rgba(255,240,190,1)', 'rgba(255,110,20,0.55)') : bubbleTexture(),
    size: kind === 'phoenix' ? 0.035 : 0.045,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    blending: kind === 'phoenix' ? THREE.AdditiveBlending : THREE.NormalBlending,
    opacity: kind === 'phoenix' ? 0.95 : 0.7,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  if (N) parent.add(points);

  // a soft coloured light that flickers (fire) or shimmers (water)
  const light = new THREE.PointLight(kind === 'phoenix' ? 0xff7a2a : 0x6fc3ff, kind === 'phoenix' ? 1.6 : 1.1, 4, 2);
  light.position.set(0, kind === 'phoenix' ? -0.2 : 0.9, 0.6);
  parent.add(light);

  let t = 0;
  return {
    update(dt: number) {
      t += dt;
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < N; i++) {
        const sp = seed[i * 4], ph = seed[i * 4 + 1];
        pos[i * 3 + 1] += sp * dt;
        pos[i * 3] += Math.sin(t * 2.2 + ph) * dt * (kind === 'phoenix' ? 0.12 : 0.05);
        pos[i * 3 + 2] += Math.cos(t * 1.7 + ph) * dt * 0.04;
        if (pos[i * 3 + 1] > 1.15) reset(i, false);
      }
      p.needsUpdate = true;
      light.intensity = kind === 'phoenix'
        ? 1.3 + Math.sin(t * 11) * 0.25 + Math.sin(t * 17.3) * 0.2
        : 1.0 + Math.sin(t * 1.4) * 0.25;
    },
    dispose() {
      geo.dispose(); mat.map?.dispose(); mat.dispose();
      parent.remove(points); parent.remove(light);
    },
  };
}
