import { useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import { EyeIcon } from '../components/ui';
import { registerWebPush } from '../pushNotifications';
import { readSession, saveSession, type Membership } from '../session';

type LoginView = 'default' | 'focused' | 'error' | 'loading';

const views: { id: LoginView; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'focused', label: 'Focused' },
  { id: 'error', label: 'Error' },
  { id: 'loading', label: 'Loading' },
];

type PlatformLoginPageProps = {
  onOpenOutlet: () => void;
  onSignIn: () => void;
};

export function PlatformLoginPage({ onOpenOutlet, onSignIn }: PlatformLoginPageProps) {
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
      saveSession({
        accessToken: result.accessToken,
        user: result.user,
        memberships: result.memberships,
        organizationId: result.memberships[0]?.organizationId ?? null,
        restaurantId: readSession()?.restaurantId ?? null,
        restaurantName: readSession()?.restaurantName ?? null,
        platformRole: null,
      });
      const profile = await api<{ platformRole: string | null }>('/platform/me');
      const current = readSession();
      if (current) saveSession({ ...current, platformRole: profile.platformRole });
      void registerWebPush();
      onSignIn();
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 403
          ? 'This account is not a platform staff account.'
          : error instanceof ApiError
            ? error.message
            : 'The server could not be reached.',
      );
      setView('error');
    }
  }

  useEffect(() => {
    document.title = 'DinePoint Platform · Sign in';
  }, []);

  return (
    <div className="platform-login">
      <div className="platform-state" role="group" aria-label="Inspect state">
        <span className="platform-state-label">
          <StateIcon />
          State demo:
        </span>
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'state-pill is-active' : 'state-pill'}
            aria-pressed={view === item.id}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <main className="platform-main">
        <div className="platform-brand">
          <span className="platform-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <strong>DinePoint</strong>
          <span className="platform-badge">Platform console</span>
        </div>
        <p className="platform-region">
          <span className="status-dot" aria-hidden="true" />
          Internal network · Region AP-South
        </p>

        <section className="platform-card" aria-labelledby="platform-sign-in-title">
          <div className="platform-card-body">
            <h1 id="platform-sign-in-title">Platform sign in</h1>
            <p>DinePoint staff only</p>

            <form
              className="login-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (isLoading || isError) return;
                void signIn();
              }}
            >
              <label className="field">
                <span className="platform-field-label">
                  Corporate email
                  <span>SSO enabled</span>
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="you@dinepoint.in"
                  value={email}
                  disabled={isLoading}
                  aria-invalid={isError}
                  className={isFocused ? 'is-preview-focus' : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="field">
                <span className="platform-field-label">
                  Password
                  <span>Need help?</span>
                </span>
                <span className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your security token"
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
          </div>

          <button className="platform-outlet" type="button" onClick={onOpenOutlet}>
            <BuildingIcon />
            Restaurant staff sign in on the outlet console
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <p className="platform-security">
          <LockIcon />
          Hardware token · MFA required · DinePoint Internal v4.12.0
        </p>
      </main>

      <footer className="platform-footer">
        <p>© 2025 DinePoint Technologies Pvt. Ltd. All rights reserved.</p>
        <p>
          <span>Infosec policy</span>
          <span aria-hidden="true">·</span>
          <span>System status</span>
          <span aria-hidden="true">·</span>
          <span>NOC helpline</span>
        </p>
      </footer>
    </div>
  );
}

function StateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M4 7h16M4 12h10M4 17h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M4 20V6.5L12 3l8 3.5V20" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 20v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <rect x="6" y="10" width="12" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
