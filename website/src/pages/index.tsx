import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const installSteps = [
  { cmd: "git clone git@github.com:coding-hui/examora.git", desc: "// Clone the repository" },
  { cmd: "make deps", desc: "// Install frontend & Rust dependencies" },
  { cmd: "make infra-up", desc: "// Start PostgreSQL & Redis via Docker" },
  { cmd: "make api & make worker", desc: "// Launch API server & judge worker" },
  { cmd: "pnpm dev:admin", desc: "// Open admin console at localhost:5173" },
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
  { num: "01", label: "Author", desc: "Create questions and papers in the admin console" },
  { num: "02", label: "Publish", desc: "Freeze source into immutable paper snapshots" },
  { num: "03", label: "Deliver", desc: "Candidates take exams via the desktop client" },
  { num: "04", label: "Judge", desc: "Worker runs code submissions in the sandbox" },
  { num: "05", label: "Score", desc: "Results computed from snapshot data" },
];

const testCases = [
  { id: "Case 01", name: "Add two integers", status: "pass", time: "12 ms", mem: "4 KB" },
  { id: "Case 02", name: "Handle negative numbers", status: "pass", time: "8 ms", mem: "3 KB" },
  { id: "Case 03", name: "Large input performance", status: "fail", time: "2048 ms", mem: "512 KB" },
  { id: "Case 04", name: "Overflow detection", status: "pass", time: "9 ms", mem: "4 KB" },
  { id: "Case 05", name: "Empty input edge case", status: "pass", time: "6 ms", mem: "2 KB" },
];

function JudgeStatusIcon({ status }: { status: string }) {
  if (status === "pass") {
    return (
      <span className={`${styles.caseStatus} ${styles.pass}`}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4.5" fill="#34d399" opacity="0.2"/>
          <path d="M3 5l1.5 1.5L7 3.5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        pass
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className={`${styles.caseStatus} ${styles.fail}`}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4.5" fill="#f87171" opacity="0.2"/>
          <path d="M3.5 3.5l3 3M6.5 3.5l-3 3" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        fail
      </span>
    );
  }
  return (
    <span className={`${styles.caseStatus} ${styles.pending}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4.5" fill="#fbbf24" opacity="0.2"/>
        <circle cx="5" cy="5" r="2" fill="#fbbf24"/>
      </svg>
      pending
    </span>
  );
}

export default function Home() {
  return (
    <Layout title="" description="Examora documentation">
      <main className={styles.page}>
        {/* ---- Hero ---- */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeDot} />
                Online examination platform
              </div>
              <h1 className={styles.heroTitle}>Examora</h1>
              <p className={styles.heroLead}>
                Desktop-first exam delivery with isolated judge runtime and snapshot-based scoring.
              </p>
              <div className={styles.heroActions}>
                <Link className="button button--primary button--lg" to="/examora/docs/getting-started">
                  Get Started
                </Link>
                <Link
                  className={`button button--outline button--lg ${styles.ghostBtn}`}
                  to="/examora/docs/concepts/architecture"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Judge Preview Card */}
            <div className={styles.heroPanel}>
              <div className={styles.heroPanelHeader}>
                <span className={styles.heroPanelTitle}>examora ~ judge-preview</span>
                <span className={styles.heroPanelStatus}>
                  <span className={styles.statusDot} />
                  Live session
                </span>
              </div>
              <div className={styles.heroPanelBody}>
                {testCases.map((tc) => (
                  <div key={tc.id} className={styles.heroCaseRow}>
                    <span className={styles.caseId}>{tc.id}</span>
                    <span className={styles.caseName}>{tc.name}</span>
                    <JudgeStatusIcon status={tc.status} />
                    <span className={styles.caseTime}>{tc.time}</span>
                    <span className={styles.caseMem}>{tc.mem}</span>
                  </div>
                ))}
                <div className={styles.heroSummary}>
                  <div className={styles.heroSummaryLeft}>
                    <span className={styles.summaryPass}>4 / 5 passed</span>
                    <span className={styles.summaryFail}>1 failed</span>
                  </div>
                  <span className={styles.summaryTime}>2073 ms</span>
                  <span className={styles.heroSandbox}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <rect x="0.5" y="2" width="8" height="6" rx="1" stroke="#818cf8" strokeWidth="0.8"/>
                      <rect x="1.5" y="0.5" width="5" height="3" rx="0.8" stroke="#818cf8" strokeWidth="0.8"/>
                      <circle cx="7" cy="2.5" r="0.5" fill="#818cf8"/>
                    </svg>
                    Linux Sandbox
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Quick Install ---- */}
        <section className={styles.installSection}>
          <div className={styles.installSectionInner}>
            <p className={styles.installLabel}>Quick Install</p>
            <div className={styles.installTerminal}>
              <div className={styles.installTerminalBar}>
                <div className={styles.installTerminalDots}>
                  <span className={styles.installTerminalDot} />
                  <span className={styles.installTerminalDot} />
                  <span className={styles.installTerminalDot} />
                </div>
                <span className={styles.installTerminalTitle}>examora ~ setup</span>
              </div>
              <div className={styles.installTerminalBody}>
                {installSteps.map((step, i) => (
                  <div key={step.cmd} className={styles.installLine}>
                    <span className={styles.installNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.installCmd}>{step.cmd}</span>
                    <span className={styles.installComment}>{step.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- Exam Lifecycle ---- */}
        <section className={styles.lifecycleSection}>
          <div className={styles.lifecycleInner}>
            <p className={styles.lifecycleLabel}>Exam Lifecycle</p>
            <h2 className={styles.lifecycleTitle}>From authoring to scoring</h2>
            <div className={styles.lifecycleGrid}>
              {flowSteps.map((step, i) => (
                <div key={step.num} className={styles.lifecycleCard}>
                  <span className={styles.lifecycleNum}>{step.num}</span>
                  <span className={styles.lifecycleCardLabel}>{step.label}</span>
                  <span className={styles.lifecycleCardDesc}>{step.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Architecture ---- */}
        <section className={styles.archSection}>
          <div className={styles.archInner}>
            <p className={styles.archLabel}>Architecture</p>
            <h2 className={styles.archTitle}>System overview</h2>
            <div className={styles.archImg}>
              <img
                src="/examora/img/system-architecture-overview.svg"
                alt="Examora system architecture"
              />
            </div>
          </div>
        </section>

        {/* ---- Documentation ---- */}
        <section className={styles.docSection}>
          <div className={styles.docInner}>
            <h2 className={styles.docTitle}>Documentation</h2>
            <div className={styles.docGrid}>
              {links.map((link) => (
                <Link key={link.to} className={styles.docCard} to={link.to}>
                  <span className={styles.docCardTitle}>{link.title}</span>
                  <span className={styles.docCardDesc}>{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
