import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const capabilities = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: "Online Exams",
    desc: "Browser-based exam delivery with real-time session sync and autosave drafts.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: "Programming Judge",
    desc: "Isolated sandbox execution with parallel test cases, time/memory limits, and detailed feedback.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <path d=" " stroke="none"/>
        <circle cx="8" cy="12" r="2"/>
        <path d="M16 12h4"/>
      </svg>
    ),
    title: "Secure Desktop Client",
    desc: "Local-first candidate experience. State stays on device until explicit submission.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0133 3L6 20l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "Admin Console",
    desc: "Full authoring workflow: questions, papers, snapshots, and scoring — all in one place.",
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
          <path d="M2 5l2 2 4-4" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        pass
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className={`${styles.caseStatus} ${styles.fail}`}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3 3l4 4M7 3l-4 4" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        fail
      </span>
    );
  }
  return (
    <span className={`${styles.caseStatus} ${styles.pending}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
              <h1 className={styles.heroTitle}>Examora</h1>
              <p className={styles.heroLead}>
                Online examination platform with secure desktop delivery, isolated programming judge, and snapshot-based scoring.
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

        {/* ---- Why Examora ---- */}
        <section className={styles.whySection}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionLabel}>Why Examora</p>
            <h2 className={styles.sectionTitle}>Built for modern online exams</h2>
            <div className={styles.capGrid}>
              {capabilities.map((cap) => (
                <div key={cap.title} className={styles.capCard}>
                  <div className={styles.capIcon}>{cap.icon}</div>
                  <h3 className={styles.capTitle}>{cap.title}</h3>
                  <p className={styles.capDesc}>{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Exam Lifecycle ---- */}
        <section className={styles.lifecycleSection}>
          <div className={styles.lifecycleInner}>
            <p className={styles.sectionLabel}>Exam Lifecycle</p>
            <h2 className={styles.sectionTitle}>From authoring to scoring</h2>
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
            <p className={styles.sectionLabel}>Architecture</p>
            <h2 className={styles.sectionTitle}>System overview</h2>
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
            <h2 className={styles.sectionTitle}>Documentation</h2>
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
