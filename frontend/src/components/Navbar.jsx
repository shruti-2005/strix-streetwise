import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAuthority } = useAuth();

  return (
    <header className="nav">
      <div className="nav-inner container">
        <NavLink to="/" className="nav-brand">
          <OwlMark />
          <span>
            Strix<span className="text-faint nav-brand-sub"> / StreetWise</span>
          </span>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Map
          </NavLink>
          <NavLink to="/report" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Report Issue
          </NavLink>
          <NavLink to="/my-reports" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            My Reports
          </NavLink>
          {isAuthority && (
            <NavLink to="/authority" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Authority Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-user">
          {user?.isAnonymous ? (
            <NavLink to="/login" className="btn btn-outline btn-sm">
              Sign in
            </NavLink>
          ) : (
            <span className="nav-user-name">{user?.name}</span>
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
