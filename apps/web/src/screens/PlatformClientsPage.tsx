import { useEffect, useState } from 'react';
import { api, formatWhen } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';
import { platformClients, type PlanName, type PlatformClient, type SubscriptionStatus } from '../data/platformClients';

type ClientsView = 'default' | 'suspended' | 'nomatch' | 'empty' | 'loading' | 'custom';

const pageSize = 8;

const views: { id: Exclude<ClientsView, 'custom'>; label: string }[] = [
  { id: 'default', label: 'Default (24)' },
  { id: 'suspended', label: 'Filtered: Suspended (2)' },
  { id: 'nomatch', label: 'Search: No match' },
  { id: 'empty', label: 'Empty' },
  { id: 'loading', label: 'Loading' },
];

const plans = ['All plans', 'Starter', 'Growth', 'Scale'] as const;
const statuses = ['All statuses', 'Active', 'Suspended'] as const;

type PlatformClientsPageProps = {
  onSignOut: () => void;
  onNavigate: (section: PlatformSection) => void;
  onOpenClient: (clientId: string) => void;
};

export function PlatformClientsPage({ onSignOut, onNavigate, onOpenClient }: PlatformClientsPageProps) {
  const [view, setView] = useState<ClientsView>('default');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statuses)[number]>('All statuses');
  const [plan, setPlan] = useState<(typeof plans)[number]>('All plans');
  const [page, setPage] = useState(1);
  const [directory, setDirectory] = useState(platformClients);

  useEffect(() => {
    document.title = 'DinePoint Platform · Clients';
    api<{ rows: ApiClient[] }>('/platform/clients?pageSize=100')
      .then((data) => setDirectory(data.rows.map(toClient)))
      .catch(() => undefined);
  }, []);

  const busy = view === 'loading';
  const catalog = view === 'empty' || view === 'loading' ? [] : directory.filter((client) => matches(client, query, status, plan));
  const pageCount = Math.max(1, Math.ceil(catalog.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = catalog.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = pageRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = pageRows.length === 0 ? 0 : start + pageRows.length - 1;
  const usingLive = directory.some((client) => client.id.length > 12);
  const summary = view === 'empty' ? emptySummary : usingLive ? liveSummary(directory) : workspaceSummary;

  function show(next: Exclude<ClientsView, 'custom'>) {
    setView(next);
    setPage(1);
    if (next === 'suspended') {
      setQuery('');
      setStatus('Suspended');
      setPlan('All plans');
      return;
    }
    if (next === 'nomatch') {
      setQuery('harbor-grill');
      setStatus('All statuses');
      setPlan('All plans');
      return;
    }
    setQuery('');
    setStatus('All statuses');
    setPlan('All plans');
  }

  function update(next: { query?: string; status?: (typeof statuses)[number]; plan?: (typeof plans)[number] }) {
    const queryValue = next.query ?? query;
    const statusValue = next.status ?? status;
    const planValue = next.plan ?? plan;
    setQuery(queryValue);
    setStatus(statusValue);
    setPlan(planValue);
    setPage(1);
    const found = directory.filter((client) => matches(client, queryValue, statusValue, planValue));
    if (!queryValue.trim() && statusValue === 'All statuses' && planValue === 'All plans') {
      setView('default');
    } else if (!queryValue.trim() && statusValue === 'Suspended' && planValue === 'All plans') {
      setView('suspended');
    } else if (queryValue.trim() && found.length === 0 && statusValue === 'All statuses' && planValue === 'All plans') {
      setView('nomatch');
    } else {
      setView('custom');
    }
  }

  return (
    <PlatformShell active="clients" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="platform-page">
        <div className="inspect-bar floors-inspect">
          <span className="inspect-label">
            <GridIcon />
            Interactive states
          </span>
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
          <p className="inspect-build clients-workspace">
            <span className="status-dot" aria-hidden="true" />
            Super Admin Workspace
          </p>
        </div>

        <section aria-labelledby="clients-title">
          <div className="clients-heading">
            <div>
              <h1 id="clients-title">Clients</h1>
              <p>Restaurant organizations on DinePoint</p>
            </div>
            <p className="clients-protocol">
              <ShieldIcon />
              Self-Registration Protocol Active
            </p>
          </div>

          <form
            className="clients-filters"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <label className="clients-search">
              <span className="visually-hidden">Name, slug, or owner email</span>
              <SearchIcon />
              <input
                type="search"
                value={query}
                placeholder="Name, slug, or owner email"
                disabled={busy}
                onChange={(event) => update({ query: event.target.value })}
              />
            </label>
            <select aria-label="Status" value={status} disabled={busy} onChange={(event) => update({ status: event.target.value as (typeof statuses)[number] })}>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select aria-label="Plan" value={plan} disabled={busy} onChange={(event) => update({ plan: event.target.value as (typeof plans)[number] })}>
              {plans.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="clients-reset" type="button" disabled={busy} onClick={() => show('default')}>
              <RefreshIcon />
              Reset
            </button>
          </form>

          {busy ? (
            <div className="today-loading" role="status" aria-live="polite">
              <p>Loading clients…</p>
              <span className="skeleton-row" />
              <span className="skeleton-row" />
              <span className="skeleton-row" />
            </div>
          ) : (
            <>
              <div className="clients-card">
                {pageRows.length === 0 ? (
                  <div className="today-empty">
                    <h2>{view === 'empty' ? 'No clients yet' : 'No matching clients'}</h2>
                    <p>
                      {view === 'empty'
                        ? 'Restaurant organizations will appear here after they join DinePoint.'
                        : 'No restaurant organizations match this search or these filters.'}
                    </p>
                  </div>
                ) : (
                  <table className="clients-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Owner</th>
                        <th>Outlets</th>
                        <th>Plan</th>
                        <th>Subscription</th>
                        <th>Period end</th>
                        <th>Status</th>
                        <th>
                          <span className="visually-hidden">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((client) => (
                        <tr key={client.id}>
                          <td className="clients-identity">
                            <button className="clients-name" type="button" onClick={() => onOpenClient(client.id)}>
                              {client.name}
                            </button>
                            <span>{client.slug}</span>
                          </td>
                          <td className="clients-identity">
                            <strong>{client.owner}</strong>
                            <span>{client.email}</span>
                          </td>
                          <td className="clients-outlets">
                            <strong>{client.outlets}</strong>
                            <span>{client.outlets === 1 ? 'outlet' : 'outlets'}</span>
                          </td>
                          <td>
                            <span className="clients-chip">{client.plan}</span>
                          </td>
                          <td>
                            <span className={`clients-chip is-${client.subscription.toLowerCase().replace(' ', '-')}`}>{client.subscription}</span>
                          </td>
                          <td className="clients-period">{client.period}</td>
                          <td>
                            <span className={`clients-status is-${client.status.toLowerCase()}`}>{client.status}</span>
                          </td>
                          <td>
                            <button className="clients-open" type="button" aria-label={`Open ${client.name}`} onClick={() => onOpenClient(client.id)}>
                              <ChevronIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {catalog.length > 0 ? (
                  <div className="clients-pager">
                    <p>
                      Showing {start}–{end} of {catalog.length}
                    </p>
                    <div>
                      <button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                        ← Previous
                      </button>
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                        <button key={number} type="button" className={number === safePage ? 'is-current' : undefined} aria-current={number === safePage ? 'page' : undefined} onClick={() => setPage(number)}>
                          {number}
                        </button>
                      ))}
                      <button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}>
                        Next →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="clients-summary">
                {summary.map((item) => (
                  <article key={item.label}>
                    <p>{item.label}</p>
                    <strong>
                      {item.value} <span>{item.note}</span>
                    </strong>
                    <i className={item.tone} aria-hidden="true">
                      {item.icon}
                    </i>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </PlatformShell>
  );
}

function matches(client: PlatformClient, query: string, status: string, plan: string) {
  const needle = query.trim().toLowerCase();
  const haystack = `${client.name} ${client.slug} ${client.email}`.toLowerCase();
  if (needle && !haystack.includes(needle)) return false;
  if (status !== 'All statuses' && client.status !== status) return false;
  if (plan !== 'All plans' && client.plan !== plan) return false;
  return true;
}

const workspaceSummary = [
  { label: 'Active subscriptions', value: '19', note: '79.1%', tone: '', icon: <CheckIcon /> },
  { label: 'Pending onboarding', value: '3', note: 'Trialing', tone: 'is-amber', icon: <HourglassIcon /> },
  { label: 'Suspended accounts', value: '2', note: 'Audit required', tone: 'is-muted', icon: <PauseIcon /> },
  { label: 'Total multi-outlets', value: '42', note: 'Locations', tone: '', icon: <StoreIcon /> },
];

function liveSummary(clients: PlatformClient[]) {
  const active = clients.filter((client) => client.subscription === 'Active').length;
  const trialing = clients.filter((client) => client.subscription === 'Trialing').length;
  const suspended = clients.filter((client) => client.status === 'Suspended').length;
  const outlets = clients.reduce((sum, client) => sum + client.outlets, 0);
  return [
    { ...workspaceSummary[0], value: String(active), note: clients.length ? `${Math.round((active / clients.length) * 1000) / 10}%` : '0%' },
    { ...workspaceSummary[1], value: String(trialing) },
    { ...workspaceSummary[2], value: String(suspended) },
    { ...workspaceSummary[3], value: String(outlets) },
  ];
}

const emptySummary = [
  { label: 'Active subscriptions', value: '0', note: '0%', tone: '', icon: <CheckIcon /> },
  { label: 'Pending onboarding', value: '0', note: 'Trialing', tone: 'is-amber', icon: <HourglassIcon /> },
  { label: 'Suspended accounts', value: '0', note: 'Audit required', tone: 'is-muted', icon: <PauseIcon /> },
  { label: 'Total multi-outlets', value: '0', note: 'Locations', tone: '', icon: <StoreIcon /> },
];

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M12 3 19 6v6c0 4.2-2.8 7.2-7 9-4.2-1.8-7-4.8-7-9V6l7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.2-5.5M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ApiClient = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  outletCount: number;
  owners: { name: string; email: string }[];
  subscription: {
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    plan: { name: string } | null;
  } | null;
};

const subscriptionLabels: Record<string, SubscriptionStatus> = {
  TRIALING: 'Trialing',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Cancelled',
};

function toClient(row: ApiClient): PlatformClient {
  const planName = row.subscription?.plan?.name;
  const plan: PlanName = planName === 'Growth' || planName === 'Scale' || planName === 'Starter' ? planName : 'Starter';
  const end = row.subscription?.status === 'TRIALING' ? row.subscription.trialEndsAt : row.subscription?.currentPeriodEnd;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    owner: row.owners[0]?.name ?? '—',
    email: row.owners[0]?.email ?? '—',
    outlets: row.outletCount,
    plan,
    subscription: subscriptionLabels[row.subscription?.status ?? ''] ?? 'Cancelled',
    period: end ? formatWhen(end, false) : 'No subscription',
    status: row.isActive ? 'Active' : 'Suspended',
  };
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 12.2 11 14.5 15.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path d="M7 4h10M7 20h10M8 4c0 4 8 4 8 8s-8 4-8 8M16 4c0 4-8 4-8 8s8 4 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 9v6M14 9v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path d="M4 9h16l-1.2 10H5.2L4 9ZM7 9V6.5A2.5 2.5 0 0 1 9.5 4h5A2.5 2.5 0 0 1 17 6.5V9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
