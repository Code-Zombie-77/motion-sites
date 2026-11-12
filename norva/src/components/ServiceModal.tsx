import React, { useState } from 'react';
import { Language, NorvaCopy } from '../data/industrialContent';

export type ModalType = 'industries' | 'mission' | 'apply' | 'request' | null;

interface ServiceModalProps {
  activeModal: ModalType;
  onClose: () => void;
  onSwitchModal: (modal: ModalType) => void;
  copy: NorvaCopy;
  lang: Language;
  onToggleLang: (lang: Language) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  activeModal,
  onClose,
  onSwitchModal,
  copy,
  lang,
  onToggleLang,
}) => {
  // Request Crew form state
  const [selectedCraft, setSelectedCraft] = useState(copy.requestModal.crafts[0]);
  const [headcount, setHeadcount] = useState('12');
  const [site, setSite] = useState('');
  const [startWindow, setStartWindow] = useState(copy.requestModal.startOptions[0]);
  const [contact, setContact] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [dispatchCode, setDispatchCode] = useState('');

  // Apply form state
  const [applicantName, setApplicantName] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(copy.applyModal.trades[0]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([copy.applyModal.certs[0]]);
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySubmitted, setApplySubmitted] = useState(false);

  if (!activeModal) return null;

  const handleCertToggle = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.trim() || !contact.trim()) {
      setRequestError(
        lang === 'de'
          ? 'Bitte geben Sie Werksstandort und Kontaktdaten für die Einsatzleitung an.'
          : 'Please enter both plant location and contact details.'
      );
      return;
    }
    setRequestError('');
    setDispatchCode(`NRV-${Math.floor(1000 + Math.random() * 9000)}-DE`);
    setRequestSubmitted(true);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim()) {
      setApplyError(
        lang === 'de'
          ? 'Bitte geben Sie Ihren Namen und Ihre Telefonnummer oder E-Mail an.'
          : 'Please provide your full name and phone or email.'
      );
      return;
    }
    setApplyError('');
    setApplySubmitted(true);
  };

  return (
    <div
      className="norva-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="norva-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="norva-modal-panel">
        <div className="norva-modal-topbar">
          <div className="norva-modal-tabs">
            <button
              type="button"
              className={`norva-modal-tab ${activeModal === 'industries' ? 'is-active' : ''}`}
              onClick={() => onSwitchModal('industries')}
            >
              {copy.nav.industries}
            </button>
            <button
              type="button"
              className={`norva-modal-tab ${activeModal === 'mission' ? 'is-active' : ''}`}
              onClick={() => onSwitchModal('mission')}
            >
              {copy.nav.mission}
            </button>
            <button
              type="button"
              className={`norva-modal-tab ${activeModal === 'apply' ? 'is-active' : ''}`}
              onClick={() => {
                setApplySubmitted(false);
                onSwitchModal('apply');
              }}
            >
              {copy.nav.apply}
            </button>
            <button
              type="button"
              className={`norva-modal-tab ${activeModal === 'request' ? 'is-active' : ''}`}
              onClick={() => {
                setRequestSubmitted(false);
                onSwitchModal('request');
              }}
            >
              {copy.nav.requestCrews}
            </button>
          </div>

          <div className="norva-modal-actions">
            <div className="norva-lang-switch" role="group" aria-label="Sprachauswahl">
              <button
                type="button"
                className={`norva-lang-btn ${lang === 'de' ? 'is-active' : ''}`}
                onClick={() => onToggleLang('de')}
              >
                DE
              </button>
              <button
                type="button"
                className={`norva-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
                onClick={() => onToggleLang('en')}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              className="norva-modal-close"
              onClick={onClose}
              aria-label={lang === 'de' ? 'Dialog schließen' : 'Close dialog'}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="norva-modal-content">
          {activeModal === 'industries' && (
            <div>
              <p className="norva-modal-kicker">{copy.industriesModal.kicker}</p>
              <h2 id="norva-modal-title" className="norva-modal-heading">
                {copy.industriesModal.title}
              </h2>
              <p className="norva-modal-subtitle">{copy.industriesModal.subtitle}</p>

              <div className="norva-industry-grid">
                {copy.industriesModal.items.map((item) => (
                  <article key={item.id} className="norva-industry-card">
                    <div className="norva-industry-meta">
                      <span>{item.code}</span>
                      <span>·</span>
                      <span className="norva-industry-metric">{item.metrics}</span>
                    </div>
                    <h3 className="norva-industry-title">{item.title}</h3>
                    <p className="norva-industry-sub">{item.subtitle}</p>
                    <p className="norva-industry-desc">{item.description}</p>
                    <div className="norva-industry-crafts">
                      {item.crafts.join('  ·  ')}
                    </div>
                  </article>
                ))}
              </div>

              <div className="norva-modal-footer-cta">
                <button
                  type="button"
                  className="norva-pill norva-pill-lime"
                  onClick={() => {
                    setRequestSubmitted(false);
                    onSwitchModal('request');
                  }}
                >
                  {copy.nav.requestCrews}
                </button>
              </div>
            </div>
          )}

          {activeModal === 'mission' && (
            <div>
              <p className="norva-modal-kicker">{copy.missionModal.kicker}</p>
              <h2 id="norva-modal-title" className="norva-modal-heading">
                {copy.missionModal.title}
              </h2>
              <p className="norva-modal-subtitle">{copy.missionModal.lead}</p>

              <div className="norva-stats-row">
                {copy.missionModal.stats.map((st) => (
                  <div key={st.label} className="norva-stat-cell">
                    <div className="norva-stat-value">{st.value}</div>
                    <div className="norva-stat-label">{st.label}</div>
                  </div>
                ))}
              </div>

              <div className="norva-pillars-list">
                {copy.missionModal.pillars.map((pillar) => (
                  <div key={pillar.num} className="norva-pillar-item">
                    <span className="norva-pillar-num">{pillar.num}</span>
                    <div>
                      <h3 className="norva-pillar-title">{pillar.title}</h3>
                      <p className="norva-pillar-detail">{pillar.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="norva-modal-footer-cta">
                <button
                  type="button"
                  className="norva-pill norva-pill-lime"
                  onClick={() => {
                    setRequestSubmitted(false);
                    onSwitchModal('request');
                  }}
                >
                  {copy.nav.requestCrews}
                </button>
              </div>
            </div>
          )}

          {activeModal === 'request' && (
            <div>
              <p className="norva-modal-kicker">{copy.requestModal.kicker}</p>
              <h2 id="norva-modal-title" className="norva-modal-heading">
                {copy.requestModal.title}
              </h2>
              <p className="norva-modal-subtitle">{copy.requestModal.subtitle}</p>

              {requestSubmitted ? (
                <div className="norva-confirm-box" role="status">
                  <div className="norva-confirm-code">
                    DISPOSITION-ID: {dispatchCode}
                  </div>
                  <h3 className="norva-confirm-title">{copy.requestModal.successTitle}</h3>
                  <p className="norva-confirm-body">{copy.requestModal.successBody}</p>
                  <div className="norva-confirm-summary">
                    <div>
                      <strong>{copy.requestModal.craftLabel}:</strong> {selectedCraft}
                    </div>
                    <div>
                      <strong>{copy.requestModal.headcountLabel}:</strong> {headcount} Fachkräfte
                    </div>
                    <div>
                      <strong>{copy.requestModal.siteLabel}:</strong> {site}
                    </div>
                    <div>
                      <strong>{copy.requestModal.startLabel}:</strong> {startWindow}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="norva-pill norva-pill-gray"
                    onClick={() => {
                      setRequestSubmitted(false);
                      setSite('');
                      setContact('');
                    }}
                  >
                    {lang === 'de' ? 'WEITERE ANFORDERUNG ERFASSEN' : 'SUBMIT ANOTHER REQUEST'}
                  </button>
                </div>
              ) : (
                <form className="norva-form" onSubmit={handleRequestSubmit} noValidate>
                  <div className="norva-form-row">
                    <label className="norva-label" htmlFor="req-craft">
                      {copy.requestModal.craftLabel}
                    </label>
                    <select
                      id="req-craft"
                      className="norva-input"
                      value={selectedCraft}
                      onChange={(e) => setSelectedCraft(e.target.value)}
                    >
                      {copy.requestModal.crafts.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="norva-form-grid-2">
                    <div className="norva-form-row">
                      <label className="norva-label" htmlFor="req-headcount">
                        {copy.requestModal.headcountLabel}
                      </label>
                      <input
                        id="req-headcount"
                        type="number"
                        min="1"
                        max="500"
                        className="norva-input"
                        value={headcount}
                        onChange={(e) => setHeadcount(e.target.value)}
                      />
                    </div>
                    <div className="norva-form-row">
                      <label className="norva-label" htmlFor="req-start">
                        {copy.requestModal.startLabel}
                      </label>
                      <select
                        id="req-start"
                        className="norva-input"
                        value={startWindow}
                        onChange={(e) => setStartWindow(e.target.value)}
                      >
                        {copy.requestModal.startOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="norva-form-row">
                    <label className="norva-label" htmlFor="req-site">
                      {copy.requestModal.siteLabel}
                    </label>
                    <input
                      id="req-site"
                      type="text"
                      className="norva-input"
                      placeholder={copy.requestModal.sitePlaceholder}
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      required
                    />
                  </div>

                  <div className="norva-form-row">
                    <label className="norva-label" htmlFor="req-contact">
                      {copy.requestModal.contactLabel}
                    </label>
                    <input
                      id="req-contact"
                      type="text"
                      className="norva-input"
                      placeholder={copy.requestModal.contactPlaceholder}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                    />
                  </div>

                  {requestError && (
                    <p className="norva-form-error" role="alert">
                      {requestError}
                    </p>
                  )}

                  <button type="submit" className="norva-pill norva-pill-lime norva-submit-btn">
                    {copy.requestModal.submitLabel}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeModal === 'apply' && (
            <div>
              <p className="norva-modal-kicker">{copy.applyModal.kicker}</p>
              <h2 id="norva-modal-title" className="norva-modal-heading">
                {copy.applyModal.title}
              </h2>
              <p className="norva-modal-subtitle">{copy.applyModal.subtitle}</p>

              {applySubmitted ? (
                <div className="norva-confirm-box" role="status">
                  <h3 className="norva-confirm-title">{copy.applyModal.successTitle}</h3>
                  <p className="norva-confirm-body">{copy.applyModal.successBody}</p>
                  <div className="norva-confirm-summary">
                    <div>
                      <strong>{copy.applyModal.nameLabel}:</strong> {applicantName}
                    </div>
                    <div>
                      <strong>{copy.applyModal.tradeLabel}:</strong> {selectedTrade}
                    </div>
                    <div>
                      <strong>{copy.applyModal.certLabel}:</strong>{' '}
                      {selectedCerts.length > 0 ? selectedCerts.join(', ') : '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="norva-pill norva-pill-gray"
                    onClick={() => {
                      setApplySubmitted(false);
                      setApplicantName('');
                      setApplicantPhone('');
                    }}
                  >
                    {lang === 'de' ? 'NEUES PROFIL ERFASSEN' : 'SUBMIT ANOTHER PROFILE'}
                  </button>
                </div>
              ) : (
                <form className="norva-form" onSubmit={handleApplySubmit} noValidate>
                  <div className="norva-form-row">
                    <label className="norva-label" htmlFor="app-name">
                      {copy.applyModal.nameLabel}
                    </label>
                    <input
                      id="app-name"
                      type="text"
                      className="norva-input"
                      placeholder={copy.applyModal.namePlaceholder}
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="norva-form-row">
                    <label className="norva-label" htmlFor="app-trade">
                      {copy.applyModal.tradeLabel}
                    </label>
                    <select
                      id="app-trade"
                      className="norva-input"
                      value={selectedTrade}
                      onChange={(e) => setSelectedTrade(e.target.value)}
                    >
                      {copy.applyModal.trades.map((tr) => (
                        <option key={tr} value={tr}>
                          {tr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="norva-form-row">
                    <span className="norva-label">{copy.applyModal.certLabel}</span>
                    <div className="norva-cert-grid">
                      {copy.applyModal.certs.map((cert) => {
                        const active = selectedCerts.includes(cert);
                        return (
                          <button
                            key={cert}
                            type="button"
                            className={`norva-cert-btn ${active ? 'is-selected' : ''}`}
                            onClick={() => handleCertToggle(cert)}
                            aria-pressed={active}
                          >
                            {cert}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="norva-form-row">
                    <label className="norva-label" htmlFor="app-phone">
                      {copy.applyModal.phoneLabel}
                    </label>
                    <input
                      id="app-phone"
                      type="text"
                      className="norva-input"
                      placeholder={copy.applyModal.phonePlaceholder}
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      required
                    />
                  </div>

                  {applyError && (
                    <p className="norva-form-error" role="alert">
                      {applyError}
                    </p>
                  )}

                  <button type="submit" className="norva-pill norva-pill-lime norva-submit-btn">
                    {copy.applyModal.submitLabel}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
