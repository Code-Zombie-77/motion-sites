/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FadingVideo } from './components/FadingVideo';
import { BlurText } from './components/BlurText';
import {
  ArrowUpRight,
  Play,
  ClockIcon,
  GlobeIcon,
  ImageIcon,
  MovieIcon,
  LightbulbIcon,
} from './components/Icons';
import { GardenModal, ActiveModalType } from './components/GardenModal';
import { GardenArchetypeId } from './utils/gardenCalculator';

const HERO_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4';

const CAPABILITIES_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4';

const sharedInitial = { filter: 'blur(10px)', opacity: 0, y: 20 };
const sharedAnimate = { filter: 'blur(0px)', opacity: 1, y: 0 };

const NAV_ITEMS: Array<{
  label: string;
  action: 'work' | 'studio' | 'services' | 'journal' | 'contact';
}> = [
  { label: 'Work', action: 'work' },
  { label: 'Studio', action: 'studio' },
  { label: 'Services', action: 'services' },
  { label: 'Journal', action: 'journal' },
  { label: 'Contact', action: 'contact' },
];

const TRUST_LOGOS = ['Aeon', 'Vela', 'Apex', 'Orbit', 'Zeno'];

const CAPABILITY_CARDS: Array<{
  title: string;
  icon: React.FC<{ className?: string }>;
  tags: string[];
  body: string;
  archetype: GardenArchetypeId;
}> = [
  {
    title: 'Design',
    icon: ImageIcon,
    tags: ['Planting Plan', 'Natural Stone', 'Courtyards'],
    body: 'Custom garden layouts, native German perennials, and stone terraces tailored to your home.',
    archetype: 'naturgarten',
  },
  {
    title: 'Engineering',
    icon: MovieIcon,
    tags: ['Bio-Pools', 'Irrigation', 'Lighting'],
    body: 'Complete earthwork, smart watering systems, natural swimming ponds, and outdoor lighting.',
    archetype: 'villa_estate',
  },
  {
    title: 'Growth',
    icon: LightbulbIcon,
    tags: ['Seasonal Care', 'Pruning', 'Soil Health'],
    body: 'Year-round garden care, organic soil preparation, and seasonal maintenance across Germany.',
    archetype: 'alpine_courtyard',
  },
];

export default function App() {
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [selectedArchetype, setSelectedArchetype] =
    useState<GardenArchetypeId>('naturgarten');

  const handleNavClick = (
    action: 'work' | 'studio' | 'services' | 'journal' | 'contact'
  ) => {
    if (action === 'services') {
      const el = document.getElementById('capabilities');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (action === 'contact') {
      setActiveModal('project');
      return;
    }
    setActiveModal(action);
  };

  return (
    <main className="bg-black text-white font-body selection:bg-white selection:text-black">
      {/* SECTION 1: HERO */}
      <section
        id="hero"
        className="relative min-h-screen lg:h-screen overflow-hidden bg-black flex flex-col"
      >
        <FadingVideo
          src={HERO_VIDEO_SRC}
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: '120%', height: '120%' }}
        />

        <div className="relative z-10 flex flex-col flex-1 h-full">
          {/* Navbar */}
          <header className="fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Aurea Gärten Home"
              className="liquid-glass h-12 w-12 rounded-full flex items-center justify-center font-heading italic text-2xl text-white cursor-pointer"
            >
              a
            </button>

            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center liquid-glass rounded-full px-1.5 py-1.5"
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.action)}
                  className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white font-body transition-colors cursor-pointer whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveModal('project')}
                className="ml-1 bg-white text-black rounded-full px-4 py-2 text-sm font-medium font-body inline-flex items-center gap-1.5 hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </nav>

            <div className="h-12 w-12" aria-hidden="true" />
          </header>

          {/* Main Centered Hero Content */}
          <div className="flex-1 flex flex-col items-center justify-center pt-20 md:pt-24 px-4 text-center">
            {/* Badge */}
            <motion.div
              initial={sharedInitial}
              animate={sharedAnimate}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="liquid-glass rounded-full px-3 py-1.5 inline-flex items-center gap-2.5"
            >
              <span className="bg-white text-black text-xs font-medium px-2.5 py-0.5 rounded-full font-body">
                New
              </span>
              <span className="text-xs md:text-sm text-white/90 font-body pr-1">
                Spring 2026 Bookings Open — Germany
              </span>
            </motion.div>

            {/* Headline */}
            <div className="mt-6 max-w-3xl">
              <BlurText
                text="Living Gardens Built for Every Season"
                className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] tracking-[-4px]"
              />
            </div>

            {/* Subtext */}
            <motion.p
              initial={sharedInitial}
              animate={sharedAnimate}
              transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
              className="mt-4 text-sm md:text-base text-white max-w-xl font-body font-light leading-tight"
            >
              Private gardens, rooftops, and natural landscapes designed and
              built in Munich, Berlin, and Hamburg.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={sharedInitial}
              animate={sharedAnimate}
              transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
              className="mt-6 flex items-center gap-6"
            >
              <button
                type="button"
                onClick={() => setActiveModal('project')}
                className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white inline-flex items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('showreel')}
                className="text-sm font-medium text-white/90 hover:text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Watch Showreel</span>
              </button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={sharedInitial}
              animate={sharedAnimate}
              transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }}
              className="mt-6 md:mt-8 flex justify-center gap-3 sm:gap-4"
            >
              <div className="liquid-glass p-4 sm:p-5 w-[170px] sm:w-[220px] rounded-[1.25rem] text-left">
                <ClockIcon className="w-5 h-5 text-white/90" />
                <div className="text-3xl sm:text-4xl font-heading italic tracking-[-1px] leading-none mt-3 sm:mt-4">
                  6 Weeks
                </div>
                <p className="text-xs text-white/80 font-body font-light mt-1.5 sm:mt-2 leading-snug">
                  Average Garden Build Time
                </p>
              </div>

              <div className="liquid-glass p-4 sm:p-5 w-[170px] sm:w-[220px] rounded-[1.25rem] text-left">
                <GlobeIcon className="w-5 h-5 text-white/90" />
                <div className="text-3xl sm:text-4xl font-heading italic tracking-[-1px] leading-none mt-3 sm:mt-4">
                  140+
                </div>
                <p className="text-xs text-white/80 font-body font-light mt-1.5 sm:mt-2 leading-snug">
                  Gardens Built in Germany
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Trust Bar */}
          <motion.div
            initial={sharedInitial}
            animate={sharedAnimate}
            transition={{ duration: 0.8, delay: 1.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 md:gap-4 pt-6 pb-8 px-4"
          >
            <div className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80 font-body text-center">
              Trusted by homeowners and architects across Germany
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16">
              {TRUST_LOGOS.map((logo) => (
                <span
                  key={logo}
                  className="font-heading italic text-2xl md:text-3xl tracking-tight text-white/90"
                >
                  {logo}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: CAPABILITIES */}
      <section
        id="capabilities"
        className="relative min-h-screen overflow-hidden bg-black"
      >
        <FadingVideo
          src={CAPABILITIES_VIDEO_SRC}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
          {/* Header */}
          <div className="mb-auto">
            <div className="text-sm font-body text-white/80 mb-6">
              // Capabilities
            </div>
            <h2 className="font-heading italic text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px] whitespace-pre-line">
              {'Garden craft,\nend to end'}
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {CAPABILITY_CARDS.map((card) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.title}
                  onClick={() => {
                    setSelectedArchetype(card.archetype);
                    setActiveModal('project');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedArchetype(card.archetype);
                      setActiveModal('project');
                    }
                  }}
                  aria-label={`${card.title} — Open Garden Planner`}
                  className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col text-left cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="liquid-glass h-11 w-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex flex-wrap justify-end gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Bottom */}
                  <div>
                    <h3 className="font-heading italic text-3xl md:text-4xl tracking-[-1px] leading-none">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[30ch]">
                      {card.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive German Garden Configurator, Estate Portfolio & Showreel Modal */}
      <GardenModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSwitchModal={(next) => setActiveModal(next)}
        initialArchetype={selectedArchetype}
      />
    </main>
  );
}
