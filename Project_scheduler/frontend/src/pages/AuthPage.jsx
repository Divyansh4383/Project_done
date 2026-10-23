import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/Primitives";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [registering, setRegistering] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (registering) await register(email, password, displayName);
      else await login(email, password);
      navigate(location.state?.from?.pathname || "/projects", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-aside">
        <div className="brand brand-light"><span className="brand-mark">S</span><span>SprintForge</span></div>
        <div className="auth-message">
          <div className="eyebrow">DELIVERY, IN FOCUS</div>
          <h1>Turn good plans into work that ships.</h1>
          <p>One clear space for projects, sprint goals, and the daily movement of your team.</p>
          <div className="auth-decoration"><span /><span /><span /><span /></div>
        </div>
        <small className="auth-footer">A calmer way to move work forward.</small>
      </div>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="eyebrow">{registering ? "GET STARTED" : "WELCOME BACK"}</div>
          <h2>{registering ? "Create your account" : "Sign in to SprintForge"}</h2>
          <p className="muted">{registering ? "Set up your team workspace in a few moments." : "Pick up where your team left off."}</p>
          <ErrorMessage error={error} />
          <form className="form-stack" onSubmit={submit}>
            {registering && (
              <label>
                Display name
                <input required maxLength="120" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
              </label>
            )}
            <label>
              Email
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label>
              Password
              <input required minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={registering ? "new-password" : "current-password"} />
            </label>
            <button className="button button-primary button-wide" disabled={busy}>
              {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
            </button>
          </form>
          <div className="auth-switch">
            {registering ? "Already have an account?" : "New to SprintForge?"}
            <button className="text-button" onClick={() => { setRegistering(!registering); setError(""); }}>
              {registering ? "Sign in" : "Create an account"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
