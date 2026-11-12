import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, CloseIcon, Play } from './Icons';
import { FadingVideo } from './FadingVideo';
import {
  calculateGardenEstimate,
  validateInquiryForm,
  GERMAN_REGIONS,
  GARDEN_ARCHETYPES,
  GermanRegionId,
  GardenArchetypeId,
} from '../utils/gardenCalculator';

export type ActiveModalType =
  | null
  | 'project'
  | 'showreel'
  | 'work'
  | 'studio'
  | 'journal';

interface GardenModalProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  onSwitchModal: (next: ActiveModalType) => void;
  initialArchetype?: GardenArchetypeId;
}

const GERMAN_PROJECTS = [
  {
    id: 'bogenhausen',
    title: 'Villa Courtyard',
    location: 'München · 420 m²',
    year: '2026',
    archetype: 'alpine_courtyard' as GardenArchetypeId,
    region: 'munich' as GermanRegionId,
    metrics: 'Limestone Terrace & Water Basin',
    summary:
      'Quiet stone courtyard with evergreen yew hedges and alpine perennials.',
  },
  {
    id: 'grunewald',
    title: 'Woodland Garden',
    location: 'Berlin · 860 m²',
    year: '2025',
    archetype: 'naturgarten' as GardenArchetypeId,
    region: 'berlin' as GermanRegionId,
    metrics: 'Natural Swimming Pond & Grasses',
    summary:
      'Wild perennial garden with silver birches and a chemical-free bio-pool.',
  },
  {
    id: 'elbchaussee',
    title: 'Elbe Hillside Garden',
    location: 'Hamburg · 540 m²',
    year: '2026',
    archetype: 'villa_estate' as GardenArchetypeId,
    region: 'hamburg' as GermanRegionId,
    metrics: 'Terraced Lawns & Hydrangeas',
    summary:
      'Stepped brick walls, white hydrangeas, and warm evening garden lights.',
  },
];

const SEASONAL_CHAPTERS = [
  {
    season: 'Spring',
    location: 'Brandenburg',
    temp: '14°C',
    note: 'Early bulbs and fresh green hornbeam hedges.',
  },
  {
    season: 'Summer',
    location: 'München',
    temp: '26°C',
    note: 'Full perennial bloom and natural swimming ponds.',
  },
  {
    season: 'Autumn',
    location: 'Frankfurt',
    temp: '11°C',
    note: 'Golden ornamental grasses and warm autumn leaves.',
  },
  {
    season: 'Winter',
    location: 'Hamburg',
    temp: '-4°C',
    note: 'Evergreen structure and frost-covered seedheads.',
  },
];

export const GardenModal: React.FC<GardenModalProps> = ({
  activeModal,
  onClose,
  onSwitchModal,
  initialArchetype = 'naturgarten',
}) => {
  const [regionId, setRegionId] = useState<GermanRegionId>('munich');
  const [archetypeId, setArchetypeId] =
    useState<GardenArchetypeId>(initialArchetype);
  const [areaSqm, setAreaSqm] = useState<number>(240);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState<number>(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('München');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    city?: string;
  }>({});
  const [justSubmitted, setJustSubmitted] = useState(false);

  const estimate = calculateGardenEstimate(regionId, archetypeId, areaSqm);

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInquiryForm({ name, email, city, notes });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setJustSubmitted(true);
  };

  React.useEffect(() => {
    if (!activeModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          exit={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="liquid-glass-strong w-full max-w-4xl rounded-[1.5rem] p-5 md:p-7 text-white relative my-auto"
        >
          {/* Top modal navigation & close button */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setJustSubmitted(false);
                  onSwitchModal('project');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-body transition-colors cursor-pointer ${
                  activeModal === 'project'
                    ? 'bg-white text-black font-medium'
                    : 'liquid-glass text-white/80 hover:text-white'
                }`}
              >
                Garden Planner
              </button>
              <button
                type="button"
                onClick={() => onSwitchModal('work')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-body transition-colors cursor-pointer ${
                  activeModal === 'work' ||
                  activeModal === 'studio' ||
                  activeModal === 'journal'
                    ? 'bg-white text-black font-medium'
                    : 'liquid-glass text-white/80 hover:text-white'
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => onSwitchModal('showreel')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-body transition-colors cursor-pointer ${
                  activeModal === 'showreel'
                    ? 'bg-white text-black font-medium'
                    : 'liquid-glass text-white/80 hover:text-white'
                }`}
              >
                Showreel
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="liquid-glass h-9 w-9 rounded-full flex items-center justify-center text-white/80 hover:text-white cursor-pointer shrink-0"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* PROJECT PLANNER & INQUIRY VIEW */}
          {activeModal === 'project' && (
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h2
                    id="modal-heading"
                    className="font-heading italic text-3xl md:text-4xl tracking-[-1px] leading-none"
                  >
                    Plan Your Garden
                  </h2>
                </div>

                {/* Step 1: City */}
                <div>
                  <label className="block text-xs font-body text-white/80 mb-1.5">
                    1. City
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(GERMAN_REGIONS) as GermanRegionId[]).map(
                      (id) => {
                        const r = GERMAN_REGIONS[id];
                        const active = regionId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setRegionId(id);
                              setCity(r.label);
                            }}
                            className={`text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                              active
                                ? 'bg-white text-black'
                                : 'liquid-glass text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">
                                {r.label}
                              </span>
                              <span
                                className={`text-[10px] font-body ${
                                  active ? 'text-black/70' : 'text-white/70'
                                }`}
                              >
                                {r.hardinessZone}
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Step 2: Garden Style */}
                <div>
                  <label className="block text-xs font-body text-white/80 mb-1.5">
                    2. Garden Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.keys(GARDEN_ARCHETYPES) as GardenArchetypeId[]
                    ).map((id) => {
                      const arch = GARDEN_ARCHETYPES[id];
                      const active = archetypeId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setArchetypeId(id)}
                          className={`text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                            active
                              ? 'bg-white text-black'
                              : 'liquid-glass text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="text-xs font-medium">{arch.title}</div>
                          <div
                            className={`text-[11px] italic truncate ${
                              active ? 'text-black/75' : 'text-white/70'
                            }`}
                          >
                            {arch.germanTitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Area Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-body text-white/80 mb-1">
                    <label htmlFor="garden-area-slider">3. Size</label>
                    <span className="font-heading italic text-2xl text-white leading-none">
                      {areaSqm} m²
                    </span>
                  </div>
                  <input
                    id="garden-area-slider"
                    type="range"
                    min={40}
                    max={1200}
                    step={20}
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                {/* Estimate Summary */}
                <div className="liquid-glass rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[11px] text-white/70">Timeline</div>
                      <div className="font-heading italic text-2xl md:text-3xl leading-none mt-1">
                        {estimate.estimatedWeeks} Weeks
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-white/70">Plants</div>
                      <div className="font-heading italic text-2xl md:text-3xl leading-none mt-1">
                        {estimate.nativeSpeciesCount} Types
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-white/70">Estimate</div>
                      <div className="font-heading italic text-2xl md:text-3xl leading-none mt-1">
                        €{(estimate.estimatedBudgetEur.min / 1000).toFixed(0)}k–€
                        {(estimate.estimatedBudgetEur.max / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                    {estimate.signaturePlants.map((plant) => (
                      <span
                        key={plant}
                        className="liquid-glass rounded-full px-2.5 py-0.5 text-[11px] text-white/90 font-body"
                      >
                        {plant}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Simple Contact Form */}
              <div className="lg:col-span-5">
                <div className="liquid-glass rounded-2xl p-5 h-full flex flex-col justify-between">
                  {justSubmitted ? (
                    <div className="space-y-4 my-auto py-4">
                      <span className="bg-white text-black text-xs font-medium px-3 py-1 rounded-full">
                        Request Sent
                      </span>
                      <h3 className="font-heading italic text-4xl leading-none mt-2">
                        Thank you, {name}
                      </h3>
                      <p className="text-sm text-white/80 font-light">
                        We received your request for {city} ({areaSqm} m²) and
                        will contact you within 48 hours.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setJustSubmitted(false);
                          setName('');
                          setEmail('');
                          setNotes('');
                        }}
                        className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
                      >
                        New Estimate
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleProjectSubmit}
                      className="space-y-3.5"
                      noValidate
                    >
                      <h3 className="font-heading italic text-3xl tracking-[-1px]">
                        Book a Visit
                      </h3>

                      <div>
                        <label
                          htmlFor="client-name"
                          className="block text-xs text-white/80 mb-1"
                        >
                          Name *
                        </label>
                        <input
                          id="client-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Clara Weber"
                          className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-300 mt-1" role="alert">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="client-email"
                          className="block text-xs text-white/80 mb-1"
                        >
                          Email *
                        </label>
                        <input
                          id="client-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="clara@example.de"
                          className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-300 mt-1" role="alert">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="client-city"
                          className="block text-xs text-white/80 mb-1"
                        >
                          City *
                        </label>
                        <input
                          id="client-city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="München"
                          className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white"
                        />
                        {errors.city && (
                          <p className="text-xs text-red-300 mt-1" role="alert">
                            {errors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="client-notes"
                          className="block text-xs text-white/80 mb-1"
                        >
                          Notes
                        </label>
                        <textarea
                          id="client-notes"
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Optional project details..."
                          className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-white text-black rounded-full py-2.5 px-5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-white/90 transition-colors cursor-pointer"
                      >
                        Send Request
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PROJECTS VIEW */}
          {(activeModal === 'work' ||
            activeModal === 'studio' ||
            activeModal === 'journal') && (
            <div className="mt-5 space-y-5">
              <h2
                id="modal-heading"
                className="font-heading italic text-4xl tracking-[-1px] leading-none"
              >
                Recent Gardens in Germany
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {GERMAN_PROJECTS.map((proj) => (
                  <div
                    key={proj.id}
                    className="liquid-glass rounded-2xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>{proj.location}</span>
                        <span>{proj.year}</span>
                      </div>
                      <h3 className="font-heading italic text-3xl leading-none">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-white/80 font-light leading-relaxed">
                        {proj.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="text-[11px] text-white/90 font-medium">
                        {proj.metrics}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegionId(proj.region);
                          setArchetypeId(proj.archetype);
                          setJustSubmitted(false);
                          onSwitchModal('project');
                        }}
                        className="liquid-glass-strong w-full rounded-full py-2 px-4 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10"
                      >
                        Select Style
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHOWREEL VIEW */}
          {activeModal === 'showreel' && (
            <div className="mt-5 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="modal-heading"
                  className="font-heading italic text-4xl tracking-[-1px] leading-none"
                >
                  Four Seasons Showreel
                </h2>
                <button
                  type="button"
                  onClick={() => onSwitchModal('project')}
                  className="bg-white text-black rounded-full px-4 py-2 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Start a Project
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 liquid-glass">
                <FadingVideo
                  src={[
                    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4',
                    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4',
                  ]}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-6">
                  <div className="inline-flex items-center gap-2 text-xs text-white/90 mb-1">
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {SEASONAL_CHAPTERS[activeSeasonIndex].season} —{' '}
                      {SEASONAL_CHAPTERS[activeSeasonIndex].location}
                    </span>
                  </div>
                  <p className="font-heading italic text-2xl md:text-3xl text-white">
                    {SEASONAL_CHAPTERS[activeSeasonIndex].note}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEASONAL_CHAPTERS.map((chap, idx) => (
                  <button
                    key={chap.season}
                    type="button"
                    onClick={() => setActiveSeasonIndex(idx)}
                    className={`text-left p-3.5 rounded-2xl transition-all cursor-pointer ${
                      activeSeasonIndex === idx
                        ? 'bg-white text-black'
                        : 'liquid-glass text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-medium">{chap.season}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        activeSeasonIndex === idx
                          ? 'text-black/70'
                          : 'text-white/70'
                      }`}
                    >
                      {chap.location} · {chap.temp}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
