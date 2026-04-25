import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const installSteps = [
  { cmd: "git clone git@github.com:coding-hui/examora.git", desc: "Clone the repository" },
  { cmd: "make deps", desc: "Install frontend & Rust dependencies" },
  { cmd: "make infra-up", desc: "Start PostgreSQL & Redis via Docker" },
  { cmd: "make api & make worker", desc: "Launch API server & judge worker" },
  { cmd: "pnpm dev:admin", desc: "Open admin console at localhost:5173" },
];

const links = [
  { title: "Quick Start", to: "/examora/docs/getting-started", desc: "Run the full stack locally" },
  { title: "Architecture", to: "/examora/docs/concepts/architecture", desc: "System design and components" },
  { title: "API Reference", to: "/examora/docs/reference/api", desc: "REST API routes and payloads" },
  { title: "Authentication", to: "/examora/docs/concepts/authentication", desc: "Logto SSO and RBAC" },
  { title: "Exam Lifecycle", to: "/examora/docs/concepts/exam-lifecycle", desc: "From authoring to scoring" },
  { title: "Judge Runtime", to: "/examora/docs/reference/judge-runtime", desc: "Worker and sandbox design" },
];

const flowSteps = [
  { label: "Author", desc: "Create questions and papers in the admin console" },
  { label: "Publish", desc: "Freeze source into immutable paper snapshots" },
  { label: "Deliver", desc: "Candidates take exams via the desktop client" },
  { label: "Judge", desc: "Worker runs code submissions in the sandbox" },
  { label: "Score", desc: "Results computed from snapshot data" },
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

        <section className={styles.techSection}>
          <div className={styles.sectionInner}>
            <p className={styles.techSectionLabel}>Quick Install</p>
            <div className={styles.techTerminal}>
              <div className={styles.terminalBar}>
                <span className={styles.terminalDot} />
                <span className={styles.terminalDot} />
                <span className={styles.terminalDot} />
                <span className={styles.terminalTitle}>examora ~ setup</span>
              </div>
              <div className={styles.terminalBody}>
                {installSteps.map((step, i) => (
                  <div key={step.cmd} className={styles.terminalLine}>
                    <span className={styles.terminalNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.terminalCmd}>{step.cmd}</span>
                    <span className={styles.terminalComment}>// {step.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.flowSection}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionLabel}>Exam Lifecycle</p>
            <h2 className={styles.flowSectionTitle}>From authoring to scoring</h2>
            <div className={styles.flowTrack}>
              {flowSteps.map((step, i) => (
                <div key={step.label} className={styles.flowStep}>
                  <div className={styles.flowNum}>{String(i + 1).padStart(2, "0")}</div>
                  <div className={styles.flowContent}>
                    <span className={styles.flowLabel}>{step.label}</span>
                    <span className={styles.flowDesc}>{step.desc}</span>
                  </div>
                  {i < flowSteps.length - 1 && <div className={styles.flowArrow}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.archSection}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionLabel}>Architecture</p>
            <h2 className={styles.archSectionTitle}>System overview</h2>
            <div className={styles.archImg}>
              <img src="/examora/img/system-architecture-overview.svg" alt="Examora system architecture" />
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
