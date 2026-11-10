import type { ReactNode } from 'react';
import { currentOrganization, readSession } from '../session';

const navItems = [
  { id: 'today', label: 'Today' },
  { id: 'spot', label: 'Spot booking' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'floors', label: 'Floors' },
  { id: 'employees', label: 'Employees' },
  { id: 'reports', label: 'Reports' },
] as const;

export type AdminSection = (typeof navItems)[number]['id'];

type AdminShellProps = {
  active?: AdminSection;
  onNavigate?: (section: AdminSection) => void;
  onSignOut: () => void;
  children: ReactNode;
};

export function AdminShell({ active = 'today', onNavigate, onSignOut, children }: AdminShellProps) {
  const session = readSession();
  const organization = currentOrganization();
  const userName = session?.user.name ?? 'Suresh Pillai';
  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="side-brand">
          <div>
            <strong>{organization?.organization.name ?? 'Saffron House'}</strong>
            <p>{organization ? 'Restaurant admin' : 'Kochi · Fort Nagar'}</p>
          </div>
          <span className="pos-badge">POS 01</span>
        </div>

        <div className="side-user">
          <span className="avatar" aria-hidden="true">
            {initials || 'SP'}
          </span>
          <div>
            <strong>{userName}</strong>
            <p>Shift active</p>
          </div>
          <span className="role-badge">{organization?.role === 'OWNER' ? 'Owner' : organization?.role ?? 'Owner'}</span>
        </div>

        <nav className="side-nav" aria-label="Admin">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === active ? 'nav-item is-active' : 'nav-item'}
              aria-current={item.id === active ? 'page' : undefined}
              onClick={() => onNavigate?.(item.id)}
            >
              <NavIcon name={item.id} />
              {item.label}
            </button>
          ))}
        </nav>

        <button className="sign-out" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-top">
          <button className="restaurant-switch" type="button">
            {session?.restaurantName ?? organization?.organization.name ?? 'Saffron House'}
            <span aria-hidden="true">▾</span>
          </button>
          <p className="live-orders">
            <span className="status-dot" aria-hidden="true" />
            Live orders
          </p>
          <p className="admin-date">
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
          <button className="icon-button has-alert" type="button" aria-label="Notifications">
            <BellIcon />
          </button>
          <button className="avatar-button" type="button" aria-label="Account">
            <span className="avatar" aria-hidden="true">
              SP
            </span>
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: (typeof navItems)[number]['id'] }) {
  const paths: Record<(typeof navItems)[number]['id'], string> = {
    today: 'M4 5h16v14H4zM8 3v4M16 3v4M4 9h16',
    spot: 'M12 5v14M5 12h14',
    restaurant: 'M4 20V8l8-4 8 4v12M9 20v-6h6v6',
    floors: 'M12 3.5 20 8 12 12.5 4 8 12 3.5ZM4.5 12.2 12 16.7l7.5-4.5M4.5 16 12 20.5 19.5 16',
    employees: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c.6-2.4 2.6-4 5-4s4.4 1.6 5 4M14 15.2c1.6.3 3 1.4 3.6 3.3',
    reports: 'M5 19V9M10 19V5M15 19v-7M20 19V8',
  };

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
