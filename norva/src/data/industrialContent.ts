export type Language = 'de' | 'en';

export interface ProcessStep {
  num: string;
  title: string;
  body: string;
  targetScrollP: number;
}

export interface IndustryItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  metrics: string;
  description: string;
  crafts: string[];
}

export interface NorvaCopy {
  nav: {
    industries: string;
    mission: string;
    apply: string;
    requestCrews: string;
  };
  hero: {
    headlineLine1: string;
    headlineLine2: string;
    subline1: string;
    subline2: string;
    subline3: string;
    mobileSubline: string;
  };
  scrollCue: string;
  steps: ProcessStep[];
  industriesModal: {
    kicker: string;
    title: string;
    subtitle: string;
    items: IndustryItem[];
  };
  missionModal: {
    kicker: string;
    title: string;
    lead: string;
    pillars: {
      num: string;
      title: string;
      detail: string;
    }[];
    stats: {
      value: string;
      label: string;
    }[];
  };
  requestModal: {
    kicker: string;
    title: string;
    subtitle: string;
    craftLabel: string;
    crafts: string[];
    headcountLabel: string;
    siteLabel: string;
    sitePlaceholder: string;
    startLabel: string;
    startOptions: string[];
    contactLabel: string;
    contactPlaceholder: string;
    submitLabel: string;
    successTitle: string;
    successBody: string;
  };
  applyModal: {
    kicker: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    tradeLabel: string;
    trades: string[];
    certLabel: string;
    certs: string[];
    phoneLabel: string;
    phonePlaceholder: string;
    submitLabel: string;
    successTitle: string;
    successBody: string;
  };
}

export const MEDIA_ASSETS = {
  desktopVideo:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/65fdef53-5686-4659-8761-52d61bf1a4f7.mp4',
  mobileVideo:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/9a30e5e9-9f03-4755-9bc1-7bcf1510aab3.mp4',
  poster:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/33150b94-09f7-47da-a7c9-3ae76c2dd7eb.jpg',
};

export const CONTENT: Record<Language, NorvaCopy> = {
  de: {
    nav: {
      industries: 'UNSERE BRANCHEN',
      mission: 'UNSERE MISSION',
      apply: 'BEWERBEN',
      requestCrews: 'EINSATZ ANFRAGEN',
    },
    hero: {
      headlineLine1: 'Der neue Standard',
      headlineLine2: 'im Industrieservice',
      subline1: 'KI-gestützte Disposition. Geprüfte Fachkolonnen.',
      subline2: 'Wir mobilisieren zertifizierte Instandhaltungsteams zum Schutz Ihrer',
      subline3: 'Terminpläne und Anlagenverfügbarkeit in hochkritischen Industrien.',
      mobileSubline:
        'KI-gestützte Disposition. Geprüfte Fachkolonnen. Wir mobilisieren zertifizierte Instandhaltungsteams zum Schutz Ihrer Terminpläne und Anlagenverfügbarkeit in hochkritischen Industrien.',
    },
    scrollCue: 'SCROLLEN, UM UNSEREN PROZESS ZU ENTDECKEN',
    steps: [
      {
        num: '01',
        title: 'Aktivierung, vereinfacht',
        body: 'Ein Anruf startet die Mobilisierung. Gewerk, Mannschaftsstärke und Starttermin gehen direkt an unsere geprüften Fachteams. Keine Übergabeverluste. Keine Eskalationen. Einsatzbereite Spezialisten vor Ort in wenigen Minuten.',
        targetScrollP: 0.35,
      },
      {
        num: '02',
        title: 'Geprüft und einsatzklar',
        body: 'Jede Fachkraft wird vor der Entsendung umfassend geprüft: Arbeitssicherheit (SCC/VCA), Hintergrund, Zertifizierungen und Tauglichkeit – damit das gesamte Team am ersten Tag ohne Verzögerung das Werkstor passiert.',
        targetScrollP: 0.78,
      },
      {
        num: '03',
        title: 'Bewährte Praxiserfahrung',
        body: 'Präzise Abstimmung auf Ihre Anlagenanforderungen: Vom Turbinenservice über Rohrleitungsbau bis zur Kraftwerksrevision liefern wir eingespielte Kolonnen mit nachgewiesener Industrieerfahrung.',
        targetScrollP: 0.88,
      },
      {
        num: '04',
        title: 'Nahtlose Werksintegration',
        body: 'Vollständig mit PSA ausgerüstete Kolonnen integrieren sich unmittelbar in Ihre Schicht- und Stillstandsplanung – inklusive digitaler Stundenerfassung und 24/7-Einsatzleitstelle.',
        targetScrollP: 0.98,
      },
    ],
    industriesModal: {
      kicker: 'EINSATZGEBIETE & SEKTOREN',
      title: 'Kritische Infrastruktur & Industrieanlagen',
      subtitle:
        'Unsere Spezialistenteams sichern den durchgängigen Betrieb in vier hochregulierten Industriesektoren im gesamten DACH- und Benelux-Raum.',
      items: [
        {
          id: 'energy',
          code: 'SEKTOR 01',
          title: 'Windenergie & Netztechnik',
          subtitle: 'Onshore- & Offshore-Turbinenservice',
          metrics: '99,4 % Termintreue bei geplanten Wartungsfenstern',
          description:
            'Zertifizierte Servicetechniker mit GWO- und PSAgA-Nachweisen für Getriebetausch, Rotorblattinspektion, Generatorwartung und Umspannwerke.',
          crafts: ['GWO-Servicetechniker', 'Hochspannungselektriker', 'Industriekletterer'],
        },
        {
          id: 'power',
          code: 'SEKTOR 02',
          title: 'Kraftwerke & Thermische Anlagen',
          subtitle: 'Kühlturm-, Kessel- & Turbinenrevision',
          metrics: '< 2 Std. Reaktionszeit bei ungeplanten Stillständen',
          description:
            'Schichtfähige Revisionskolonnen für Dampfturbinen, Wärmetauscher, Kühlturmeinbauten und Hochdruck-Rohrleitungssysteme im 24/7-Betrieb.',
          crafts: ['Rohrschlosser ISO', 'WIG/MAG-Schweißer', 'Armaturentechniker'],
        },
        {
          id: 'chem',
          code: 'SEKTOR 03',
          title: 'Chemie, Petrochemie & Raffinerie',
          subtitle: 'Turnaround-Management & Anlagenstillstände',
          metrics: '100 % SCC** / VCA-P-zertifizierte Sicherheitsquote',
          description:
            'Komplette Gewerketeams für Großabstellungen (TAR), Kolonnenreinigung, Flanschmanagement nach EN 1591-4 und EMSR-Inbetriebnahme.',
          crafts: ['Flanschmonteure EN 1591', 'EMSR-Fachkräfte', 'Sicherheitswachen'],
        },
        {
          id: 'port',
          code: 'SEKTOR 04',
          title: 'Hafen-, Container- & Schwerlastlogistik',
          subtitle: 'Terminalinstandhaltung & Fördertechnik',
          metrics: '4.800+ verifizierte Fachkräfte auf Abruf',
          description:
            'Spezialisierte Instandhaltungsteams für Containerbrücken, Portalkrane, automatisierte Lagersysteme und maritime Umschlaghubs.',
          crafts: ['Mechatroniker Kranbau', 'Hydraulikspezialisten', 'SPS-Inbetriebnehmer'],
        },
      ],
    },
    missionModal: {
      kicker: 'UNSERE MISSION',
      title: 'Stillstandszeiten minimieren. Anlagensicherheit maximieren.',
      lead: 'In hochkritischen Industrieumgebungen kostet jede Stunde ungeplanter Anlagenstillstand sechsstellige Beträge. NORVA ersetzt träge Personalvermittlung durch algorithmische Echtzeit-Disposition und kompromisslose Vorab-Qualifizierung.',
      pillars: [
        {
          num: '01',
          title: 'Direkte Leitstellen-Aktivierung ohne Zwischenhändler',
          detail:
            'Ihre Anforderung läuft direkt in unser zentrales Dispositionsnetzwerk. Verfügbare Kolonnen mit passender Werksfreigabe werden in unter 15 Minuten identifiziert.',
        },
        {
          num: '02',
          title: 'Lückenlose Sicherheits- & Dokumentenprüfung vorab',
          detail:
            'SCC/VCA-Zertifikate, Schweißerprüfungen nach ISO 9606, arbeitsmedizinische Vorsorge (G20/G25/G41) und PSA-Prüfprotokolle liegen digital vor, bevor das Team anreist.',
        },
        {
          num: '03',
          title: 'Eingespielte Kolonnen statt Einzelvermittlung',
          detail:
            'Wir entsenden aufeinander abgestimmte Teams inklusive deutschsprachigem Kolonnenführer und SGU-Aufsicht – für sofortige Produktivität ab Schichtbeginn.',
        },
      ],
      stats: [
        { value: '18 Min.', label: 'Ø Bestätigungszeit für Eilkolonnen' },
        { value: '4.850+', label: 'Zertifizierte Industrie-Spezialisten' },
        { value: '99,8 %', label: 'Ersttags-Freigabequote am Werkstor' },
        { value: '24 / 7', label: 'Besetzte Leitstelle im DACH-Raum' },
      ],
    },
    requestModal: {
      kicker: '24/7 LEITSTELLE · SOFORTDISPOSITION',
      title: 'Industrie-Einsatzteam anfordern',
      subtitle:
        'Übermitteln Sie Ihren Bedarf direkt an unsere Einsatzleitung. Sie erhalten innerhalb von 15 Minuten eine verbindliche Verfügbarkeits- und Qualifikationsübersicht.',
      craftLabel: 'BENÖTIGTES GEWERK',
      crafts: [
        'Rohrleitungsbau & Schweißtechnik (WIG/MAG)',
        'Kraftwerks- & Turbinenrevision',
        'Windenergie & Hochspannungstechnik',
        'Chemie-Turnaround & Flanschmanagement',
        'EMSR-Technik & Industrieautomatisierung',
      ],
      headcountLabel: 'TEAMSTÄRKE (FACHKRÄFTE)',
      siteLabel: 'WERKSSTANDORT / ANLAGE',
      sitePlaceholder: 'z. B. Industriepark Höchst, Werk Leverkusen, Offshore Nordsee',
      startLabel: 'EINSATZBEGINN',
      startOptions: [
        'Soforteinsatz / Störfall (< 24 Std.)',
        'Kurzfristig (innerhalb 72 Std.)',
        'Geplanter Stillstand / Revision (nach Terminplan)',
      ],
      contactLabel: 'EINSATZLEITER / GESCHÄFTLICHE E-MAIL ODER TELEFON',
      contactPlaceholder: 'name@industrie-werk.de / +49 ...',
      submitLabel: 'VERFÜGBARKEIT PRÜFEN & ANFORDERN',
      successTitle: 'Einsatzanforderung in der Leitstelle registriert',
      successBody:
        'Ihre Anfrage wurde mit Priorität an unseren diensthabenden Dispositionsleiter übergeben. Die Vorab-Auswahl der SCC-geprüften Fachkolonne wird vorbereitet.',
    },
    applyModal: {
      kicker: 'FACHKRÄFTE-NETZWERK',
      title: 'Als Industrie-Spezialist oder Kolonne bewerben',
      subtitle:
        'Werden Sie Teil der führenden Einsatzreserve für Anlagenbau, Instandhaltung und Energieinfrastruktur mit übertariflicher Vergütung und verlässlicher Einsatzplanung.',
      nameLabel: 'VOLLSTÄNDIGER NAME / KOLONNENLEITER',
      namePlaceholder: 'z. B. Markus Weber',
      tradeLabel: 'HAUPTQUALIFIKATION / GEWERK',
      trades: [
        'Industriemechaniker / Anlagenmechaniker',
        'Geprüfter Schweißer (ISO 9606 WIG / MAG / E-Hand)',
        'Elektroniker für Betriebstechnik / EMSR',
        'Servicetechniker Windenergie (GWO)',
        'Richtmeister / Bau- & Revisionsleiter',
      ],
      certLabel: 'VORHANDENE SICHERHEITSZERTIFIKATE',
      certs: ['SCC / VCA', 'G41 Arbeiten in Höhen / PSAgA', 'Flanschschein EN 1591-4', 'Schaltberechtigung bis 30 kV'],
      phoneLabel: 'TELEFONNUMMER ODER E-MAIL FÜR RÜCKRUF',
      phonePlaceholder: '+49 170 ... oder name@beispiel.de',
      submitLabel: 'QUALIFIKATIONSPROFIL SENDEN',
      successTitle: 'Profil erfolgreich übermittelt',
      successBody:
        'Vielen Dank. Unser technisches Recruiting-Team prüft Ihre Angaben und meldet sich werktags innerhalb von 4 Stunden für die Dokumentenfreigabe.',
    },
  },
  en: {
    nav: {
      industries: 'OUR INDUSTRIES',
      mission: 'OUR MISSION',
      apply: 'APPLY',
      requestCrews: 'REQUEST CREWS',
    },
    hero: {
      headlineLine1: 'The New Standard',
      headlineLine2: 'in Staffing',
      subline1: 'AI driven speed. Expert curation.',
      subline2: 'We mobilize verified crews to protect your schedule and',
      subline3: 'your bottom line in high-consequence environments.',
      mobileSubline:
        'AI driven speed. Expert curation. We mobilize verified crews to protect your schedule and your bottom line in high-consequence environments.',
    },
    scrollCue: 'SCROLL TO DISCOVER OUR PROCESS',
    steps: [
      {
        num: '01',
        title: 'Activation, simplified',
        body: 'One call starts mobilization. Craft, headcount and start date go straight to our vetted crews. No hand-offs. No escalations. Just boots on site within minutes.',
        targetScrollP: 0.35,
      },
      {
        num: '02',
        title: 'Cleared to count',
        body: 'Every worker is screened before dispatch: compliance, background, certifications and fitness for duty, so the whole crew clears the gate on day one.',
        targetScrollP: 0.78,
      },
      {
        num: '03',
        title: 'Proven field match',
        body: 'Precision matching for your plant specifications: from turbine overhaul to industrial piping and turnaround maintenance, every crew arrives field-proven.',
        targetScrollP: 0.88,
      },
      {
        num: '04',
        title: 'Seamless arrival',
        body: 'Fully PPE-equipped squads integrate straight into your shift and outage schedule with digital timekeeping and 24/7 dispatch oversight.',
        targetScrollP: 0.98,
      },
    ],
    industriesModal: {
      kicker: 'SECTORS & DEPLOYMENTS',
      title: 'High-Consequence Industrial Environments',
      subtitle:
        'Our verified industrial crews protect uptime across four mission-critical sectors.',
      items: [
        {
          id: 'energy',
          code: 'SECTOR 01',
          title: 'Wind Energy & Grid Infrastructure',
          subtitle: 'Onshore & Offshore Turbine Maintenance',
          metrics: '99.4% schedule adherence across maintenance windows',
          description:
            'GWO-certified technicians for gearbox swaps, blade inspection, generator servicing, and high-voltage substations.',
          crafts: ['GWO Technicians', 'HV Electricians', 'Rope Access Specialists'],
        },
        {
          id: 'power',
          code: 'SECTOR 02',
          title: 'Power Generation & Thermal Plants',
          subtitle: 'Cooling Tower, Boiler & Turbine Overhauls',
          metrics: '< 2 hr response time for unplanned outages',
          description:
            'Shift-ready overhaul squads for steam turbines, heat exchangers, cooling towers, and high-pressure piping systems.',
          crafts: ['ISO Pipefitters', 'TIG/MIG Welders', 'Valve Technicians'],
        },
        {
          id: 'chem',
          code: 'SECTOR 03',
          title: 'Chemical, Petrochemical & Refining',
          subtitle: 'Turnaround Management & Plant Outages',
          metrics: '100% SCC** / VCA-P safety clearance rate',
          description:
            'Complete craft teams for major turnarounds (TAR), vessel maintenance, EN 1591-4 flange management, and I&C commissioning.',
          crafts: ['EN 1591 Flange Techs', 'I&C Specialists', 'Safety Supervisors'],
        },
        {
          id: 'port',
          code: 'SECTOR 04',
          title: 'Port, Container & Heavy Logistics',
          subtitle: 'Terminal Maintenance & Crane Engineering',
          metrics: '4,800+ verified specialists on standby',
          description:
            'Specialized maintenance crews for ship-to-shore cranes, gantry systems, automated stacking yards, and maritime hubs.',
          crafts: ['Crane Mechatronics', 'Hydraulics Techs', 'PLC Engineers'],
        },
      ],
    },
    missionModal: {
      kicker: 'OUR MISSION',
      title: 'Eliminate Gate Delays. Protect Critical Schedules.',
      lead: 'In high-consequence industrial environments, every hour of unplanned downtime costs six figures. NORVA replaces slow legacy staffing with real-time algorithmic dispatch and uncompromising pre-clearance.',
      pillars: [
        {
          num: '01',
          title: 'Direct Dispatch Without Middlemen',
          detail:
            'Your requirements go straight to our verified crew network. Cleared teams with matching plant credentials are locked in under 15 minutes.',
        },
        {
          num: '02',
          title: 'Full Gate-Ready Pre-Screening',
          detail:
            'Safety compliance, background checks, welding certifications, and medical fitness for duty are verified before a single boot leaves for site.',
        },
        {
          num: '03',
          title: 'Cohesive Crews Over Fragmented Temps',
          detail:
            'We deploy field-tested squads led by experienced foremen and safety leads for immediate day-one productivity.',
        },
      ],
      stats: [
        { value: '18 min', label: 'Avg. confirmation for rapid dispatch' },
        { value: '4,850+', label: 'Verified industrial specialists' },
        { value: '99.8%', label: 'Day-one gate clearance rate' },
        { value: '24 / 7', label: 'Live operations command center' },
      ],
    },
    requestModal: {
      kicker: '24/7 OPERATIONS DESK · RAPID MOBILIZATION',
      title: 'Request Verified Industrial Crews',
      subtitle:
        'Send your craft and schedule requirements directly to dispatch. Receive a confirmed availability roster within 15 minutes.',
      craftLabel: 'REQUIRED CRAFT / DISCIPLINE',
      crafts: [
        'Industrial Piping & Welding (TIG/MIG)',
        'Power Plant & Turbine Overhaul',
        'Wind Energy & High-Voltage Grid',
        'Refinery Turnaround & Flange Management',
        'I&C Engineering & Plant Automation',
      ],
      headcountLabel: 'CREW HEADCOUNT',
      siteLabel: 'PLANT LOCATION / SITE',
      sitePlaceholder: 'e.g. Frankfurt Industrial Park, North Sea Hub',
      startLabel: 'MOBILIZATION WINDOW',
      startOptions: [
        'Emergency Dispatch (< 24 hrs)',
        'Rapid Mobilization (within 72 hrs)',
        'Scheduled Outage / Turnaround',
      ],
      contactLabel: 'SITE MANAGER / WORK EMAIL OR PHONE',
      contactPlaceholder: 'name@plant-ops.com / +49 ...',
      submitLabel: 'VERIFY AVAILABILITY & DISPATCH',
      successTitle: 'Mobilization Request Logged with Dispatch',
      successBody:
        'Your request has been routed to our duty operations lead. Pre-cleared crew rosters are being compiled for your site.',
    },
    applyModal: {
      kicker: 'SPECIALIST NETWORK',
      title: 'Apply as a Verified Specialist or Crew',
      subtitle:
        'Join the premier industrial deployment network across energy, refining, and heavy maintenance.',
      nameLabel: 'FULL NAME / FOREMAN',
      namePlaceholder: 'e.g. Markus Weber',
      tradeLabel: 'PRIMARY TRADE / CRAFT',
      trades: [
        'Industrial Mechanic / Millwright',
        'Certified Welder (ISO 9606 TIG / MIG)',
        'Industrial Electrician / I&C Tech',
        'Wind Turbine Technician (GWO)',
        'Site Foreman / Turnaround Supervisor',
      ],
      certLabel: 'ACTIVE SAFETY CLEARANCES',
      certs: ['SCC / VCA', 'Working at Heights / Rope Access', 'EN 1591-4 Flange Cert', 'HV Switching up to 30 kV'],
      phoneLabel: 'PHONE OR EMAIL FOR CALLBACK',
      phonePlaceholder: '+49 170 ... or name@example.com',
      submitLabel: 'SUBMIT CREDENTIAL PROFILE',
      successTitle: 'Application Received',
      successBody:
        'Our technical credentialing team is reviewing your profile and will reach out within 4 business hours.',
    },
  },
};
