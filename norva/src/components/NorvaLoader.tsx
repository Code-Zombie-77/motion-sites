import React from 'react';

interface NorvaLoaderProps {
  visible: boolean;
  fadingOut: boolean;
  reducedMotion: boolean;
}

/**
 * Loader specification:
 * - A full-screen night panel (#0f1626) with two dotted ellipses (one wide, one circular) around the mark.
 * - The mark is six cyan (#3fd8ff) squares in a ring and a lime (#c6ff2e) chevron, spinning every 1.6 s at an ease.
 * - The loader fades out (.6s) 350ms after the clip's first frame loads, or after 3.5 s at most.
 * - Reduced motion: no loader spin and no transitions.
 */
export const NorvaLoader: React.FC<NorvaLoaderProps> = ({
  visible,
  fadingOut,
  reducedMotion,
}) => {
  if (!visible) return null;

  // Six cyan squares arranged in a ring (60 deg apart)
  const ringAngles = [0, 60, 120, 180, 240, 300];
  const radius = 26;

  return (
    <div
      id="norva-loader"
      role="status"
      aria-label="NORVA Industrieservice wird geladen"
      className={`norva-loader ${fadingOut ? 'is-fading' : ''} ${
        reducedMotion ? 'is-reduced-motion' : ''
      }`}
    >
      <div className="norva-loader-stage">
        <svg
          className="norva-loader-ellipses"
          viewBox="0 0 360 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Wide dotted ellipse */}
          <ellipse
            cx="180"
            cy="110"
            rx="158"
            ry="62"
            stroke="rgba(244, 246, 250, 0.24)"
            strokeWidth="1.2"
            strokeDasharray="2 6"
          />
          {/* Circular dotted ellipse */}
          <ellipse
            cx="180"
            cy="110"
            rx="78"
            ry="78"
            stroke="rgba(244, 246, 250, 0.28)"
            strokeWidth="1.2"
            strokeDasharray="2 5"
          />
        </svg>

        {/* Spinning mark: six cyan squares in a ring and a lime chevron */}
        <div className="norva-loader-mark" aria-hidden="true">
          <svg
            width="88"
            height="88"
            viewBox="-44 -44 88 88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {ringAngles.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const cx = Math.cos(rad) * radius;
              const cy = Math.sin(rad) * radius;
              return (
                <rect
                  key={deg}
                  x={cx - 4}
                  y={cy - 4}
                  width="8"
                  height="8"
                  rx="1.5"
                  fill="#3fd8ff"
                  transform={`rotate(${deg + 45} ${cx} ${cy})`}
                />
              );
            })}
            {/* Lime chevron in center */}
            <path
              d="M-8 3 L0 -6 L8 3"
              stroke="#c6ff2e"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
