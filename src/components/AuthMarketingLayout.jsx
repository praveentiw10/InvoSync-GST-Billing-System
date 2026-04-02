import { useMemo, useState } from "react";
import { getLandingTopic, landingLinkTargets } from "../data/landingTopics";

const HERO_CHECKLIST = [
  "Collect online payments and recurring subscriptions from one system",
  "Generate GST-ready invoices with branded PDF output",
  "Track paid, unpaid, and partial collections in real time",
  "Use desktop mode for uninterrupted invoicing when offline"
];

const TRUSTED_BRANDS = ["TechSmith", "Intel", "CourseLab", "AppForge", "StudioPilot", "DevWorks"];

const METRICS = [
  { value: "3,200+", label: "digital product teams served" },
  { value: "200+", label: "regions ready for billing" },
  { value: "21+", label: "languages supported" },
  { value: "35+", label: "payment currencies" }
];

const USE_CASES = [
  {
    title: "SaaS and AI",
    description: "Manage recurring subscriptions, upgrades, and invoice automation for product-led and sales-led growth.",
    topicKey: landingLinkTargets.footer_saas_ai
  },
  {
    title: "Downloadable Software",
    description: "Sell licenses, renewals, and add-ons with one workflow that combines checkout, invoicing, and reporting.",
    topicKey: landingLinkTargets.footer_software
  },
  {
    title: "Courses and Digital Goods",
    description: "Accept global payments for training, templates, media, and digital products with clean post-purchase invoicing.",
    topicKey: landingLinkTargets.footer_digital_goods
  }
];

const PLATFORM_FEATURES = [
  {
    title: "Global Payments",
    description: "Accept payments across multiple countries while keeping one consistent billing flow for your team."
  },
  {
    title: "Subscription Management",
    description: "Run monthly or annual plans, prorations, and renewals with full visibility into active and pending revenue."
  },
  {
    title: "Branded Checkout + Invoices",
    description: "Keep customer experience consistent with your logo, signature, terms, and payment details."
  },
  {
    title: "Automated Tax Workflow",
    description: "Use built-in GST-ready invoice generation and summaries to reduce manual tax preparation effort."
  },
  {
    title: "Fraud and Risk Signals",
    description: "Spot irregular payment behavior early and maintain healthier approval rates for valid transactions."
  },
  {
    title: "Analytics and Revenue Insights",
    description: "Understand sales trends, collections, and pending amounts from practical dashboard summaries."
  }
];

const DEV_FEATURES = [
  {
    title: "Simple Integration",
    description: "Start quickly with a clean web app flow and switch to desktop runtime when your team needs offline support.",
    topicKey: landingLinkTargets.footer_integration
  },
  {
    title: "Offline Queueing",
    description: "Critical actions like email retries and invoice work remain reliable during network drops.",
    topicKey: landingLinkTargets.footer_offline_runtime
  },
  {
    title: "Production-Ready Exports",
    description: "Generate stable A4 PDF invoices that maintain structure after preview, download, and sharing.",
    topicKey: landingLinkTargets.footer_pdf_pipeline
  }
];

const HIGHLIGHTS = [
  { value: "10x", label: "faster invoice drafting" },
  { value: "100%", label: "offline-ready workflow" },
  { value: "A4", label: "stable PDF quality" }
];

function openTopOfPage() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function LandingNav({ onTopicOpen, onAuthOpen, onDownloadApp, downloadLoading, authButtonLabel }) {
  return (
    <header className="landing-nav">
      <div className="landing-brand">
        <span className="landing-brand-badge">IS</span>
        <span>InvoSync</span>
      </div>

      <nav className="landing-nav-links">
        <button className="landing-link-button" type="button" onClick={() => onTopicOpen(landingLinkTargets.nav_product)}>
          Product
        </button>
        <button className="landing-link-button" type="button" onClick={() => onTopicOpen(landingLinkTargets.nav_use_cases)}>
          Use Cases
        </button>
        <button className="landing-link-button" type="button" onClick={() => onTopicOpen(landingLinkTargets.nav_developers)}>
          Developers
        </button>
        <button className="landing-link-button" type="button" onClick={() => onTopicOpen(landingLinkTargets.nav_resources)}>
          Resources
        </button>
      </nav>

      <div className="landing-nav-actions">
        <button className="ghost-button landing-auth-open-btn" type="button" onClick={onAuthOpen}>
          {authButtonLabel}
        </button>
        <button className="primary-button download-app-button landing-download-small" type="button" onClick={onDownloadApp} disabled={downloadLoading}>
          {downloadLoading ? "Preparing..." : "Download App"}
        </button>
      </div>
    </header>
  );
}

function LandingFooter({ onTopicOpen }) {
  return (
    <footer className="landing-footer" id="footer">
      <div className="landing-footer-grid">
        <div>
          <strong>InvoSync</strong>
          <p>Modern billing infrastructure for software and digital product businesses.</p>
        </div>
        <div>
          <h4>Product</h4>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_payments)}>
            Payments
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_subscriptions)}>
            Subscriptions
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_tax_invoicing)}>
            Tax Invoicing
          </button>
        </div>
        <div>
          <h4>Solutions</h4>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_saas_ai)}>
            SaaS and AI
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_software)}>
            Software
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_digital_goods)}>
            Digital Goods
          </button>
        </div>
        <div>
          <h4>Developers</h4>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_integration)}>
            Integration
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_offline_runtime)}>
            Offline Runtime
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_pdf_pipeline)}>
            PDF Pipeline
          </button>
        </div>
        <div>
          <h4>Help</h4>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_support)}>
            Support
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_guides)}>
            Guides
          </button>
          <button className="landing-footer-link" type="button" onClick={() => onTopicOpen(landingLinkTargets.footer_release_updates)}>
            Release Updates
          </button>
        </div>
      </div>
      <p className="landing-copyright">&copy; {new Date().getFullYear()} InvoSync. Built for modern business billing operations.</p>
      <div className="internship-badge internship-badge-footer">
        <span>Internship Project @ </span>
        <strong>MaMo Technolabs LLP</strong>
      </div>
    </footer>
  );
}

function TopicPage({ topic, onBack, onTopicOpen, onDownloadApp, downloadLoading, onAuthOpen }) {
  return (
    <>
      <section className="landing-topic-hero fade-in-up">
        <button className="landing-topic-back" type="button" onClick={onBack}>
          Back to Home
        </button>
        <p className="landing-kicker">{topic.category}</p>
        <h1>{topic.title}</h1>
        <p>{topic.summary}</p>
      </section>

      <section className="landing-topic-metrics">
        {topic.metrics.map((metric) => (
          <article key={`${topic.title}-${metric.label}`} className="landing-topic-metric-card fade-in-up">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <section className="landing-topic-sections">
        {topic.sections.map((section, index) => (
          <article key={`${topic.title}-${section.heading}`} className="landing-topic-section fade-in-up" style={{ animationDelay: `${index * 70}ms` }}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={`${section.heading}-${paragraph.slice(0, 22)}`}>{paragraph}</p>
            ))}
            <ul>
              {section.bullets.map((bullet) => (
                <li key={`${section.heading}-${bullet}`}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="landing-topic-related fade-in-up" style={{ animationDelay: "140ms" }}>
        <div>
          <p className="landing-kicker">Related Topics</p>
          <h2>Continue Exploring</h2>
        </div>
        <div className="landing-topic-related-grid">
          {topic.related.map((item) => (
            <button key={`${topic.title}-${item.key}`} className="landing-topic-related-link" type="button" onClick={() => onTopicOpen(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="landing-cta-banner">
        <div>
          <p className="landing-kicker">Ready To Start</p>
          <h2>Try this workflow in your own billing operations</h2>
        </div>
        <div className="landing-topic-cta-actions">
          <button className="primary-button download-app-button" type="button" onClick={onDownloadApp} disabled={downloadLoading}>
            {downloadLoading ? "Preparing..." : "Download InvoiceGen App"}
          </button>
          <button className="secondary-button" type="button" onClick={onAuthOpen}>
            Open Auth Panel
          </button>
        </div>
      </section>
    </>
  );
}

export default function AuthMarketingLayout({
  heading,
  summary,
  authButtonLabel,
  onDownloadApp,
  downloadLoading,
  downloadFeedback,
  children
}) {
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [activeTopicKey, setActiveTopicKey] = useState(null);

  const activeTopic = useMemo(() => (activeTopicKey ? getLandingTopic(activeTopicKey) : null), [activeTopicKey]);

  function openAuthPanel() {
    setShowAuthPanel(true);
  }

  function closeAuthPanel() {
    setShowAuthPanel(false);
  }

  function openTopic(topicKey) {
    setActiveTopicKey(topicKey);
    openTopOfPage();
  }

  function goHome() {
    setActiveTopicKey(null);
    openTopOfPage();
  }

  return (
    <main className={`landing-shell ${activeTopic ? "landing-shell-topic" : ""}`}>
      <div className="landing-announcement fade-in-up">
        <span className="landing-announcement-badge">New</span>
        <p>Desktop + web billing with offline-safe invoice workflows.</p>
      </div>

      <LandingNav
        onTopicOpen={openTopic}
        onAuthOpen={openAuthPanel}
        onDownloadApp={onDownloadApp}
        downloadLoading={downloadLoading}
        authButtonLabel={authButtonLabel}
      />

      {activeTopic ? (
        <TopicPage
          topic={activeTopic}
          onBack={goHome}
          onTopicOpen={openTopic}
          onDownloadApp={onDownloadApp}
          downloadLoading={downloadLoading}
          onAuthOpen={openAuthPanel}
        />
      ) : (
        <>
          <section className="landing-hero" id="product">
            <div className="landing-hero-grid">
              <div className="landing-copy fade-in-up">
                <p className="landing-kicker">All-In-One Billing Platform</p>
                <h1>{heading}</h1>
                <p>{summary}</p>

                <div className="landing-cta-row">
                  <button className="primary-button download-app-button landing-cta-primary" type="button" onClick={onDownloadApp} disabled={downloadLoading}>
                    {downloadLoading ? "Preparing installer..." : "Download InvoSync Desktop"}
                  </button>
                  <button className="secondary-button landing-cta-secondary" type="button" onClick={() => openTopic(landingLinkTargets.nav_product)}>
                    Explore Platform
                  </button>
                </div>

                {downloadFeedback ? <p className="landing-download-feedback">{downloadFeedback}</p> : null}

                <div className="landing-trust-row">
                  <span>Trusted by growing digital product teams</span>
                  <div className="landing-brand-cloud">
                    {TRUSTED_BRANDS.map((brand) => (
                      <span key={brand} className="landing-brand-pill">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="landing-hero-panel fade-in-up" style={{ animationDelay: "90ms" }}>
                <p className="landing-kicker">Platform Snapshot</p>
                <h3>Everything required to run billing operations at scale</h3>
                <ul className="landing-hero-checklist">
                  {HERO_CHECKLIST.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="landing-highlight-grid">
                  {HIGHLIGHTS.map((item) => (
                    <div className="landing-highlight-card" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <section className="landing-stats fade-in-up" style={{ animationDelay: "120ms" }}>
            {METRICS.map((metric) => (
              <article className="landing-stat-card" key={metric.label}>
                <strong className="landing-stat-value">{metric.value}</strong>
                <span className="landing-stat-label">{metric.label}</span>
              </article>
            ))}
          </section>

          <section className="landing-section" id="use-cases">
            <div className="landing-section-header">
              <p className="landing-kicker">Who InvoSync Serves</p>
              <h2>Purpose-built for teams selling software and digital products</h2>
            </div>

            <div className="landing-use-case-grid">
              {USE_CASES.map((item, index) => (
                <article className="landing-use-case-card fade-in-up" key={item.title} style={{ animationDelay: `${index * 80}ms` }}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <button className="landing-inline-link-btn" type="button" onClick={() => openTopic(item.topicKey)}>
                    Open full page
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-section" id="platform">
            <div className="landing-section-header">
              <p className="landing-kicker">Platform Capabilities</p>
              <h2>Everything your billing team needs in one operational layer</h2>
            </div>

            <div className="landing-platform-grid">
              {PLATFORM_FEATURES.map((item, index) => (
                <article className="landing-platform-card fade-in-up" key={item.title} style={{ animationDelay: `${index * 70}ms` }}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-dev" id="developers">
            <div className="landing-dev-copy fade-in-up">
              <p className="landing-kicker">Made For Developers</p>
              <h2>Simple to adopt, flexible to scale, reliable in production</h2>
              <p>
                Run the web workflow for quick rollout, then use the desktop app where offline resilience and local installer distribution are required.
              </p>
            </div>

            <div className="landing-dev-grid">
              {DEV_FEATURES.map((item, index) => (
                <article className="landing-dev-card fade-in-up" key={item.title} style={{ animationDelay: `${index * 90}ms` }}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <button className="landing-inline-link-btn landing-inline-link-light" type="button" onClick={() => openTopic(item.topicKey)}>
                    Read full page
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-resource-band" id="resources">
            <button className="landing-resource-pill" type="button" onClick={() => openTopic(landingLinkTargets.resource_product_overview)}>
              Product Overview
            </button>
            <button className="landing-resource-pill" type="button" onClick={() => openTopic(landingLinkTargets.resource_integration_notes)}>
              Integration Notes
            </button>
            <button className="landing-resource-pill" type="button" onClick={() => openTopic(landingLinkTargets.resource_support_resources)}>
              Support Resources
            </button>
          </section>

          <section className="landing-cta-banner">
            <div>
              <p className="landing-kicker">Ready To Start</p>
              <h2>Launch desktop-ready billing and invoicing with confidence</h2>
            </div>
            <button className="primary-button download-app-button" type="button" onClick={onDownloadApp} disabled={downloadLoading}>
              {downloadLoading ? "Preparing..." : "Download InvoSync App"}
            </button>
          </section>
        </>
      )}

      <LandingFooter onTopicOpen={openTopic} />

      {showAuthPanel ? (
        <div className="landing-auth-overlay" onClick={closeAuthPanel}>
          <section className="landing-auth-modal auth-card" onClick={(event) => event.stopPropagation()}>
            <div className="landing-auth-modal-header">
              <strong>{authButtonLabel}</strong>
              <button className="ghost-button landing-close-btn" type="button" onClick={closeAuthPanel}>
                Close
              </button>
            </div>
            {children}
          </section>
        </div>
      ) : null}
    </main>
  );
}
