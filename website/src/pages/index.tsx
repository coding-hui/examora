import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const features = [
  {
    title: "Desktop exam client",
    desc: "Candidates take exams in a controlled desktop environment with local state and autosave.",
  },
  {
    title: "Isolated judge runtime",
    desc: "Code submissions run in an isolated sandbox with parallel test case execution.",
  },
  {
    title: "Snapshot-based scoring",
    desc: "Published exams are frozen as snapshots. All scoring reads from immutable snapshots.",
  },
];

const links = [
  { title: "Quick Start", to: "/examora/docs/getting-started", desc: "Run the full stack locally" },
  { title: "Architecture", to: "/examora/docs/concepts/architecture", desc: "System design and components" },
  { title: "API Reference", to: "/examora/docs/reference/api", desc: "REST API routes and payloads" },
  { title: "Authentication", to: "/examora/docs/concepts/authentication", desc: "Logto SSO and RBAC" },
  { title: "Exam Lifecycle", to: "/examora/docs/concepts/exam-lifecycle", desc: "From authoring to scoring" },
  { title: "Judge Runtime", to: "/examora/docs/reference/judge-runtime", desc: "Worker and sandbox design" },
];

export default function Home() {
  return (
    <Layout title="" description="Examora documentation">
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>Examora</h1>
            <p className={styles.heroLead}>
              Online examination platform with desktop delivery, isolated judging, and snapshot-based scoring.
            </p>
            <div className={styles.heroActions}>
              <Link className="button button--primary button--lg" to="/examora/docs/getting-started">
                Get Started
              </Link>
              <Link className={`button button--outline button--lg ${styles.ghostBtn}`} to="/examora/docs/concepts/architecture">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.sectionInner}>
            <div className={styles.featureGrid}>
              {features.map((f) => (
                <article key={f.title} className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.linkSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.linkSectionTitle}>Documentation</h2>
            <div className={styles.linkGrid}>
              {links.map((link) => (
                <Link key={link.to} className={styles.linkCard} to={link.to}>
                  <span className={styles.linkTitle}>{link.title}</span>
                  <span className={styles.linkDesc}>{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
