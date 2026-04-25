import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const heroPills = ["Desktop client", "API service", "Judge runtime"];

const capabilities = [
  {
    title: "One flow, one runtime",
    desc: "Authoring, delivery, and scoring stay in the same operational model.",
  },
  {
    title: "Clear service boundaries",
    desc: "Desktop, API, worker, and sandbox remain separated in the docs and the system.",
  },
];

const entries = [
  { label: "Getting Started", title: "Quick Start", to: "/docs/getting-started", desc: "Run the stack locally." },
  { label: "Concepts", title: "Architecture", to: "/docs/concepts/architecture", desc: "See the system model." },
  { label: "Reference", title: "API Reference", to: "/docs/reference/api", desc: "Routes and payloads." },
  { label: "Concepts", title: "Authentication", to: "/docs/concepts/authentication", desc: "Logto and RBAC." },
  { label: "Concepts", title: "Exam Lifecycle", to: "/docs/concepts/exam-lifecycle", desc: "Publish to scoring." },
  { label: "Reference", title: "Judge Runtime", to: "/docs/reference/judge-runtime", desc: "Worker and sandbox." },
];

export default function Home() {
  return (
    <Layout title="" description="Examora documentation">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Examora documentation</p>
              <h1 className={styles.heroTitle}>Desktop exam delivery</h1>
              <p className={styles.heroLead}>Setup, runtime, and reference docs for the Examora stack.</p>

              <div className={styles.heroActions}>
                <Link className="button button--primary button--lg" to="/docs/getting-started">
                  Quick Start
                </Link>
                <Link className={`button button--lg ${styles.secondaryButton}`} to="/docs/concepts/architecture">
                  Architecture
                </Link>
              </div>

              <div className={styles.heroPills}>
                {heroPills.map((pill) => (
                  <span key={pill} className={styles.pill}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.heroMock}>
              <div className={styles.mockHeader}>
                <span className={styles.mockTitle}>System Snapshot</span>
                <span className={styles.mockState}>Live session</span>
              </div>

              <div className={styles.mockLayout}>
                <aside className={styles.mockSidebar}>
                  <span className={styles.mockSidebarLabel}>Session</span>
                  <div className={`${styles.mockItem} ${styles.mockItemActive}`}>Candidate workspace</div>
                  <div className={styles.mockItem}>Submission queue</div>
                  <div className={styles.mockItem}>Judge worker</div>
                  <div className={styles.mockItem}>Sandbox run</div>
                </aside>

                <section className={styles.mockMain}>
                  <div className={styles.mockHeroCard}>
                    <span className={styles.mockHeroLabel}>Programming exam</span>
                    <h2 className={styles.mockHeroTitle}>Auto-save is on.</h2>
                    <p className={styles.mockHeroText}>
                      Candidate actions, queue state, and judge progress stay visible in one interface.
                    </p>
                  </div>

                  <div className={styles.mockTimeline}>
                    <div className={styles.timelineRow}>
                      <span className={styles.timelineKey}>Draft</span>
                      <span className={styles.timelineValue}>Saved locally</span>
                    </div>
                    <div className={styles.timelineRow}>
                      <span className={styles.timelineKey}>Submit</span>
                      <span className={styles.timelineValue}>Queued for judge</span>
                    </div>
                    <div className={styles.timelineRow}>
                      <span className={styles.timelineKey}>Score</span>
                      <span className={styles.timelineValue}>Pending result</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className={styles.mockFooter}>
                <div className={styles.footerCard}>
                  <span>API</span>
                  <strong>Session sync</strong>
                </div>
                <div className={styles.footerCard}>
                  <span>Worker</span>
                  <strong>Judge queued</strong>
                </div>
                <div className={styles.footerCard}>
                  <span>Sandbox</span>
                  <strong>Isolated run</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Why Examora</p>
              <h2 className={styles.sectionTitle}>A simple map of the platform.</h2>
            </div>

            <div className={styles.capabilityGrid}>
              {capabilities.map((item) => (
                <article key={item.title} className={styles.capabilityCard}>
                  <h3 className={styles.capabilityTitle}>{item.title}</h3>
                  <p className={styles.capabilityDesc}>{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.entrySection}`}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Documentation Entry</p>
              <h2 className={styles.sectionTitle}>Start with the right section.</h2>
            </div>

            <div className={styles.entryGrid}>
              {entries.map((entry) => (
                <Link key={entry.to} className={styles.entryCard} to={entry.to}>
                  <span className={styles.entryLabel}>{entry.label}</span>
                  <div className={styles.entryRow}>
                    <span className={styles.entryTitle}>{entry.title}</span>
                    <span className={styles.entryArrow}>→</span>
                  </div>
                  <p className={styles.entryDesc}>{entry.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
