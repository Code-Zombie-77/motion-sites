import React, { useEffect } from 'react';
import './components/RunwayElement';
import { LOOKS, PRODUCTS_MAP } from './data/catalog';
import { stylingBag } from './utils/bagController';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'runway-section': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        Record<string, unknown>;
    }
  }
}

const SECTION_ID = 'template--28035983671601__the_runway_wdM8BG';

const SECTION_STYLE: React.CSSProperties = {
  '--rw-c-stage': '#ffffff',
  '--rw-c-panel': '#ffffff',
  '--rw-c-text': '#151413',
  '--rw-c-muted': '#66625c',
  '--rw-c-accent': '#0e0e0e',
  '--rw-c-on-accent': '#ffffff',
  '--rw-c-line': '#c8c8c8',
  '--rw-card': '#DFDFDF',
  '--rw-hf': 'var(--font-heading--family, inherit)',
  '--rw-hw': '400',
  '--rw-h-d': '46px',
  '--rw-h-m': '24px',
  '--rw-sub-d': '12px',
  '--rw-sub-m': '12px',
  '--rw-eyebrow-d': '11px',
  '--rw-eyebrow-m': '10px',
  '--rw-label-d': '10px',
  '--rw-label-m': '9px',
  '--rw-chip-d': '17px',
  '--rw-chip-m': '18px',
  '--rw-ph-d': '18px',
  '--rw-ph-m': '16px',
  '--rw-pt-size-d': '13px',
  '--rw-pt-size-m': '12px',
  '--rw-price-d': '12px',
  '--rw-price-m': '12px',
  '--rw-opt-d': '11px',
  '--rw-opt-m': '11px',
  '--rw-total-d': '16px',
  '--rw-total-m': '16px',
  '--rw-thumb-d': '92px',
  '--rw-thumb-m': '62px',
  '--rw-tag-top': '18px',
  '--rw-tag-left': '0px',
  '--rw-thumb-radius': '0px',
  '--rw-morph': '900ms',
  '--rw-bar-r': '20px',
  '--rw-panel-w': '380px',
  '--rw-panel-pad-d': '32px',
  '--rw-radius': '0px',
  '--rw-max': 'none',
  '--rw-speed': '5s',
  '--rw-ax': '40%',
  '--rw-btn-radius': '0px',
  '--rw-pill-radius': '30px',
  '--rw-add-radius': '20px',
} as React.CSSProperties;

export default function App() {
  useEffect(() => {
    stylingBag.initDOM();
  }, []);

  return (
    <>
      <header className="site-header shopify-section-group-header-group">
        <a href="./" className="brand" aria-label="Runway Startseite">
          <img
            src="https://reel-ref-try-the-look.vercel.app/assets/nike-logo.svg"
            width={68}
            height={24}
            alt="Nike"
          />
        </a>
        <nav aria-label="Hauptnavigation">
          <a href="./">Start</a>
          <a
            href="https://nike-makknzjs.myshopify.com/pages/nike-orbit"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nike Orbit
          </a>
          <a
            href="https://nike-makknzjs.myshopify.com/pages/scene-rail"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hand Rail Pro
          </a>
          <a href="./" aria-current="page">
            Runway
          </a>
        </nav>
        <button id="open-bag" type="button" aria-label="Styling-Tasche öffnen">
          <svg
            width="22"
            height="24"
            viewBox="0 0 24 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            <path d="M4 8h16l1 16H3L4 8zM8 8V6a4 4 0 0 1 8 0v2" />
          </svg>
          <span data-cart-count>0</span>
        </button>
      </header>

      <main>
        <runway-section
          id={`Runway-${SECTION_ID}`}
          className="rw rw--add-icon rw--popup rw--list has-dividers has-border"
          data-feel="balanced"
          data-blur="true"
          data-mblur="true"
          data-style="ring"
          data-mstyle="classic"
          data-fit="true"
          data-height-mode="original"
          data-height-vh="100"
          data-mheight-mode="custom"
          data-mheight-vh="109"
          data-reflect="false"
          data-autoplay="true"
          data-speed="5000"
          data-after-add="stay"
          data-bundle-code=""
          data-msg-choose="Wähle deine Größe für: [items]"
          data-msg-error="Konnte nicht hinzugefügt werden. Bitte erneut versuchen."
          data-msg-soldout="Ausverkauft"
          style={SECTION_STYLE}
        >
          <div className="rw__sticky">
            <div className="rw__grid">
              {/* Left Column: Stage & Controls */}
              <div className="rw__left">
                <div className="rw__head">
                  <div className="rw__intro">
                    <h2 className="rw__title">Sichere dir den Look.</h2>
                    <p className="rw__sub">
                      Sechs markante Streetwear-Outfits, von Kopf bis Fuß kuratiert. Tippe auf einen Pin und mach das Piece zu deinem.
                    </p>
                  </div>
                  <span
                    className="rw__sr"
                    aria-live="polite"
                    aria-atomic="true"
                    data-rw-live
                  />
                </div>

                <div
                  className="rw__stage"
                  data-rw-stage
                  tabIndex={0}
                  role="region"
                  aria-roledescription="carousel"
                  aria-label="Sichere dir den Look. — Pfeiltasten oder Wischen zum Wechseln des Looks nutzen"
                >
                  {/* 1. Queue bodies */}
                  <div className="rw__actors" data-rw-actors>
                    {LOOKS.map((look) => (
                      <div
                        key={`actor-${look.index}`}
                        className="rw__model"
                        data-rw-model
                        data-index={look.index}
                        aria-hidden="true"
                      >
                        <span className="rw__shadow" />
                        <div
                          className="rw__figure"
                          style={{ '--rw-ar': 0.5625 } as React.CSSProperties}
                        >
                          <div className="rw__art">
                            <img
                              src={look.model640}
                              srcSet={`${look.model640} 640w, ${look.model1080} 1080w`}
                              sizes="(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px"
                              loading="eager"
                              decoding="async"
                              width={1100}
                              height={1956}
                              draggable={false}
                              data-model-image
                              alt={look.name}
                            />
                            <button
                              type="button"
                              className="rw__hit"
                              data-rw-go={look.index}
                              aria-label={`Look ${look.index + 1}: ${look.name}`}
                              tabIndex={-1}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 2. Heroes */}
                  <div className="rw__heroes" data-rw-heroes>
                    {LOOKS.map((look) => (
                      <div
                        key={`hero-${look.index}`}
                        className={`rw__hero${look.index === 0 ? ' is-on' : ''}`}
                        data-rw-hero
                        data-index={look.index}
                        data-name={look.name}
                        data-label={`Look ${look.index + 1}: ${look.name}`}
                        data-probe={look.model640}
                        aria-hidden={look.index === 0 ? 'false' : 'true'}
                      >
                        <div className="rw__morph">
                          <span className="rw__shadow" />
                          <div
                            className="rw__figure"
                            style={{ '--rw-ar': 0.5625 } as React.CSSProperties}
                          >
                            <div className="rw__art">
                              <img
                                src={look.model640}
                                srcSet={`${look.model640} 640w, ${look.model1080} 1080w`}
                                sizes="(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px"
                                loading="eager"
                                decoding="async"
                                width={1100}
                                height={1956}
                                draggable={false}
                                data-model-image
                                alt={look.name}
                              />
                              <button
                                type="button"
                                className="rw__zoom"
                                data-rw-zoom
                                aria-label={`Look im Detail: ${look.name}`}
                                tabIndex={look.index === 0 ? 0 : -1}
                              />
                              <div className="rw__pins">
                                {look.pins.map((pin) => (
                                  <button
                                    key={`pin-${look.index}-${pin.n}`}
                                    type="button"
                                    className="rw__pin"
                                    data-rw-pin={pin.n}
                                    data-tip={pin.title}
                                    style={
                                      {
                                        left: pin.left,
                                        top: pin.top,
                                        '--pi': pin.n,
                                      } as React.CSSProperties
                                    }
                                    aria-label={`${pin.n}: ${pin.title}`}
                                    tabIndex={-1}
                                  >
                                    <span className="rw__pin-dot">{pin.n}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 3. Light sweep */}
                  <span className="rw__sweep" />

                  {/* 4. Custom cursor */}
                  <span className="rw__cursor" data-rw-cursor>
                    <span className="rw__cursor-in">
                      <span className="rw__cursor-label rw__cursor-drag">Ziehen</span>
                      <span className="rw__cursor-label rw__cursor-view">Ansehen</span>
                    </span>
                  </span>

                  {/* 5. Walk progress line (mobile) */}
                  <span className="rw__walk">
                    <span className="rw__walk-line" />
                  </span>
                </div>

                {/* Controls Row */}
                <div className="rw__controls">
                  <button
                    type="button"
                    className="rw__icon"
                    data-rw-prev
                    aria-label="Vorheriger Look"
                  >
                    <svg
                      width="26"
                      height="14"
                      viewBox="0 0 26 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M25 7H1M7 1L1 7l6 6" />
                    </svg>
                  </button>

                  <div className="rw__ticks">
                    {LOOKS.map((look) => (
                      <button
                        key={`tick-${look.index}`}
                        type="button"
                        className="rw__tick"
                        data-rw-tick={look.index}
                        aria-current={look.index === 0 ? 'true' : 'false'}
                        aria-label={`Look ${look.index + 1}: ${look.name}`}
                      >
                        <span className="rw__tick-bar" />
                        <span className="rw__tick-label">
                          {look.num}
                          <span className="rw__tick-name">
                            {'\u00A0\u00A0'}
                            {look.name}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="rw__icon rw__auto"
                    data-rw-auto
                    aria-pressed="false"
                    aria-label="Automatische Wiedergabe"
                  >
                    <svg
                      className="rw__icon-play"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M7 4.5v15l12.5-7.5z" />
                    </svg>
                    <svg
                      className="rw__icon-pause"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="rw__icon"
                    data-rw-next
                    aria-label="Nächster Look"
                  >
                    <svg
                      width="26"
                      height="14"
                      viewBox="0 0 26 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 7h24M19 1l6 6-6 6" />
                    </svg>
                  </button>
                </div>

                {/* View Look Popup Lightbox */}
                <div
                  className="rw__lb"
                  data-rw-lb
                  data-word="Look"
                  role="region"
                  aria-label="Look im Detail"
                  aria-hidden="true"
                >
                  <div className="rw__lb-stage" data-rw-lb-stage />
                  <div className="rw__lb-top">
                    <p className="rw__lb-cap">
                      <span className="rw__lb-kicker" data-rw-lb-kicker />
                      <span className="rw__lb-name" data-rw-lb-name />
                    </p>
                    <button
                      type="button"
                      className="rw__lb-close"
                      data-rw-zoom-close
                      aria-label="Schließen"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="M5 5l14 14M19 5L5 19" />
                      </svg>
                    </button>
                  </div>
                  <p className="rw__lb-hint">Tippe auf einen Punkt, um das Piece zu sichern</p>
                </div>
              </div>

              {/* Right Column: In this look Panel */}
              <div className="rw__panel has-rule">
                <div className="rw__panel-inner">
                  <div className="rw__panel-head">
                    <h3 className="rw__panel-title">In diesem Look</h3>
                    <span className="rw__label" data-rw-pieces>
                      3 Pieces
                    </span>
                  </div>

                  {LOOKS.map((look) => (
                    <div
                      key={`panel-${look.index}`}
                      className={`rw__look-panel${look.index === 0 ? ' is-in' : ''}`}
                      data-rw-panel={look.index}
                      hidden={look.index !== 0}
                    >
                      <div className="rw__mhead">
                        <span className="rw__mhead-title">{look.name}</span>
                        <span className="rw__label">{look.piecesLabel}</span>
                      </div>

                      <ul className="rw__items" role="list">
                        {look.pieces.map((pieceRef, idx) => {
                          const n = idx + 1;
                          const product = PRODUCTS_MAP[pieceRef.productId];
                          const pickerId = `Picker-${SECTION_ID}-look_${look.key}-${n}`;
                          const optName = `Opt-${SECTION_ID}-look_${look.key}-${n}-1`;

                          return (
                            <li
                              key={pickerId}
                              className="rw__item"
                              data-rw-card={n}
                              style={{ '--i': n } as React.CSSProperties}
                              data-title={product.name}
                            >
                              {pieceRef.tag && (
                                <span className="rw__tag">
                                  <span className="rw__tag-text">{pieceRef.tag}</span>
                                </span>
                              )}

                              <a
                                className="rw__media"
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                tabIndex={-1}
                                aria-hidden="true"
                              >
                                <img
                                  src={product.image}
                                  loading="lazy"
                                  decoding="async"
                                  alt=""
                                  width={product.naturalWidth}
                                  height={product.naturalHeight}
                                />
                                <span className="rw__num">{n}</span>
                              </a>

                              <div className="rw__info">
                                <span className="rw__type">{product.vendor}</span>
                                <a
                                  className="rw__name"
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {product.name}
                                </a>
                                <span className="rw__price">
                                  <span>{product.priceFormatted}</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                className="rw__add"
                                data-rw-add
                                aria-expanded="false"
                                aria-controls={pickerId}
                                aria-label={`Zur Tasche hinzufügen: ${product.name}`}
                                data-added-label={`In der Tasche: ${product.name}`}
                              >
                                <svg
                                  className="rw__add-plus"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  aria-hidden="true"
                                >
                                  <path d="M12 4v16M4 12h16" />
                                </svg>
                                <svg
                                  className="rw__add-check"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  aria-hidden="true"
                                >
                                  <path d="M4.5 12.5l5 5L19.5 7" />
                                </svg>
                                <svg
                                  className="rw__add-spin"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  aria-hidden="true"
                                >
                                  <path d="M12 3a9 9 0 1 1-9 9" />
                                </svg>
                              </button>

                              <div
                                id={pickerId}
                                className="rw__picker"
                                data-rw-picker
                                hidden
                              >
                                <div className="rw__picker-head">
                                  <div className="rw__picker-thumb">
                                    <img
                                      src={product.image}
                                      loading="lazy"
                                      decoding="async"
                                      alt=""
                                      width={product.mobileWidth}
                                      height={product.mobileHeight}
                                    />
                                  </div>
                                  <div className="rw__picker-meta">
                                    <span className="rw__picker-title">{product.name}</span>
                                    <span className="rw__picker-price">
                                      {product.priceFormatted}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className="rw__picker-close"
                                    data-rw-pick-close
                                    aria-label="Schließen"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      aria-hidden="true"
                                    >
                                      <path d="M5 5l14 14M19 5L5 19" />
                                    </svg>
                                  </button>
                                </div>

                                <fieldset className="rw__opt">
                                  <legend className="rw__opt-name">
                                    {product.optionLegend}
                                  </legend>
                                  <div className="rw__pills">
                                    {product.sizes.map((sizeVal, sIdx) => (
                                      <label
                                        key={`${pickerId}-${sizeVal}`}
                                        className="rw__pill"
                                      >
                                        <input
                                          type="radio"
                                          name={optName}
                                          value={sizeVal}
                                          defaultChecked={sIdx === 0}
                                          data-rw-option="0"
                                        />
                                        <span className="rw__pill-label">{sizeVal}</span>
                                      </label>
                                    ))}
                                  </div>
                                </fieldset>

                                <button
                                  type="button"
                                  className="rw__confirm"
                                  data-rw-confirm
                                >
                                  <span
                                    data-rw-confirm-label
                                    data-add="In die Tasche"
                                  >
                                    In die Tasche
                                  </span>
                                  <span className="rw__sr"> — {product.name}</span>
                                </button>

                                <script
                                  type="application/json"
                                  data-rw-variants
                                  dangerouslySetInnerHTML={{
                                    __html: JSON.stringify(product.variants),
                                  }}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="rw__bundle has-rule">
                        <p
                          className="rw__msg"
                          data-rw-msg
                          role="status"
                          aria-live="polite"
                        />
                        <div className="rw__bundle-row">
                          <div className="rw__bundle-copy">
                            <span className="rw__bundle-title">
                              Mach den Look komplett
                            </span>
                            <span className="rw__bundle-note">
                              Alle 3 sichern &amp; sofort 10 % sparen
                            </span>
                          </div>
                          <div className="rw__bundle-price">
                            <s>{look.bundleOriginal}</s>
                            <strong>{look.bundlePrice}</strong>
                          </div>
                        </div>

                        <button type="button" className="rw__cta" data-rw-all>
                          <span className="rw__cta-add">
                            Kompletten Look in die Tasche
                          </span>
                          <span className="rw__cta-m">
                            Kompletter Look — {look.bundlePrice}
                          </span>
                          <span className="rw__cta-done">
                            Kompletter Look in deiner Tasche
                          </span>
                          <svg
                            className="rw__cta-arrow"
                            width="22"
                            height="12"
                            viewBox="0 0 26 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M1 7h24M19 1l6 6-6 6" />
                          </svg>
                          <svg
                            className="rw__cta-spin"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                          >
                            <path d="M12 3a9 9 0 1 1-9 9" />
                          </svg>
                        </button>
                      </div>

                      <template
                        data-rw-pieces-text
                        dangerouslySetInnerHTML={{ __html: look.piecesLabel }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </runway-section>
      </main>

      <dialog id="bag-dialog">
        <div className="bag-heading">
          <h2>Deine Styling-Tasche</h2>
          <button id="close-bag" type="button" aria-label="Styling-Tasche schließen">
            ×
          </button>
        </div>
        <p className="bag-note">
          Deine persönliche Outfit-Auswahl. Hier erfolgt noch keine Zahlung oder Bestellung. Öffne ein Piece direkt im Original-Shop, um weiterzumachen.
        </p>
        <div id="bag-items" />
        <p id="bag-total" />
        <button id="export-bag" type="button">
          Outfit-Merkliste herunterladen
        </button>
      </dialog>

      <div id="bag-status" role="status" aria-live="polite" />
    </>
  );
}
