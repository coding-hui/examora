import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const proofPoints = ["Desktop client", "Judge runtime", "Snapshot scoring"];

const capabilityCards = [
  {
    title: "Operational control",
    desc: "Keep authoring, delivery, and scoring inside one exam lifecycle.",
  },
  {
    title: "Isolated execution",
    desc: "Desktop, API, worker, and sandbox remain separated by design.",
  },
  {
    title: "Fast documentation path",
    desc: "Find setup, concepts, API, and runtime docs without hunting around.",
  },
];

const entries = [
  { label: "Getting Started", title: "Quick Start", to: "/docs/getting-started", desc: "Run the full stack locally." },
  { label: "Concepts", title: "Architecture", to: "/docs/concepts/architecture", desc: "Read the system model." },
  { label: "Reference", title: "API Reference", to: "/docs/reference/api", desc: "Inspect routes and payloads." },
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
              <p className={styles.heroLead}>
                A desktop-first exam platform with a controlled runtime, isolated judging, and docs that follow the
                product flow.
              </p>

              <div className={styles.heroActions}>
                <Link className="button button--primary button--lg" to="/docs/getting-started">
                  Quick Start
                </Link>
                <Link className={`button button--lg ${styles.secondaryButton}`} to="/docs/concepts/architecture">
                  Architecture
                </Link>
              </div>

              <div className={styles.heroPills}>
                {proofPoints.map((pill) => (
                  <span key={pill} className={styles.pill}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.heroPanel}>
              <div className={styles.panelTopline}>
                <span className={styles.panelTitle}>System Snapshot</span>
                <span className={styles.panelStatus}>Live session</span>
              </div>

              <div className={styles.panelWindow}>
                <div className={styles.windowTopbar}>
                  <span className={styles.windowDots}>
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className={styles.windowName}>examora-desktop</span>
                </div>

                <div className={styles.windowBody}>
                  <div className={styles.windowCard}>
                    <span className={styles.windowLabel}>Current exam</span>
                    <strong>Programming 101</strong>
                    <p>Autosave is active. Candidate state stays local until submission.</p>
                  </div>

                  <div className={styles.windowGrid}>
                    <div className={styles.windowStat}>
                      <span>API</span>
                      <strong>Session sync</strong>
                    </div>
                    <div className={styles.windowStat}>
                      <span>Worker</span>
                      <strong>Judge queued</strong>
                    </div>
                    <div className={styles.windowStat}>
                      <span>Sandbox</span>
                      <strong>Isolated run</strong>
                    </div>
                  </div>

                  <div className={styles.windowStrip}>
                    <span>Draft saved</span>
                    <span>Submission queued</span>
                    <span>Score pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Why Examora</p>
              <h2 className={styles.sectionTitle}>One platform, one exam lifecycle.</h2>
            </div>

            <div className={styles.capabilityGrid}>
              {capabilityCards.map((card) => (
                <article key={card.title} className={styles.capabilityCard}>
                  <h3 className={styles.capabilityTitle}>{card.title}</h3>
                  <p className={styles.capabilityDesc}>{card.desc}</p>
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
