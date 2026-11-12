import React, { useEffect, useRef, useState } from 'react';
import { BookEntry, SAMPLE } from '../data/books';
import { downloadDemoPdf } from '../utils/pdfGenerator';

import { CartIcon } from './Cart3D';

interface ReaderOverlayProps {
  isOpen: boolean;
  book: BookEntry;
  originRect: DOMRect | null;
  onClose: () => void;
  isMobile: boolean;
  reducedMotion: boolean;
  onHoverBtn: (hovered: boolean) => void;
  onAddToCart: () => void;
}

function easePageTurn(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function ReaderOverlay({
  isOpen,
  book,
  originRect,
  onClose,
  isMobile,
  reducedMotion,
  onHoverBtn,
  onAddToCart,
}: ReaderOverlayProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [spread, setSpread] = useState(0); // 0..1 on desktop (4 sample pages), 0..3 on mobile
  const [turning, setTurning] = useState<{
    from: number;
    to: number;
    dir: 1 | -1;
    angle: number;
  } | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const samplePages = SAMPLE[book.id]?.pages ?? SAMPLE.verwandlung.pages;
  const maxSpread = isMobile ? samplePages.length - 1 : Math.ceil(samplePages.length / 2) - 1;

  useEffect(() => {
    if (!isOpen) return;
    setSpread(0);
    setTurning(null);

    if (reducedMotion || !sheetRef.current) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const rect = originRect ?? new DOMRect(W / 2 - 21, H / 2 - 21, 42, 42);
    const top = Math.max(0, rect.top);
    const left = Math.max(0, rect.left);
    const right = Math.max(0, W - rect.right);
    const bottom = Math.max(0, H - rect.bottom);

    sheetRef.current.getAnimations().forEach((a) => a.cancel());
    sheetRef.current.animate(
      [
        { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 21px)` },
        { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
      ],
      {
        duration: 850,
        easing: 'cubic-bezier(.76,0,.18,1)',
        fill: 'both',
      }
    );
  }, [isOpen, book.id, originRect, reducedMotion]);

  const turnTo = (target: number) => {
    if (turning) return;
    if (target < 0 || target > maxSpread || target === spread) return;
    if (reducedMotion) {
      setSpread(target);
      return;
    }
    const dir: 1 | -1 = target > spread ? 1 : -1;
    const t0 = performance.now();
    const duration = 900;

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = easePageTurn(p);
      const angle = dir === 1 ? -180 * eased : -180 * (1 - eased);
      setTurning({ from: spread, to: target, dir, angle });
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setSpread(target);
        setTurning(null);
      }
    };
    requestAnimationFrame(step);
  };

  const handleClose = () => {
    if (reducedMotion || !sheetRef.current) {
      onClose();
      return;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const rect = originRect ?? new DOMRect(W / 2 - 21, H / 2 - 21, 42, 42);
    const top = Math.max(0, rect.top);
    const left = Math.max(0, rect.left);
    const right = Math.max(0, W - rect.right);
    const bottom = Math.max(0, H - rect.bottom);

    const anim = sheetRef.current.animate(
      [
        { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
        { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 21px)` },
      ],
      {
        duration: 700,
        easing: 'cubic-bezier(.76,0,.18,1)',
        fill: 'both',
      }
    );
    anim.onfinish = () => onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        turnTo(spread + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turnTo(spread - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, spread, turning]);

  if (!isOpen) return null;

  const renderSamplePage = (pageIndex: number) => {
    const paras = samplePages[pageIndex] ?? [];
    return (
      <div className="w-full h-full flex flex-col justify-between px-[10%] py-[9%] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
          <span className="lbl text-[#6D6A63] truncate">{book.title}</span>
          <span className="font-sans text-[10px] tracking-[0.12em] text-[#6D6A63]">
            {book.year}
          </span>
        </div>
        <div className="my-auto space-y-3.5 py-2 overflow-hidden">
          {paras.map((p, idx) => (
            <p
              key={idx}
              className="font-serif text-[13.5px] leading-[1.55] text-[#141414] mask-line-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {p}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#141414]/15 pt-2">
          <span className="font-sans text-[10px] tracking-[0.12em] text-[#6D6A63]">
            {pageIndex + 1} / {samplePages.length}
          </span>
        </div>
      </div>
    );
  };

  const handleBookClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    if (relX > 0.66) {
      turnTo(spread + 1);
    } else if (relX < 0.34) {
      turnTo(spread - 1);
    }
  };

  let leafTransform = '';
  let leafShade = 0;
  if (turning) {
    const rad = (Math.abs(turning.angle) * Math.PI) / 180;
    const sinA = Math.sin(rad);
    leafTransform = `translateZ(${(sinA * 42).toFixed(1)}px) rotateY(${turning.angle.toFixed(2)}deg) rotateZ(${(sinA * 1.5).toFixed(2)}deg) skewY(${(sinA * -3).toFixed(2)}deg)`;
    leafShade = sinA * 0.35;
  }

  const baseLeftSpread = turning ? (turning.dir === 1 ? turning.from : turning.to) : spread;
  const baseRightSpread = turning ? (turning.dir === 1 ? turning.to : turning.from) : spread;
  const leafRectoSpread = turning ? (turning.dir === 1 ? turning.from : turning.to) : spread;
  const leafVersoSpread = turning ? (turning.dir === 1 ? turning.to : turning.from) : spread;

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Leseprobe ${book.title}`}
      className="fixed inset-0 z-[70] bg-[#F3F0EA] flex items-center justify-center overflow-hidden"
      onTouchStart={(e) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartXRef.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartXRef.current) - touchStartXRef.current;
        if (dx < -35) turnTo(spread + 1);
        if (dx > 35) turnTo(spread - 1);
        touchStartXRef.current = null;
      }}
    >
      <button
        type="button"
        aria-label="In den Warenkorb"
        onClick={onAddToCart}
        onMouseEnter={() => onHoverBtn(true)}
        onMouseLeave={() => onHoverBtn(false)}
        className="box lbl fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[80] h-[36px] px-4 bg-[#8B1E2D] text-[#ECE8E0] !border-[#8B1E2D] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#141414]"
      >
        <CartIcon size={15} />
        <span className="ml-2">In den Warenkorb</span>
      </button>

      {/* Two controls only: "SCHLIESSEN" and "PDF HERUNTERLADEN" */}
      <button
        type="button"
        aria-label="SCHLIESSEN"
        onClick={handleClose}
        onMouseEnter={() => onHoverBtn(true)}
        onMouseLeave={() => onHoverBtn(false)}
        className="box lbl fixed top-[28px] left-[36px] z-[80] text-[#141414] bg-[#F3F0EA]/90 hover:bg-[#8B1E2D] hover:text-[#ECE8E0] hover:border-[#8B1E2D] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
      >
        SCHLIESSEN
      </button>

      <button
        type="button"
        aria-label="PDF HERUNTERLADEN"
        onClick={() => downloadDemoPdf(book.id)}
        onMouseEnter={() => onHoverBtn(true)}
        onMouseLeave={() => onHoverBtn(false)}
        className="box lbl fixed top-[28px] right-[36px] z-[80] text-[#141414] bg-[#F3F0EA]/90 hover:bg-[#8B1E2D] hover:text-[#ECE8E0] hover:border-[#8B1E2D] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
      >
        PDF HERUNTERLADEN
      </button>

      <div
        onClick={handleBookClick}
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
          <div className="w-full h-full bg-[#ECE8E0] border border-[#141414]/15 relative overflow-hidden">
            {renderSamplePage(spread)}
          </div>
        ) : (
          <div className="w-full h-full flex relative" style={{ transformStyle: 'preserve-3d' }}>
            <div className="w-1/2 h-full bg-[#ECE8E0] border border-[#141414]/15 relative overflow-hidden">
              {renderSamplePage(baseLeftSpread * 2)}
            </div>
            <div className="w-1/2 h-full bg-[#ECE8E0] border border-[#141414]/15 relative overflow-hidden">
              {renderSamplePage(baseRightSpread * 2 + 1)}
            </div>
            <div
              className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[36px] z-20"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(20,16,10,.18) 50%, transparent)',
              }}
            />
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
                <div
                  className="absolute inset-0 bg-[#ECE8E0] border border-[#141414]/15 overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {renderSamplePage(leafRectoSpread * 2 + 1)}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(20,16,10,0.85))',
                      opacity: leafShade,
                    }}
                  />
                </div>
                <div
                  className="absolute inset-0 bg-[#ECE8E0] border border-[#141414]/15 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {renderSamplePage(leafVersoSpread * 2)}
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
          </div>
        )}
      </div>
    </div>
  );
}
