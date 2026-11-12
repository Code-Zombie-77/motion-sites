import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BOOKS, BookEntry, PRICE } from '../data/books';
import { BookCoverArtwork } from './BookArtwork';
import { createCartScene } from './cartScene';

export interface CartHandle {
  /** Rolls the cart in and drops the book into the basket. */
  add: (book: BookEntry, from: DOMRect | null) => void;
  toggle: () => void;
}

const KEY = 'wendland-cart';
const euro = (n: number) => `€ ${n.toFixed(2).replace('.', ',')}`;
const priceOf = (b: BookEntry) => PRICE[b.kind].hardcover;

function loadIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((id) => BOOKS.some((b) => b.id === id)) : [];
  } catch {
    return [];
  }
}

export function CartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
      <circle cx="10" cy="20.5" r="1.4" />
      <circle cx="18" cy="20.5" r="1.4" />
    </svg>
  );
}

// Full-size cover scaled down, so small sizes show the same artwork as the shelf
function CoverThumb({ book, w, h }: { book: BookEntry; w: number; h: number }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-[2px] relative shadow-[2px_3px_6px_rgba(20,16,10,.45)]" style={{ width: w, height: h }}>
      <div className="absolute left-0 top-0" style={{ width: 200, height: 300, transform: `scale(${w / 200}, ${h / 300})`, transformOrigin: '0 0' }}>
        <BookCoverArtwork book={book} sheetsLoaded={{}} />
      </div>
    </div>
  );
}

export const Cart3D = forwardRef<
  CartHandle,
  { reducedMotion: boolean; onHoverBtn: (h: boolean) => void; onCountChange: (n: number) => void }
>(function Cart3D({ reducedMotion, onHoverBtn, onCountChange }, ref) {
  const [ids, setIds] = useState<string[]>(loadIds);
  const [panelOpen, setPanelOpen] = useState(false);
  const [called, setCalled] = useState(false);
  const [flying, setFlying] = useState<{ book: BookEntry; from: DOMRect | null } | null>(null);
  const parked = ids.length > 0 || called || panelOpen || !!flying;
  const anchorRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ReturnType<typeof createCartScene> | null>(null);
  const spin = useRef({ dragging: false, lastX: 0, moved: 0 });

  // Real WebGL cart: turns with the pointer, the camera rises and falls, dragging spins it
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = createCartScene(canvasRef.current);
    sceneRef.current = scene;
    const onMove = (e: PointerEvent) => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (a) {
        scene.pointer(
          Math.max(-1, Math.min(1, (e.clientX - a.left - a.width / 2) / 620)),
          Math.max(-1, Math.min(1, (e.clientY - a.top - a.height / 2) / 480))
        );
      }
      const s = spin.current;
      if (s.dragging) {
        scene.spin(e.clientX - s.lastX);
        s.moved += Math.abs(e.clientX - s.lastX);
        s.lastX = e.clientX;
      }
    };
    const onUp = () => {
      spin.current.dragging = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('resize', scene.resize);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', scene.resize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setRunning(parked);
  }, [parked]);

  useEffect(() => {
    sceneRef.current?.setBooks(ids.map((id) => BOOKS.find((b) => b.id === id)!));
  }, [ids]);


  useEffect(() => {
    onCountChange(ids.length);
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable: cart still works for this visit */
    }
  }, [ids]);

  useImperativeHandle(ref, () => ({
    add: (book, from) => {
      setCalled(true);
      if (reducedMotion) setIds((p) => [...p, book.id]);
      else setFlying({ book, from });
    },
    toggle: () => {
      setCalled(true);
      setPanelOpen((p) => !p);
    },
  }));

  // Flight: an arc from the shelf into the basket, then the book lands in the stack
  useEffect(() => {
    if (!flying || !flyRef.current || !anchorRef.current) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const a = anchorRef.current.getBoundingClientRect();
    const f = flying.from ?? new DOMRect(W / 2 - 90, H / 2 - 130, 180, 260);
    const w = 90;
    const h = 130;
    const sx = f.left + f.width / 2 - w / 2;
    const sy = f.top + f.height / 2 - h / 2;
    const tx = a.left + a.width / 2 - w / 2;
    const ty = a.top + a.height * 0.42 - h / 2;
    const midY = Math.min(sy, ty) - 90;
    const scale0 = f.height / h;
    const anim = flyRef.current.animate(
      [
        { transform: `translate3d(${sx}px,${sy}px,0) scale(${scale0}) rotateY(0deg)`, opacity: 1, offset: 0 },
        { transform: `translate3d(${(sx + tx) / 2}px,${midY}px,0) scale(.85) rotateY(-30deg) rotateZ(10deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate3d(${tx}px,${ty - 70}px,0) scale(.42) rotateY(-55deg) rotateZ(4deg)`, opacity: 1, offset: 0.84 },
        { transform: `translate3d(${tx}px,${ty + 6}px,0) scale(.34) rotateY(-60deg) rotateX(40deg)`, opacity: 0, offset: 1 },
      ],
      { duration: 1250, delay: 420, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'both' }
    );
    anim.onfinish = () => {
      setIds((p) => [...p, flying.book.id]);
      setFlying(null);
    };
    return () => anim.cancel();
  }, [flying]);

  const items = ids.map((id, i) => ({ book: BOOKS.find((b) => b.id === id)!, i }));
  const total = items.reduce((s, { book }) => s + priceOf(book), 0);
  const more = BOOKS.filter((b) => !ids.includes(b.id)).slice(0, 4);
  const hoverProps = { onMouseEnter: () => onHoverBtn(true), onMouseLeave: () => onHoverBtn(false) };

  return (
    <div data-cart>
      {/* Parked anchor: the cart rolls in from the right edge */}
      <div ref={anchorRef} className="cart-anchor">
        <button
          type="button"
          aria-label={`Warenkorb öffnen, ${ids.length} Bücher`}
          onClick={(e) => {
            e.stopPropagation();
            if (spin.current.moved < 5) setPanelOpen((p) => !p);
          }}
          onPointerDown={(e) => {
            spin.current.dragging = true;
            spin.current.lastX = e.clientX;
            spin.current.moved = 0;
          }}
          {...hoverProps}
          className={`cart-roller ${parked ? 'is-parked' : ''}`}
        >
          <canvas ref={canvasRef} className="cart-canvas" />
          {ids.length > 0 && <span className="cart-badge">{ids.length}</span>}
        </button>
      </div>

      {flying && (
        <div ref={flyRef} className="cart-fly" aria-hidden="true">
          <BookCoverArtwork book={flying.book} sheetsLoaded={{}} />
        </div>
      )}

      {/* Order sheet with "more books" */}
      <aside
        aria-label="Warenkorb"
        aria-hidden={!panelOpen}
        className={`cart-panel ${panelOpen ? 'is-open' : ''}`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-fraktur text-[32px] text-[#8B1E2D] leading-none">Warenkorb</h2>
          <button type="button" tabIndex={panelOpen ? 0 : -1} onClick={() => setPanelOpen(false)} {...hoverProps} className="lbl text-[#141414]">
            Schliessen
          </button>
        </div>

        {items.length === 0 && (
          <p className="font-serif text-[16px] text-[#6D6A63] py-3">Noch keine Bücher im Korb.</p>
        )}
        {items.map(({ book, i }) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#141414]/15">
            <div className="cart-thumb"><CoverThumb book={book} w={54} h={80} /></div>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[15px] leading-tight truncate">{book.title}</div>
              <div className="font-serif text-[13px] text-[#6D6A63]">{euro(priceOf(book))}</div>
            </div>
            <button
              type="button"
              tabIndex={panelOpen ? 0 : -1}
              aria-label={`${book.title} entfernen`}
              onClick={() => setIds((p) => p.filter((_, n) => n !== i))}
              {...hoverProps}
              className="text-[#8B1E2D] text-[20px] px-2"
            >
              ×
            </button>
          </div>
        ))}

        {items.length > 0 && (
          <div className="flex justify-between items-baseline pt-4">
            <span className="lbl">Summe (Hardcover)</span>
            <span className="font-serif text-[22px]">{euro(total)}</span>
          </div>
        )}

        <h3 className="lbl text-[#8B1E2D] mt-7 mb-2">Weitere Bücher hinzufügen</h3>
        {more.map((book) => (
          <div key={book.id} className="flex items-center gap-3 py-2">
            <div className="cart-thumb"><CoverThumb book={book} w={46} h={68} /></div>
            <div className="min-w-0 flex-1 font-serif text-[14px] leading-tight truncate">{book.title}</div>
            <button
              type="button"
              tabIndex={panelOpen ? 0 : -1}
              aria-label={`${book.title} hinzufügen`}
              onClick={() => setIds((p) => [...p, book.id])}
              {...hoverProps}
              className="box lbl shrink-0 hover:bg-[#8B1E2D] hover:text-[#ECE8E0] transition-colors"
            >
              <CartIcon size={13} />
              <span className="ml-1.5">Korb</span>
            </button>
          </div>
        ))}
      </aside>
    </div>
  );
});
