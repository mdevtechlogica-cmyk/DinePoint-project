import { useState } from 'react';
import { ApiError, api } from '../api';
import { EyeIcon } from '../components/ui';
import { registerWebPush } from '../pushNotifications';
import { saveSession, type Membership } from '../session';

type LoginView = 'default' | 'focused' | 'error' | 'loading';

const views: { id: LoginView; label: string }[] = [
  { id: 'default', label: '1. Default' },
  { id: 'focused', label: '2. Focused' },
  { id: 'error', label: '3. Error' },
  { id: 'loading', label: '4. Loading' },
];

type LoginPageProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
};

export function LoginPage({ onCreateAccount, onSignIn }: LoginPageProps) {
  const [view, setView] = useState<LoginView>('default');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('Email or password is incorrect.');

  const isLoading = view === 'loading';
  const isError = view === 'error';
  const isFocused = view === 'focused';

  async function signIn() {
    setView('loading');
    try {
      const result = await api<{
        user: { id: string; name: string; email: string };
        memberships: Membership[];
        accessToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const organizationId = result.memberships[0]?.organizationId ?? null;
      saveSession({
        accessToken: result.accessToken,
        user: result.user,
        memberships: result.memberships,
        organizationId,
        restaurantId: null,
        restaurantName: null,
        platformRole: null,
      });
      void registerWebPush();
      onSignIn();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'The server could not be reached.');
      setView('error');
    }
  }

  return (
    <div className="login-page">
      <header className="login-chrome">
        <p className="login-chrome-title">
          <span className="status-dot" aria-hidden="true" />
          DinePoint POS &amp; Web Admin · Desktop / Tablet view
        </p>
        <div className="state-switcher" role="group" aria-label="Inspect state">
          <span>Inspect state</span>
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'state-pill is-active' : 'state-pill'}
              aria-pressed={view === item.id}
              onClick={() => {
                setMessage('Email or password is incorrect.');
                setView(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="login-main">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="3" y="4" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 18v2M16 18v2M7 10h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          DinePoint
        </div>

        <section className="login-card" aria-labelledby="sign-in-title">
          <h1 id="sign-in-title">Sign in</h1>
          <p className="login-subtitle">Restaurant admin panel</p>

          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (isLoading || isError) return;
              void signIn();
            }}
          >
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                disabled={isLoading}
                aria-invalid={isError}
                className={isFocused ? 'is-preview-focus' : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <span className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={isLoading}
                  aria-invalid={isError}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <EyeIcon revealed={showPassword} />
                </button>
              </span>
            </label>

            {isError ? (
              <p className="form-error" role="alert">
                {message}
              </p>
            ) : null}

            <button className="sign-in-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button className="text-link" type="button" onClick={onCreateAccount}>
            Create owner account
          </button>
          <p className="card-note">First time here? This is only for the restaurant owner.</p>
        </section>

        <p className="employee-note">
          Employees: use the email and temporary password given by your owner.
        </p>
      </main>

      <footer className="login-footer">
        <p>
          <span className="status-dot" aria-hidden="true" />
          System online · DinePoint POS Server India (IST UTC+5:30)
        </p>
        <p>Target: 1280×800 · Fluid tablet support</p>
      </footer>
    </div>
  );
}
