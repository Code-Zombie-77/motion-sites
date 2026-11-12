import React, { useEffect, useRef } from 'react';

interface PricingSheetProps {
  isOpen: boolean;
  originRect: DOMRect | null;
  onClose: () => void;
  onOpenReader: () => void;
  reducedMotion: boolean;
  onHoverBtn: (hovered: boolean) => void;
}

export function PricingSheet({
  isOpen,
  originRect,
  onClose,
  onOpenReader,
  reducedMotion,
  onHoverBtn,
}: PricingSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || reducedMotion || !sheetRef.current) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const rect = originRect ?? new DOMRect(W - 140, 28, 60, 20);
    const top = Math.max(0, rect.top);
    const left = Math.max(0, rect.left);
    const right = Math.max(0, W - rect.right);
    const bottom = Math.max(0, H - rect.bottom);

    sheetRef.current.getAnimations().forEach((a) => a.cancel());
    sheetRef.current.animate(
      [
        { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 2px)` },
        { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
      ],
      {
        duration: 850,
        easing: 'cubic-bezier(.76,0,.18,1)',
        fill: 'both',
      }
    );
  }, [isOpen, originRect, reducedMotion]);

  if (!isOpen) return null;

  const cards = [
    {
      name: 'Leseprobe',
      price: '€ 0',
      list: ['Leseprobe und Demo-PDF für alle 12 Bücher'],
      btn: 'LESEN',
      action: () => {
        onClose();
        onOpenReader();
      },
    },
    {
      name: 'Einzelband',
      price: 'ab € 2,99',
      list: ['Ein Buch in der Ausgabe Ihrer Wahl'],
      btn: 'BUCH WÄHLEN',
      action: () => {
        onClose();
      },
    },
    {
      name: 'Bibliothek',
      price: '€ 9,90 pro Monat',
      list: ['Alle 12 Bücher als E-Books'],
      btn: 'STARTEN',
      action: () => {},
    },
  ];

  const tableRows = [
    ['Demo-PDF', '€ 0', '€ 0'],
    ['E-Book', '€ 2,99', '€ 8,99'],
    ['Taschenbuch', '€ 6,90', '€ 14,90'],
    ['Hardcover', '€ 18,00', '€ 24,00'],
  ];

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label="Preise"
      className="fixed inset-0 z-[55] bg-[#F3F0EA] pt-[92px] pb-[48px] px-[36px] max-md:px-[16px] max-md:pt-[76px] overflow-y-auto flex flex-col items-center justify-center max-md:justify-start"
    >
      <div className="w-full max-w-[980px] flex flex-col gap-8">
        {/* Three plain cards (tall pages with a 1px gold frame, name, price, a short list, one button) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div key={card.name} className="overflow-hidden">
              <div
                className="border border-[#B08D3C] bg-[#ECE8E0] p-7 min-h-[300px] flex flex-col justify-between mask-line-in"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <div>
                  <div className="lbl text-[#8B1E2D]">{card.name}</div>
                  <div className="font-serif font-medium text-[32px] leading-tight text-[#141414] mt-3 tabular-nums">
                    {card.price}
                  </div>
                  <ul className="mt-6 space-y-2 border-t border-[#141414]/15 pt-4">
                    {card.list.map((item) => (
                      <li
                        key={item}
                        className="font-serif text-[15px] leading-[1.45] text-[#141414]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    aria-label={card.btn}
                    onClick={card.action}
                    onMouseEnter={() => onHoverBtn(true)}
                    onMouseLeave={() => onHoverBtn(false)}
                    className="box lbl w-full justify-center h-[34px] text-[#141414] hover:bg-[#8B1E2D] hover:text-[#ECE8E0] hover:border-[#8B1E2D] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#8B1E2D]"
                  >
                    {card.btn}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The edition table sits below the cards */}
        <div className="overflow-hidden">
          <div
            className="border border-[#B08D3C] bg-[#ECE8E0] p-6 mask-line-in"
            style={{ animationDelay: '270ms' }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#141414]/30">
                  <th className="py-2.5 lbl text-[#6D6A63]">Ausgabe</th>
                  <th className="py-2.5 lbl text-[#6D6A63]">Klassiker</th>
                  <th className="py-2.5 lbl text-[#6D6A63]">Wendland Original</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(([ed, cl, or]) => (
                  <tr key={ed} className="border-b border-[#141414]/15 last:border-b-0">
                    <td className="py-3 font-sans font-medium text-[12px] uppercase tracking-[0.06em] text-[#141414]">
                      {ed}
                    </td>
                    <td className="py-3 font-serif text-[16px] text-[#141414] tabular-nums">
                      {cl}
                    </td>
                    <td className="py-3 font-serif text-[16px] text-[#141414] tabular-nums">
                      {or}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
