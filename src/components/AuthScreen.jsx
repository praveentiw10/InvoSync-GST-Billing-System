import { useState } from "react";

const emptyLogin = {
  email: "",
  password: ""
};

const emptySignup = {
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
};

export default function AuthScreen({ onLogin, onSignup, loading, feedback }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [signupForm, setSignupForm] = useState(emptySignup);

  async function handleLoginSubmit(event) {
    event.preventDefault();
    await onLogin(loginForm);
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      await onSignup({ ...signupForm, passwordMismatch: true });
      return;
    }

    await onSignup(signupForm);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <p className="eyebrow">Mamo Invoice Studio</p>
          <h1>{mode === "login" ? "Login to continue" : "Create your account"}</h1>
          <p>
            {mode === "login"
              ? "Access the invoice dashboard with your stored JWT session."
              : "Register once, store the account in local storage, and start generating invoices."}
          </p>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your password"
              />
            </label>
            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <label className="field">
              <span>Full name</span>
              <input
                value={signupForm.name}
                onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Your name"
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={signupForm.email}
                onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@example.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={signupForm.password}
                onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Create a password"
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                value={signupForm.confirmPassword}
                onChange={(event) => setSignupForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                placeholder="Repeat your password"
              />
            </label>
            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}

        {feedback ? <p className="auth-feedback">{feedback}</p> : null}

        <div className="auth-switch">
          {mode === "login" ? (
            <p>
              New user?{" "}
              <button className="auth-link" type="button" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button className="auth-link" type="button" onClick={() => setMode("login")}>
                Back to login
              </button>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
