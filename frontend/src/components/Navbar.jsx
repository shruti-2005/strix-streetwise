import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAuthority, logout } = useAuth();
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="nav">
      <div className="nav-inner container">
        <NavLink to={user ? "/dashboard" : "/"} className="nav-brand">
          <OwlMark />
          <span>
            <b>STRIX</b><small>StreetWise Civic Intelligence</small>
          </span>
        </NavLink>

        <nav className="nav-links">
          {user && <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>Dashboard</NavLink>}
          <NavLink to="/live-map" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>Live Map</NavLink>
          <NavLink to="/my-reports" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>My Reports</NavLink>
          {isAuthority && <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>Admin Panel</NavLink>}
        </nav>

        <div className="nav-user">
          <NavLink to="/report" className="nav-report"><span>⊕</span> Report issue</NavLink>
          <span className="nav-bell" aria-label="Notifications">♧</span>
          {!user ? <NavLink to="/" className="nav-signin">Sign in</NavLink> : (
            <div className="account-menu">
              <button
                className="nav-avatar"
                onClick={() => setAccountMenuOpen((open) => !open)}
                title="Account menu"
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
              >
                {user?.name?.[0] || "●"}
              </button>
              {accountMenuOpen && (
                <div className="account-menu-popover">
                  <span className="account-menu-name">{user?.name || "Signed in user"}</span>
                  <button type="button" onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function OwlMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#171A1E" />
      <circle cx="11" cy="14" r="4.2" fill="#F1F3EF" />
      <circle cx="21" cy="14" r="4.2" fill="#F1F3EF" />
      <circle cx="11" cy="14" r="1.6" fill="#171A1E" />
      <circle cx="21" cy="14" r="1.6" fill="#171A1E" />
      <path d="M16 17.5L13.5 22H18.5L16 17.5Z" fill="#E8730A" />
    </svg>
  );
}
