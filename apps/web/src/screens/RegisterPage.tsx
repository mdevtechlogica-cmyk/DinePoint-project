import { useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import { EyeIcon } from '../components/ui';
import { registerWebPush } from '../pushNotifications';
import { saveSession } from '../session';

type RegisterView = 'empty' | 'filled' | 'validation' | 'email-exists' | 'loading';

const views: { id: RegisterView; label: string }[] = [
  { id: 'empty', label: 'Default (Empty)' },
  { id: 'filled', label: 'Filled (Sample Data)' },
  { id: 'validation', label: 'Validation Error' },
  { id: 'email-exists', label: 'Email Exists' },
  { id: 'loading', label: 'Loading' },
];

const sample = {
  name: 'Suresh Menon',
  email: 'suresh@saffronhouse.in',
  password: 'Saffron123',
  organization: 'Saffron House',
};

type RegisterPageProps = {
  onBack: () => void;
  onCreated: () => void;
};

export function RegisterPage({ onBack, onCreated }: RegisterPageProps) {
  const [view, setView] = useState<RegisterView>('empty');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (view === 'empty') {
      setName('');
      setEmail('');
      setPassword('');
      setOrganization('');
      return;
    }

    if (view === 'validation') {
      setName('');
      setEmail('suresh');
      setPassword('short');
      setOrganization('');
      return;
    }

    setName(sample.name);
    setEmail(sample.email);
    setPassword(sample.password);
    setOrganization(sample.organization);
  }, [view]);

  const isLoading = view === 'loading';
  const showValidation = view === 'validation';
  const showEmailExists = view === 'email-exists';
  const nameError = showValidation && name.trim().length < 2 ? 'Enter the owner’s full name.' : '';
  const emailError = showEmailExists
    ? 'An account with this email already exists.'
    : showValidation && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Enter a valid email address.'
      : '';
  const passwordError = showValidation && password.length < 8 ? 'Use at least 8 characters.' : '';
  const organizationError =
    showValidation && organization.trim().length < 2 ? 'Enter the organization name.' : '';

  async function createAccount() {
    if (name.trim().length < 2 || password.length < 8 || organization.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setView('validation');
      return;
    }
    setView('loading');
    try {
      const result = await api<{
        user: { id: string; name: string; email: string };
        organization: { id: string; name: string; slug: string };
        accessToken: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, organizationName: organization }),
      });
      saveSession({
        accessToken: result.accessToken,
        user: result.user,
        memberships: [
          {
            organizationId: result.organization.id,
            role: 'OWNER',
            organization: { name: result.organization.name, slug: result.organization.slug },
          },
        ],
        organizationId: result.organization.id,
        restaurantId: null,
        restaurantName: null,
        platformRole: null,
      });
      void registerWebPush();
      onCreated();
    } catch (error) {
      setView(error instanceof ApiError && error.status === 409 ? 'email-exists' : 'validation');
    }
  }

  return (
    <div className="login-page">
      <header className="login-chrome">
        <p className="login-chrome-title">
          <span className="status-dot" aria-hidden="true" />
          Inspect state
        </p>
        <div className="state-switcher" role="group" aria-label="Inspect state">
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
      </header>

      <main className="login-main">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          DinePoint
        </div>

        <section className="login-card register-card" aria-labelledby="register-title">
          <h1 id="register-title">Create owner account</h1>
          <p className="login-subtitle register-intro">
            Used once, when your organization first joins DinePoint. You can add restaurants and employees after this.
          </p>

          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (isLoading || showValidation || showEmailExists) return;
              void createAccount();
            }}
          >
            <Field
              label="Owner name"
              name="name"
              autoComplete="name"
              placeholder="Full name"
              value={name}
              disabled={isLoading}
              error={nameError}
              onChange={setName}
            />

            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourrestaurant.in"
              value={email}
              disabled={isLoading}
              error={emailError}
              hint={emailError ? undefined : 'You will use this to sign in.'}
              onChange={setEmail}
            />

            <label className="field">
              <span>Password</span>
              <span className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Enter password"
                  value={password}
                  disabled={isLoading}
                  aria-invalid={passwordError ? true : undefined}
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
              <StrengthMeter password={password} />
              {passwordError ? (
                <span className="field-error" role="alert">
                  {passwordError}
                </span>
              ) : (
                <span className="field-hint">At least 8 characters</span>
              )}
            </label>

            <Field
              label="Organization name"
              name="organization"
              autoComplete="organization"
              placeholder="Your company or group name"
              value={organization}
              disabled={isLoading}
              error={organizationError}
              hint={organizationError ? undefined : 'One organization can have more than one restaurant.'}
              onChange={setOrganization}
            />

            <button className="sign-in-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <button className="text-link" type="button" onClick={onBack}>
            Back to sign in
          </button>
          <p className="owner-note">By creating an account you become the owner of this organization.</p>
        </section>

        <div className="register-footer">
          <p>Next step: Restaurant details &amp; first branch setup</p>
          <p>DinePoint POS &amp; Admin · India Edition (IST UTC+5:30)</p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  disabled,
  error,
  hint,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  disabled: boolean;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

function StrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);

  return (
    <span className="strength" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className={index < score ? `is-on level-${score}` : undefined} />
      ))}
    </span>
  );
}

function passwordStrength(password: string) {
  if (!password) {
    return 0;
  }

  let score = 1;

  if (password.length >= 8) {
    score = 2;
  }

  if (password.length >= 8 && /\d/.test(password)) {
    score = 3;
  }

  if (
    password.length >= 8 &&
    /\d/.test(password) &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password)
  ) {
    score = 4;
  }

  return score;
}
