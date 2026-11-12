/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  clamp,
  computeScrollProgress,
  computeTargetVideoTime,
  stepVideoTime,
  computeHeadlineState,
  computeScrollCueState,
  computeProcessListState,
  computeRecorderProgress,
} from './utils/scrollMath';
import { CONTENT, Language, MEDIA_ASSETS } from './data/industrialContent';
import { NorvaLoader } from './components/NorvaLoader';
import { ModalType, ServiceModal } from './components/ServiceModal';

declare global {
  interface Window {
    __recTime?: (video: HTMLVideoElement, t: number) => number;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') === 'en' ? 'en' : 'de';
  });

  const isRecMode = useRef<boolean>(
    new URLSearchParams(window.location.search).get('rec') === '1'
  ).current;

  const isAutostart = useRef<boolean>(
    new URLSearchParams(window.location.search).get('autostart') === '1'
  ).current;

  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // Loader state: removed immediately in ?rec=1 or ?autostart=1
  const [loaderVisible, setLoaderVisible] = useState<boolean>(
    !(isRecMode || isAutostart)
  );
  const [loaderFading, setLoaderFading] = useState<boolean>(false);

  // Scroll progress p in [0, 1]
  const [scrollP, setScrollP] = useState<number>(0);
  // Optional manual override when user clicks a process step (01-04)
  const [manualStepIndex, setManualStepIndex] = useState<number | null>(null);
  const lastScrollYRef = useRef<number>(0);

  // Active modal state for interactive nav links / pills
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Responsive video source selection (<= 900px uses 1280x720 clip)
  const [isCompactVideo, setIsCompactVideo] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  );

  const trackRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef<number>(0);
  const curTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(5.04);
  const pRef = useRef<number>(0);

  const copy = CONTENT[lang];

  // Listen for reduced motion & viewport width <= 900px
  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mqMotion.addEventListener('change', handleMotion);

    const handleResize = () => {
      setIsCompactVideo(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      mqMotion.removeEventListener('change', handleMotion);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Dismiss loader helper: fades out (.6s) 350ms after first frame loads, or 3.5s max
  const triggerLoaderDismiss = useCallback((delayMs: number) => {
    const fadeTimer = window.setTimeout(() => {
      setLoaderFading(true);
      const removeTimer = window.setTimeout(() => {
        setLoaderVisible(false);
      }, 600);
      return () => window.clearTimeout(removeTimer);
    }, delayMs);
    return fadeTimer;
  }, []);

  useEffect(() => {
    if (isRecMode || isAutostart) {
      setLoaderVisible(false);
      return;
    }
    const maxTimer = triggerLoaderDismiss(3500);
    return () => window.clearTimeout(maxTimer);
  }, [isRecMode, isAutostart, triggerLoaderDismiss]);

  // Apply scroll progress p to state & video target time
  const updateFromProgress = useCallback((nextP: number) => {
    const clamped = clamp(nextP, 0, 1);
    pRef.current = clamped;
    setScrollP(clamped);
    const dur =
      videoRef.current && Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0
        ? videoRef.current.duration
        : durationRef.current;
    targetTimeRef.current = computeTargetVideoTime(clamped, dur);
  }, []);

  // Scroll listener
  useEffect(() => {
    const computeFromWindowScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const trackTop = rect.top + window.scrollY;
      const trackHeight = track.offsetHeight;
      const nextP = computeScrollProgress(
        window.scrollY,
        trackTop,
        trackHeight,
        window.innerHeight
      );
      if (Math.abs(window.scrollY - lastScrollYRef.current) > 4) {
        setManualStepIndex(null);
        lastScrollYRef.current = window.scrollY;
      }
      updateFromProgress(nextP);
    };

    computeFromWindowScroll();
    window.addEventListener('scroll', computeFromWindowScroll, { passive: true });
    window.addEventListener('resize', computeFromWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', computeFromWindowScroll);
      window.removeEventListener('resize', computeFromWindowScroll);
    };
  }, [updateFromProgress]);

  // Video frame seeking loop:
  // target = p * (duration - 1/48). Each frame, cur += (target - cur) * .2.
  // Set currentTime only when !video.seeking and |video.currentTime - cur| > 1/60 s, and re-seek on seeked.
  useEffect(() => {
    let rafId = 0;

    const syncVideo = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          durationRef.current = video.duration;
          targetTimeRef.current = computeTargetVideoTime(pRef.current, video.duration);
        }
        curTimeRef.current = stepVideoTime(
          curTimeRef.current,
          targetTimeRef.current,
          reducedMotion || isRecMode
        );
        if (
          !video.seeking &&
          Math.abs(video.currentTime - curTimeRef.current) > 1 / 60
        ) {
          try {
            video.currentTime = curTimeRef.current;
          } catch {
            // Ignore transient DOM readiness errors
          }
        }
      }
      rafId = window.requestAnimationFrame(syncVideo);
    };

    rafId = window.requestAnimationFrame(syncVideo);
    return () => window.cancelAnimationFrame(rafId);
  }, [reducedMotion, isRecMode]);

  // Re-seek on `seeked` if needed
  const handleVideoSeeked = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    if (
      !video.seeking &&
      Math.abs(video.currentTime - curTimeRef.current) > 1 / 60
    ) {
      try {
        video.currentTime = curTimeRef.current;
      } catch {
        // Ignore transient seek error
      }
    }
  };

  const handleVideoLoadedData = () => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      durationRef.current = video.duration;
      targetTimeRef.current = computeTargetVideoTime(pRef.current, video.duration);
    }
    if (!isRecMode && !isAutostart) {
      triggerLoaderDismiss(350);
    }
  };

  // Recorder mode (?rec=1):
  // 6.5 s timeline: hold 0.55 s, then linear glide of 5.04 s, then hold.
  // window.__recTime(video, t) scrolls to that p, updates the UI and returns the clip time.
  useEffect(() => {
    window.__recTime = (video: HTMLVideoElement, t: number): number => {
      const nextP = computeRecorderProgress(t);
      const track = trackRef.current;
      if (track) {
        const scrollable = Math.max(0, track.offsetHeight - window.innerHeight);
        window.scrollTo(0, nextP * scrollable);
      }
      updateFromProgress(nextP);
      const dur =
        video && Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : durationRef.current;
      const clipTime = computeTargetVideoTime(nextP, dur);
      curTimeRef.current = clipTime;
      targetTimeRef.current = clipTime;
      if (video && video.readyState >= 2) {
        try {
          video.currentTime = clipTime;
        } catch {
          // Ignore seek errors in synthetic harness
        }
      }
      return clipTime;
    };

    if (!isRecMode) {
      return () => {
        delete window.__recTime;
      };
    }

    const start = performance.now();
    let recRaf = 0;
    const tickRec = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (videoRef.current && window.__recTime) {
        window.__recTime(videoRef.current, elapsed);
      }
      if (elapsed < 6.5) {
        recRaf = window.requestAnimationFrame(tickRec);
      }
    };
    recRaf = window.requestAnimationFrame(tickRec);

    return () => {
      window.cancelAnimationFrame(recRaf);
      delete window.__recTime;
    };
  }, [isRecMode, updateFromProgress]);

  // Smooth scroll helper when clicking Scroll Cue or a Process Step
  const scrollToProgress = (targetP: number, stepIdx: number | null = null) => {
    const track = trackRef.current;
    if (!track) return;
    const scrollable = Math.max(0, track.offsetHeight - window.innerHeight);
    const targetY = clamp(targetP, 0, 1) * scrollable;
    lastScrollYRef.current = targetY;
    if (stepIdx !== null) {
      setManualStepIndex(stepIdx);
    }
    window.scrollTo({
      top: targetY,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  // Pure functions of scrollP for UI elements
  const headlineState = computeHeadlineState(scrollP);
  const scrollCueState = computeScrollCueState(scrollP);
  const processListState = computeProcessListState(scrollP, manualStepIndex);

  const videoSrc = isCompactVideo
    ? MEDIA_ASSETS.mobileVideo
    : MEDIA_ASSETS.desktopVideo;

  return (
    <>
      <NorvaLoader
        visible={loaderVisible}
        fadingOut={loaderFading}
        reducedMotion={reducedMotion}
      />

      {/* Fixed Top Navigation (58u tall, 3 columns) */}
      <header className="norva-nav" role="banner">
        <nav className="norva-nav-left" aria-label="Hauptnavigation">
          <button
            type="button"
            className="norva-nav-link"
            onClick={() => setActiveModal('industries')}
          >
            {copy.nav.industries}
          </button>
          <button
            type="button"
            className="norva-nav-link"
            onClick={() => setActiveModal('mission')}
          >
            {copy.nav.mission}
          </button>
        </nav>

        <button
          type="button"
          className="norva-wordmark"
          onClick={() => scrollToProgress(0, null)}
          aria-label="NORVA Startseite"
        >
          NORVA
        </button>

        <div className="norva-nav-right">
          <button
            type="button"
            className="norva-pill norva-pill-gray"
            onClick={() => setActiveModal('apply')}
          >
            {copy.nav.apply}
          </button>
          <button
            type="button"
            className="norva-pill norva-pill-lime"
            onClick={() => setActiveModal('request')}
          >
            {copy.nav.requestCrews}
          </button>
        </div>
      </header>

      {/* Main 420vh Scroll Track holding Sticky 100vh Video Scene */}
      <main>
        <div
          ref={trackRef}
          className="norva-track"
          data-testid="norva-scroll-track"
          data-scroll-p={scrollP.toFixed(3)}
        >
          <div className="norva-scene">
            <video
              ref={videoRef}
              className="norva-video"
              src={videoSrc}
              poster={MEDIA_ASSETS.poster}
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideoLoadedData}
              onSeeked={handleVideoSeeked}
            />
            <div className="norva-shade" aria-hidden="true" />
          </div>
        </div>

        {/* Fixed Hero Copy inside perspective: 900u stage */}
        <section
          className="norva-hero-stage"
          aria-label="NORVA Industrieservice"
        >
          <div
            className="norva-hero-block"
            style={{
              transform: `translateY(${headlineState.translateYVh}vh) rotateX(${headlineState.rotateXDeg}deg) scale(${headlineState.scale})`,
              opacity: headlineState.opacity,
              pointerEvents: headlineState.pointerEvents,
            }}
          >
            <h1 className="norva-headline">
              {copy.hero.headlineLine1}{' '}
              <br />
              {copy.hero.headlineLine2}
            </h1>

            {/* Desktop 3-line subline */}
            <p className="norva-subline-desktop">
              <span>{copy.hero.subline1}</span>
              <span>{copy.hero.subline2}</span>
              <span>{copy.hero.subline3}</span>
            </p>

            {/* Mobile single-paragraph subline (up to 34ch) */}
            <p className="norva-subline-mobile">{copy.hero.mobileSubline}</p>
          </div>
        </section>

        {/* Scroll Cue: centered 36u from bottom, 1px underline drains over first 10% */}
        <button
          type="button"
          className="norva-scroll-cue"
          onClick={() => scrollToProgress(0.35, 0)}
          style={{
            opacity: scrollCueState.opacity,
            pointerEvents: scrollCueState.opacity > 0.05 ? 'auto' : 'none',
          }}
        >
          <span>{copy.scrollCue}</span>
          <span
            className="norva-scroll-cue-line"
            style={{
              transform: `scaleX(${scrollCueState.underlineScale})`,
            }}
          />
        </button>

        {/* Four-Step Process List: fixed, bottom left at 36u / 28u, 430u wide */}
        <section
          className="norva-process-list"
          aria-label="Unser vierstufiger Mobilisierungsprozess"
          style={{
            transform: `translateY(${processListState.translateYPx}px)`,
            opacity: processListState.opacity,
            pointerEvents: processListState.pointerEvents,
          }}
        >
          {copy.steps.map((step, index) => {
            const isActive = processListState.activeStepIndex === index;
            return (
              <div
                key={step.num}
                className={`norva-process-row ${isActive ? 'is-active' : ''}`}
              >
                <button
                  type="button"
                  className="norva-process-header"
                  aria-expanded={isActive}
                  onClick={() => scrollToProgress(step.targetScrollP, index)}
                >
                  <span className="norva-process-num">{step.num}</span>
                  <span className="norva-process-title">{step.title}</span>
                </button>
                <div className="norva-process-drawer">
                  <div className="norva-process-drawer-inner">
                    <p className="norva-process-body">{step.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Interactive German Industrial Service Modals */}
      <ServiceModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSwitchModal={(next) => setActiveModal(next)}
        copy={copy}
        lang={lang}
        onToggleLang={(nextLang) => setLang(nextLang)}
      />
    </>
  );
}
