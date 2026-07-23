import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

export default function Landing() {
  const { isSignedIn } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Now with AI-powered features
          </div>
          <h1 className="hero-title">
            Build smarter.
            <br />
            <span className="hero-gradient">Ship faster.</span>
          </h1>
          <p className="hero-subtitle">
            A clean, modern platform powered by intelligent backends.
            Sign up in seconds and start building.
          </p>
          <div className="hero-actions">
            {isSignedIn ? (
              <Link to="/dashboard" className="btn btn-primary" id="hero-dashboard">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/sign-up" className="btn btn-primary" id="hero-signup">
                  Get Started Free
                </Link>
                <Link to="/sign-in" className="btn btn-ghost" id="hero-signin">
                  Sign In →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Auth</h3>
            <p>Enterprise-grade authentication powered by Clerk. SSO, MFA, and more out of the box.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Optimized API layer with Express. Sub-100ms response times for every request.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Beautiful UI</h3>
            <p>Clean, minimal interface with dark & light themes. Designed for developers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
