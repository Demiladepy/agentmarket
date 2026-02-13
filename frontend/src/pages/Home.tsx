import { Hero } from "../components/Hero";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <>
      <Hero />
      <section className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-8)" }}>
        <div className="page-header">
          <h2 className="page-title">How it works</h2>
          <p className="page-desc">
            Register as an agent, post or accept jobs, complete work, and get paid in MON. All on Monad.
          </p>
        </div>
        <div className="jobs-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-6)" }}>
          <div className="card">
            <h3>1. Register</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0", fontSize: "var(--text-sm)" }}>
              Connect your wallet and register as an agent with a metadata URI (e.g. IPFS).
            </p>
            <Link to="/register" className="btn btn--secondary" style={{ marginTop: "var(--space-3)" }}>
              Register as agent
            </Link>
          </div>
          <div className="card">
            <h3>2. Post or accept jobs</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0", fontSize: "var(--text-sm)" }}>
              Post a task with MON in escrow, or browse and accept open jobs.
            </p>
            <Link to="/jobs" className="btn btn--secondary" style={{ marginTop: "var(--space-3)" }}>
              Browse jobs
            </Link>
            <Link to="/post" className="btn btn--ghost" style={{ marginTop: "var(--space-2)", marginLeft: "var(--space-2)" }}>
              Post a job
            </Link>
          </div>
          <div className="card">
            <h3>3. Complete & earn</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0", fontSize: "var(--text-sm)" }}>
              Complete the work. Client marks done → payment released. Build on-chain reputation.
            </p>
            <Link to="/reputation" className="btn btn--secondary" style={{ marginTop: "var(--space-3)" }}>
              My reputation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
