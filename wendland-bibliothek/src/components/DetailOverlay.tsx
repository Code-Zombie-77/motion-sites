import React, { useEffect, useRef, useState } from 'react';
import { BookEntry, PRICE, SAMPLE } from '../data/books';
import { BookCoverArtwork, FrontispieceSvg } from './BookArtwork';
import { CartIcon } from './Cart3D';
import { downloadDemoPdf } from '../utils/pdfGenerator';

interface DetailOverlayProps {
  isOpen: boolean;
  book: BookEntry;
  coverRect: DOMRect | null;
  getLatestCoverRect: () => DOMRect | null;
  onCloseComplete: () => void;
  onOpenReader: () => void;
  onAddToCart: () => void;
  isMobile: boolean;
  reducedMotion: boolean;
  sheetsLoaded: Record<string, boolean>;
  onHoverBtn: (hovered: boolean) => void;
}

const INK_CIRCLES: [number, number, number][] = [
  [190, 330, 0],
  [430, 600, 120],
  [320, 120, 220],
  [110, 760, 300],
  [500, 250, 360],
  [330, 860, 420],
  [290, 470, 180],
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

// Approximate cubic-bezier(.65, 0, .25, 1)
function easePageTurn(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function DetailOverlay({
  isOpen,
  book,
  coverRect,
  getLatestCoverRect,
  onCloseComplete,
  onOpenReader,
  onAddToCart,
  isMobile,
  reducedMotion,
  sheetsLoaded,
  onHoverBtn,
}: DetailOverlayProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const spreadWrapRef = useRef<HTMLDivElement>(null);
  const frontCoverWingRef = useRef<HTMLDivElement>(null);
  const frontCoverShadeRef = useRef<HTMLDivElement>(null);

  const [spread, setSpread] = useState(0); // 0..3 on desktop, 0..7 on mobile
  const [turning, setTurning] = useState<{
    from: number;
    to: number;
    dir: 1 | -1;
    angle: number; // 0 to -180
  } | null>(null);
  const [inkRadii, setInkRadii] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [textRevealed, setTextRevealed] = useState(false);
  const isClosingRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);

  const maxSpread = isMobile ? 7 : 3;

  // Trigger open sequence when isOpen becomes true
  useEffect(() => {
    if (!isOpen) return;
    isClosingRef.current = false;
    setSpread(0);
    setTurning(null);

    if (reducedMotion) {
      setInkRadii([800, 800, 800, 800, 800, 800, 800]);
      setTextRevealed(true);
      if (sheetRef.current) {
        sheetRef.current.style.clipPath = 'inset(0px round 0px)';
      }
      if (frontCoverWingRef.current) {
        frontCoverWingRef.current.style.transform = 'rotateY(-172deg)';
      }
      return;
    }

    setInkRadii([0, 0, 0, 0, 0, 0, 0]);
    setTextRevealed(false);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const rect = coverRect ?? new DOMRect(W / 2 - 120, H / 2 - 180, 240, 360);

    const top = Math.max(0, rect.top);
    const left = Math.max(0, rect.left);
    const right = Math.max(0, W - rect.right);
    const bottom = Math.max(0, H - rect.bottom);

    if (sheetRef.current) {
      sheetRef.current.getAnimations().forEach((a) => a.cancel());
      sheetRef.current.animate(
        [
          { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)` },
          { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
        ],
        {
          duration: 1050,
          easing: 'cubic-bezier(.76,0,.18,1)',
          fill: 'both',
        }
      );
    }

    // FLIP closed copy of the book from cover rect to centre of the screen over 1050ms
    const ph = Math.min(H * 0.78, W * 0.46);
    const pw = isMobile ? Math.min(W * 0.86, H * 0.52) : ph * 0.667;
    const targetCenterX = W / 2;
    const targetCenterY = H / 2;
    const startCenterX = rect.left + rect.width / 2;
    const startCenterY = rect.top + rect.height / 2;
    const dx = startCenterX - targetCenterX + (isMobile ? 0 : pw / 2);
    const dy = startCenterY - targetCenterY;
    const sx = rect.width / pw;
    const sy = rect.height / ph;

    if (spreadWrapRef.current) {
      spreadWrapRef.current.getAnimations().forEach((a) => a.cancel());
      spreadWrapRef.current.animate(
        [
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})` },
          { transform: 'translate3d(0px, 0px, 0) scale(1, 1)' },
        ],
        {
          duration: 1050,
          easing: 'cubic-bezier(.76,0,.18,1)',
          fill: 'both',
        }
      );
    }

    // Front cover swings open from 900ms: rotateY(0deg -> -172deg) over 1100ms
    let rafId = 0;
    const t0 = performance.now();

    const tickOpen = (now: number) => {
      if (isClosingRef.current) return;
      const elapsed = now - t0;

      // Cover swing (900ms..2000ms)
      if (frontCoverWingRef.current) {
        if (elapsed < 900) {
          frontCoverWingRef.current.style.transform = 'rotateY(0deg)';
          frontCoverWingRef.current.style.zIndex = '30';
        } else {
          const p = Math.min(1, (elapsed - 900) / 1100);
          const eased = easePageTurn(p);
          const ang = -172 * eased;
          frontCoverWingRef.current.style.transform = `rotateY(${ang}deg)`;
          frontCoverWingRef.current.style.zIndex = ang < -90 ? '5' : '30';
          if (frontCoverShadeRef.current) {
            const shade = Math.sin((Math.abs(ang) * Math.PI) / 180) * 0.45;
            frontCoverShadeRef.current.style.opacity = String(shade);
          }
        }
      }

      if (elapsed >= 1300) {
        setTextRevealed(true);
      }

      // From 1500ms, each ink circle grows from 0 to r=800 over 1250ms after its delay
      if (elapsed >= 1500) {
        const inkElapsed = elapsed - 1500;
        const radii = INK_CIRCLES.map(([, , delay]) => {
          const local = inkElapsed - delay;
          if (local <= 0) return 0;
          return 800 * easeOutCubic(local / 1250);
        });
        setInkRadii(radii);
      }

      if (elapsed < 3250) {
        rafId = requestAnimationFrame(tickOpen);
      }
    };

    rafId = requestAnimationFrame(tickOpen);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, book.id, coverRect, isMobile, reducedMotion]);

  // Ensure ink circles animate if user turns to spread 1 early
  useEffect(() => {
    if (!isOpen) return;
    if ((spread === 1 || (isMobile && spread === 3)) && inkRadii.every((r) => r < 10)) {
      if (reducedMotion) {
        setInkRadii([800, 800, 800, 800, 800, 800, 800]);
        return;
      }
      let rafId = 0;
      const t0 = performance.now();
      const tick = (now: number) => {
        const inkElapsed = now - t0;
        const radii = INK_CIRCLES.map(([, , delay]) => {
          const local = inkElapsed - delay;
          if (local <= 0) return 0;
          return 800 * easeOutCubic(local / 1250);
        });
        setInkRadii(radii);
        if (inkElapsed < 1700) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }
  }, [spread, isOpen, isMobile, reducedMotion]);

  const turnToSpread = (target: number) => {
    if (turning || isClosingRef.current) return;
    if (target < 0 || target > maxSpread || target === spread) return;

    if (reducedMotion) {
      setSpread(target);
      return;
    }

    const dir: 1 | -1 = target > spread ? 1 : -1;
    const t0 = performance.now();
    const duration = 900;

    const stepTurn = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = easePageTurn(p);
      const angle = dir === 1 ? -180 * eased : -180 * (1 - eased);
      setTurning({ from: spread, to: target, dir, angle });
      if (p < 1) {
        requestAnimationFrame(stepTurn);
      } else {
        setSpread(target);
        setTurning(null);
      }
    };
    requestAnimationFrame(stepTurn);
  };

  const triggerClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (reducedMotion) {
      onCloseComplete();
      return;
    }

    // 1. Cover swings closed (-172deg -> 0deg, 800ms)
    const t0 = performance.now();
    const swingDuration = 800;

    const swingStep = (now: number) => {
      const p = Math.min(1, (now - t0) / swingDuration);
      const eased = easePageTurn(p);
      const ang = -172 * (1 - eased);
      if (frontCoverWingRef.current) {
        frontCoverWingRef.current.style.visibility = 'visible';
        frontCoverWingRef.current.style.transform = `rotateY(${ang}deg)`;
        frontCoverWingRef.current.style.zIndex = ang < -90 ? '5' : '40';
      }
      if (p < 1) {
        requestAnimationFrame(swingStep);
      } else {
        // 2. Book travels back and sheet clips back to current cover rect over 850ms
        const W = window.innerWidth;
        const H = window.innerHeight;
        const rect =
          getLatestCoverRect() ??
          coverRect ??
          new DOMRect(W / 2 - 120, H / 2 - 180, 240, 360);

        const top = Math.max(0, rect.top);
        const left = Math.max(0, rect.left);
        const right = Math.max(0, W - rect.right);
        const bottom = Math.max(0, H - rect.bottom);

        const ph = Math.min(H * 0.78, W * 0.46);
        const pw = isMobile ? Math.min(W * 0.86, H * 0.52) : ph * 0.667;
        const dx = rect.left + rect.width / 2 - W / 2 + (isMobile ? 0 : pw / 2);
        const dy = rect.top + rect.height / 2 - H / 2;
        const sx = rect.width / pw;
        const sy = rect.height / ph;

        if (spreadWrapRef.current) {
          spreadWrapRef.current.animate(
            [
              { transform: 'translate3d(0px, 0px, 0) scale(1, 1)' },
              { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})` },
            ],
            {
              duration: 850,
              easing: 'cubic-bezier(.76,0,.18,1)',
              fill: 'both',
            }
          );
        }

        if (sheetRef.current) {
          const anim = sheetRef.current.animate(
            [
              { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
              { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)` },
            ],
            {
              duration: 850,
              easing: 'cubic-bezier(.76,0,.18,1)',
              fill: 'both',
            }
          );
          anim.onfinish = () => {
            if (sheetRef.current) {
              sheetRef.current.getAnimations().forEach((a) => a.cancel());
            }
            if (spreadWrapRef.current) {
              spreadWrapRef.current.getAnimations().forEach((a) => a.cancel());
            }
            onCloseComplete();
          };
        } else {
          onCloseComplete();
        }
      }
    };

    requestAnimationFrame(swingStep);
  };

  // Keyboard support inside detail
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        turnToSpread(spread + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turnToSpread(spread - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, spread, turning]);

  if (!isOpen) return null;

  const samplePages = SAMPLE[book.id]?.pages ?? SAMPLE.verwandlung.pages;

  // Render content for a single page (left or right of spreadIdx 0..3)
  const renderPageSide = (spreadIdx: number, side: 'left' | 'right', animateLines = true) => {
    const lineClass = animateLines && textRevealed ? 'mask-line-in' : '';

    if (spreadIdx === 0 && side === 'left') {
      // Spread 0 Left page: Inside of the cover: plain paper, no content
      return <div className="w-full h-full" />;
    }

    if (spreadIdx === 0 && side === 'right') {
      // Spread 0 Right page: Title page: the title in Newsreader 600 clamp(36px,4.4vw,64px), the author's name below it, the year below that
      return (
        <div className="w-full h-full flex flex-col justify-center px-[9%] py-[12%] select-none">
          <div className="overflow-hidden">
            <h2
              className={`font-serif font-semibold text-[#141414] leading-[1.08] tracking-[-0.02em] break-words ${lineClass}`}
              style={{
                fontSize:
                  book.title.length > 13
                    ? 'clamp(28px, 3.3vw, 48px)'
                    : 'clamp(36px, 4.4vw, 64px)',
                animationDelay: '0ms',
              }}
            >
              {book.title}
            </h2>
          </div>
          <div className="overflow-hidden mt-5">
            <div
              className={`lbl text-[#8B1E2D] ${lineClass}`}
              style={{ animationDelay: '75ms' }}
            >
              {book.author.toUpperCase()}
            </div>
          </div>
          <div className="overflow-hidden mt-3">
            <div
              className={`font-sans font-medium text-[11px] tracking-[0.1em] text-[#6D6A63] ${lineClass}`}
              style={{ animationDelay: '150ms' }}
            >
              {book.year}
            </div>
          </div>
        </div>
      );
    }

    if (spreadIdx === 1 && side === 'left') {
      // Spread 1 Left page: The synopsis in Newsreader 17px/1.5 (max 42ch) and a muted meta line YEAR / GENRE / N S.
      return (
        <div className="w-full h-full flex flex-col justify-between px-[11%] py-[12%]">
          <div className="my-auto">
            <div className="overflow-hidden">
              <p
                className={`font-serif text-[17px] leading-[1.5] text-[#141414] max-w-[42ch] ${lineClass}`}
                style={{ animationDelay: '0ms' }}
              >
                {book.synopsisDe}
              </p>
            </div>
            <div className="overflow-hidden mt-6">
              <div
                className={`font-sans font-medium text-[10.5px] tracking-[0.12em] uppercase text-[#6D6A63] ${lineClass}`}
                style={{ animationDelay: '75ms' }}
              >
                {book.year} / {book.genre.toUpperCase()} / {book.pages} S.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (spreadIdx === 1 && side === 'right') {
      // Spread 1 Right page: The frontispiece: the cover crop as an SVG poster (viewBox 600 x 900) revealed by the ink mask
      return (
        <div className="w-full h-full p-[6%] flex items-center justify-center">
          <div className="w-full h-full overflow-hidden">
            <FrontispieceSvg book={book} inkRadii={inkRadii} sheetsLoaded={sheetsLoaded} />
          </div>
        </div>
      );
    }

    if (spreadIdx === 2 && side === 'left') {
      // Spread 2 Left page: Reading sample, page 1
      const paras = samplePages[0] ?? [];
      return (
        <div className="w-full h-full flex flex-col justify-between px-[10%] py-[10%] overflow-hidden">
          <div className="space-y-3.5 overflow-hidden">
            {paras.map((p, idx) => (
              <p
                key={idx}
                className={`font-serif text-[13.5px] leading-[1.52] text-[#141414] ${lineClass}`}
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                {p}
              </p>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#141414]/15">
            <span className="font-sans text-[10px] tracking-[0.12em] text-[#6D6A63]">1</span>
            <button
              type="button"
              aria-label="Leseprobe im Vollbild öffnen"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReader();
              }}
              onMouseEnter={() => onHoverBtn(true)}
              onMouseLeave={() => onHoverBtn(false)}
              className="lbl text-[#8B1E2D] hover:underline focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
            >
              LESEPROBE ÖFFNEN
            </button>
          </div>
        </div>
      );
    }

    if (spreadIdx === 2 && side === 'right') {
      // Spread 2 Right page: Reading sample, page 2
      const paras = samplePages[1] ?? [];
      return (
        <div className="w-full h-full flex flex-col justify-between px-[10%] py-[10%] overflow-hidden">
          <div className="space-y-3.5 overflow-hidden">
            {paras.map((p, idx) => (
              <p
                key={idx}
                className={`font-serif text-[13.5px] leading-[1.52] text-[#141414] ${lineClass}`}
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                {p}
              </p>
            ))}
          </div>
          <div className="flex items-center justify-end pt-2 border-t border-[#141414]/15">
            <span className="font-sans text-[10px] tracking-[0.12em] text-[#6D6A63]">2</span>
          </div>
        </div>
      );
    }

    if (spreadIdx === 3 && side === 'left') {
      // Spread 3 Left page: The edition price table for this book (section 10)
      const p = PRICE[book.kind];
      const rows: [string, string][] = [
        ['Demo-PDF', '€ 0'],
        ['E-Book', `€ ${p.ebook.toFixed(2).replace('.', ',')}`],
        ['Taschenbuch', `€ ${p.paperback.toFixed(2).replace('.', ',')}`],
        ['Hardcover', `€ ${p.hardcover.toFixed(2).replace('.', ',')}`],
      ];
      return (
        <div className="w-full h-full flex flex-col justify-center px-[11%] py-[12%]">
          <div className="border-t border-[#141414]/80">
            {rows.map(([label, val], idx) => (
              <div
                key={label}
                className={`flex items-center justify-between py-3.5 border-b border-[#141414]/25 ${lineClass}`}
                style={{ animationDelay: `${idx * 65}ms` }}
              >
                <span className="font-sans font-medium text-[12px] tracking-[0.06em] uppercase text-[#141414]">
                  {label}
                </span>
                <span className="font-serif font-medium text-[17px] text-[#141414] tabular-nums">
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Spread 3 Right page: Two buttons: "DEMO-PDF HERUNTERLADEN" and "KAUFEN"
    return (
      <div className="w-full h-full flex flex-col justify-center items-start gap-4 px-[11%] py-[12%]">
        <button
          type="button"
          aria-label="DEMO-PDF HERUNTERLADEN"
          onClick={(e) => {
            e.stopPropagation();
            downloadDemoPdf(book.id);
          }}
          onMouseEnter={() => onHoverBtn(true)}
          onMouseLeave={() => onHoverBtn(false)}
          className="box lbl text-[#141414] hover:bg-[#8B1E2D] hover:text-[#ECE8E0] hover:border-[#8B1E2D] transition-colors h-[36px] px-4 focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
        >
          DEMO-PDF HERUNTERLADEN
        </button>
        <button
          type="button"
          aria-label="In den Warenkorb"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          onMouseEnter={() => onHoverBtn(true)}
          onMouseLeave={() => onHoverBtn(false)}
          className="box lbl bg-[#8B1E2D] text-[#ECE8E0] border-[#8B1E2D] h-[36px] px-4 focus-visible:outline-2 focus-visible:outline-[#141414]"
        >
          <CartIcon size={15} />
          <span className="ml-2">IN DEN WARENKORB</span>
        </button>
      </div>
    );
  };

  // Click on right or left outer third of a page turns pages
  const handleSpreadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    if (relX > 0.66) {
      turnToSpread(spread + 1);
    } else if (relX < 0.34) {
      turnToSpread(spread - 1);
    }
  };

  // Compute active turning leaf geometry (same lift, rotateZ, skewY curl and shading as reveal leaves)
  let leafTransform = '';
  let leafShade = 0;
  if (turning) {
    const rad = (Math.abs(turning.angle) * Math.PI) / 180;
    const sinA = Math.sin(rad);
    const tz = sinA * 42;
    const rz = sinA * 1.5;
    const sky = sinA * -3;
    leafTransform = `translateZ(${tz.toFixed(1)}px) rotateY(${turning.angle.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) skewY(${sky.toFixed(2)}deg)`;
    leafShade = sinA * 0.35;
  }

  // Determine which spreads are shown underneath during a page turn
  const baseLeftSpread = turning ? (turning.dir === 1 ? turning.from : turning.to) : spread;
  const baseRightSpread = turning ? (turning.dir === 1 ? turning.to : turning.from) : spread;
  const leafRectoSpread = turning ? (turning.dir === 1 ? turning.from : turning.to) : spread;
  const leafVersoSpread = turning ? (turning.dir === 1 ? turning.to : turning.from) : spread;

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
      className="detail fixed inset-0 z-[60] bg-[#F3F0EA] flex items-center justify-center overflow-hidden"
      onTouchStart={(e) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartXRef.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartXRef.current) - touchStartXRef.current;
        if (dx < -35) turnToSpread(spread + 1);
        if (dx > 35) turnToSpread(spread - 1);
        touchStartXRef.current = null;
      }}
    >
      {/* Close button: a boxed .lbl "SCHLIESSEN" at 36px, 28px. Nothing else in the chrome. */}
      <button
        type="button"
        aria-label="SCHLIESSEN"
        onClick={triggerClose}
        onMouseEnter={() => onHoverBtn(true)}
        onMouseLeave={() => onHoverBtn(false)}
        className="box lbl fixed top-[28px] left-[36px] z-[80] text-[#141414] bg-[#F3F0EA]/90 hover:bg-[#8B1E2D] hover:text-[#ECE8E0] hover:border-[#8B1E2D] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
      >
        SCHLIESSEN
      </button>

      {/* Two-page spread container (or single page on phone) */}
      <div
        ref={spreadWrapRef}
        onClick={handleSpreadClick}
        className="relative select-none"
        style={{
          height: isMobile ? 'min(76svh, 130vw)' : 'min(78vh, 46vw)',
          width: isMobile
            ? 'min(86vw, 52svh)'
            : 'calc(min(78vh, 46vw) * 0.667 * 2)',
          perspective: '1800px',
          transformStyle: 'preserve-3d',
          boxShadow: '0 38px 75px -24px rgba(20, 16, 10, 0.38)',
        }}
      >
        {isMobile ? (
          /* Mobile: one page at a time */
          <div className="w-full h-full bg-[#ECE8E0] border border-[#141414]/15 relative overflow-hidden">
            {renderPageSide(
              Math.floor(spread / 2),
              spread % 2 === 0 ? 'left' : 'right',
              true
            )}
          </div>
        ) : (
          /* Desktop: Two-page hardcover spread */
          <div
            className="w-full h-full flex relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Left Page */}
            <div className="w-1/2 h-full bg-[#ECE8E0] border border-[#141414]/15 relative overflow-hidden">
              {renderPageSide(baseLeftSpread, 'left', !turning)}
            </div>

            {/* Right Page */}
            <div className="w-1/2 h-full bg-[#ECE8E0] border border-[#141414]/15 relative overflow-hidden">
              {renderPageSide(baseRightSpread, 'right', !turning)}
            </div>

            {/* Gutter: vertical shading strip in the centre (36px wide) */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[36px] z-20"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(20,16,10,.18) 50%, transparent)',
              }}
            />

            {/* Turning Page Leaf (rotates around the gutter from 0 to -180deg) */}
            {turning && (
              <div
                className="absolute top-0 right-0 w-1/2 h-full z-25 pointer-events-none"
                style={{
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  transform: leafTransform,
                  willChange: 'transform',
                }}
              >
                {/* Recto (front of turning right page) */}
                <div
                  className="absolute inset-0 bg-[#ECE8E0] border border-[#141414]/15 overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {renderPageSide(leafRectoSpread, 'right', false)}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(20,16,10,0.85))',
                      opacity: leafShade,
                    }}
                  />
                </div>
                {/* Verso (back of turning page -> next spread's left page) */}
                <div
                  className="absolute inset-0 bg-[#ECE8E0] border border-[#141414]/15 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {renderPageSide(leafVersoSpread, 'left', false)}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(-90deg, transparent, rgba(20,16,10,0.85))',
                      opacity: leafShade,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Front Cover Wing that swings open around its left (spine) edge from 0deg -> -172deg */}
            <div
              ref={frontCoverWingRef}
              className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(-172deg)',
                zIndex: 5,
                visibility:
                  spread === 0 && (!turning || turning.to === 0) ? 'visible' : 'hidden',
              }}
            >
              {/* Front Cover outside */}
              <div
                className="absolute inset-0 overflow-hidden rounded-[2px]"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <BookCoverArtwork book={book} sheetsLoaded={sheetsLoaded} />
                <div
                  ref={frontCoverShadeRef}
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: 0 }}
                />
              </div>
              {/* Inside of the front cover (plain paper) */}
              <div
                className="absolute inset-0 bg-[#ECE8E0] border border-[#141414]/20"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
