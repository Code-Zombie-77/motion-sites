import React, { useEffect, useRef, useState } from 'react';
import { BOOKS, BookEntry, SHEET } from './data/books';
import {
  ArcParams,
  bookHash,
  computeArcParams,
  computeBookFrame,
  findNearestBookTarget,
  interpolateTimelineYear,
  rel,
  smoothstep,
  yearToTimelineLeft,
} from './utils/arcMath';
import { BookCoverArtwork, BookSpineArtwork, bookMaterial } from './components/BookArtwork';
import { Cart3D, CartHandle, CartIcon } from './components/Cart3D';
import { DetailOverlay } from './components/DetailOverlay';
import { ReaderOverlay } from './components/ReaderOverlay';
import { PricingSheet } from './components/PricingSheet';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

// Approximate cubic-bezier(.45,.05,.25,1) for leaf riffle
function easeLeafRiffle(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.45 ? 1.8 * c * c : 1 - Math.pow(1 - c, 2.6) * 0.9;
}

// Approximate cubic-bezier(.76,0,.18,1) for leaf stack lift-off
function easeInOutQuart(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 8 * c * c * c * c : 1 - Math.pow(-2 * c + 2, 4) / 2;
}

export default function App() {
  const probeRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLElement>(null);
  const preiseBtnRef = useRef<HTMLButtonElement>(null);
  const readRingRef = useRef<HTMLButtonElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);
  const timelineDotRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  const titleMaskRef = useRef<HTMLDivElement>(null);
  const authorMaskRef = useRef<HTMLDivElement>(null);
  const yearMaskRef = useRef<HTMLDivElement>(null);

  const leafStackRef = useRef<HTMLDivElement>(null);
  const leafElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const leafShadeRef = useRef<(HTMLDivElement | null)[]>([]);

  const bookElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const spineElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const coverElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const backElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const topElsRef = useRef<(HTMLDivElement | null)[]>([]);

  const cartRef = useRef<CartHandle>(null);
  const addRingRef = useRef<HTMLButtonElement>(null);
  const introBookRef = useRef<HTMLDivElement>(null);
  const contactElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 767 : false
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [sheetsLoaded, setSheetsLoaded] = useState<Record<string, boolean>>({});
  const [leafStackMounted, setLeafStackMounted] = useState(() => {
    if (typeof window === 'undefined') return true;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const auto = new URLSearchParams(window.location.search).get('autostart') === '1';
    return !rm && !auto;
  });

  const [activeBookIndex, setActiveBookIndex] = useState(5); // Starts on index 5 (Die Verwandlung)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCoverRect, setDetailCoverRect] = useState<DOMRect | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerOriginRect, setReaderOriginRect] = useState<DOMRect | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingOriginRect, setPricingOriginRect] = useState<DOMRect | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mutable animation state inside single requestAnimationFrame loop
  const stateRef = useRef({
    s: 17, // 5 + 12
    T: 17,
    activeIdx: 5,
    hoveredV: -1,
    hoveredBtn: false,
    lifts: new Float32Array(36),
    dragging: false,
    dragStartX: 0,
    dragStartT: 17,
    dragMoved: false,
    mx: typeof window !== 'undefined' ? window.innerWidth / 2 : 720,
    my: typeof window !== 'undefined' ? window.innerHeight * 0.41 : 360,
    cx: typeof window !== 'undefined' ? window.innerWidth / 2 : 720,
    cy: typeof window !== 'undefined' ? window.innerHeight * 0.41 : 360,
    tiltX: 0,
    tiltY: 0,
    dotLeft: yearToTimelineLeft(1915),
    revealStart: -1,
    revealSkipped: false,
    captionRevealed: false,
    timelineRevealed: false,
    params: computeArcParams(380, false),
    introPlaced: false,
  });

  // Preload sheets as Image() objects on start
  useEffect(() => {
    Object.entries(SHEET).forEach(([id, [url]]) => {
      if (url && !url.startsWith('PASTE_')) {
        const img = new Image();
        img.onload = () => setSheetsLoaded((prev) => ({ ...prev, [id]: true }));
        img.src = url;
      }
    });
  }, []);

  // Measure H with probe element and update ArcParams on resize
  useEffect(() => {
    const updateMeasurements = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      const probeH = probeRef.current?.getBoundingClientRect().height || 360;
      stateRef.current.params = computeArcParams(probeH, mobile);
    };
    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onMq);

    return () => {
      window.removeEventListener('resize', updateMeasurements);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  // Helper to swap caption with WAAPI mask slide
  const swapCaption = (book: BookEntry, dir: number, instant = false) => {
    const masks: [HTMLDivElement | null, string][] = [
      [titleMaskRef.current, book.title],
      [authorMaskRef.current, book.author.toUpperCase()],
      [yearMaskRef.current, `${book.year} — ${book.genre.toUpperCase()}`],
    ];

    const signDir = dir === 0 ? 1 : Math.sign(dir);

    masks.forEach(([mask, text], idx) => {
      if (!mask) return;
      const oldSpans = Array.from(mask.querySelectorAll('span'));
      const newSpan = document.createElement('span');
      newSpan.textContent = text;
      newSpan.className = 'block w-full text-center';
      mask.appendChild(newSpan);

      if (instant || reducedMotion) {
        oldSpans.forEach((s) => s.remove());
        newSpan.style.transform = 'translateY(0%)';
        return;
      }

      // Old text fades out of flow first; new text arrives after it, so lines never overlap
      oldSpans.forEach((old, n) => {
        if (n < oldSpans.length - 1) {
          old.remove();
          return;
        }
        old.getAnimations().forEach((a) => a.cancel());
        old.style.position = 'absolute';
        old.style.left = '0';
        old.style.right = '0';
        old.style.top = '0';
        const anim = old.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: `translateY(${-signDir * 14}px)`, opacity: 0 },
          ],
          { duration: 170, easing: 'ease-in', fill: 'both' }
        );
        anim.onfinish = () => old.remove();
      });

      newSpan.animate(
        [
          { transform: `translateY(${signDir * 16}px)`, opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 420, delay: 170 + idx * 30, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
      );
    });
  };

  // Skip reveal helper (on click or key press during reveal, or reducedMotion)
  const skipRevealToEnd = () => {
    const st = stateRef.current;
    if (st.revealSkipped) return;
    st.revealSkipped = true;
    st.captionRevealed = true;
    st.timelineRevealed = true;
    setLeafStackMounted(false);

    if (topBarRef.current) {
      topBarRef.current.getAnimations().forEach((a) => a.cancel());
      topBarRef.current.style.transform = 'translateY(0%)';
    }
    [titleMaskRef.current, authorMaskRef.current, yearMaskRef.current].forEach((m) => {
      const sp = m?.querySelector('span');
      if (sp) {
        sp.getAnimations().forEach((a) => a.cancel());
        sp.style.transform = 'translateY(0%)';
      }
    });
    if (timelineLineRef.current) {
      timelineLineRef.current.getAnimations().forEach((a) => a.cancel());
      timelineLineRef.current.style.transform = 'scaleX(1)';
    }
    if (timelineDotRef.current) {
      timelineDotRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  };

  // Main requestAnimationFrame loop
  useEffect(() => {
    const st = stateRef.current;
    const auto = new URLSearchParams(window.location.search).get('autostart') === '1';
    if (reducedMotion || auto) {
      skipRevealToEnd();
    } else {
      // Set initial hidden states for reveal
      if (topBarRef.current) {
        topBarRef.current.style.transform = 'translateY(-100%)';
      }
      [titleMaskRef.current, authorMaskRef.current, yearMaskRef.current].forEach((m) => {
        const sp = m?.querySelector('span');
        if (sp) sp.style.transform = 'translateY(110%)';
      });
      if (timelineLineRef.current) {
        timelineLineRef.current.style.transform = 'scaleX(0)';
      }
      if (timelineDotRef.current) {
        timelineDotRef.current.style.transform = 'translate(-50%, -50%) scale(0)';
      }
    }

    let rafId = 0;
    let lastTime = performance.now();

    const years = BOOKS.map((b) => b.year);

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (st.revealStart < 0) st.revealStart = now;
      const elapsed = now - st.revealStart;

      const { H, ws, d, U } = st.params;
      const W = window.innerWidth;
      const VH = window.innerHeight;
      const shelfCy = VH * (isMobile ? 0.43 : 0.41);
      const anySheetOpen = detailOpen || readerOpen || pricingOpen || mobileMenuOpen;

      // 1. Page-flap reveal timeline
      const numLeaves = isMobile ? 24 : 40;
      if (!st.revealSkipped && !reducedMotion) {
        // 300-1780ms: cover opens, leaves riffle; 1800-2300ms: book closes; 2300-2700ms: it lands on the shelf
        if (elapsed < 2700 && leafStackRef.current) {
          // Build the intro book on the exact screen rect of the placed shelf book
          if (!st.introPlaced && introBookRef.current) {
            st.introPlaced = true;
            const r0 = 17 - st.s;
            const fr = computeBookFrame(r0, 0, 1, 0, 0, st.params);
            const b5 = BOOKS[5];
            const hi5 = H * (1 + 0.03 * bookHash(b5.id));
            const persp = 1400 / (1400 - fr.z - ws / 2);
            const lw = d * persp;
            const lh = hi5 * persp;
            const stack = leafStackRef.current;
            stack.style.setProperty('--lw', `${lw.toFixed(1)}px`);
            stack.style.setProperty('--lh', `${lh.toFixed(1)}px`);
            stack.style.setProperty('--shade', fr.coverShade.toFixed(3));
            stack.style.perspectiveOrigin = `50% ${shelfCy.toFixed(1)}px`;
            introBookRef.current.style.left = `${(W / 2 + fr.x * persp - lw / 2).toFixed(1)}px`;
            introBookRef.current.style.top = `${(shelfCy + (fr.y + (H - hi5) / 2) * persp - lh / 2).toFixed(1)}px`;
          }
          const closeP = easeInOutQuart((elapsed - 1800) / 500);
          for (let i = 0; i < numLeaves; i++) {
            const leafEl = leafElsRef.current[i];
            if (!leafEl) continue;
            const p = (elapsed - (300 + i * 22)) / 620;
            if (elapsed >= 1800) {
              const aDeg = -180 * (1 - closeP);
              leafEl.style.transform = `rotateY(${aDeg.toFixed(2)}deg)`;
              leafEl.style.zIndex = String(aDeg < -90 ? 10 + i : 100 - i);
            } else if (p <= 0) {
              leafEl.style.transform = 'rotateY(0deg)';
              leafEl.style.zIndex = String(100 - i);
            } else if (p >= 1) {
              leafEl.style.transform = 'rotateY(-180deg)';
              leafEl.style.zIndex = String(10 + i);
              if (leafShadeRef.current[i]) leafShadeRef.current[i]!.style.opacity = '0';
            } else {
              const aDeg = -180 * easeLeafRiffle(p);
              const sinA = Math.sin((Math.abs(aDeg) * Math.PI) / 180);
              leafEl.style.transform = `translateZ(${(sinA * H * 0.12).toFixed(1)}px) rotateY(${aDeg.toFixed(2)}deg) rotateZ(${(sinA * 1.5).toFixed(2)}deg) skewY(${(sinA * -3).toFixed(2)}deg)`;
              leafEl.style.zIndex = String(200 + i);
              if (leafShadeRef.current[i]) leafShadeRef.current[i]!.style.opacity = (sinA * 0.35).toFixed(3);
            }
          }

        } else if (elapsed >= 2700 && leafStackMounted) {
          setLeafStackMounted(false);
        }

        // 2300ms: Caption lines slide up in their masks (650, staggered 70) and top bar slides down
        if (elapsed >= 2500 && !st.captionRevealed) {
          st.captionRevealed = true;
          if (topBarRef.current) {
            topBarRef.current.animate(
              [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0%)' }],
              { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
            );
          }
          [titleMaskRef.current, authorMaskRef.current, yearMaskRef.current].forEach((m, idx) => {
            const sp = m?.querySelector('span');
            if (sp) {
              sp.animate(
                [{ transform: 'translateY(105%)' }, { transform: 'translateY(0%)' }],
                {
                  duration: 650,
                  delay: idx * 70,
                  easing: 'cubic-bezier(.2,.8,.2,1)',
                  fill: 'both',
                }
              );
            }
          });
        }

        // 2600ms: Timeline line draws from the left (scaleX 0 to 1 over 900) and dot lands
        if (elapsed >= 2650 && !st.timelineRevealed) {
          st.timelineRevealed = true;
          if (timelineLineRef.current) {
            timelineLineRef.current.animate(
              [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
              { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
            );
          }
          if (timelineDotRef.current) {
            timelineDotRef.current.animate(
              [
                { transform: 'translate(-50%, -50%) scale(0)' },
                { transform: 'translate(-50%, -50%) scale(1)' },
              ],
              { duration: 500, delay: 300, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
            );
          }
        }

        if (elapsed >= 3700) {
          st.revealSkipped = true;
        }
      }

      // 2. Spring physics: s += (T - s) * (1 - e^(-k * dt))
      if (reducedMotion) {
        st.s = st.T;
      } else {
        const kSpring = st.dragging ? 18 : 5.2;
        st.s += (st.T - st.s) * (1 - Math.exp(-kSpring * dt));
      }

      // When s passes ±4 loops, shift s and T by whole loops (a loop is 12 books)
      if (Math.abs(st.s) > 48) {
        const loops = Math.trunc(st.s / 12);
        st.s -= loops * 12;
        st.T -= loops * 12;
      }

      // Active book: round(s) mod 12. On change, swap the caption with dir = sign(T - s)
      const currentIdx = ((Math.round(st.s) % 12) + 12) % 12;
      if (currentIdx !== st.activeIdx) {
        const dir = Math.sign(st.T - st.s) || 1;
        st.activeIdx = currentIdx;
        setActiveBookIndex(currentIdx);
        swapCaption(BOOKS[currentIdx], dir, reducedMotion);
      }

      // 3. Cover tilt
      const settled = Math.abs(st.T - st.s) < 0.3;
      const onCover =
        !anySheetOpen &&
        settled &&
        Math.abs(st.mx - W / 2) <= 0.55 * d &&
        Math.abs(st.my - shelfCy) <= 0.55 * H;

      const targetTiltY = anySheetOpen
        ? 0
        : onCover
          ? ((st.mx - W / 2) / (0.55 * d)) * 8
          : ((st.mx - W / 2) / W) * 4;
      const targetTiltX = anySheetOpen
        ? 0
        : onCover
          ? -((st.my - shelfCy) / (H / 2)) * 5
          : 0;

      const tiltEase = reducedMotion ? 1 : 1 - Math.exp(-7 * dt);
      st.tiltY += (targetTiltY - st.tiltY) * tiltEase;
      st.tiltX += (targetTiltX - st.tiltX) * tiltEase;

      // 4. Per book, every frame (36 virtual books)
      for (let v = 0; v < 36; v++) {
        const bookEl = bookElsRef.current[v];
        if (!bookEl) continue;

        const r = rel(v, st.s);
        const bookData = BOOKS[v % 12];
        const hi = H * (1 + 0.03 * bookHash(bookData.id));
        const yBottomAlign = (H - hi) / 2;

        // Hover lift: a hovered non-active book (|r| > .5) eases its lift to 1 at 1 - e^(-12dt)
        const wantLift = !anySheetOpen && st.hoveredV === v && Math.abs(r) > 0.5 ? 1 : 0;
        if (reducedMotion) {
          st.lifts[v] = wantLift;
        } else {
          st.lifts[v] += (wantLift - st.lifts[v]) * (1 - Math.exp(-12 * dt));
        }

        // Entrance rise (1100 - 2900ms: ent goes 0 to 1 over 900ms starting at 1100 + |r|*65)
        let ent = 1;
        if (!st.revealSkipped && !reducedMotion) {
          const bookStart = 2350 + Math.min(Math.abs(r), 10) * 40;
          ent = easeOutCubic((elapsed - bookStart) / 900);
        }

        const bf = computeBookFrame(r, st.lifts[v], ent, st.tiltX, st.tiltY, st.params);
        if (!bf.visible) {
          bookEl.style.display = 'none';
          if (contactElsRef.current[v]) contactElsRef.current[v]!.style.display = 'none';
          continue;
        }

        bookEl.style.display = 'block';
        const introHidden = !st.revealSkipped && (v === 17 ? elapsed < 2700 : ent <= 0);
        bookEl.style.visibility = introHidden ? 'hidden' : 'visible';
        const contact = contactElsRef.current[v];
        if (contact) {
          const persp = 1400 / Math.max(200, 1400 - bf.z);
          const rad = (bf.rotateY * Math.PI) / 180;
          const footprint = (ws * Math.abs(Math.cos(rad)) + d * Math.abs(Math.sin(rad))) * persp;
          const fw = footprint * 1.5;
          const fh = H * 0.12 * persp;
          const sx = W / 2 + bf.x * persp;
          const sy = shelfCy + (bf.y + yBottomAlign + hi / 2) * persp;
          contact.style.display = 'block';
          contact.style.width = `${fw.toFixed(1)}px`;
          contact.style.height = `${fh.toFixed(1)}px`;
          contact.style.transform = `translate3d(${(sx - fw / 2).toFixed(1)}px, ${(sy - fh / 2).toFixed(1)}px, 0)`;
          contact.style.opacity = introHidden ? '0' : String(Math.min(1, ent));
        }
        bookEl.style.setProperty('--ws', ws.toFixed(1));
        bookEl.style.setProperty('--d', d.toFixed(1));
        bookEl.style.setProperty('--hi', hi.toFixed(1));
        bookEl.style.zIndex = String(bf.zIndex);
        bookEl.style.willChange = Math.abs(r) < 0.6 ? 'transform' : 'auto';
        bookEl.style.transform = `translate3d(${bf.x.toFixed(2)}px, ${(bf.y + yBottomAlign).toFixed(2)}px, ${bf.z.toFixed(2)}px) rotateX(${bf.rotateX.toFixed(2)}deg) rotateY(${bf.rotateY.toFixed(2)}deg)`;

        // Update dimensions & --shade on faces
        const sp = spineElsRef.current[v];
        if (sp) {
          sp.style.width = `${ws.toFixed(1)}px`;
          sp.style.height = `${hi.toFixed(1)}px`;
          sp.style.top = `${(-hi / 2).toFixed(1)}px`;
          sp.style.left = `${(-ws / 2).toFixed(1)}px`;
          sp.style.transform = `translateZ(${(d / 2).toFixed(1)}px)`;
          sp.style.setProperty('--shade', bf.spineShade.toFixed(3));
        }

        const cv = coverElsRef.current[v];
        if (cv) {
          cv.style.width = `${d.toFixed(1)}px`;
          cv.style.height = `${hi.toFixed(1)}px`;
          cv.style.top = `${(-hi / 2).toFixed(1)}px`;
          cv.style.left = `${(-d / 2).toFixed(1)}px`;
          cv.style.transform = `rotateY(90deg) translateZ(${(ws / 2).toFixed(1)}px)`;
          cv.style.setProperty('--shade', bf.coverShade.toFixed(3));
          if (Math.abs(r) < 1) {
            cv.style.setProperty('--glx', `${(45 + st.tiltY * 6).toFixed(1)}%`);
            cv.style.setProperty('--gly', `${(28 - st.tiltX * 7).toFixed(1)}%`);
          }
        }

        const bk = backElsRef.current[v];
        if (bk) {
          bk.style.width = `${d.toFixed(1)}px`;
          bk.style.height = `${hi.toFixed(1)}px`;
          bk.style.top = `${(-hi / 2).toFixed(1)}px`;
          bk.style.left = `${(-d / 2).toFixed(1)}px`;
          bk.style.transform = `rotateY(-90deg) translateZ(${(ws / 2).toFixed(1)}px)`;
          bk.style.setProperty('--shade', bf.backShade.toFixed(3));
        }

        const tp = topElsRef.current[v];
        if (tp) {
          tp.style.width = `${ws.toFixed(1)}px`;
          tp.style.height = `${d.toFixed(1)}px`;
          tp.style.top = `${(-hi / 2 - d / 2).toFixed(1)}px`;
          tp.style.left = `${(-ws / 2).toFixed(1)}px`;
          tp.style.transform = 'rotateX(90deg)';
          tp.style.setProperty('--shade', bf.topShade.toFixed(3));
        }
      }

      // 5. Read ring position and scale
      if (readRingRef.current) {
        const ringLeft = W / 2 - d / 2 - 6;
        const ringTop = shelfCy + 0.36 * H;
        const ringScale =
          anySheetOpen || (!st.revealSkipped && elapsed < 2650)
            ? 0
            : smoothstep(Math.max(0, 1 - Math.abs(st.T - st.s) * 3));
        readRingRef.current.style.left = `${ringLeft.toFixed(1)}px`;
        readRingRef.current.style.top = `${ringTop.toFixed(1)}px`;
        readRingRef.current.style.transform = `translate(-50%, -50%) scale(${ringScale.toFixed(3)})`;
        readRingRef.current.style.pointerEvents = ringScale > 0.5 ? 'auto' : 'none';
        if (addRingRef.current) {
          addRingRef.current.style.left = `${(W / 2 + d / 2 + 6).toFixed(1)}px`;
          addRingRef.current.style.top = `${ringTop.toFixed(1)}px`;
          addRingRef.current.style.transform = `translate(-50%, -50%) scale(${ringScale.toFixed(3)})`;
          addRingRef.current.style.pointerEvents = ringScale > 0.5 ? 'auto' : 'none';
        }
      }

      // 6. Timeline dot interpolation
      if (timelineDotRef.current) {
        const interpYear = interpolateTimelineYear(st.s, years);
        const targetLeft = yearToTimelineLeft(interpYear);
        const yearJump = Math.abs(targetLeft - st.dotLeft) * 260;
        if (reducedMotion || yearJump > 45) {
          st.dotLeft = targetLeft;
        } else {
          st.dotLeft += (targetLeft - st.dotLeft) * (1 - Math.exp(-14 * dt));
        }
        timelineDotRef.current.style.left = `${(st.dotLeft * 100).toFixed(3)}%`;
      }

      // 7. Custom cursor (1 - e^(-16dt) smoothing)
      if (cursorRef.current && !isMobile) {
        const cEase = reducedMotion ? 1 : 1 - Math.exp(-16 * dt);
        st.cx += (st.mx - st.cx) * cEase;
        st.cy += (st.my - st.cy) * cEase;
        cursorRef.current.style.transform = `translate3d(${(st.cx - 29).toFixed(1)}px, ${(st.cy - 29).toFixed(1)}px, 0)`;

        // Determine cursor state: .open, .spine, .btn, or default
        const isOverActiveCover =
          !anySheetOpen &&
          settled &&
          (st.hoveredV >= 0
            ? Math.abs(rel(st.hoveredV, st.s)) < 0.5
            : onCover);
        const isOverOtherSpine =
          !anySheetOpen && st.hoveredV >= 0 && Math.abs(rel(st.hoveredV, st.s)) >= 0.5;

        if (cursorRingRef.current && cursorDotRef.current && cursorLabelRef.current) {
          if (st.hoveredBtn) {
            cursorRingRef.current.style.transform = 'scale(0.55)';
            cursorRingRef.current.style.backgroundColor = 'transparent';
            cursorRingRef.current.style.borderColor = '#141414';
            cursorDotRef.current.style.transform = 'scale(0)';
            cursorLabelRef.current.style.opacity = '0';
          } else if (isOverActiveCover) {
            cursorRingRef.current.style.transform = 'scale(1.75)';
            cursorRingRef.current.style.backgroundColor = '#8B1E2D';
            cursorRingRef.current.style.borderColor = '#8B1E2D';
            cursorDotRef.current.style.transform = 'scale(0)';
            cursorLabelRef.current.style.opacity = '1';
          } else if (isOverOtherSpine) {
            cursorRingRef.current.style.transform = 'scale(0.72)';
            cursorRingRef.current.style.backgroundColor = 'transparent';
            cursorRingRef.current.style.borderColor = '#141414';
            cursorDotRef.current.style.transform = 'scale(1)';
            cursorLabelRef.current.style.opacity = '0';
          } else {
            cursorRingRef.current.style.transform = 'scale(1)';
            cursorRingRef.current.style.backgroundColor = 'transparent';
            cursorRingRef.current.style.borderColor = '#141414';
            cursorDotRef.current.style.transform = 'scale(1)';
            cursorLabelRef.current.style.opacity = '0';
          }
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [isMobile, reducedMotion, detailOpen, readerOpen, pricingOpen, mobileMenuOpen, leafStackMounted]);

  // Global mousemove, wheel, and keyboard listeners
  useEffect(() => {
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    const onMouseMove = (e: MouseEvent) => {
      const st = stateRef.current;
      st.mx = e.clientX;
      st.my = e.clientY;
      const hit = (e.target as Element | null)?.closest?.('[data-v]') as HTMLElement | null;
      const hv = hit ? Number(hit.dataset.v) : -1;
      st.hoveredV = hv;
      if (st.dragging) {
        const dx = e.clientX - st.dragStartX;
        if (Math.abs(dx) > 5) {
          st.dragMoved = true;
          const { ws, gap } = st.params;
          st.T = st.dragStartT - dx / (ws + gap);
        }
      }
    };

    const onMouseUp = () => {
      const st = stateRef.current;
      if (st.dragging) {
        st.dragging = false;
        if (st.dragMoved) {
          st.T = Math.round(st.T);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      const st = stateRef.current;
      if (!st.revealSkipped) skipRevealToEnd();
      if (detailOpen || readerOpen || pricingOpen || mobileMenuOpen) return;
      if ((e.target as Element | null)?.closest?.('[data-cart]')) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const { ws, gap } = st.params;
      st.T += (delta / (ws + gap)) * 0.5;
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        st.T = Math.round(st.T);
      }, 160);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (!st.revealSkipped) {
        skipRevealToEnd();
      }
      if (detailOpen || readerOpen || pricingOpen || mobileMenuOpen) {
        if (e.key === 'Escape') {
          setPricingOpen(false);
          setMobileMenuOpen(false);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        st.T = Math.round(st.T) + 1;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        st.T = Math.round(st.T) - 1;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openActiveDetail();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [detailOpen, readerOpen, pricingOpen, mobileMenuOpen]);

  // Helper to read active book's cover rect
  const getActiveCoverRect = (): DOMRect | null => {
    const st = stateRef.current;
    const snapV = ((Math.round(st.s) % 36) + 36) % 36;
    const coverEl = coverElsRef.current[snapV];
    return coverEl ? coverEl.getBoundingClientRect() : null;
  };

  // Open detail for active book
  const openActiveDetail = () => {
    const st = stateRef.current;
    st.T = Math.round(st.s);
    const rect = getActiveCoverRect();
    setDetailCoverRect(rect);
    setDetailOpen(true);
  };

  // Handle clicking on a virtual book v
  const handleBookClick = (v: number) => {
    const st = stateRef.current;
    if (!st.revealSkipped) {
      skipRevealToEnd();
      return;
    }
    if (st.dragMoved) return;
    const r = rel(v, st.s);
    if (Math.abs(r) < 0.45) {
      openActiveDetail();
    } else {
      st.T = Math.round(st.T + r);
    }
  };

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (!st.revealSkipped) skipRevealToEnd();
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickedYear = 1770 + ratio * 260;
    const years = BOOKS.map((b) => b.year);
    st.T = findNearestBookTarget(st.T, clickedYear, years);
  };

  // Close any open book view and send the active book to the cart
  const addActiveToCart = () => {
    const rect = getActiveCoverRect();
    setDetailOpen(false);
    setReaderOpen(false);
    cartRef.current?.add(BOOKS[stateRef.current.activeIdx], rect);
  };

  const setHoverBtn = (hovered: boolean) => {
    stateRef.current.hoveredBtn = hovered;
  };

  const activeBook = BOOKS[activeBookIndex] ?? BOOKS[5];
  const numLeaves = isMobile ? 24 : 40;

  // Generate timeline ticks from 1770 to 2030 every 10 years
  const ticks: number[] = [];
  for (let yr = 1770; yr <= 2030; yr += 10) {
    ticks.push(yr);
  }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      onClick={() => {
        if (!stateRef.current.revealSkipped) skipRevealToEnd();
      }}
    >
      {/* Hidden probe element to measure height:var(--H) */}
      <div
        ref={probeRef}
        aria-hidden="true"
        className="fixed left-[-9999px] top-0 pointer-events-none"
        style={{ height: 'var(--H)', width: '1px' }}
      />

      {/* Paper grain: fixed full-screen layer (z 40, no pointer events, mix-blend-mode:multiply, opacity .6) */}
      <div className="paper-grain fixed inset-0 z-[40] pointer-events-none" aria-hidden="true" />

      {/* 1. Top bar: 76px tall (60px on phones), 36px side padding (16px on phones), space-between, all oxblood */}
      <header
        ref={topBarRef}
        className="fixed top-0 left-0 right-0 z-[56] h-[76px] max-md:h-[60px] px-[36px] max-md:px-[16px] flex items-center justify-between text-[#8B1E2D]"
      >
        <a
          href="#archiv"
          aria-label="WENDLAND BIBLIOTHEK"
          onClick={(e) => {
            e.preventDefault();
            setDetailOpen(false);
            setReaderOpen(false);
            setPricingOpen(false);
            setMobileMenuOpen(false);
          }}
          onMouseEnter={() => setHoverBtn(true)}
          onMouseLeave={() => setHoverBtn(false)}
          className="lbl text-[#8B1E2D] focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
        >
          WENDLAND BIBLIOTHEK
        </a>

        <nav className="flex items-center gap-[34px] max-md:gap-[18px]">
          <button
            type="button"
            aria-label="BÜCHER"
            onClick={() => {
              setDetailOpen(false);
              setReaderOpen(false);
              setPricingOpen(false);
              setMobileMenuOpen(false);
            }}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            className="lbl text-[#8B1E2D] max-md:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
          >
            BÜCHER
          </button>

          <button
            ref={preiseBtnRef}
            type="button"
            aria-label="PREISE"
            onClick={() => {
              setDetailOpen(false);
              setReaderOpen(false);
              setMobileMenuOpen(false);
              if (preiseBtnRef.current) {
                setPricingOriginRect(preiseBtnRef.current.getBoundingClientRect());
              }
              setPricingOpen((prev) => !prev);
            }}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            className="lbl text-[#8B1E2D] max-md:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
          >
            PREISE
          </button>

          <button
            type="button"
            aria-label="Warenkorb"
            onClick={() => cartRef.current?.toggle()}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            className="lbl text-[#8B1E2D] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
          >
            <span className="inline-flex items-center gap-1.5"><CartIcon size={16} />Warenkorb ({cartCount})</span>
          </button>

          {/* Burger of two 1.5px lines, 26 x 12px */}
          <button
            type="button"
            aria-label="Menü"
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen((prev) => !prev);
              } else {
                if (pricingOpen || detailOpen || readerOpen) {
                  setPricingOpen(false);
                  setDetailOpen(false);
                  setReaderOpen(false);
                } else {
                  if (preiseBtnRef.current) {
                    setPricingOriginRect(preiseBtnRef.current.getBoundingClientRect());
                  }
                  setPricingOpen(true);
                }
              }
            }}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            className="w-[26px] h-[12px] flex flex-col justify-between items-stretch cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
          >
            <span className="w-full h-[1.5px] bg-[#8B1E2D] block" />
            <span className="w-full h-[1.5px] bg-[#8B1E2D] block" />
          </button>
        </nav>
      </header>

      {/* Mobile full-screen menu with BÜCHER and PREISE */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-[61] bg-[#F3F0EA] flex flex-col items-center justify-center gap-10"
        >
          <button
            type="button"
            aria-label="BÜCHER"
            onClick={() => {
              setMobileMenuOpen(false);
              setPricingOpen(false);
              setDetailOpen(false);
              setReaderOpen(false);
            }}
            className="font-serif text-[32px] text-[#8B1E2D]"
          >
            BÜCHER
          </button>
          <button
            type="button"
            aria-label="PREISE"
            onClick={() => {
              setMobileMenuOpen(false);
              setDetailOpen(false);
              setReaderOpen(false);
              setPricingOpen(true);
            }}
            className="font-serif text-[32px] text-[#8B1E2D]"
          >
            PREISE
          </button>
        </div>
      )}

      {/* 2. Halftone type: BÜCHER on the left and GESCHICHTEN on the right */}
      <div
        aria-hidden="true"
        className="font-halftone fixed z-[1] left-[2.4vw] top-[13vh] pointer-events-none select-none"
      >
        BÜCHER
      </div>
      <div
        aria-hidden="true"
        className="font-halftone fixed z-[1] right-[2.4vw] top-[9vh] pointer-events-none select-none"
      >
        GESCHICHTEN
      </div>

      {/* 3. Floor shadow: centred at top:calc(--cy + H*.47), width min(96vw, H*3.6), height H*.26 */}
      <div
        aria-hidden="true"
        className="fixed left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[5]"
        style={{
          top: 'calc(var(--cy) + var(--H) * 0.47)',
          width: 'min(96vw, calc(var(--H) * 3.6))',
          height: 'calc(var(--H) * 0.62)',
          background:
            'radial-gradient(closest-side, rgba(36,26,14,.3), rgba(36,26,14,.15) 45%, rgba(36,26,14,.05) 72%, transparent)',
        }}
      />

      <div aria-hidden="true" className="fixed inset-0 z-[6] pointer-events-none">
        {Array.from({ length: 36 }).map((_, v) => (
          <div
            key={v}
            ref={(el) => {
              contactElsRef.current[v] = el;
            }}
            className="book-contact"
          />
        ))}
      </div>

      {/* 4. Shelf: spans full width, top --cy - H/2 - 50px, height H + 100px, perspective:1400px at 50% 50%, z 10, clip-path: inset(0 0 24px 0) */}
      <main
        id="archiv"
        onMouseDown={(e) => {
          if (detailOpen || readerOpen || pricingOpen) return;
          const st = stateRef.current;
          st.dragging = true;
          st.dragStartX = e.clientX;
          st.dragStartT = st.T;
          st.dragMoved = false;
        }}
        onTouchStart={(e) => {
          if (detailOpen || readerOpen || pricingOpen) return;
          const st = stateRef.current;
          if (!st.revealSkipped) skipRevealToEnd();
          st.dragging = true;
          st.dragStartX = e.touches[0]?.clientX ?? 0;
          st.dragStartT = st.T;
          st.dragMoved = false;
        }}
        onTouchMove={(e) => {
          const st = stateRef.current;
          if (!st.dragging) return;
          const x = e.touches[0]?.clientX ?? st.dragStartX;
          const dx = x - st.dragStartX;
          if (Math.abs(dx) > 5) {
            st.dragMoved = true;
            const { ws, gap } = st.params;
            st.T = st.dragStartT - dx / (ws + gap);
          }
        }}
        onTouchEnd={() => {
          const st = stateRef.current;
          if (st.dragging) {
            st.dragging = false;
            if (st.dragMoved) {
              st.T = Math.round(st.T);
            }
          }
        }}
        className="fixed left-0 right-0 z-[10]"
        style={{
          top: 'calc(var(--cy) - var(--H) / 2 - 50px)',
          height: 'calc(var(--H) + 100px)',
          perspective: '1400px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-y',
        }}
      >
        {/* Zero-size .stage at the centre with preserve-3d */}
        <div
          className="stage absolute left-1/2 top-1/2 w-0 h-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {Array.from({ length: 36 }).map((_, v) => {
            const book = BOOKS[v % 12];
            return (
              <div
                key={v}
                ref={(el) => {
                  bookElsRef.current[v] = el;
                }}
                role="button"
                tabIndex={v === 17 ? 0 : -1}
                aria-label={`${book.title} — ${book.author} (${book.year})`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookClick(v);
                }}
                data-v={v}
                className="book absolute left-0 top-0 w-0 h-0 cursor-pointer focus-visible:outline-none"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Spine .sp */}
                <div
                  ref={(el) => {
                    spineElsRef.current[v] = el;
                  }}
                  className="sp book-face overflow-hidden"
                >
                  <BookSpineArtwork book={book} sheetsLoaded={sheetsLoaded} />
                </div>

                {/* Front cover .cv */}
                <div
                  ref={(el) => {
                    coverElsRef.current[v] = el;
                  }}
                  className="cv book-face overflow-hidden"
                  style={{
                    boxShadow: '14px 26px 44px -18px rgba(20,14,6,.55), 4px 6px 12px rgba(20,14,6,.25)',
                  }}
                >
                  <BookCoverArtwork book={book} sheetsLoaded={sheetsLoaded} />
                </div>

                {/* Back cover .bk */}
                <div
                  ref={(el) => {
                    backElsRef.current[v] = el;
                  }}
                  className="bk book-face overflow-hidden"
                  style={{ backgroundColor: book.clothBg }}
                >
                  <div className={`mat mat-${bookMaterial(book.id)}`} />
                  <div className="bevel" />
                </div>

                {/* Top .tp */}
                <div
                  ref={(el) => {
                    topElsRef.current[v] = el;
                  }}
                  className="tp book-face page-block-top"
                  style={{ borderLeft: `3px solid ${book.clothBg}`, borderRight: `3px solid ${book.clothBg}` }}
                />
              </div>
            );
          })}
        </div>
      </main>

      {/* Page-flap reveal stack (40 loose leaves at z 20, removed after lift-off) */}
      {leafStackMounted && (
        <div
          ref={leafStackRef}
          aria-hidden="true"
          className="fixed inset-0 z-[20] pointer-events-none flex items-center justify-center"
          style={{
            perspective: '1400px',
            perspectiveOrigin: '50% 41%',
          }}
        >
          <div
            ref={introBookRef}
            className="absolute"
            style={{
              width: 'var(--lw)',
              height: 'var(--lh)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="intro-board"
              style={{
                background: BOOKS[5].clothBg,
                left: 0,
                width: 'var(--lw)',
                height: 'var(--lh)',
                top: 0,
              }}
            />
            {Array.from({ length: numLeaves }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  leafElsRef.current[i] = el;
                }}
                className="leaf absolute"
                style={{
                  width: 'var(--lw)',
                  height: 'var(--lh)',
                  top: 0,
                  left: '0px',
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                }}
              >
                {/* Recto (right-hand page) */}
                <div
                  className={`leaf-sheet absolute inset-0 rounded-[4px] overflow-hidden ${i === 0 ? 'book-face' : ''}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {i === 0 && <BookCoverArtwork book={BOOKS[5]} sheetsLoaded={sheetsLoaded} />}
                  <div
                    ref={(el) => {
                      leafShadeRef.current[i] = el;
                    }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(20,16,10,0.85))',
                      opacity: 0,
                    }}
                  />
                </div>
                {/* Verso (turned rotateY(180deg)) */}
                <div
                  className="leaf-sheet absolute inset-0 rounded-[3px]"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Read ring: fixed 42px circle with 1px oxblood border, rgba(236,232,224,.8) fill and 14px open-book glyph in oxblood */}
      <button
        ref={readRingRef}
        type="button"
        aria-label="Leseprobe öffnen"
        onClick={(e) => {
          e.stopPropagation();
          if (readRingRef.current) {
            setReaderOriginRect(readRingRef.current.getBoundingClientRect());
          }
          setReaderOpen(true);
        }}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        className="fixed z-[30] w-[42px] h-[42px] rounded-full border border-[#8B1E2D] bg-[#ECE8E0]/80 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 2.2C3.2 1.2 5.8 1.5 8 2.8C10.2 1.5 12.8 1.2 15 2.2V12.2C12.8 11.2 10.2 11.5 8 12.8C5.8 11.5 3.2 11.2 1 12.2V2.2Z"
            stroke="#8B1E2D"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M8 2.8V12.8" stroke="#8B1E2D" strokeWidth="1.2" />
        </svg>
      </button>

      <button
        ref={addRingRef}
        type="button"
        aria-label="In den Warenkorb legen"
        title="In den Warenkorb"
        onClick={(e) => {
          e.stopPropagation();
          addActiveToCart();
        }}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        className="fixed z-[30] w-[42px] h-[42px] rounded-full bg-[#8B1E2D] text-[#ECE8E0] text-[22px] leading-none flex items-center justify-center cursor-pointer shadow-[0_4px_10px_rgba(20,14,6,.4)] focus-visible:outline-2 focus-visible:outline-[#141414]"
      >
        <CartIcon size={20} />
      </button>

      {/* 6. Caption: centred grid at top: --cy + H/2 + 4.2vh, 10px gap */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[25] grid justify-items-center gap-[10px] pointer-events-none"
        style={{
          top: 'calc(var(--cy) + var(--H) / 2 + 4.2vh)',
          width: 'min(56vw, 600px)',
        }}
      >
        {/* Title: Newsreader 500, clamp(30px,3.6vw,52px) (27px on phones), letter-spacing -.01em, oxblood */}
        <div
          ref={titleMaskRef}
          className="relative overflow-hidden w-full font-fraktur text-[#8B1E2D] leading-[1.2] pb-[2px] whitespace-nowrap max-md:!text-[22px]"
          style={{ fontSize: 'clamp(20px, 2.7vw, 40px)' }}
        >
          <span className="block w-full text-center">{BOOKS[5].title}</span>
        </div>

        {/* Author: oxblood .lbl at 9.5px, letter-spacing .24em */}
        <div
          ref={authorMaskRef}
          className="relative overflow-hidden w-full lbl text-[#8B1E2D] !text-[12px] !tracking-[0.14em] pb-[1px]"
        >
          <span className="block w-full text-center">{BOOKS[5].author.toUpperCase()}</span>
        </div>

        {/* Rule: 18 x 1px, oxblood */}
        <div className="w-[18px] h-[1px] bg-[#8B1E2D]" />

        {/* Year line: Inter Tight 500, 10.5px, letter-spacing .08em, ink, YEAR — GENRE */}
        <div
          ref={yearMaskRef}
          className="relative overflow-hidden w-full font-sans font-medium text-[10.5px] tracking-[0.08em] uppercase text-[#141414]"
        >
          <span className="block w-full text-center">
            {BOOKS[5].year} — {BOOKS[5].genre.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 7. Arrows: two 44px oxblood buttons on the title's line, at 50% ± min(19vw,250px) (on phones: bottom 118px at screen edges) */}
      <button
        type="button"
        aria-label="Vorheriges Buch"
        onClick={(e) => {
          e.stopPropagation();
          const st = stateRef.current;
          if (!st.revealSkipped) skipRevealToEnd();
          st.T = Math.round(st.T) - 1;
        }}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        className="fixed z-[30] w-[44px] h-[44px] flex items-center justify-center text-[#8B1E2D] cursor-pointer -translate-x-1/2 max-md:translate-x-0 max-md:!left-[16px] max-md:!top-auto max-md:bottom-[118px] focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
        style={{
          left: 'calc(50% - min(30vw, 420px))',
          top: 'calc(var(--cy) + var(--H) / 2 + 4.2vh)',
        }}
      >
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
          <path
            d="M6 1L1 6l5 5M1 6h23"
            stroke="#8B1E2D"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Nächstes Buch"
        onClick={(e) => {
          e.stopPropagation();
          const st = stateRef.current;
          if (!st.revealSkipped) skipRevealToEnd();
          st.T = Math.round(st.T) + 1;
        }}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        className="fixed z-[30] w-[44px] h-[44px] flex items-center justify-center text-[#8B1E2D] cursor-pointer translate-x-1/2 max-md:translate-x-0 max-md:!left-auto max-md:right-[16px] max-md:!top-auto max-md:bottom-[118px] focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
        style={{
          left: 'calc(50% + min(30vw, 420px))',
          top: 'calc(var(--cy) + var(--H) / 2 + 4.2vh)',
        }}
      >
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
          <path
            d="M18 1l5 5-5 5M23 6H0"
            stroke="#8B1E2D"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* 8. Timeline: left and right 36px (16px on phones), bottom 64px (54px on phones), 40px tall, 1770 to 2030 */}
      <div
        ref={timelineTrackRef}
        role="slider"
        aria-label="Zeitleiste 1770 bis 2030"
        aria-valuemin={1770}
        aria-valuemax={2030}
        aria-valuenow={activeBook.year}
        tabIndex={0}
        onClick={handleTimelineClick}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        className="fixed left-[36px] right-[36px] bottom-[64px] max-md:left-[16px] max-md:right-[16px] max-md:bottom-[54px] h-[40px] z-[30] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
      >
        {/* Oxblood 1px line at 12px (opacity .75) */}
        <div
          ref={timelineLineRef}
          className="absolute left-0 right-0 top-[12px] h-[1px] bg-[#8B1E2D] opacity-75 origin-left"
        />

        {/* Ticks every 10 years */}
        {ticks.map((yr) => {
          const isMajor = yr % 50 === 0;
          const isEnd = yr === 1770 || yr === 2030;
          const showLabel = isMajor || isEnd;
          // On phones: every other year label is hidden (keep 1770, 1850, 1950, 2030)
          const hideOnMobile = yr === 1800 || yr === 1900 || yr === 2000;
          const leftPct = ((yr - 1770) / 260) * 100;

          return (
            <div
              key={yr}
              className="absolute top-[12px]"
              style={{ left: `${leftPct}%` }}
            >
              <div
                className="w-[1px] bg-[#8B1E2D] -translate-x-1/2 -translate-y-1/2"
                style={{
                  height: isMajor ? '13px' : '7px',
                  opacity: isMajor ? 0.75 : 0.4,
                }}
              />
              {showLabel && (
                <span
                  className={`absolute top-[10px] font-sans font-medium text-[9.5px] text-[#8B1E2D] tabular-nums whitespace-nowrap ${
                    yr === 1770
                      ? 'left-0'
                      : yr === 2030
                        ? 'right-0'
                        : '-translate-x-1/2'
                  } ${hideOnMobile ? 'max-md:hidden' : ''}`}
                >
                  {yr}
                </span>
              )}
            </div>
          );
        })}

        {/* 9px oxblood dot rides the line */}
        <div
          ref={timelineDotRef}
          className="absolute top-[12px] w-[9px] h-[9px] rounded-full bg-[#8B1E2D] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${yearToTimelineLeft(1915) * 100}%` }}
        />
      </div>

      {/* 9. Footer: left 36px, bottom 24px, one oxblood .lbl: "© WENDLAND BIBLIOTHEK". Nothing on the right. */}
      <footer className="fixed left-[36px] max-md:left-[16px] bottom-[24px] z-[30] pointer-events-none">
        <span className="lbl text-[#8B1E2D]">© WENDLAND BIBLIOTHEK</span>
      </footer>

      {/* Detail overlay (two-page hardcover spread) */}
      <DetailOverlay
        isOpen={detailOpen}
        book={activeBook}
        coverRect={detailCoverRect}
        onAddToCart={addActiveToCart}
        getLatestCoverRect={getActiveCoverRect}
        onCloseComplete={() => setDetailOpen(false)}
        onOpenReader={() => {
          setReaderOriginRect(null);
          setReaderOpen(true);
        }}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        sheetsLoaded={sheetsLoaded}
        onHoverBtn={setHoverBtn}
      />

      {/* Demo Reader overlay */}
      <ReaderOverlay
        isOpen={readerOpen}
        book={activeBook}
        originRect={readerOriginRect}
        onClose={() => setReaderOpen(false)}
        onAddToCart={addActiveToCart}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        onHoverBtn={setHoverBtn}
      />

      {/* Pricing sheet */}
      <PricingSheet
        isOpen={pricingOpen}
        originRect={pricingOriginRect}
        onClose={() => setPricingOpen(false)}
        onOpenReader={() => {
          setPricingOpen(false);
          setReaderOriginRect(null);
          setReaderOpen(true);
        }}
        reducedMotion={reducedMotion}
        onHoverBtn={setHoverBtn}
      />

      <Cart3D ref={cartRef} reducedMotion={reducedMotion} onHoverBtn={setHoverBtn} onCountChange={setCartCount} />

      {/* Letterpress filter: rough ink edges with small dropouts, so printing sits in the material */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="press" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={3} result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale={2.2} result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={8} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.85" result="holes" />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </svg>

      {/* 10. Cursor: 58px, fixed, z 100 */}
      {!isMobile && (
        <div
          ref={cursorRef}
          aria-hidden="true"
          className="fixed top-0 left-0 w-[58px] h-[58px] z-[100] pointer-events-none flex items-center justify-center"
        >
          <div
            ref={cursorRingRef}
            className="absolute inset-0 rounded-full border-[1.5px] border-[#141414]"
            style={{
              transition:
                'transform 0.5s var(--ease), background-color 0.4s var(--ease), border-color 0.4s var(--ease)',
            }}
          />
          <div
            ref={cursorDotRef}
            className="w-[6px] h-[6px] rounded-full bg-[#141414] relative z-10"
            style={{ transition: 'transform 0.4s var(--ease)' }}
          />
          <span
            ref={cursorLabelRef}
            className="absolute font-sans font-semibold text-[10px] tracking-[0.12em] text-white opacity-0 z-20"
            style={{ transition: 'opacity 0.45s var(--ease)' }}
          >
            ÖFFNEN
          </span>
        </div>
      )}
    </div>
  );
}
