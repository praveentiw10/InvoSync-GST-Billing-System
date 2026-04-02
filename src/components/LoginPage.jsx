import { useState } from "react";
import AuthMarketingLayout from "./AuthMarketingLayout";

const initialState = {
  email: "",
  password: ""
};

export default function LoginPage({ onLogin, onShowRegister, loading, feedback, onDownloadApp, downloadLoading, downloadFeedback }) {
  const [form, setForm] = useState(initialState);

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin(form);
  }

  return (
    <AuthMarketingLayout
      heading="Smart GST Billing for Modern Indian Businesses"
      summary="Create professional invoices, track payment status in real-time, and run your billing workflow online or offline from one secure workspace."
      authButtonLabel="Login"
      onDownloadApp={onDownloadApp}
      downloadLoading={downloadLoading}
      downloadFeedback={downloadFeedback}
    >
      <section className="landing-auth-form-shell">
        <div className="auth-brand">
          <p className="eyebrow">Welcome back</p>
          <h1>Login</h1>
          <p>Enter your email and password to continue to your invoicing dashboard.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter your password"
            />
          </label>
          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {feedback ? <p className="auth-feedback">{feedback}</p> : null}

        <div className="auth-switch">
          <p>
            New registration?{" "}
            <button className="auth-link" type="button" onClick={onShowRegister}>
              Open register page
            </button>
          </p>
        </div>

        <div className="internship-badge internship-badge-footer" style={{ border: 'none', background: 'none', padding: '0', marginTop: '24px', opacity: '0.7' }}>
          <span>Internship Work @ </span>
          <strong>MaMo Technolabs LLP</strong>
        </div>
      </section>
    </AuthMarketingLayout>
  );
}
