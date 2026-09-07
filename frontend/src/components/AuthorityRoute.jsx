import { useAuth } from "../context/AuthContext";

export default function AuthorityRoute({ children }) {
  const { isAuthority, loading } = useAuth();

  if (loading) return <div className="container" style={{ paddingTop: 48 }}>Loading…</div>;

  if (!isAuthority) {
    return (
      <div className="container" style={{ paddingTop: 48 }}>
        <div className="card" style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: "1.1rem" }}>Authority access required</h2>
          <p className="text-soft">
            This dashboard is for municipal authority staff. Sign in with an authority account to continue.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
