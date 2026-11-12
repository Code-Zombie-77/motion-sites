"""Comment-to-DM lead magnets for the Mind-Merit motion sites, in German AND English.
<OUT>/<Lang>/<nn>_<Site>_Workflow.pdf (+ .md): PROMPT (pro build spec) + WEBSITE blueprint + 3D-WORKFLOW (with asset-generation prompts).
Prompts stay in English (models build most precisely from English specs); framing text is per language. PDFs via headless Chrome."""
import os, html, subprocess
OUT = r"D:\Websites\motion-sites\Motion-site-reels\MindMerit_Reels_v7\Lead-Magnets"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

COMMON_RULES = """
WORKING RULES FOR YOU (the AI)
- Work in the phases below. After each phase: stop, summarise what you built, list anything you assumed, and wait for my "go".
- Never replace a working effect with a simpler one to make an error go away. Fix the cause.
- No placeholder lorem ipsum: write real, specific copy in the language stated above.
- Every number in this brief (colours, easings, durations, camera values) is intentional. Use them exactly unless they break something; if so, tell me why.
- Keep everything in the stated file structure. Comment every non-obvious block in one line ("why", not "what").

QUALITY BAR
- 60 fps on a 2021 MacBook Air / mid-range Windows laptop at 1440p; no frame over 33 ms while scrolling.
- LCP < 2.5 s on fast 4G: real HTML text and a poster image paint first, WebGL/video boot after first paint.
- devicePixelRatio capped (value given per project). Render loop pauses when the tab is hidden or the canvas is off-screen.
- prefers-reduced-motion: no scroll-jacking, no camera flights. Show a still / poster and a normal readable page.
- Keyboard: every interactive element reachable and visibly focused. Text contrast ≥ 4.5:1 on its real background.
"""

SITES = [
dict(key="Nectarline", nr="01",
 title={"de": "Nectarline – Ad-Tech-Landingpage mit 3D-Koi im Unterwasser-Licht", "en": "Nectarline – ad-tech landing page with a 3D koi in underwater light"},
 what={"de": "Eine SaaS-Landingpage, die sich wie ein Teich anfühlt: Ein echter 3D-Koi (KI-generiertes GLB) schwimmt über einem Unterwasser-Video, ein Shader legt Kaustik-Licht darüber, Liquid-Glass-Panels brechen das Bild wie Wasser, und jeder Abschnitt taucht beim Scrollen aus der Tiefe auf.",
       "en": "A SaaS landing page that feels like a pond: a real 3D koi (AI-generated GLB) swims over an underwater video, a shader adds caustic light, liquid-glass panels refract the scene like water, and every section rises out of the depth as you scroll."},
 stack="index.html (single file) · three@0.170.0 via importmap · GLTFLoader · MeshPhysicalMaterial + custom GLSL · SVG feDisplacementMap · no framework",
 time={"de": "Assets ca. 1–2 Std. · Build mit KI-Agent ca. 4–6 Std.", "en": "Assets approx. 1–2 h · build with an AI agent approx. 4–6 h"},
 prompt="""ROLE
You are a senior creative developer (Three.js + GLSL + CSS) building an award-level landing page. Ship one production-quality index.html.

PROJECT
"Nectarline – Supply Side Studio", a German supply-side ad-tech company. All visible copy in German, confident and short.
Feeling: calm, premium, underwater. Think "a koi pond at golden hour, seen through glass", not "aquarium screensaver".

ART DIRECTION
- Palette (CSS custom properties): --ink #f4f8ff · --ink2 rgba(230,250,255,.72) · --ink3 rgba(229,250,255,.5) · --peri #ff6a1a (accent) · --peri2 #ff9a52 · --navy #0a3442 · --line rgba(229,250,255,.15) · --hi linear-gradient(160deg, rgba(189,242,255,.2), rgba(72,177,203,.14))
- Type: "Inter Tight" (UI + headlines, weights 400/500/600, tight tracking -0.02em on headlines), "Instrument Serif" italic for 1–2 emphasised words per headline, "Fira Code" for numbers/labels. Fluid unit --u: calc(100vw/1440); H1 = calc(var(--u)*96), body = max(15px, calc(var(--u)*17)).
- One easing everywhere: --ease cubic-bezier(.2,.7,.2,1). UI transitions 300–500 ms.
- Buttons "Framer style": hairline ring 1px var(--line), a fine top light (inset 0 1px 0 rgba(255,255,255,.18)), nothing heavy. Primary = solid --peri with dark text.

LAYER STACK (back → front, all position:fixed inside #scene)
1. <video id="pond"> looping underwater pond (muted, playsinline, preload auto, crossorigin anonymous), object-fit cover.
2. <canvas id="pondfx"> fullscreen fragment shader on top of the video: animated caustics (iterative trig "water caustic" pattern, 5 iterations, scale ≈ 0.34 of uv, speed ≈ 0.34), warm god-ray falloff from the top, subtle vignette. Additive, max contribution ≈ 0.75.
3. #violet and #night: two colour-grade overlays whose opacity is driven by scroll (day → violet dusk → night as you go deeper).
4. <canvas id="koi"> Three.js: PerspectiveCamera(30, aspect, .1, 100), ACESFilmicToneMapping, exposure .95, renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25)), alpha: true.

THE KOI
- Load the GLB with GLTFLoader. Re-skin it with MeshPhysicalMaterial: map = the original texture redrawn through a canvas (so you can tweak saturation), roughness .36, metalness 0, clearcoat 1, clearcoatRoughness .09, a little sheen. Colour space SRGB, anisotropy 8.
- Add procedural "imbricated scales" in onBeforeCompile: a staggered cell grid (≈104 × 126 cells, every other column offset by .5) that darkens toward each scale's rear rim. Subtle – visible only in highlights.
- Swimming: the fish follows a smooth closed CatmullRom path across the hero; body bends with a travelling sine wave along its length (amplitude grows toward the tail, ~1.1 Hz). The head turns toward the cursor with damped lerp (rate ≈ 1 - 0.92^(dt*60)).
- A soft shadow/caustic blob follows under the fish on the pondfx layer.

SECTIONS (copy in German)
1. Hero – "Das ist Nectarline" (Instrument Serif italic on "Nectarline"), subline "Supply-Side-Studio für kuratiertes Inventar.", buttons "Demo buchen" (primary) / "Nach unten scrollen" (ghost).
2. Statement – "Inventar kuratieren, bevor Sie bieten." + 4 KPIs in Fira Code: 2,4 Mrd. Bid-Requests/Tag · 48 s bis zum Deal · 120+ Publisher · 0 % Blindinventar.
3. "Deal-Leistung" – a product dashboard built in HTML/CSS (NOT a screenshot): sidebar, KPI cards, an SVG area chart that draws itself in, a live "bid request" log that ticks every 1.2 s.
4. "Wählen, prüfen, messen." – 3 glass cards with numbered steps.
5. Packages – "Kaufbereite Zielgruppen", "Streaming", "Conversions" (glass cards, hover lifts 6px).
6. "Für alle, die mit Inventar arbeiten." – tabs: Mediaagentur · Werbetreibende · Publisher · Ad-Tech-Anbieter, content cross-fades 300 ms.
7. Final CTA "Inventar kuratieren auf der Supply-Seite" + footer.

LIQUID GLASS
- Big panels: backdrop-filter: blur(14px) saturate(1.3) + background var(--hi) + 1px var(--line) border.
- Edge refraction: an inline SVG filter with feDisplacementMap (scale 54, xChannel R, yChannel G) fed by a per-panel displacement map that is strong at the edges and flat in the middle. Inner content stays flat and readable.

SCROLL CHOREOGRAPHY
- "Depth on scroll": every .d3 block travels in from behind the page – starts at translateZ(-320px) scale(.86), opacity 0, blur 8px – and settles flat. Driven by its scroll progress (IntersectionObserver + rAF), NOT a one-shot animation; scrolling back reverses it.
- Sticky glass nav: smooth-scrolls to sections and marks the active one.
""" + COMMON_RULES + """
BUILD PHASES
1. Static page: all sections, copy, typography, glass styles. No WebGL. → review
2. Video + pondfx caustics shader + scroll-driven colour grades. → review
3. Koi: load, re-skin, scales shader, path + body wave + cursor look. → review
4. Depth-on-scroll + nav + tabs + dashboard animations. → review
5. Performance + reduced motion + mobile (smaller fish, 720p video, panels stack) + final polish. → review

ACCEPTANCE CHECKLIST
[ ] Text is readable before any 3D loads   [ ] Fish never pops or teleports when the path loops
[ ] Glass edges visibly bend the background   [ ] Scrolling back reverses every depth animation
[ ] 60 fps while scrolling on a normal laptop   [ ] Reduced motion = still pond + no fish movement
I will give you: GLB_URL, VIDEO_URL (desktop), VIDEO_URL_MOBILE, POSTER_URL.""",
 blueprint={"de": ["Hero: 3D-Koi + Unterwasser-Video + Kaustik-Shader, Headline unten links", "Statement + 4 Kennzahlen (Fira Code)", "Produkt-Dashboard komplett in HTML/CSS (scharf, animiert)", "3 Schritte als Glas-Karten", "Paket-Karten", "Zielgruppen-Tabs", "Abschluss-CTA + Footer"],
            "en": ["Hero: 3D koi + underwater video + caustics shader, headline bottom left", "Statement + 4 KPIs (Fira Code)", "Product dashboard fully in HTML/CSS (sharp, animated)", "3 steps as glass cards", "Package cards", "Audience tabs", "Final CTA + footer"]},
 tokens="#f4f8ff · #ff6a1a / #ff9a52 · #0a3442 · Inter Tight / Instrument Serif / Fira Code · ease cubic-bezier(.2,.7,.2,1)",
 workflow=[
  ({"de": "Koi-Referenzbild", "en": "Koi reference image"},
   {"de": "Ein seitliches Studio-Bild ist die Basis für ein gutes 3D-Modell.", "en": "A clean side-view studio image is the base for a good 3D model."},
   "Photorealistic koi fish, kohaku pattern (white body, deep orange-red patches), full body in strict side profile facing right, fins spread, studio lighting, soft shadow, plain light-grey background, ultra-detailed scales, 8k, sharp focus\nNegative: water, bubbles, multiple fish, cropped tail, top view, blur, text"),
  ({"de": "Bild → 3D (GLB)", "en": "Image → 3D (GLB)"},
   {"de": "Image-to-3D (z. B. Higgsfield 3D, Meshy, Tripo). Export .glb, < 8 MB, Texturen 2K. In gltf.report prüfen: Kopf zeigt nach +X, Ursprung im Körpermittelpunkt, ein Mesh, ein Material.", "en": "Image-to-3D (e.g. Higgsfield 3D, Meshy, Tripo). Export .glb, < 8 MB, 2K textures. Check in gltf.report: head points to +X, origin at body centre, one mesh, one material."}, None),
  ({"de": "Unterwasser-Video", "en": "Underwater video"},
   {"de": "Text-to-Video, Kamera statisch, nahtlose Schleife. Danach mit ffmpeg auf 1920 px / CRF 26 und eine 720p-Version für Mobile.", "en": "Text-to-video, static camera, seamless loop. Then ffmpeg to 1920 px / CRF 26 plus a 720p mobile version."},
   "Underwater view of a calm koi pond, sun rays piercing the surface from top left, slow drifting particles, soft green-teal water, smooth stones and water plants at the bottom, no fish, static locked-off camera, seamless loop, cinematic, 24 fps\nNegative: camera movement, fish, people, text, fast motion"),
  ({"de": "Build", "en": "Build"},
   {"de": "PROMPT in einen KI-Coding-Agenten (z. B. Claude Code) geben, die 4 URLs ergänzen und Phase für Phase freigeben.", "en": "Give the PROMPT to an AI coding agent (e.g. Claude Code), add the 4 URLs and approve phase by phase."}, None),
  ({"de": "Test", "en": "Test"},
   {"de": "Echtes Handy + Laptop, Lighthouse, reduced motion, langsames und schnelles Scrollen.", "en": "Real phone + laptop, Lighthouse, reduced motion, slow and fast scrolling."}, None)]),

dict(key="KV-Fracht", nr="02",
 title={"de": "KV-Fracht – Logistik-Website, bei der Scrollen den Container verlädt", "en": "KV-Fracht – a logistics site where scrolling loads the container"},
 what={"de": "Die Scroll-Position steuert ein KI-Video Bild für Bild: Der Reachstacker hebt den Container auf den LKW, danach fährt der Truck los – mit echten, sich drehenden Rädern aus dem Video selbst – und die Leistungen rollen als horizontale Strecke vorbei.",
       "en": "Scroll position drives an AI video frame by frame: the reach stacker lifts the container onto the truck, then the truck drives off – with real spinning wheels cut from the video itself – and the services roll past as a horizontal track."},
 stack="index.html (single file) · vanilla JS · <video> scrubbing · <canvas> wheel cut-outs · CSS sticky · Anton / Archivo / JetBrains Mono",
 time={"de": "Video ca. 1 Std. · Build ca. 3–5 Std.", "en": "Video approx. 1 h · build approx. 3–5 h"},
 prompt="""ROLE
You are a senior front-end engineer specialised in scroll-driven storytelling. Build one production-quality index.html, vanilla JS, no libraries.

PROJECT
"KV – Fracht aus einer Hand", a German freight forwarder (air, sea, customs, warehousing, project cargo). Copy in German, bold and direct.
Feeling: industrial poster meets Apple product page. White studio, huge condensed type, one machine doing real work.

ART DIRECTION
- Fonts: "Anton" (headlines, uppercase, line-height .9), "Archivo" 400–600 (body/UI), "JetBrains Mono" (labels, 10–11px, letter-spacing .1em, uppercase).
- Fluid unit: --u: calc(min(100vw/1440, 100vh/960)). Every size is a multiple of var(--u).
- Colours: page #ffffff, ink #111111, road #111111. Container tints cycle per service: transparent → #2a55c8 → #a8553a → #2a7f70 → #b08a30 → #84405c.
- Motion easing for UI: cubic-bezier(.4,.05,.55,.95).

STRUCTURE
- .track (tall scroll container, height = (1 + A + B) × 100vh, A = 2.4) holding a sticky #scene (100vh).
- In #scene: the <video id="v"> positioned by JS (see layout), a road (#road, #lane) under the truck, 5 <canvas class="wheel">, a container tint overlay (#tc) + shadow (#sh), the horizontal #strip of service cards and a giant outlined word (#giant) behind it.

LAYOUT (recompute on resize)
- Landscape: video covers the scene (scale = max(vw/1920, vh/1080)), centred.
- Portrait/mobile: video width = 1.55 × vw, height = width × 9/16, left = vw/2 − .4·w, top = .36·vh − .448·h; use the vertical-friendly second video file.
- All overlays are placed in VIDEO-FRAME FRACTIONS: put(el, x0, y0, x1, y1) → left = l + x0·w etc. Container tint box ≈ (.1658, .2735) → (.5592, .3925). Wheel centres (fractions): (.2567,.4248) (.2948,.4248) (.3329,.4248) (.5059,.4248) (.6184,.4248), diameter .0316·w.
- Background: hard split – white above the road edge (t + .5h), #111 below.

SCROLL LOGIC
- Phase A (0 → A·vh): q = scrollY / (A·vh); target time = q × (duration − 1/48). Seek only when the previous seek finished ('seeked' guard) and |currentTime − target| > 1/60. Never call play().
- When q ≥ .94 and the video is at its last frame, set --ph:1 (truck is loaded, UI switches to "drive" mode).
- Phase B: r = (scrollY − A·vh)/(B·vh). Strip translateX = vw − r·(stripWidth + .45·vw); giant word moves faster: vw − r·(giantWidth + vw).
- Road + lane markings: background-position-x = −scrollY × 1.6 (feels like the truck drives).
- Wheels: each canvas draws the wheel region of the CURRENT video frame (drawImage with source rect around the wheel centre), clipped to a circle, rotated by scrollY × .55°. Real wheels, really spinning.
- Container tint index = 1 + floor(r × 5) – changes per service card.

COPY
Hero: "Alles für Ihre Fracht. Aus einer Hand." · Cards (Anton, line-broken on purpose): "Luft- fracht", "See- fracht", "Zoll- abfertigung", "Lager und Logistik", "Projekt- ladung" – each with a 2-line description and a mono label (e.g. "01 / AIR"). Nav: logo "KV", uppercase links, pill CTA "Angebot anfragen".
""" + COMMON_RULES + """
PROJECT-SPECIFIC
- devicePixelRatio for the wheel canvases capped at 2. Preload the poster image (<link rel="preload" as="image">).
- ?rec=1 URL flag: disables seeking logic so a screen recorder can play the video straight (for making reels).
- Reduced motion: show the last frame as an image and render the cards as a normal vertical list.

BUILD PHASES
1. Static layout + typography + cards (no video). → review
2. Video layout maths (landscape + portrait) + scrubbing with seeked guard. → review
3. Road, lane, wheels from video, container tint. → review
4. Horizontal strip + giant word + nav. → review
5. Mobile video, reduced motion, rec flag, performance. → review

ACCEPTANCE CHECKLIST
[ ] Scrubbing is smooth forwards AND backwards (no stutter on trackpad)   [ ] Wheels sit exactly on the video wheels at every viewport size
[ ] Tint box never leaves the container   [ ] Works on iPhone Safari (muted + playsinline)
I will give you: VIDEO_URL_DESKTOP (16:9), VIDEO_URL_MOBILE, POSTER_URL.""",
 blueprint={"de": ["Sticky Szene: Scroll steuert das Verlade-Video", "Truck fährt los: Straße, Fahrbahn, echte Räder bewegen sich mit", "Horizontale Leistungs-Strecke (5 Karten) + Riesen-Schriftzug", "Kontakt / Angebot + Footer"],
            "en": ["Sticky scene: scroll drives the loading video", "Truck drives off: road, lane, real wheels move with scroll", "Horizontal services track (5 cards) + giant word", "Contact / quote + footer"]},
 tokens="#ffffff · #111111 · tints #2a55c8 / #a8553a / #2a7f70 / #b08a30 / #84405c · Anton / Archivo / JetBrains Mono",
 workflow=[
  ({"de": "Startbild", "en": "Start frame"}, {"de": "Strenge Seitenansicht ist Pflicht – sonst passen die Räder später nicht.", "en": "Strict side view is mandatory – otherwise the wheels won't line up later."},
   "Photorealistic reach stacker (container handler) holding a blue 40ft shipping container, next to an empty flatbed semi-trailer truck, strict side view, orthographic feel, pure white seamless studio background, soft contact shadows, product photography, 16:9, high detail\nNegative: perspective angle, people, text, logos, ground texture, motion blur"),
  ({"de": "Bild → Video", "en": "Image → video"}, {"de": "Image-to-Video mit gesperrter Kamera, ca. 4 s.", "en": "Image-to-video with a locked camera, approx. 4 s."},
   "The reach stacker smoothly lowers the blue container onto the truck trailer and releases it, then backs away slightly. Camera completely static, no zoom, no pan. White studio background stays clean. Realistic heavy machinery motion, 4 seconds\nNegative: camera movement, cuts, extra vehicles, people"),
  ({"de": "Für Scrubbing kodieren", "en": "Encode for scrubbing"}, {"de": "Jedes Frame als Keyframe, sonst ruckelt Rückwärts-Scrollen.", "en": "Every frame a keyframe, otherwise scrolling backwards stutters."},
   "ffmpeg -i in.mp4 -an -c:v libx264 -g 1 -crf 22 -pix_fmt yuv420p -movflags +faststart desktop.mp4"),
  ({"de": "Rad-Koordinaten messen", "en": "Measure wheel coordinates"}, {"de": "Letztes Frame öffnen, Rad-Mittelpunkte als Bruchteile (x/Breite, y/Höhe) notieren und im Prompt ersetzen.", "en": "Open the last frame, note wheel centres as fractions (x/width, y/height) and replace them in the prompt."}, None),
  ({"de": "Build & Test", "en": "Build & test"}, {"de": "Prompt + URLs an den Agenten; testen mit Trackpad, Mausrad, iPhone.", "en": "Prompt + URLs to the agent; test with trackpad, mouse wheel, iPhone."}, None)]),

dict(key="Wendland-Bibliothek", nr="03",
 title={"de": "Wendland Bibliothek – Bucharchiv als gebogenes 3D-Regal", "en": "Wendland Library – a book archive as a curved 3D shelf"},
 what={"de": "36 Bücher stehen auf einem gebogenen Regal-Bogen, der sich mit Scroll und Drag dreht. Jedes Cover wird per Code generiert, jedes Buch öffnet eine Detailansicht mit Leseprobe, landet in einem 3D-Warenkorb und kann als PDF exportiert werden.",
       "en": "36 books stand on a curved shelf arc that rotates with scroll and drag. Every cover is generated in code, every book opens a detail view with a reading sample, drops into a 3D cart and can be exported as a PDF."},
 stack="React 19 · Vite · TypeScript · Tailwind v4 · motion · three.js (cart) · Vitest",
 time={"de": "Prototyp in Google AI Studio ca. 2 Std. · Feinschliff ca. 4–6 Std.", "en": "Prototype in Google AI Studio approx. 2 h · polish approx. 4–6 h"},
 prompt="""ROLE
You are a senior React/TypeScript engineer with a strong typographic eye. Build "Wendland Bibliothek" as a Vite + React 19 + TypeScript + Tailwind v4 app with unit-tested geometry.

PROJECT
A curated archive of classic German literature plus original works by the fictional author Elias Wendland. UI copy in German. Feeling: a quiet private library at dusk – paper, ink, lamp light. Zero gimmicks, all craft.

ART DIRECTION
- Paper #f3eee6 · ink #1d1a16 · muted #6b6359 · hairline #d9d1c4 · one accent, deep red #9c2a1f.
- Serif for titles (e.g. "Cormorant Garamond" 500/600), clean grotesk for UI ("Inter" 400/500). Generous whitespace, no drop shadows except the book lift.
- Motion: spring-based (motion library), stiffness ~170, damping ~26. Overlays fade+rise 24px in 420 ms.

THE ARC (src/utils/arcMath.ts – pure functions, fully unit-tested)
- computeArcParams(H, isMobile): book width ws = .15H, book height d = .667H, gap = .03H, arc radius U = H × (isMobile ? 1.15 : 1.45), perspective P, and the x-slot table XS.
- 36 slots on a closed ring. rel(v, s) returns the signed shortest distance on the 36-ring (range −18…+18).
- For each book: angle from rel(), x/z on the arc, perspective scale P/(P+z), depth blur and opacity falloff with distance from centre (B(r) easing that is linear inside |r|<1 and eases out beyond).
- Render only books with |rel| ≤ 8 (performance). Centre book lifts 12px, gets a soft spotlight gradient, title/author/year appear underneath.
- Input: wheel/trackpad (normalise deltas), pointer drag with inertia, arrow keys, click-to-centre. Snap to nearest book with a critically damped spring.

COVERS (src/components/BookArtwork.tsx)
- Generated typographic covers, no images: palette + ornament + type layout chosen by epoch (Barock, Aufklärung, Romantik, Realismus, Moderne, Wendland originals). Spine text vertical. Deterministic from the book id.

OVERLAYS
- DetailOverlay: large cover, metadata, blurb, formats, "In den Warenkorb", "Leseprobe".
- ReaderOverlay: paginated serif reading view, page-turn animation, progress bar, ESC to close, focus trap.
- PricingSheet: Hardcover / Taschenbuch / E-Book with prices.

3D CART (Cart3D.tsx + cartScene.ts)
- One small three.js canvas: added books become boxes with the generated cover as CanvasTexture and drop onto a stack with a spring. One key light + one fill, soft shadow plane.
- Checkout summary + utils/pdfGenerator.ts: builds a reading-list PDF in the browser (no server).

DATA: src/data/books.ts – 36 books {id, title, author, year, epoch, palette, blurb, price, sample}.
""" + COMMON_RULES + """
PROJECT-SPECIFIC
- Tests (Vitest) for arcMath: rel() wraps correctly, centre slot has scale 1, symmetric slots mirror, no NaN at H = 0.
- No API keys in the frontend. Reduced motion: arc becomes a flat horizontal list with the same data.

BUILD PHASES
1. Data + arcMath + tests (no UI). → review
2. Arc rendering + input + snapping. → review
3. Generated covers. → review
4. Detail, reader, pricing overlays. → review
5. 3D cart + PDF + accessibility + mobile. → review

ACCEPTANCE CHECKLIST
[ ] Trackpad, mouse wheel, drag and arrows all feel equally smooth   [ ] No book ever jumps when the ring wraps from 35 to 0
[ ] All tests green   [ ] Reader is fully keyboard-operable""",
 blueprint={"de": ["Header mit Suche + Epochen-Filter", "Gebogenes Bücher-Regal (Hauptbühne)", "Detail-Overlay + Formate/Preise", "Leseansicht mit Umblättern", "3D-Warenkorb + PDF-Export"],
            "en": ["Header with search + epoch filter", "Curved book arc (main stage)", "Detail overlay + formats/prices", "Reader with page turns", "3D cart + PDF export"]},
 tokens="#f3eee6 · #1d1a16 · #9c2a1f · Serif titles + Inter UI · springs 170/26",
 workflow=[
  ({"de": "Prototyp in Google AI Studio", "en": "Prototype in Google AI Studio"}, {"de": "Build-Modus, PROMPT einfügen, Phase 1–2 dort bauen und live testen.", "en": "Build mode, paste the PROMPT, build phases 1–2 there and test live."}, None),
  ({"de": "Export + lokal weiter", "en": "Export + continue locally"}, {"de": "Als ZIP/GitHub exportieren, npm install && npm run dev, Phasen 3–5 mit einem KI-Coding-Agenten.", "en": "Export as ZIP/GitHub, npm install && npm run dev, phases 3–5 with an AI coding agent."}, None),
  ({"de": "Optionale Cover-Texturen", "en": "Optional cover textures"}, {"de": "Für noch mehr Haptik: Papier-/Leinen-Texturen per KI, als Overlay mit multiply.", "en": "For extra tactility: AI paper/linen textures used as a multiply overlay."},
   "Seamless tileable texture of aged linen book cloth, warm off-white, subtle weave, soft even lighting, top-down, no shadows, 2048x2048\nNegative: text, folds, seams, vignette"),
  ({"de": "Tests + Deploy", "en": "Tests + deploy"}, {"de": "npx vitest, dann npm run build → Vercel/Netlify.", "en": "npx vitest, then npm run build → Vercel/Netlify."}, None)]),

dict(key="Runway", nr="04",
 title={"de": "Runway – Streetwear-Shop als Laufsteg-Karussell", "en": "Runway – a streetwear shop as a runway carousel"},
 what={"de": "Sechs komplette Looks stehen auf einem unsichtbaren Ring und drehen sich wie auf einem Laufsteg. Jedes Teil am Model ist anklickbar, Größe wählen, und der ganze Look wandert in die Styling-Bag.",
       "en": "Six complete looks stand on an invisible ring and rotate like a runway. Every piece on the model is clickable, pick a size, and the whole look goes into the styling bag."},
 stack="React 19 · Vite · TypeScript · Web Component <runway-section> · spring physics · CSS custom properties · Shopify-shaped data",
 time={"de": "Model-Cut-outs ca. 1–2 Std. · Build ca. 4–6 Std.", "en": "Model cut-outs approx. 1–2 h · build approx. 4–6 h"},
 prompt="""ROLE
You are a senior front-end engineer for premium e-commerce. Build a "Shop the look" runway section as a framework-agnostic Web Component (<runway-section>) mounted in a React 19 + Vite + TypeScript shell.

PROJECT
German streetwear brand. Headline "Sichere dir den Look." UI copy in German. Feeling: fashion-week backstage, white stage, nothing but the clothes.

ART DIRECTION (all themable via CSS custom properties on the section)
--rw-c-stage #ffffff · --rw-c-text #151413 · --rw-c-muted #66625c · --rw-c-accent #0e0e0e · --rw-c-line #c8c8c8 · --rw-card #DFDFDF
Headline 46px desktop / 24px mobile, weight 400; eyebrows 11/10px uppercase; buttons radius 0; size chips radius 30px; side panel 380px wide, padding 32px. Morph duration 900ms.

THE RING (src/utils/runwayMath.ts – pure, unit-tested)
- 6 looks on N = 12 slots. computeRingSlot(a, cur, W, H, fs, isMobile): centre x = .5W, ring radius R = (isMobile ? .72 : .62)·W, perspective P = (isMobile ? 1.9 : 1.65)·W. Returns x, y, scale, opacity, blur, z for each model.
- Front model: scale 1, sharp, full opacity. Back models: smaller, up to 6px blur, opacity down to .35, lower z-index.
- Input: normaliseWheelDelta (mouse vs trackpad vs line mode), computeWheelTarget, resolveWheelSnapTarget (snap to nearest look after 140 ms idle), shortestDelta / wrapN for wrap-around, pointer drag with velocity.
- Motion: stepSpring(cur, vel, target, dt, K = 95) – critically damped (C = 2√K), dt clamped to [0.001, 0.034], settle tolerance .0005.
- "Classic" mode toggle: models walk in from the side one after another (computeClassicSlot, per-body spring state).

HOTSPOTS + PRODUCT
- Numbered pins in % over each model image. Click → product card morphs out of the pin: name, vendor, price, size chips (disabled when variant unavailable), "In die Bag".
- Styling bag (src/utils/bagController.ts): tiny event-emitter store shared by the web component and React; side panel lists items with thumbnail, size selector, total, "Ganzen Look hinzufügen".

DATA (src/data/catalog.ts) – shaped like Shopify product JSON so it can later come from the Storefront API: LOOKS {model image, pins[{n, productId, left, top}]} and PRODUCTS {id, name, vendor, type, price, priceFormatted, image, sizes, variants[{id, available, options}], url}.
""" + COMMON_RULES + """
PROJECT-SPECIFIC
- Model images are transparent WebP, all aligned to the same foot line and height – the maths assumes it.
- Mobile: ring becomes a swipe carousel, bag becomes a bottom sheet with drag-to-close.
- Tests (Vitest): slot symmetry, wrap-around shortestDelta, snapping picks the nearest look, spring settles without overshoot.

BUILD PHASES
1. runwayMath + tests. → review
2. Web component + ring rendering + input + springs. → review
3. Hotspots + product morph. → review
4. Bag controller + side panel / bottom sheet. → review
5. Classic mode, theming, a11y, performance. → review

ACCEPTANCE CHECKLIST
[ ] One trackpad flick moves exactly one look   [ ] No model "jumps" at the wrap-around
[ ] Sizes that are sold out cannot be added   [ ] Re-skinning only the CSS variables changes the whole look""",
 blueprint={"de": ["Headline 'Sichere dir den Look.'", "Laufsteg-Ring mit 6 Looks", "Hotspots → Produkt-Karte", "Styling-Bag (Panel / Bottom-Sheet)", "Umschalter Ring ↔ Classic"],
            "en": ["Headline 'Sichere dir den Look.'", "Runway ring with 6 looks", "Hotspots → product card", "Styling bag (panel / bottom sheet)", "Ring ↔ Classic toggle"]},
 tokens="#ffffff · #151413 · #66625c · #DFDFDF · radius 0 / 30px · spring K = 95",
 workflow=[
  ({"de": "Looks erzeugen", "en": "Generate the looks"}, {"de": "Gleiche Pose, gleiche Brennweite, gleiche Fußlinie auf allen 6 Bildern.", "en": "Same pose, same focal length, same foot line on all 6 images."},
   "Full-body fashion photo of a model in an oversized streetwear outfit (boxy hoodie, wide cargo pants, chunky sneakers), standing straight, front view, arms relaxed, neutral expression, 85mm lens, even soft studio light, pure white background, feet fully visible, head-to-toe framing with 5% margin, 2:3\nNegative: crop, shadows on wall, props, text, logos, dynamic pose"),
  ({"de": "Freistellen + ausrichten", "en": "Cut out + align"}, {"de": "Hintergrund entfernen, transparente WebP, Höhe 1600 px, alle auf dieselbe Fußlinie zuschneiden.", "en": "Remove background, transparent WebP, 1600 px tall, crop all to the same foot line."}, None),
  ({"de": "Hotspots messen", "en": "Measure hotspots"}, {"de": "Pro Teil left/top in Prozent notieren → catalog.ts.", "en": "Note left/top in percent per piece → catalog.ts."}, None),
  ({"de": "Build + Shop", "en": "Build + shop"}, {"de": "PROMPT in AI Studio oder Claude Code; später echte Produkte über die Shopify Storefront API.", "en": "PROMPT in AI Studio or Claude Code; later real products via the Shopify Storefront API."}, None)]),

dict(key="Tiefenpfad", nr="05",
 title={"de": "Tiefenpfad – Höhlentouren-Website mit begehbarem 3D-Rundgang", "en": "Tiefenpfad – cave-tour website with a walkable 3D tour"},
 what={"de": "Eine Buchungsseite plus ein komplett im Code gebauter 3D-Rundgang: Die Kamera fliegt beim Scrollen vom Waldweg durch den Hohlweg in die Höhle, an Tropfsteinen vorbei bis zum unterirdischen See – mit Laternen, Staub im Licht und Bloom. Keine 3D-Modelle, alles prozedural.",
       "en": "A booking site plus a 3D tour built entirely in code: as you scroll, the camera flies from the forest path through a sunken lane into the cave, past stalactites to an underground lake – with lanterns, dust in the light and bloom. No 3D models, everything procedural."},
 stack="index.html (booking) + rundgang.html (3D) · three@0.170.0 · InstancedMesh · custom shaders · EffectComposer + UnrealBloomPass",
 time={"de": "Buchungsseite ca. 2 Std. · 3D-Rundgang ca. 8–12 Std. (iterativ)", "en": "Booking page approx. 2 h · 3D tour approx. 8–12 h (iterative)"},
 prompt="""ROLE
You are a senior WebGL artist-engineer (Three.js r170, GLSL, procedural modelling). Build a cinematic, scroll-driven 3D walk into a German show cave – entirely procedural, no model files – plus the booking page it sells.

PROJECT
"Tiefenpfad – Höhlentouren in Deutschland". German copy. Feeling: hushed, cool, awe. Hero line: "Unter DEUTSCHLAND beginnt die STILLE" (uppercase words set in a heavier cut).

ART DIRECTION
- 3D page palette: --fir #1F3A2E · --moss #5E7F4A · --mist #C9D6D2 · --granite #3B3F42 · --lantern #F2A65A · --snow #F4F2EC · --ink #0B0F0D
- Booking page palette: --bg #faf8f3 · --ink #1b1a17 · --soft #66625a · --line #e3dfd6 · --accent #b6531a · --dark #14120f
- Fonts: "Inter Tight" (UI) + "Instrument Serif" (display). Easing cubic-bezier(.2,.7,.2,1). Caption cards: backdrop-filter blur(18px).

RENDERER
PerspectiveCamera(50, aspect, .1, 1400) · ACESFilmicToneMapping, exposure animated per scene · FogExp2(0xaebcb2, .011) whose colour/density lerp per scene · EffectComposer → RenderPass → UnrealBloomPass (strength .3–.4, threshold 1.05–1.15 per scene) → OutputPass · pixel ratio min(devicePixelRatio, 1.5), drop to 1 if the measured fps < 45 for 2 s.

WORLD = ONE CAMERA PATH
- Camera keyframes along z: [6, −20, −48, −82, −112, −140, −168, −190, −225, −280, −322, −346, −372]; x from a gentle pathX(z) sine; y = terrain height + eye level outside, fixed ~1.72 inside the cave. Build a CatmullRomCurve3 through them.
- Scroll s ∈ [0,1] → smoothed u (damped). Position = curve.getPointAt(u); look target = getPointAt(u + .035). A "tilt" band early in the flight looks down into the gorge (look offset from .75 to −6.5), then levels out.
- Cursor: a small warm light on the ground follows the mouse with damping 1 − .94^(dt·60).

CHAPTERS (caption card per chapter, fades in/out by u)
Waldweg → Hohlweg → Eingang → Enge Stellen → Tropfsteine → Licht aus → Wenn etwas passiert → Am See.

BUILD THE WORLD AROUND THE PATH
- Terrain: plane displaced by fbm, denser vertices near the path. Valley ridges as layered silhouettes, each lighter than the one in front (aerial perspective).
- Shared PBR detail shader chunk (onBeforeCompile): world-space rock grain, moss on upward-facing normals (dot(n, up) > .6), baked glow via vertex colours.
- Vegetation: grass, ferns, heather as InstancedMesh with ONE wind vertex shader (uTime, sway grows with height, per-instance phase).
- Gorge: boulders (lumpy displaced icosahedrons, instanced), overhanging slabs, hanging roots.
- Entrance: mountain face + stone arch, ivy strands, backlight.
- Tunnel + hall as ONE carved tube along the path (TubeGeometry → vertex noise), glow baked per vertex.
- Formations: stalactites/stalagmites as instanced tapered cones with noise.
- "Licht aus": ambient → 0, only the lantern near the camera remains.
- Lake: reflective plane (low-res Reflector or screen-space trick) with slow ripples.
- Lanterns: many emissive lanterns, but only the TWO nearest to the camera are real PointLights (re-assigned every frame).
- Dust: points that catch light and stay around the camera. Sun rays (additive cones) only in the valley.
- Stream geometry in chunks: create a chunk when the camera is within 120 units, dispose it when 200 units behind.

BOOKING PAGE (index.html)
Hero + search (Höhle, Datum, Personen), tour cards (Bärenhöhle, Baumannshöhle, Dechenhöhle, Feengrotten, Teufelshöhle, Wimsener Höhle – photo, region, duration, price, "Buchen"), "Gehen Sie erst einmal digital hinein" (teaser that lazy-loads the 3D only on desktop without reduced-motion / save-data), "Ihre Tour, Schritt für Schritt", FAQ (Stornieren), B2B block "Sie führen selbst Gäste durch eine Höhle?". Final CTA: "Kommen Sie mit hinunter."
""" + COMMON_RULES + """
BUILD PHASES
1. Booking page complete (fast, static, real photos). → review
2. 3D: renderer + camera path + grey tube + scroll mapping + captions. Fly it. → review
3. Terrain, ridges, rock shader, boulders, gorge. → review
4. Entrance, tunnel/hall, formations, lantern system, dust, bloom, fog per scene. → review
5. Vegetation wind, lake, chunk streaming, fps fallback, mobile video fallback. → review

ACCEPTANCE CHECKLIST
[ ] The flight never clips through geometry   [ ] No visible pop when chunks load
[ ] "Licht aus" is genuinely dark but readable   [ ] ≥ 50 fps on a mid-range laptop at 1440p
[ ] UI text is visible before WebGL starts""",
 blueprint={"de": ["Buchung: Hero + Suche, Touren-Karten, Timeline, FAQ, B2B", "3D-Rundgang: 8 Kapitel entlang eines Kamerapfads", "Kapitel-Karten über dem 3D-Bild", "Abschluss-CTA zur Buchung"],
            "en": ["Booking: hero + search, tour cards, timeline, FAQ, B2B", "3D tour: 8 chapters along one camera path", "Chapter cards over the 3D view", "Final CTA back to booking"]},
 tokens="#1F3A2E · #5E7F4A · #C9D6D2 · #F2A65A · #0B0F0D · booking #faf8f3 / #b6531a · Inter Tight + Instrument Serif",
 workflow=[
  ({"de": "Fotos für die Buchungsseite", "en": "Photos for the booking page"}, {"de": "Pressefotos der Höhlen oder KI-Bilder (dann als Illustration kennzeichnen).", "en": "Press photos of the caves or AI images (then label them as illustrations)."},
   "Wide photo inside a German show cave, warm lantern light on wet limestone, stalactites and stalagmites, a narrow walkway with railing, cool blue shadows, cinematic, 16:9, high dynamic range\nNegative: people, text, fantasy elements, oversaturated colours"),
  ({"de": "Kamerapfad zuerst", "en": "Camera path first"}, {"de": "Erst nur Pfad + graue Röhre bauen lassen und durchscrollen. Erst wenn sich der Flug gut anfühlt, kommt die Welt dazu.", "en": "Have only the path + a grey tube built first and scroll through it. Add the world only once the flight feels right."}, None),
  ({"de": "Welt in Schichten", "en": "World in layers"}, {"de": "Ein Prompt pro Schicht (Gelände → Gestein → Tunnel → Formationen → Licht → Vegetation), nach jedem Schritt testen.", "en": "One prompt per layer (terrain → rock → tunnel → formations → light → vegetation), test after each step."}, None),
  ({"de": "Marketing-Material", "en": "Marketing footage"}, {"de": "Rundgang in 60 fps aufnehmen → Material für Reels, Ads und die Mobile-Version.", "en": "Record the tour at 60 fps → footage for reels, ads and the mobile fallback."}, None)]),

dict(key="Kernwald", nr="06",
 title={"de": "Kernwald – Cloud-Anbieter mit 3D-Flug in den Berg", "en": "Kernwald – a cloud provider with a 3D flight into the mountain"},
 what={"de": "Beim Scrollen fliegt die Kamera durch ein prozedurales Schwarzwald-Tal, eine Schlucht und einen Tunnel bis in eine leuchtende Serverhalle im Berg – das Markenversprechen „souverän wie der Berg“ wird erlebbar.",
       "en": "As you scroll, the camera flies through a procedural Black Forest valley, a gorge and a tunnel into a glowing server hall inside the mountain – the brand promise 'sovereign like the mountain' becomes an experience."},
 stack="index.html (single file) · three@0.170.0 · InstancedMesh · wind + rock shaders · UnrealBloomPass · procedural geometry",
 time={"de": "ca. 8–12 Std. (iterativ mit KI-Agent)", "en": "approx. 8–12 h (iterative with an AI agent)"},
 prompt="""ROLE
You are a senior WebGL artist-engineer. Build a single-file brand site whose scroll is a continuous 3D camera flight – procedural world, no model files – for a sovereign German cloud provider.

PROJECT
"Kernwald – Souveräne Cloud aus dem Schwarzwald". German copy. Story of the flight = the sales argument: nature (calm) → mountain (protection) → server hall inside the rock (your data, safe and fast).
Hero headline over the 3D: "Souverän WIE DER BERG – schnell wie die CLOUD" (mixed weights; uppercase words heavier).

ART DIRECTION
--fir #1F3A2E · --moss #5E7F4A · --mist #C9D6D2 · --granite #3B3F42 · --lantern #F2A65A · --snow #F4F2EC · --ink #0B0F0D
Fonts "Inter Tight" + "Instrument Serif". Glass cards: backdrop-filter blur(18px) / blur(14px) saturate(120%). Easing cubic-bezier(.2,.7,.2,1).

BOOT ORDER
UI first (HTML text, nav, sections render instantly), THEN WebGL fades in (canvas .on class). Expose window.__kw = {ready:true} after the first frame (useful for automated screenshots/recording).

RENDERER
PerspectiveCamera(50, aspect, .1, 1400) · ACES tone mapping, exposure per scene · FogExp2(0xaebcb2, .011) lerped per scene (valley mist → gorge green-grey 0x12251d → tunnel dark → hall cool) · EffectComposer + UnrealBloomPass (strength .3 → .4, threshold 1.05 → 1.15 as you enter the hall) + OutputPass · pixel ratio min(dpr, 1.5).

CAMERA FLIGHT
Keyframe z: [6, −20, −48, −82, −112, −140, −168, −190, −225, −280, −322, −346, −372]. Outside: y = terrain height + eye level; inside the tunnel (z < −185): y ≈ 1.72, rising to 2.5 in the hall (z < −330). CatmullRomCurve3 through the points; target = getPointAt(u + .035); early "tilt" band looks down into the gorge. Scroll → u with damping; cursor light on the ground (damping 1 − .94^(dt·60)).

WORLD (build around the path)
- Valley: fbm terrain denser near the path; layered ridges, each lighter than the one in front; sun rays only here.
- Shared rock/PBR chunk: world-space grain, moss on upward normals, baked vertex glow.
- Grass, ferns, heather: InstancedMesh + one wind shader.
- Gorge: boulders, overhanging slabs, hanging roots. Timber, rails and sleepers along the path; a water channel.
- Mountain face + stone arch, ivy at the entrance, entrance backlight.
- Logo object at the entrance: a hexagonal crystal with a fir tree cut through it (boolean-looking via two meshes + emissive edges), slowly rotating; its light breaks into dust particles that stay with the camera; fades out after s > .18.
- Tunnel + hall: ONE carved tube with baked glow. Hall: server racks as InstancedMesh with blinking LED strips (instanced attribute for phase), cold-white floor glow.
- Lanterns: only the 2 nearest are real lights.
- Stream geometry in chunks; pause rendering when the tab is hidden.

PAGE SECTIONS (glass cards floating over the flight, each tied to a flight segment)
"Kontrolle, im Kern." (data sovereignty, German data centres, ISO 27001 / BSI C5) · Products (Compute, Storage, Kubernetes) · "Standort" (map + facts) · Contact CTA.
""" + COMMON_RULES + """
BUILD PHASES
1. UI + sections + glass, no WebGL. → review
2. Renderer + path + grey box world + scroll/cursor mapping. → review
3. Valley, ridges, rock shader, vegetation wind. → review
4. Gorge, entrance, crystal logo, dust, tunnel. → review
5. Server hall, lantern system, fog/bloom per scene, streaming, fallbacks. → review

ACCEPTANCE CHECKLIST
[ ] Each section card appears exactly while its scene is on screen   [ ] Fog/colour transitions are seamless
[ ] ≥ 50 fps at 1440p on a mid-range laptop   [ ] Mobile / reduced motion get a still + normal page""",
 blueprint={"de": ["Hero mit Statement-Headline über dem 3D-Tal", "Scroll-Flug: Tal → Schlucht → Tunnel → Serverhalle", "Inhalts-Sektionen als Glas-Karten", "Standort + Kontakt"],
            "en": ["Hero with statement headline over the 3D valley", "Scroll flight: valley → gorge → tunnel → server hall", "Content sections as glass cards", "Location + contact"]},
 tokens="#1F3A2E · #5E7F4A · #C9D6D2 · #3B3F42 · #F2A65A · #F4F2EC · #0B0F0D · Inter Tight + Instrument Serif",
 workflow=[
  ({"de": "Story vor Code", "en": "Story before code"}, {"de": "Jede Szene = ein Verkaufsargument. Erst die 4–5 Szenen als Text festlegen.", "en": "Every scene = one sales argument. Write the 4–5 scenes as text first."}, None),
  ({"de": "Moodboard per KI", "en": "AI moodboard"}, {"de": "Ein Referenzbild pro Szene hilft dem Agenten bei Farben und Licht.", "en": "One reference image per scene helps the agent with colour and light."},
   "Cinematic still: misty Black Forest valley at dawn, dark fir trees, mossy granite boulders, a narrow gravel path leading toward a mountain with a glowing tunnel entrance, volumetric light rays, muted greens and warm lantern accents, 16:9\nNegative: people, text, buildings, oversaturated colours"),
  ({"de": "Graubox → Welt", "en": "Grey box → world"}, {"de": "Pfad + Graubox fliegen, dann Szene für Szene ausbauen (ein Prompt pro Szene).", "en": "Fly the path + grey box, then build scene by scene (one prompt per scene)."}, None),
  ({"de": "Aufnahme", "en": "Record"}, {"de": "Flug in 60 fps aufnehmen – Content für Wochen und Mobile-Fallback.", "en": "Record the flight at 60 fps – weeks of content and the mobile fallback."}, None)]),
]

L = {
 "de": dict(folder="Deutsch", kicker="Mind-Merit · 3D Motion Websites · Gratis-Workflow", tech="Technik", time="Aufwand",
            how="<b>So nutzt du diese Datei:</b> <b>1 PROMPT</b> komplett kopieren und in einen KI-Coding-Agenten (z. B. Claude Code, Cursor) oder Google AI Studio einfügen. Er ist ein vollständiges Build-Briefing: Art Direction, exakte Technik-Werte, Bau-Phasen mit Review-Stopps und eine Abnahme-Checkliste. Bewusst auf Englisch, weil die Modelle so am präzisesten bauen; die Website-Texte entstehen trotzdem auf Deutsch. <b>2 WEBSITE</b> zeigt den Aufbau. <b>3 3D-WORKFLOW</b> erklärt die Assets – inklusive fertiger Prompts für Bild-, 3D- und Video-KI.",
            p1="1 · PROMPT – komplettes Build-Briefing (copy &amp; paste)", p2="2 · WEBSITE – Aufbau", p3="3 · 3D-WORKFLOW – Schritt für Schritt",
            tok="Design-Tokens", step="Schritt", ap="Asset-Prompt", foot="Du willst so eine Website für dein Unternehmen? Schreib uns eine DM – <b>mind-merit.com</b>"),
 "en": dict(folder="English", kicker="Mind-Merit · 3D Motion Websites · Free workflow", tech="Tech", time="Effort",
            how="<b>How to use this file:</b> copy <b>1 PROMPT</b> in full into an AI coding agent (e.g. Claude Code, Cursor) or Google AI Studio. It is a complete build brief: art direction, exact technical values, build phases with review stops and an acceptance checklist. <b>2 WEBSITE</b> shows the structure. <b>3 3D-WORKFLOW</b> explains the assets – including ready-made prompts for image, 3D and video AI.",
            p1="1 · PROMPT – complete build brief (copy &amp; paste)", p2="2 · WEBSITE – structure", p3="3 · 3D-WORKFLOW – step by step",
            tok="Design tokens", step="Step", ap="Asset prompt", foot="Want a website like this for your business? Send us a DM – <b>mind-merit.com</b>"),
}

CSS = """@page{size:A4;margin:15mm 14mm}
body{font-family:'Poppins',system-ui,sans-serif;color:#1c1714;font-size:10.2pt;line-height:1.55;margin:0}
.cover{background:#121314;color:#f2ece4;border-radius:14px;padding:26px 28px;margin-bottom:16px;background-image:radial-gradient(ellipse at 88% 0%,rgba(249,108,4,.55),transparent 58%),radial-gradient(ellipse at 0% 100%,rgba(249,108,4,.28),transparent 55%)}
.cover .k{color:#F96C04;font-weight:600;letter-spacing:.12em;font-size:8.5pt;text-transform:uppercase}
.cover h1{font-size:19pt;line-height:1.22;margin:6px 0 10px}
.cover p{margin:4px 0;color:#e6ddd2}
h2{font-size:13.5pt;margin:20px 0 8px;color:#121314;border-left:4px solid #F96C04;padding-left:10px;break-after:avoid}
pre{background:#f7f3ee;border:1px solid #e9dfd3;border-radius:10px;padding:12px 14px;white-space:pre-wrap;font-family:'JetBrains Mono',Consolas,monospace;font-size:8.1pt;line-height:1.5}
.step{border:1px solid #eadfd2;border-radius:10px;padding:10px 14px;margin:8px 0;break-inside:avoid}
.step b{color:#c75400} .step pre{margin:8px 0 2px;font-size:7.9pt}
.ap{font-size:7.6pt;color:#8a7d70;text-transform:uppercase;letter-spacing:.08em;margin-top:6px}
.note{background:#fff4ea;border-radius:10px;padding:10px 14px;font-size:9.4pt}
.foot{margin-top:20px;font-size:9pt;color:#6b5f55;border-top:1px solid #eadfd2;padding-top:10px}"""

def html_for(s, lg):
    e = html.escape; T = L[lg]
    steps = ""
    for i, (h, d, ap) in enumerate(s["workflow"], 1):
        steps += f'<div class="step"><b>{T["step"]} {i} – {e(h[lg])}</b><br>{e(d[lg])}'
        if ap: steps += f'<div class="ap">{T["ap"]}</div><pre>{e(ap)}</pre>'
        steps += "</div>"
    bl = "".join(f"<li>{e(b)}</li>" for b in s["blueprint"][lg])
    return f"""<!doctype html><html lang="{lg}"><head><meta charset="utf-8"><title>{e(s['key'])} – Workflow</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet"><style>{CSS}</style></head><body>
<div class="cover"><div class="k">{T['kicker']}</div><h1>{e(s['title'][lg])}</h1>
<p>{e(s['what'][lg])}</p><p><b>{T['tech']}:</b> {e(s['stack'])}</p><p><b>{T['time']}:</b> {e(s['time'][lg])}</p></div>
<div class="note">{T['how']}</div>
<h2>{T['p1']}</h2><pre>{e(s['prompt'].strip())}</pre>
<h2>{T['p2']}</h2><ol>{bl}</ol><p><b>{T['tok']}:</b> {e(s['tokens'])}</p>
<h2>{T['p3']}</h2>{steps}
<div class="foot">{T['foot']}</div></body></html>"""

def md_for(s, lg):
    T = L[lg]; out = [f"# {s['title'][lg]}", "", s["what"][lg], "", f"**{T['tech']}:** {s['stack']}  ", f"**{T['time']}:** {s['time'][lg]}", "",
                      "## " + T["p1"].replace("&amp;", "&"), "", "```text", s["prompt"].strip(), "```", "", "## " + T["p2"], ""]
    out += [f"{i}. {b}" for i, b in enumerate(s["blueprint"][lg], 1)] + ["", f"**{T['tok']}:** {s['tokens']}", "", "## " + T["p3"], ""]
    for i, (h, d, ap) in enumerate(s["workflow"], 1):
        out += [f"**{T['step']} {i} – {h[lg]}**  ", d[lg], ""]
        if ap: out += ["```text", ap, "```", ""]
    return "\n".join(out)

def pdf(src, dst):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={dst}", "--virtual-time-budget=4000",
                    "file:///" + src.replace("\\", "/")], check=True, capture_output=True)

if __name__ == "__main__":
    for lg in ("de", "en"):
        d = os.path.join(OUT, L[lg]["folder"]); os.makedirs(d, exist_ok=True)
        for s in SITES:
            base = os.path.join(d, f"{s['nr']}_{s['key']}_Workflow{'_EN' if lg == 'en' else ''}")
            open(base + ".md", "w", encoding="utf-8").write(md_for(s, lg))
            open(base + ".html", "w", encoding="utf-8").write(html_for(s, lg))
            pdf(base + ".html", base + ".pdf"); os.remove(base + ".html"); print("ok", lg, s["key"])
