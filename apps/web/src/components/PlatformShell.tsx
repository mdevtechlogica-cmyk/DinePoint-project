import type { ReactNode } from 'react';
import { readSession } from '../session';

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'clients', label: 'Clients' },
  { id: 'plans', label: 'Plans' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'reports', label: 'Reports' },
] as const;

export type PlatformSection = (typeof navItems)[number]['id'];

type PlatformShellProps = {
  active?: PlatformSection;
  onNavigate?: (section: PlatformSection) => void;
  onSignOut: () => void;
  children: ReactNode;
};

export function PlatformShell({ active = 'overview', onNavigate, onSignOut, children }: PlatformShellProps) {
  const session = readSession();
  const role = session?.platformRole === 'SUPPORT' ? 'Support' : 'Super admin';
  const initials = (session?.user.name ?? 'Meera Krishnan')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="platform-shell">
      <aside className="platform-side">
        <div className="platform-side-brand">
          <span className="platform-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M8 3.5v5.2M6.2 3.5v4M9.8 3.5v4M8 8.7V20M15.2 3.5c2.1 2.2 2.1 4.4 0 6.2V20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <strong>DinePoint</strong>
            <p>Platform console</p>
          </div>
        </div>

        <div className="platform-side-user">
          <div>
            <strong>{session?.user.name ?? 'Meera Krishnan'}</strong>
            <p>{role}</p>
          </div>
          <span>Root</span>
        </div>

        <nav className="platform-nav" aria-label="Platform">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === active ? 'is-active' : undefined}
              aria-current={item.id === active ? 'page' : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              <PlatformNavIcon name={item.id} />
              {item.label}
            </button>
          ))}
        </nav>

        <button className="platform-sign-out" type="button" onClick={onSignOut}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4H19v16h-7.5A1.5 1.5 0 0 1 10 18.5V17M14.5 12H4M7 9l-3 3 3 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign out
        </button>
      </aside>

      <div className="platform-body">
        <header className="platform-top">
          <strong>DinePoint Platform</strong>
          <label className="platform-search">
            <span className="visually-hidden">Search clients</span>
            <span className="platform-search-field">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input type="search" placeholder="Search clients..." />
            </span>
          </label>
          <p className="platform-date">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M7 4v3M17 4v3M4.5 9.5h15M6 6.5h12a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {session
              ? new Intl.DateTimeFormat('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date())
              : 'Thursday, 22 Oct 2026'}
          </p>
          <button type="button" className="platform-bell" aria-label="Notifications">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15L6 16Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <span className="platform-avatar" aria-hidden="true">
            {initials || 'MK'}
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}

function PlatformNavIcon({ name }: { name: PlatformSection }) {
  const paths: Record<PlatformSection, string> = {
    overview: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    clients: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c.4-2.6 2.4-4 5-4s4.6 1.4 5 4M14 15c2.2 0 4 1.2 4.4 3.5',
    plans: 'M12 3 20 7.5 12 12 4 7.5 12 3Z',
    subscriptions: 'M20 12a8 8 0 1 1-2.2-5.5M20 4v5h-5',
    invoices: 'M7 3h8l4 4v14H7V3ZM15 3v4h4M9 12h6M9 16h6',
    reports: 'M5 19V10M10 19V5M15 19v-7M20 19V8',
  };

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
