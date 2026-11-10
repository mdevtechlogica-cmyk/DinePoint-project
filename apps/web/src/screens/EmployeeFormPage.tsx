import { useState } from 'react';
import { ApiError, api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { EyeIcon } from '../components/ui';
import { readSession } from '../session';
import { employees, type Employee } from './EmployeesPage';

type EmployeeView = 'record' | 'add' | 'empty' | 'edit' | 'invalid' | 'duplicate' | 'deactivate' | 'saved' | 'loading';
type Role = Employee['role'] | '';

type Draft = {
  name: string;
  phone: string;
  email: string;
  role: Role;
  password: string;
  active: boolean;
};

const nishaDraft: Draft = {
  name: 'Nisha Joseph',
  phone: '9746018832',
  email: 'nisha@saffronhouse.in',
  role: 'Staff',
  password: 'Nisha#18832',
  active: true,
};

const lathaDraft: Draft = {
  name: 'Latha Menon',
  phone: '9447066120',
  email: 'latha@saffronhouse.in',
  role: 'Manager',
  password: 'Latha#66120',
  active: true,
};

const emptyDraft: Draft = { name: '', phone: '', email: '', role: '', password: '', active: true };

const views: { id: Exclude<EmployeeView, 'record'>; label: string }[] = [
  { id: 'add', label: '1. Add (Nisha)' },
  { id: 'empty', label: '2. Empty Form' },
  { id: 'edit', label: '3. Edit (Latha)' },
  { id: 'invalid', label: '4. Validation Errors' },
  { id: 'duplicate', label: '5. Duplicate Email' },
  { id: 'deactivate', label: '6. Deactivate Modal' },
  { id: 'saved', label: '7. Saved Toast' },
  { id: 'loading', label: '8. Loading State' },
];

const roleNotes: Record<Exclude<Role, ''>, string> = {
  Admin: 'Admins manage employees, restaurant details, and POS access.',
  Manager: 'Managers run the shift, floors, and live bookings.',
  Staff: 'Staff can take live table bookings and punch KOT tickets.',
};

type EmployeeFormPageProps = {
  employeeId?: string;
  onBack: () => void;
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function EmployeeFormPage({ employeeId, onBack, onSignOut, onNavigate }: EmployeeFormPageProps) {
  const opened = employees.find((employee) => employee.id === employeeId);
  const [view, setView] = useState<EmployeeView>(employeeId === 'latha' ? 'edit' : employeeId ? 'record' : 'add');
  const [mode, setMode] = useState<'add' | 'edit'>(employeeId ? 'edit' : 'add');
  const [draft, setDraft] = useState<Draft>(opened ? toDraft(opened) : nishaDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toast, setToast] = useState('');

  const busy = view === 'loading';
  const title = mode === 'edit' ? 'Edit employee' : 'Add employee';

  function show(next: EmployeeView) {
    if (next === 'edit' || next === 'deactivate') {
      setMode('edit');
      setDraft(lathaDraft);
    } else if (next === 'empty' || next === 'invalid') {
      setMode('add');
      setDraft(emptyDraft);
    } else if (next === 'duplicate') {
      setMode('add');
      setDraft({ ...nishaDraft, email: 'suresh@saffronhouse.in' });
    } else if (next === 'add' || next === 'saved' || next === 'loading') {
      setMode('add');
      setDraft(nishaDraft);
    }
    setShowPassword(false);
    setNameError(next === 'invalid' ? 'Enter the full name.' : '');
    setPhoneError(next === 'invalid' ? 'Enter a 10-digit mobile number.' : '');
    setEmailError(
      next === 'invalid' ? 'Enter an email address.' : next === 'duplicate' ? 'An account with this email already exists.' : '',
    );
    setRoleError(next === 'invalid' ? 'Select a role.' : '');
    setPasswordError(next === 'invalid' ? 'Enter a temporary password.' : '');
    setToast(next === 'saved' ? 'Employee saved.' : '');
    setView(next);
  }

  function update(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function save() {
    if (busy) return;
    const nextName = draft.name.trim().length < 2 ? 'Enter the full name.' : '';
    const nextPhone = draft.phone.length === 10 ? '' : 'Enter a 10-digit mobile number.';
    const email = draft.email.trim().toLowerCase();
    const nextEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter an email address.';
    const duplicate = employees.some((employee) => employee.email.toLowerCase() === email && employee.id !== employeeId);
    const nextRole = draft.role ? '' : 'Select a role.';
    const nextPassword = draft.password.trim().length < 8 ? 'Enter a temporary password.' : '';
    setNameError(nextName);
    setPhoneError(nextPhone);
    setEmailError(duplicate ? 'An account with this email already exists.' : nextEmail);
    setRoleError(nextRole);
    setPasswordError(nextPassword);
    if (duplicate && !nextEmail) {
      setView('duplicate');
      return;
    }
    if (nextName || nextPhone || nextEmail || nextRole || nextPassword) {
      setView('invalid');
      return;
    }
    const session = readSession();
    if (!session?.organizationId || (employeeId && employeeId.length < 12 && employees.some((item) => item.id === employeeId))) {
      setToast('Employee saved.');
      setView('saved');
      return;
    }
    const role = draft.role === 'Manager' ? 'MANAGER' : draft.role === 'Staff' ? 'STAFF' : 'ADMIN';
    const path = `/organizations/${session.organizationId}/employees`;
    void api(employeeId ? `${path}/${employeeId}` : path, {
      method: employeeId ? 'PATCH' : 'POST',
      body: JSON.stringify({
        name: draft.name.trim(),
        email,
        phone: draft.phone,
        role,
        isActive: draft.active,
        ...(employeeId ? {} : { password: draft.password }),
        ...(employeeId && draft.password.trim().length >= 8 ? { password: draft.password } : {}),
      }),
    })
      .then(() => {
        setToast('Employee saved.');
        setView('saved');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          setEmailError('An account with this email already exists.');
          setView('duplicate');
          return;
        }
        setView('invalid');
      });
  }

  function generateKey() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = 'Sf';
    for (let index = 0; index < 8; index += 1) {
      key += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    update({ password: key });
    setPasswordError('');
    setShowPassword(true);
  }

  return (
    <AdminShell active="employees" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">Scenarios</span>
        <div role="group" aria-label="Inspect state">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'state-pill is-active' : 'state-pill'}
              aria-pressed={view === item.id}
              onClick={() => show(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="today-page" aria-labelledby="employee-form-title">
        <p className="crumb">
          <button type="button" onClick={onBack}>
            Employees
          </button>
          <span aria-hidden="true">/</span>
          {title}
        </p>
        <div className="today-heading">
          <div className="rooms-heading">
            <button className="back-button" type="button" aria-label="Back to employees" onClick={onBack}>
              ←
            </button>
            <div>
              <h1 id="employee-form-title">{title}</h1>
              <p>Configure back-of-house roles, floor clearance, and POS login access.</p>
            </div>
          </div>
          <p className="service-clock">
            <span className="status-dot" aria-hidden="true" />
            <span>
              <strong>Branch Shift #2</strong>
              Terminal 01 · Fort Nagar
            </span>
          </p>
        </div>

        {view === 'saved' ? <p className="save-toast">{toast}</p> : null}

        <form
          className="spot-card"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="form-grid">
            <label className="field">
              Full name *
              <input
                value={draft.name}
                aria-invalid={Boolean(nameError)}
                disabled={busy}
                onChange={(event) => {
                  update({ name: event.target.value });
                  if (nameError) setNameError('');
                }}
              />
              {nameError ? <span className="field-error">{nameError}</span> : null}
            </label>
            <label className="field">
              Phone number *
              <span className={phoneError ? 'phone-row is-invalid' : 'phone-row'}>
                <span>+91</span>
                <input
                  inputMode="numeric"
                  value={formatPhone(draft.phone)}
                  aria-invalid={Boolean(phoneError)}
                  disabled={busy}
                  placeholder="97460 18832"
                  onChange={(event) => {
                    update({ phone: event.target.value.replace(/\D/g, '').slice(0, 10) });
                    if (phoneError) setPhoneError('');
                  }}
                />
              </span>
              {phoneError ? (
                <span className="field-error">{phoneError}</span>
              ) : (
                <span className="field-hint">10-digit mobile number for branch SMS and shift notifications.</span>
              )}
            </label>
            <label className="field">
              Email address *
              <input
                value={draft.email}
                aria-invalid={Boolean(emailError)}
                disabled={busy}
                onChange={(event) => {
                  update({ email: event.target.value });
                  if (emailError) setEmailError('');
                }}
              />
              {emailError ? <span className="field-error">{emailError}</span> : null}
            </label>
            <div className="field">
              Role &amp; access level *
              <div className="role-switch" role="group" aria-label="Role and access level">
                {(['Admin', 'Manager', 'Staff'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={draft.role === role ? 'is-selected' : ''}
                    aria-pressed={draft.role === role}
                    disabled={busy}
                    onClick={() => {
                      update({ role });
                      if (roleError) setRoleError('');
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {roleError ? <span className="field-error">{roleError}</span> : <span className="field-hint">{draft.role ? roleNotes[draft.role] : 'Choose the access this person needs.'}</span>}
            </div>
          </div>

          <label className="field">
            <span className="field-label-row">
              Temporary password *
              <button className="text-action is-positive" type="button" disabled={busy} onClick={generateKey}>
                Generate secure key
              </button>
            </span>
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={draft.password}
                aria-invalid={Boolean(passwordError)}
                disabled={busy}
                onChange={(event) => {
                  update({ password: event.target.value });
                  if (passwordError) setPasswordError('');
                }}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={busy}
                onClick={() => setShowPassword((current) => !current)}
              >
                <EyeIcon revealed={showPassword} />
              </button>
            </span>
            {passwordError ? (
              <span className="field-error">{passwordError}</span>
            ) : (
              <span className="field-hint">Share this initial credential with the staff member. They must reset it upon first terminal sign-in.</span>
            )}
          </label>

          <div className={draft.active ? 'availability is-on' : 'availability'}>
            <div>
              <strong>
                Active account
                <span className={draft.active ? 'floor-status is-active' : 'floor-status'}>{draft.active ? 'Enabled' : 'Disabled'}</span>
              </strong>
              <p>Inactive employees cannot sign in to the POS terminals or view floor schedules.</p>
            </div>
            <button
              className={draft.active ? 'switch is-on' : 'switch'}
              type="button"
              role="switch"
              aria-checked={draft.active}
              aria-label="Active account"
              disabled={busy}
              onClick={() => {
                if (draft.active) setView('deactivate');
                else update({ active: true });
              }}
            />
          </div>

          <div className="spot-actions">
            <button className="sign-in-button today-action" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button className="edit-button" type="button" onClick={onBack}>
              Cancel
            </button>
          </div>
        </form>
      </section>

      {view === 'deactivate' ? (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-employee-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setView(mode === 'edit' ? 'edit' : 'add');
            }}
          >
            <h2 id="deactivate-employee-title">Deactivate {draft.name || 'this employee'}?</h2>
            <p>Inactive employees cannot sign in to the POS terminals or view floor schedules. You can enable the account again later.</p>
            <div className="modal-actions">
              <button className="edit-button" type="button" onClick={() => setView(mode === 'edit' ? 'edit' : 'add')}>
                Keep active
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  update({ active: false });
                  setToast('Employee deactivated.');
                  setView('saved');
                }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function toDraft(employee: Employee): Draft {
  return {
    name: employee.name,
    phone: employee.phone.replace(/\D/g, '').slice(-10),
    email: employee.email,
    role: employee.role,
    password: 'Staff#4401',
    active: employee.active,
  };
}

function formatPhone(digits: string) {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}
