import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", locality: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 48, maxWidth: 420 }}>
      <div className="card">
        <div className="flex gap-2" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === "login" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === "register" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <p className="text-soft" style={{ marginTop: 0, fontSize: "0.85rem" }}>
          You're already browsing Strix anonymously — no account needed to report issues. Sign in only if you want a
          named, persistent account (e.g. as authority staff, or to sync reports across devices).
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" value={form.name} onChange={update("name")} placeholder="Your name" />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={form.password} onChange={update("password")} placeholder="••••••••" />
          </div>
          {mode === "register" && (
            <div className="field">
              <label htmlFor="locality">Locality (optional)</label>
              <input id="locality" value={form.locality} onChange={update("locality")} placeholder="e.g. Downtown" />
            </div>
          )}

          {error && <div className="report-alert report-alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-faint" style={{ fontSize: "0.76rem", marginTop: 16 }}>
          Demo authority login: roads.authority@strix.demo / password123 (after running the seed script)
        </p>
      </div>
    </div>
  );
}
