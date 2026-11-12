# FADENWERK — procedural 3D clothing rail

Open `index.html` directly in a browser. It's a single file: inline CSS and JS, with three.js 0.160 loaded from jsDelivr through an import map. No image, video, model or texture files are downloaded. Every visual is generated on the visitor's GPU.

## 1. Reference audit

No reference URL was given, so there was nothing to audit. The section order follows a common pattern for fashion e-commerce sites. Everything else is original: the brand, the copy and the media.

## 2. Media inventory → how each asset is generated

| # | Section | Element | Role | Size / ratio | Motion | Generator |
|---|---|---|---|---|---|---|
| 1 | Header | Wordmark | Logo | text | — | Typographic (Archivo, condensed) |
| 2 | Hero | WebGL canvas | 5 garments on a rail | full-screen sticky, 500vh scroll | scroll → rail, spring swing, drag rotate, inspect dolly | Parametric tube geometry + custom fabric `ShaderMaterial` |
| 3 | Hero | Hangers, rail, floor shadows | Props | — | Swivel and swing | `TubeGeometry` / `MeshStandardMaterial` + RoomEnvironment PMREM; floor shadows drawn analytically in a shader |
| 4 | New-in carousel | Product front/back | Product shot | 600×800 PNG, 3:4 | Back image shows on hover | Offscreen `WebGLRenderer` → `toBlob` → `createObjectURL` |
| 5 | Marquee | Fabric swatches | Texture | 320×320 JPEG, 1:1 | Marquee loop | Same pipeline, camera 14 cm from the garment |
| 6 | Shop grid | 10 products × front/back | Product shot | 3:4 | Back image shows on hover | Same as #4 |
| 7 | Fabric lab | Denim macro | Hero texture | 1100×900 JPEG | — | Same pipeline, 20 cm macro |
| 8 | Look-book | 5 editorial frames | Lifestyle | 4:5, 3:4, 1:1, 2:3 | — | 3/4 garment render composited on a 2D canvas (gradient backdrop, light falloff, floor shadow, vignette, film grain, type) → JPEG |
| 9 | Store | Map | Decorative | CSS | Pin pulse | CSS gradients |

**Fabrics** (GLSL, thread sizes in real cm). Each weave fades to its average colour once a thread is smaller than about 1.6–3 px on screen:
3/1 twill denim with slubs, fades, whiskers and seam roping · ripstop with a 5 mm grid · 8-wale corduroy with velvet sheen · loopback jersey with heather · 2×2 rib · 20D nylon with a fresnel environment reflection · braided cord.

**Construction details** (drawn in cm space): waistband, belt loops, J-fly, curved front pockets, rivets, back pockets with arcuate stitching, yoke, side seams and inseams, hems, cargo pockets with flap and snap, kangaroo pocket, rib cuffs and hem, hood seam, aglets, box-baffle stitching, coil zip with slider.

## 3. Performance

- 0 texture downloads. The page is about 70 KB, not counting three.js and the fonts.
- Pixel ratio is capped at 2 on desktop and 1.5 on mobile. If the average frame takes more than 24 ms, the ratio drops by 0.25 (minimum 0.75).
- The render loop pauses when the hero is off-screen (IntersectionObserver) or the tab is hidden.
- On mobile and on devices with 4 or fewer CPU cores, garment meshes use 0.6× resolution.
- Media generation runs in `requestIdleCallback` after the first hero frame. Shimmer placeholders sit in fixed aspect-ratio boxes until each image arrives, so the layout doesn't shift.

## 4. Observed vs. inferred, and what to replace

- **Observed:** nothing, because no reference was given.
- **Inferred:** the full section structure and the visual style.
- **Replace before launch:**
  - The brand name "FADENWERK" if you want your own.
  - Prices (PKR placeholders).
  - The address (`[Your Street 00]`, `[Your City]`) and opening hours.
  - The newsletter, bag and checkout hooks. They are handled in JS only and send nothing.
  - The social links.

QA URL params: `?look=0..4`, `?inspect=1`, `?y=<px>`.
