import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth, UserButton } from "@clerk/clerk-react";
import ThemeToggle from "./ThemeToggle";

export default function Layout() {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  const isAuthPage =
    location.pathname.startsWith("/sign-in") ||
    location.pathname.startsWith("/sign-up");

  return (
    <div className="app-layout">
      <nav className="navbar" id="main-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo" id="nav-logo">
            <span className="logo-dot" />
            <span className="logo-text">AI Platform</span>
          </Link>

          <div className="nav-right">
            <ThemeToggle />

            {isSignedIn ? (
              <div className="nav-auth">
                <Link to="/dashboard" className="nav-link" id="nav-dashboard">
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "clerk-avatar",
                    },
                  }}
                />
              </div>
            ) : (
              !isAuthPage && (
                <div className="nav-auth">
                  <Link to="/sign-in" className="nav-link" id="nav-signin">
                    Sign in
                  </Link>
                  <Link to="/sign-up" className="btn btn-primary btn-sm" id="nav-signup">
                    Get Started
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
