import React from 'react';
import { BookEntry, CROP, SHEET } from '../data/books';

// Publisher seal: a book and a quill in a circle in oxblood (#8B1E2D)
export function PublisherSeal({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#8B1E2D" stroke="#B08D3C" strokeWidth="1" />
      <circle cx="16" cy="16" r="11.5" stroke="#EFE6D2" strokeWidth="0.6" strokeOpacity="0.6" />
      {/* Open book */}
      <path
        d="M9 19.5V12.5C9 12.5 12 11.5 16 13C20 11.5 23 12.5 23 12.5V19.5C23 19.5 20 18.5 16 20C12 18.5 9 19.5 9 19.5Z"
        stroke="#EFE6D2"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M16 13V20" stroke="#EFE6D2" strokeWidth="1" />
      {/* Quill */}
      <path
        d="M21.5 8.5C18.5 10.5 15.5 14.5 14 22.5M21.5 8.5C21.5 12 19 15 16.5 16.5"
        stroke="#B08D3C"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Spine top mini-icons per table in section 3
export function SpineTopIcon({ id }: { id: string }) {
  const gold = '#B08D3C';
  const cream = '#EFE6D2';
  switch (id) {
    case 'werther': // small yellow waistcoat icon
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M7 4L10 6L12 10L14 6L17 4L19 9V20L14 18L12 20L10 18L5 20V9L7 4Z"
            fill="#C79A3B"
            stroke={gold}
            strokeWidth="1.2"
          />
        </svg>
      );
    case 'sandmann': // eye icon
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M2 12C5 7 9 5 12 5C15 5 19 7 22 12C19 17 15 19 12 19C9 19 5 17 2 12Z"
            fill="#8B1E2D"
            stroke={gold}
            strokeWidth="1.2"
          />
          <circle cx="12" cy="12" r="3.2" fill={cream} />
          <circle cx="12" cy="12" r="1.4" fill="#141414" />
        </svg>
      );
    case 'schimmelreiter': // horse head
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M7 20V13L5 10L8 5L11 3L13 6L18 8L17 11L13 11L15 20H7Z"
            fill={cream}
            stroke={gold}
            strokeWidth="1.1"
          />
        </svg>
      );
    case 'effi': // swing
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <line x1="8" y1="3" x2="8" y2="17" stroke="#1E3B2B" strokeWidth="1.3" />
          <line x1="16" y1="3" x2="16" y2="17" stroke="#1E3B2B" strokeWidth="1.3" />
          <rect x="5" y="17" width="14" height="2.5" fill="#8B1E2D" />
        </svg>
      );
    case 'venedig': // gondola prow (ferro)
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M9 21V8C9 5 12 3 16 4C14 6 13 8 13 8H16M13 11H16M13 14H16"
            stroke="#141414"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'verwandlung': // staircase
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M4 19H8V15H12V11H16V7H20"
            stroke={gold}
            strokeWidth="1.6"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'schach': // chess king
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M12 2V6M10 4H14" stroke="#141414" strokeWidth="1.4" />
          <path d="M7 19H17L15 9L12 11L9 9L7 19Z" fill="#141414" stroke={gold} strokeWidth="1" />
        </svg>
      );
    case 'glasberg': // mountain
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <polygon points="12,4 21,19 3,19" fill={cream} stroke={gold} strokeWidth="1.2" />
          <polyline points="12,4 14,12 10,15 12,19" stroke="#1B2A49" strokeWidth="1" />
        </svg>
      );
    case 'weissfluss': // bridge
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M2 10H10M14 10H22M4 18C4 13 8 12 10 12M20 18C20 13 16 12 14 12" stroke={cream} strokeWidth="1.5" />
        </svg>
      );
    case 'zeugen': // window
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <rect x="6" y="4" width="12" height="16" stroke="#141414" strokeWidth="1.4" fill="#EFE6D2" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#141414" strokeWidth="1.2" />
          <line x1="6" y1="12" x2="18" y2="12" stroke="#141414" strokeWidth="1.2" />
        </svg>
      );
    case 'geruch': // nose
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path
            d="M11 4L16 15C16 16.5 14.5 17.5 12.5 17.5H9"
            stroke={gold}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'uhrmacher': // gear
    default:
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <circle cx="12" cy="12" r="5" stroke={gold} strokeWidth="1.6" />
          <circle cx="12" cy="12" r="1.8" fill={gold} />
          <path d="M12 3V6M12 18V21M3 12H6M18 12H21M5.6 5.6L7.8 7.8M16.2 16.2L18.4 18.4M18.4 5.6L16.2 7.8M7.8 16.2L5.6 18.4" stroke={gold} strokeWidth="1.4" />
        </svg>
      );
  }
}

// Detailed Linocut / Screen-print SVG motif for each cover (viewBox 0 0 360 420)
export function CoverMotifSvg({ id }: { id: string }) {
  switch (id) {
    case 'werther':
      // Prussian-blue cloth, a lone figure in a yellow waistcoat on a hill under a thin moon, gold laurel frame
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Gold laurel frame */}
          <ellipse cx="180" cy="210" rx="135" ry="165" stroke="#B08D3C" strokeWidth="1.5" strokeDasharray="6 3" fill="none" />
          <ellipse cx="180" cy="210" rx="127" ry="157" stroke="#B08D3C" strokeWidth="0.8" fill="none" />
          {/* Thin crescent moon */}
          <path d="M235 75 A 28 28 0 1 1 210 118 A 24 24 0 1 0 235 75 Z" fill="#EFE6D2" />
          {/* Distant cypress & hills */}
          <path d="M48 310 Q 120 265 210 290 T 312 300 L 312 365 L 48 365 Z" fill="#101A30" />
          <path d="M48 330 Q 175 245 312 335 L 312 375 L 48 375 Z" fill="#141414" />
          {/* Linocut hatching on hill */}
          <g stroke="#B08D3C" strokeWidth="0.7" opacity="0.45">
            <line x1="90" y1="320" x2="140" y2="310" />
            <line x1="115" y1="332" x2="195" y2="318" />
            <line x1="150" y1="344" x2="245" y2="330" />
          </g>
          {/* Lone figure in yellow waistcoat */}
          <g transform="translate(166, 188)">
            {/* Dark frock coat */}
            <path d="M8 26 L2 68 L11 68 L14 48 L17 68 L26 68 L20 26 Z" fill="#141414" stroke="#EFE6D2" strokeWidth="0.7" />
            {/* Yellow waistcoat */}
            <path d="M10 27 L18 27 L17 48 L11 48 Z" fill="#C79A3B" />
            {/* Head in profile */}
            <circle cx="14" cy="16" r="6.5" fill="#EFE6D2" />
            {/* Walking stick */}
            <line x1="23" y1="38" x2="29" y2="85" stroke="#B08D3C" strokeWidth="1.4" />
          </g>
        </svg>
      );

    case 'sandmann':
      // Black cloth, a huge oxblood eye with a tiny figure standing in the pupil, scattered white sand
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Scattered white sand */}
          <g fill="#EFE6D2" opacity="0.75">
            <circle cx="72" cy="88" r="1.5" />
            <circle cx="98" cy="112" r="1" />
            <circle cx="280" cy="95" r="1.8" />
            <circle cx="255" cy="74" r="1.2" />
            <circle cx="64" cy="295" r="1.6" />
            <circle cx="105" cy="330" r="1.3" />
            <circle cx="145" cy="348" r="2" />
            <circle cx="215" cy="342" r="1.5" />
            <circle cx="268" cy="318" r="1.7" />
            <circle cx="294" cy="285" r="1.1" />
            <circle cx="180" cy="65" r="1.4" />
            <circle cx="132" cy="78" r="1.2" />
          </g>
          {/* Radiant linocut rays */}
          <g stroke="#B08D3C" strokeWidth="0.9" opacity="0.5">
            <line x1="180" y1="95" x2="180" y2="122" />
            <line x1="120" y1="115" x2="135" y2="136" />
            <line x1="240" y1="115" x2="225" y2="136" />
            <line x1="180" y1="325" x2="180" y2="298" />
            <line x1="120" y1="305" x2="135" y2="284" />
            <line x1="240" y1="305" x2="225" y2="284" />
          </g>
          {/* Huge oxblood eye */}
          <path
            d="M36 210 C 88 128, 272 128, 324 210 C 272 292, 88 292, 36 210 Z"
            fill="#8B1E2D"
            stroke="#B08D3C"
            strokeWidth="2"
          />
          <circle cx="180" cy="210" r="56" fill="#EFE6D2" stroke="#141414" strokeWidth="2" />
          <circle cx="180" cy="210" r="38" fill="#141414" />
          {/* Tiny figure standing in the pupil */}
          <circle cx="180" cy="194" r="4" fill="#EFE6D2" />
          <path d="M174 201 L186 201 L184 226 L176 226 Z" fill="#EFE6D2" />
        </svg>
      );

    case 'schimmelreiter':
      // Deep teal cloth, a white horse rearing on a dike against a violet storm
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Violet storm sky & lightning */}
          <path d="M40 50 H320 V290 H40 Z" fill="#2B1E3E" />
          <path d="M235 60 L205 125 L228 128 L190 205" stroke="#B08D3C" strokeWidth="1.8" fill="none" />
          {/* Storm waves */}
          <path d="M40 275 Q 90 250 140 275 T 240 275 T 320 275 V360 H40 Z" fill="#1B2A49" />
          {/* Dike silhouette */}
          <path d="M40 365 L155 255 L320 325 L320 375 L40 375 Z" fill="#141414" stroke="#B08D3C" strokeWidth="1" />
          {/* Rearing white horse & rider */}
          <g transform="translate(125, 130)">
            {/* Flying cloak */}
            <path d="M42 48 Q 10 38 4 65 Q 25 62 45 66 Z" fill="#8B1E2D" />
            {/* Horse body rearing */}
            <path
              d="M35 135 L42 92 L32 68 L48 35 L68 18 L78 28 L66 44 L76 68 L95 58 L98 66 L76 82 L64 115 L72 142 L62 144 L54 116 L44 138 Z"
              fill="#EFE6D2"
              stroke="#141414"
              strokeWidth="1.2"
            />
          </g>
        </svg>
      );

    case 'effi':
      // Cream cloth with a green swing and a long garden wall, a thin red thread leaving the frame
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Platanen bough at top */}
          <path d="M40 70 Q 180 85 320 65" stroke="#1E3B2B" strokeWidth="5" fill="none" />
          {/* Green swing */}
          <line x1="138" y1="75" x2="138" y2="245" stroke="#1E3B2B" strokeWidth="2.2" />
          <line x1="222" y1="74" x2="222" y2="245" stroke="#1E3B2B" strokeWidth="2.2" />
          <rect x="122" y="245" width="116" height="9" fill="#1E3B2B" />
          {/* Long garden wall */}
          <rect x="45" y="295" width="270" height="58" fill="#1E3B2B" />
          <g stroke="#EFE6D2" strokeWidth="0.9" opacity="0.45">
            <line x1="45" y1="314" x2="315" y2="314" />
            <line x1="45" y1="333" x2="315" y2="333" />
            <line x1="110" y1="295" x2="110" y2="314" />
            <line x1="190" y1="295" x2="190" y2="314" />
            <line x1="265" y1="295" x2="265" y2="314" />
            <line x1="150" y1="314" x2="150" y2="333" />
            <line x1="230" y1="314" x2="230" y2="333" />
          </g>
          {/* Thin red thread leaving the frame */}
          <path
            d="M180 249 C 205 280, 265 255, 358 318"
            stroke="#8B1E2D"
            strokeWidth="2.2"
            fill="none"
          />
        </svg>
      );

    case 'venedig':
      // Ochre cloth, a striped bathing cabin, a gondola prow and a dark sea, gold border
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Dark sea */}
          <rect x="42" y="245" width="276" height="120" fill="#1B2A49" />
          <g stroke="#C79A3B" strokeWidth="1" opacity="0.55">
            <line x1="65" y1="270" x2="165" y2="270" />
            <line x1="195" y1="288" x2="295" y2="288" />
            <line x1="85" y1="312" x2="220" y2="312" />
          </g>
          {/* Striped bathing cabin */}
          <g transform="translate(82, 118)">
            <polygon points="0,32 46,0 92,32" fill="#8B1E2D" stroke="#141414" strokeWidth="1.5" />
            <rect x="6" y="32" width="80" height="95" fill="#EFE6D2" stroke="#141414" strokeWidth="1.5" />
            <rect x="18" y="32" width="12" height="95" fill="#8B1E2D" />
            <rect x="42" y="32" width="12" height="95" fill="#8B1E2D" />
            <rect x="66" y="32" width="12" height="95" fill="#8B1E2D" />
          </g>
          {/* Gondola prow (ferro) in foreground */}
          <path
            d="M215 365 L235 190 C 242 145, 275 130, 295 148 C 276 160, 265 182, 260 205 L284 205 L282 214 L258 214 L256 226 L280 226 L278 235 L254 235 L252 247 L276 247 L274 256 L250 256 L242 365 Z"
            fill="#141414"
          />
        </svg>
      );

    case 'verwandlung':
      // Dark oxblood cloth, a tall staircase and a huge beetle shape made only from shadow, an open door
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Tall staircase */}
          <g stroke="#B08D3C" strokeWidth="1.4" fill="none" opacity="0.7">
            <path d="M52 340 H90 V305 H128 V270 H166 V235 H204 V200 H242" />
            <line x1="52" y1="305" x2="242" y2="165" />
          </g>
          {/* Open door casting light */}
          <polygon points="225,85 292,70 292,235 225,215" fill="#EFE6D2" />
          <polygon points="225,215 292,235 320,360 110,360" fill="#EFE6D2" opacity="0.18" />
          <rect x="225" y="85" width="67" height="130" stroke="#141414" strokeWidth="2" fill="none" />
          {/* Huge beetle shape made only from shadow */}
          <g fill="#141414" opacity="0.92">
            <ellipse cx="168" cy="248" rx="48" ry="68" transform="rotate(-14 168 248)" />
            <ellipse cx="155" cy="176" rx="24" ry="16" transform="rotate(-14 155 176)" />
            <g stroke="#141414" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M135 165 Q 108 135 88 142" />
              <path d="M168 160 Q 185 125 210 128" />
              <path d="M128 210 L 78 192 L 62 215" />
              <path d="M122 248 L 68 252 L 54 282" />
              <path d="M132 288 L 85 318 L 75 348" />
              <path d="M198 195 L 248 175 L 266 196" />
              <path d="M212 235 L 268 232 L 285 258" />
              <path d="M208 278 L 258 302 L 272 332" />
            </g>
          </g>
        </svg>
      );

    case 'schach':
      // Ivory cloth, a chessboard fading into prison bars, one black king
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Prison bars at top */}
          <g stroke="#141414" strokeWidth="3.5">
            <line x1="76" y1="60" x2="76" y2="230" />
            <line x1="118" y1="60" x2="118" y2="230" />
            <line x1="160" y1="60" x2="160" y2="230" />
            <line x1="202" y1="60" x2="202" y2="230" />
            <line x1="244" y1="60" x2="244" y2="230" />
            <line x1="286" y1="60" x2="286" y2="230" />
          </g>
          {/* Chessboard grid below */}
          <g transform="translate(55, 220)">
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3, 4, 5].map((c) =>
                (r + c) % 2 === 0 ? (
                  <rect key={`${r}-${c}`} x={c * 41.6} y={r * 34} width="41.6" height="34" fill="#141414" />
                ) : null
              )
            )}
            <rect x="0" y="0" width="250" height="136" stroke="#141414" strokeWidth="2" fill="none" />
          </g>
          {/* One black king with gold outline */}
          <g transform="translate(152, 148)">
            <path d="M28 6 V22 M20 14 H36" stroke="#8B1E2D" strokeWidth="3.5" />
            <path
              d="M10 96 H46 L40 42 L28 50 L16 42 L10 96 Z"
              fill="#141414"
              stroke="#B08D3C"
              strokeWidth="2"
            />
            <rect x="6" y="96" width="44" height="8" fill="#141414" stroke="#B08D3C" strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'glasberg':
      // Pale blue cloth, a tiny walker on a mountain of faceted glass under a big sun
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Big sun */}
          <circle cx="180" cy="135" r="64" fill="#EFE6D2" stroke="#B08D3C" strokeWidth="1.5" />
          {/* Mountain of faceted glass */}
          <polygon points="180,108 308,355 52,355" fill="#1B2A49" stroke="#EFE6D2" strokeWidth="1.5" />
          <polygon points="180,108 235,355 125,355" fill="#5B7C99" stroke="#EFE6D2" strokeWidth="1.2" />
          <polygon points="180,108 235,235 180,265" fill="#EFE6D2" opacity="0.65" />
          <polygon points="180,108 125,245 180,265" fill="#C79A3B" opacity="0.45" />
          <line x1="180" y1="108" x2="180" y2="355" stroke="#EFE6D2" strokeWidth="1.2" />
          {/* Tiny walker ascending */}
          <g transform="translate(152, 206)">
            <circle cx="6" cy="4" r="3" fill="#8B1E2D" />
            <path d="M3 8 L9 8 L11 20 L2 20 Z" fill="#8B1E2D" />
            <line x1="12" y1="7" x2="15" y2="22" stroke="#EFE6D2" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'weissfluss':
      // Slate grey cloth, a ruined bridge over a white river, three small helmets
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* White river winding vertically */}
          <path d="M145 70 C 210 150, 110 250, 195 365 L 285 365 C 195 250, 265 150, 200 70 Z" fill="#EFE6D2" />
          {/* Ruined bridge */}
          <path
            d="M42 185 H152 V240 C 152 205, 115 205, 100 240 H42 Z"
            fill="#141414"
            stroke="#B08D3C"
            strokeWidth="1.2"
          />
          <path
            d="M222 185 H318 V240 H268 C 255 205, 222 205, 222 240 Z"
            fill="#141414"
            stroke="#B08D3C"
            strokeWidth="1.2"
          />
          {/* Jagged broken timber */}
          <line x1="152" y1="188" x2="176" y2="195" stroke="#B08D3C" strokeWidth="2" />
          <line x1="222" y1="188" x2="202" y2="198" stroke="#B08D3C" strokeWidth="2" />
          {/* Three small helmets in foreground */}
          {[105, 165, 225].map((hx) => (
            <path
              key={hx}
              d={`M${hx} 325 C ${hx} 305, ${hx + 34} 305, ${hx + 34} 325 L ${hx + 38} 330 H ${hx - 4} Z`}
              fill="#141414"
              stroke="#EFE6D2"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      );

    case 'zeugen':
      // Mustard cloth, a row of identical windows, one lit, a typewriter silhouette
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Grid of identical windows, one lit */}
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => {
              const isLit = row === 1 && col === 2;
              const wx = 66 + col * 62;
              const wy = 72 + row * 56;
              return (
                <g key={`${row}-${col}`}>
                  <rect
                    x={wx}
                    y={wy}
                    width="38"
                    height="42"
                    fill={isLit ? '#EFE6D2' : '#141414'}
                    stroke="#141414"
                    strokeWidth="1.5"
                  />
                  {isLit && <circle cx={wx + 19} cy={wy + 24} r="6" fill="#8B1E2D" />}
                  <line x1={wx + 19} y1={wy} x2={wx + 19} y2={wy + 42} stroke="#B88928" strokeWidth="1.2" />
                  <line x1={wx} y1={wy + 21} x2={wx + 38} y2={wy + 21} stroke="#B88928" strokeWidth="1.2" />
                </g>
              );
            })
          )}
          {/* Typewriter silhouette */}
          <g transform="translate(95, 255)">
            <rect x="28" y="0" width="114" height="32" fill="#EFE6D2" stroke="#141414" strokeWidth="1.5" />
            <rect x="12" y="26" width="146" height="10" fill="#141414" />
            <path d="M18 36 L152 36 L166 86 L4 86 Z" fill="#141414" />
            {/* Keys */}
            {[0, 1, 2].map((kr) =>
              [0, 1, 2, 3, 4, 5, 6].map((kc) => (
                <circle key={`${kr}-${kc}`} cx={32 + kc * 18 + (kr % 2) * 5} cy={54 + kr * 11} r="3" fill="#EFE6D2" />
              ))
            )}
          </g>
        </svg>
      );

    case 'geruch':
      // Rose cloth, a city map drawn with swirling scent trails and a large nose in profile
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* City street map blocks */}
          <g fill="#141414" opacity="0.35">
            <rect x="58" y="78" width="65" height="48" />
            <rect x="140" y="78" width="85" height="48" />
            <rect x="58" y="144" width="48" height="75" />
            <rect x="235" y="120" width="62" height="82" />
            <rect x="68" y="245" width="75" height="68" />
            <rect x="210" y="255" width="88" height="62" />
          </g>
          {/* Swirling scent trails */}
          <g fill="none" stroke="#EFE6D2" strokeWidth="1.8" opacity="0.85">
            <path d="M55 230 C 120 180, 165 290, 295 215" />
            <path d="M65 295 C 145 340, 210 240, 305 290" stroke="#B08D3C" strokeWidth="2.2" />
            <path d="M85 130 C 145 95, 210 175, 290 110" />
          </g>
          {/* Large nose in profile */}
          <path
            d="M162 85 L224 222 C 232 242, 214 256, 188 254 C 178 254, 168 246, 164 238"
            fill="#8B1E2D"
            stroke="#B08D3C"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'uhrmacher':
    default:
      // Forest green cloth, an astronomical clock face made of gears, a small telescope
      return (
        <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
          {/* Astronomical clock face made of gears */}
          <g transform="translate(180, 195)">
            <circle cx="0" cy="0" r="102" stroke="#B08D3C" strokeWidth="2" fill="none" />
            <circle cx="0" cy="0" r="92" stroke="#B08D3C" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <circle cx="0" cy="0" r="64" stroke="#EFE6D2" strokeWidth="1.5" fill="#141414" fillOpacity="0.45" />
            <circle cx="-24" cy="-18" r="28" stroke="#B08D3C" strokeWidth="1.6" fill="none" />
            <circle cx="28" cy="22" r="22" stroke="#C79A3B" strokeWidth="1.5" fill="none" />
            {/* Clock numerals/ticks */}
            {Array.from({ length: 12 }).map((_, idx) => {
              const ang = (idx * 30 * Math.PI) / 180;
              return (
                <line
                  key={idx}
                  x1={Math.cos(ang) * 78}
                  y1={Math.sin(ang) * 78}
                  x2={Math.cos(ang) * 90}
                  y2={Math.sin(ang) * 90}
                  stroke="#EFE6D2"
                  strokeWidth="1.8"
                />
              );
            })}
            {/* Hands */}
            <line x1="0" y1="0" x2="-38" y2="-56" stroke="#B08D3C" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="62" y2="-18" stroke="#EFE6D2" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="5" fill="#8B1E2D" stroke="#B08D3C" strokeWidth="1.5" />
          </g>
          {/* Small telescope at bottom */}
          <g transform="translate(135, 315)">
            <polygon points="0,18 78,0 82,14 4,26" fill="#B08D3C" stroke="#141414" strokeWidth="1.2" />
            <line x1="42" y1="16" x2="26" y2="46" stroke="#EFE6D2" strokeWidth="1.8" />
            <line x1="42" y1="16" x2="58" y2="46" stroke="#EFE6D2" strokeWidth="1.8" />
            <line x1="42" y1="16" x2="42" y2="48" stroke="#EFE6D2" strokeWidth="1.8" />
          </g>
        </svg>
      );
  }
}

// Helper that returns sheet background style if real sheet URL is loaded, or null if procedural fallback is active
export function getSheetFaceStyle(cropKey: string, sheetsLoaded: Record<string, boolean>): React.CSSProperties | null {
  const crop = CROP[cropKey];
  if (!crop) return null;
  const [sheetId, x, y, w, h] = crop;
  const sheet = SHEET[sheetId];
  if (!sheet) return null;
  const [url, W, H] = sheet;
  if (!url || url.startsWith('PASTE_') || !sheetsLoaded[sheetId]) {
    return null;
  }
  const bgW = (W / w) * 100;
  const bgH = (H / h) * 100;
  const posX = (x / (W - w)) * 100;
  const posY = (y / (H - h)) * 100;
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${bgW}% ${bgH}%`,
    backgroundPosition: `${posX}% ${posY}%`,
  };
}

export type BookMaterial = 'leather' | 'card' | 'cloth';
const MATERIALS: Record<string, BookMaterial> = {
  werther: 'leather',
  sandmann: 'leather',
  schimmelreiter: 'leather',
  verwandlung: 'leather',
  uhrmacher: 'leather',
  effi: 'card',
  venedig: 'card',
  schach: 'card',
  zeugen: 'card',
  glasberg: 'cloth',
  weissfluss: 'cloth',
  geruch: 'cloth',
};
export const bookMaterial = (id: string): BookMaterial => MATERIALS[id] ?? 'cloth';

// Abstract printed covers, after Bauhaus posters and Insel-era German book design.
// Returns null where the book keeps its figurative block print.
function abstractMotif(id: string) {
  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 360 420" className="w-full h-full" aria-hidden="true">
      {children}
    </svg>
  );
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);
  switch (id) {
    case 'werther':
      return svg(
        <>
          {range(9).map((i) => (
            <circle key={i} cx="232" cy="118" r={24 + i * 25} fill="none" stroke="#D9BE78" strokeWidth={5.5 - i * 0.5} opacity={1 - i * 0.08} />
          ))}
          <circle cx="232" cy="118" r="20" fill="#EFE6D2" />
          <path d="M0 420 V310 Q 130 215 360 330 V420 Z" fill="#0D1526" />
          <rect x="112" y="228" width="7" height="44" fill="#C79A3B" />
        </>
      );
    case 'schach':
      return svg(
        range(7).map((r) =>
          range(6).map((c) =>
            (r + c) % 2 === 0 ? (
              <rect key={`${r}-${c}`} x={30 + c * 50 + Math.sin(r * 1.3) * r * 5} y={30 + r * 52} width="50" height="52" fill={r === 3 && c === 3 ? '#8B1E2D' : '#141414'} />
            ) : null
          )
        )
      );
    case 'glasberg':
      return svg(
        <>
          <circle cx="245" cy="105" r="62" fill="#EFE6D2" />
          <polygon points="30,390 150,70 212,390" fill="#1B2A49" />
          <polygon points="150,70 300,390 212,390" fill="#EFE6D2" opacity=".72" />
          <polygon points="150,70 212,390 118,250" fill="#8B1E2D" opacity=".78" />
          <polygon points="238,240 340,390 208,390" fill="#1B2A49" opacity=".7" />
        </>
      );
    case 'weissfluss':
      return svg(
        range(15).map((i) => (
          <path key={i} d={`M-10 ${40 + i * 25} C 90 ${i * 25 - 20}, 220 ${110 + i * 25}, 370 ${30 + i * 25}`} fill="none" stroke="#EFE6D2" strokeWidth={1.5 + (i % 4)} />
        ))
      );
    case 'geruch':
      return svg(
        range(12).map((i) => (
          <ellipse key={i} cx={180 - i * 3} cy={210 - i * 2} rx={16 + i * 13} ry={12 + i * 15} transform={`rotate(${i * 14} 180 210)`} fill="none" stroke={i % 3 === 0 ? '#8B1E2D' : i % 3 === 1 ? '#EFE6D2' : '#5C2430'} strokeWidth={2 + (i % 4) * 1.5} />
        ))
      );
    case 'uhrmacher':
      return svg(
        <>
          {[[180, 210, 130], [150, 170, 72], [226, 262, 50], [226, 262, 16], [150, 170, 26]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#D9BE78" strokeWidth="3" strokeDasharray={i % 2 ? '2 7' : undefined} />
          ))}
          <line x1="50" y1="340" x2="310" y2="80" stroke="#D9BE78" strokeWidth="2" />
          <circle cx="150" cy="170" r="8" fill="#EFE6D2" />
        </>
      );
    default:
      return null;
  }
}

export const coverMotif = (id: string) => abstractMotif(id) ?? <CoverMotifSvg id={id} />;

// Procedural or sheet-backed Front Cover Face
export function BookCoverArtwork({ book, sheetsLoaded }: { book: BookEntry; sheetsLoaded: Record<string, boolean> }) {
  const sheetStyle = getSheetFaceStyle('cover-' + book.id, sheetsLoaded);
  if (sheetStyle) return <div className="w-full h-full relative" style={sheetStyle} />;

  const material = bookMaterial(book.id);
  const motif = abstractMotif(book.id) ?? <CoverMotifSvg id={book.id} />;
  const titleSize = book.title.length > 20 ? 'clamp(11px, 1.25vw, 17px)' : 'clamp(14px, 1.7vw, 24px)';
  const subSize = 'clamp(6.5px, 0.72vw, 10px)';

  const title =
    material === 'card' ? (
      <div className="paper-label text-center mx-[5%]">
        <div className="font-fraktur leading-[1.08] text-[#3a1016]" style={{ fontSize: titleSize }}>{book.title}</div>
        <div className="font-serif mt-[2px] tracking-[0.12em] text-[#3a1016]" style={{ fontSize: subSize }}>{book.surname}</div>
      </div>
    ) : (
      <div className="text-center pt-1">
        <div className="font-fraktur foil leading-[1.08]" style={{ fontSize: titleSize }}>{book.title}</div>
        <div className="font-serif foil mt-[3px] tracking-[0.16em]" style={{ fontSize: subSize }}>{book.surname}</div>
      </div>
    );

  return (
    <div className="w-full h-full relative overflow-hidden select-none" style={{ backgroundColor: book.clothBg, borderRadius: 'inherit', isolation: 'isolate' }}>
      <div className="relative w-full h-full flex flex-col justify-between pl-[13%] pr-[6%] py-[7%]">
        {material === 'leather' && (
          <div
            className="absolute inset-y-[3.5%] left-[11%] right-[3.5%] pointer-events-none"
            style={{ border: '1.5px solid #B99A50', outline: '0.5px solid rgba(185,154,80,.7)', outlineOffset: '-5px' }}
          />
        )}
        <div className="relative px-[6%] pt-[3%]">{title}</div>
        <div className="press relative flex-1 min-h-0 my-1 flex items-center justify-center" style={{ mixBlendMode: material === 'card' ? 'multiply' : 'normal' }}>
          {motif}
        </div>
        <div className="relative flex justify-center pb-[3%]">
          <PublisherSeal size={16} />
        </div>
      </div>
      <div className="hinge" />
      <div className={`mat mat-${material}`} />
      <div className="bevel" />
    </div>
  );
}

// Procedural or sheet-backed Spine Face
export function BookSpineArtwork({ book, sheetsLoaded }: { book: BookEntry; sheetsLoaded: Record<string, boolean> }) {
  const sheetStyle = getSheetFaceStyle('spine-' + book.id, sheetsLoaded);
  if (sheetStyle) return <div className="w-full h-full relative" style={sheetStyle} />;

  const material = bookMaterial(book.id);
  const light = material === 'card';
  const inkCls = light ? '' : 'foil';
  const inkColor = light ? '#3a1016' : undefined;

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-between py-[10%] px-[6%] select-none" style={{ backgroundColor: book.clothBg, borderRadius: 'inherit' }}>
      <div className="relative flex flex-col items-center w-full gap-2">
        <SpineTopIcon id={book.id} />
        <div className="spine-band" />
      </div>
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-1">
        <span className={`font-fraktur whitespace-nowrap ${inkCls}`} style={{ writingMode: 'vertical-rl', color: inkColor, fontSize: 'clamp(11px, 1.5vh, 17px)' }}>
          {book.title}
        </span>
      </div>
      <div className="relative flex flex-col items-center w-full gap-1.5">
        <div className="spine-band" />
        <span className={`font-serif tracking-[0.04em] truncate max-w-full ${inkCls}`} style={{ color: inkColor, fontSize: 'clamp(6px, 0.62vw, 8.5px)' }}>
          {book.kind === 'original' ? 'WENDLAND' : book.surname}
        </span>
        <PublisherSeal size={13} />
      </div>
      <div className={`mat mat-${material}`} />
      <div className="spine-round" />
    </div>
  );
}

// Frontispiece SVG poster (viewBox 600 x 900) revealed by the ink mask on Spread 1
export function FrontispieceSvg({
  book,
  inkRadii,
  sheetsLoaded,
}: {
  book: BookEntry;
  inkRadii: number[];
  sheetsLoaded: Record<string, boolean>;
}) {
  const crop = CROP['cover-' + book.id];
  const sheet = crop ? SHEET[crop[0]] : null;
  const hasRealSheet =
    crop && sheet && sheet[0] && !sheet[0].startsWith('PASTE_') && sheetsLoaded[crop[0]];

  // Circles (cx, cy, delay ms) in a 600 x 900 box:
  // (190,330,0) (430,600,120) (320,120,220) (110,760,300) (500,250,360) (330,860,420) (290,470,180)
  const circles = [
    [190, 330],
    [430, 600],
    [320, 120],
    [110, 760],
    [500, 250],
    [330, 860],
    [290, 470],
  ];

  return (
    <svg viewBox="0 0 600 900" className="w-full h-full block" aria-label={book.title}>
      <defs>
        <filter id="ink-bleed-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011"
            numOctaves={3}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={120}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id="frontispiece-box-clip">
          <rect x="0" y="0" width="600" height="900" />
        </clipPath>
        <mask id="ink-reveal-mask">
          <rect x="0" y="0" width="600" height="900" fill="black" />
          <g filter="url(#ink-bleed-filter)" fill="white">
            {circles.map(([cx, cy], idx) => (
              <circle key={idx} cx={cx} cy={cy} r={inkRadii[idx] ?? 0} />
            ))}
          </g>
        </mask>
      </defs>

      <g clipPath="url(#frontispiece-box-clip)" mask="url(#ink-reveal-mask)">
        {hasRealSheet && crop && sheet ? (
          <image
            href={sheet[0]}
            x={(-crop[1] * 600) / crop[3]}
            y={(-crop[2] * 900) / crop[4]}
            width={(sheet[1] * 600) / crop[3]}
            height={(sheet[2] * 900) / crop[4]}
            preserveAspectRatio="none"
          />
        ) : (
          <g>
            <rect x="0" y="0" width="600" height="900" fill={book.clothBg} />
            <rect
              x="36"
              y="36"
              width="528"
              height="828"
              fill="none"
              stroke="#B08D3C"
              strokeWidth="3"
            />
            <rect
              x="46"
              y="46"
              width="508"
              height="808"
              fill="none"
              stroke="#B08D3C"
              strokeWidth="1.2"
            />
            <text
              x="300"
              y="115"
              textAnchor="middle"
              fill={book.isLightCloth ? '#8B1E2D' : '#B08D3C'}
              fontFamily="Newsreader, Georgia, serif"
              fontWeight="600"
              fontSize="32"
            >
              {book.title.toUpperCase()}
            </text>
            <text
              x="300"
              y="150"
              textAnchor="middle"
              fill={book.isLightCloth ? '#141414' : '#EFE6D2'}
              fontFamily="Inter Tight, system-ui, sans-serif"
              fontWeight="600"
              fontSize="15"
              letterSpacing="4"
            >
              {book.surname}
            </text>
            <svg x="75" y="175" width="450" height="560" viewBox="0 0 360 420">
              <CoverMotifSvg id={book.id} />
            </svg>
            <g transform="translate(278, 790) scale(1.4)">
              <PublisherSeal size={32} />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
