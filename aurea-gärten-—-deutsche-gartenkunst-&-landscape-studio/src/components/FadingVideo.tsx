import React, { useEffect, useRef, useState } from 'react';

interface FadingVideoProps {
  src: string | string[];
  className?: string;
  style?: React.CSSProperties;
}

export const FadingVideo: React.FC<FadingVideoProps> = ({
  src,
  className = '',
  style = {},
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const isFadingOutRef = useRef(false);
  const hasFadedInRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opacity, setOpacity] = useState(0);

  const sources = Array.isArray(src) ? src : [src];
  const activeSrc = sources[currentIndex % sources.length];

  const animateOpacity = (from: number, to: number, durationMs: number) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const nextOpacity = from + (to - from) * progress;
      setOpacity(nextOpacity);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const triggerFadeIn = () => {
    if (hasFadedInRef.current) return;
    hasFadedInRef.current = true;
    isFadingOutRef.current = false;
    animateOpacity(0, 1, 500);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    hasFadedInRef.current = false;
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      triggerFadeIn();
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activeSrc]);

  const handleLoadedData = () => {
    triggerFadeIn();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= 0.55 && !isFadingOutRef.current) {
      isFadingOutRef.current = true;
      animateOpacity(1, 0, 550);
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    if (sources.length === 1) {
      video.currentTime = 0;
      isFadingOutRef.current = false;
      hasFadedInRef.current = true;
      video.play().catch(() => {});
      animateOpacity(0, 1, 500);
    } else {
      isFadingOutRef.current = false;
      hasFadedInRef.current = false;
      setCurrentIndex((prev) => (prev + 1) % sources.length);
    }
  };

  return (
    <video
      ref={videoRef}
      src={activeSrc}
      className={className}
      style={{
        ...style,
        filter: 'brightness(1.45) contrast(1.08) saturate(1.15)',
        opacity,
        pointerEvents: 'none',
      }}
      autoPlay
      muted
      playsInline
      preload="auto"
      onLoadedData={handleLoadedData}
      onCanPlay={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
};
