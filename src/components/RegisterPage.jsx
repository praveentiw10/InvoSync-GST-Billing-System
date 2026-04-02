import { useState } from "react";
import AuthMarketingLayout from "./AuthMarketingLayout";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
};

export default function RegisterPage({ onRegister, onShowLogin, loading, feedback, onDownloadApp, downloadLoading, downloadFeedback }) {
  const [form, setForm] = useState(initialState);

  async function handleSubmit(event) {
    event.preventDefault();
    await onRegister(form);
  }

  return (
    <AuthMarketingLayout
      heading="Get Started with Fast, Reliable Invoice Operations"
      summary="Set up your workspace in minutes, issue branded invoices, and monitor receipts with a dashboard designed for day-to-day business flow."
      authButtonLabel="Register"
      onDownloadApp={onDownloadApp}
      downloadLoading={downloadLoading}
      downloadFeedback={downloadFeedback}
    >
      <section className="landing-auth-form-shell">
        <div className="auth-brand">
          <p className="eyebrow">Create account</p>
          <h1>Register</h1>
          <p>Create your profile to start generating GST-ready invoices and tracking payments.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
          </label>
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
              placeholder="Create a password"
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Repeat your password"
            />
          </label>
          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {feedback ? <p className="auth-feedback">{feedback}</p> : null}

        <div className="auth-switch">
          <p>
            Already registered?{" "}
            <button className="auth-link" type="button" onClick={onShowLogin}>
              Back to login
            </button>
          </p>
        </div>
      </section>
    </AuthMarketingLayout>
  );
}
