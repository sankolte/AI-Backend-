import { useUser, useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setBackendUser(data);
        } else {
          setError("Could not load profile from backend");
        }
      } catch (err) {
        setError("Backend not reachable. Make sure it's running on " + API_URL);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [getToken]);

  return (
    <div className="dashboard-page" id="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, {user?.firstName || "there"} 👋
          </h1>
          <p className="dashboard-subtitle">
            Here's your account overview
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Clerk Profile Card */}
        <div className="dash-card" id="clerk-profile-card">
          <div className="card-header">
            <span className="card-icon">👤</span>
            <h3>Clerk Profile</h3>
          </div>
          <div className="card-body">
            <div className="profile-row">
              <img
                src={user?.imageUrl}
                alt="avatar"
                className="profile-avatar"
              />
              <div>
                <p className="profile-name">{user?.fullName}</p>
                <p className="profile-email">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <div className="profile-meta">
              <div className="meta-item">
                <span className="meta-label">User ID</span>
                <span className="meta-value mono">{user?.id?.slice(0, 16)}...</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Joined</span>
                <span className="meta-value">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Backend Profile Card */}
        <div className="dash-card" id="backend-profile-card">
          <div className="card-header">
            <span className="card-icon">🗄️</span>
            <h3>Backend Profile</h3>
            <span className={`status-badge ${backendUser ? "online" : error ? "error" : "loading"}`}>
              {backendUser ? "Connected" : error ? "Error" : "Loading..."}
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="card-loader">
                <div className="loader" />
                <p>Fetching from backend...</p>
              </div>
            ) : error ? (
              <div className="card-error">
                <p>{error}</p>
                <p className="error-hint">
                  Start your backend with <code>npm run dev</code> in the project root.
                </p>
              </div>
            ) : backendUser ? (
              <div className="backend-data">
                <pre>{JSON.stringify(backendUser, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dash-card stat-card" id="stat-auth">
          <div className="stat-icon">🔐</div>
          <div className="stat-info">
            <span className="stat-value">Active</span>
            <span className="stat-label">Auth Status</span>
          </div>
        </div>

        <div className="dash-card stat-card" id="stat-sessions">
          <div className="stat-icon">📡</div>
          <div className="stat-info">
            <span className="stat-value">{user?.externalAccounts?.length || 0}</span>
            <span className="stat-label">Connected Accounts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
