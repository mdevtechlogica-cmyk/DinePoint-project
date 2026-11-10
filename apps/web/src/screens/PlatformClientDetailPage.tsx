import { useEffect, useState } from 'react';
import { api, formatWhen } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';
import { findPlatformClient, platformClients, type PlanName, type PlatformClient, type SubscriptionStatus } from '../data/platformClients';

type DetailView = 'live' | 'trial' | 'pastDue' | 'suspended' | 'none' | 'dialog' | 'saved' | 'loading';
type Surface = 'live' | 'trial' | 'pastDue' | 'suspended' | 'none';

type Outlet = {
  name: string;
  terminal: string;
  city: string;
  tables: string;
  published: boolean;
  action: string;
};

const pills: { id: Exclude<DetailView, 'live'>; label: string }[] = [
  { id: 'trial', label: '1. Active trial' },
  { id: 'pastDue', label: '2. Past due' },
  { id: 'suspended', label: '3. Suspended' },
  { id: 'none', label: '4. No subscription' },
  { id: 'dialog', label: '5. Suspend dialog' },
  { id: 'saved', label: '6. Saved toast' },
  { id: 'loading', label: '7. Loading' },
];

type ApiClientDetail = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  owners: { name: string; email: string; phone: string | null }[];
  subscription: { status: string; currentPeriodEnd: string | null; plan: { name: string } | null } | null;
  outlets: {
    branchName: string;
    city: string | null;
    restaurant: { name: string; isPublished: boolean } | null;
  }[];
};

const planPrice: Record<PlanName, string> = {
  Starter: '₹999',
  Growth: '₹2,499',
  Scale: '₹4,999',
};

const planAllowance: Record<PlanName, { outlets: number; tables: number }> = {
  Starter: { outlets: 2, tables: 20 },
  Growth: { outlets: 3, tables: 40 },
  Scale: { outlets: 8, tables: 120 },
};

type PlatformClientDetailPageProps = {
  clientId: string;
  onBack: () => void;
  onNavigate: (section: PlatformSection) => void;
  onSignOut: () => void;
};

export function PlatformClientDetailPage({ clientId, onBack, onNavigate, onSignOut }: PlatformClientDetailPageProps) {
  const sample = findPlatformClient(clientId);
  const [remote, setRemote] = useState<PlatformClient | null>(null);
  const [apiOutlets, setApiOutlets] = useState<Outlet[] | null>(null);
  const [lookup, setLookup] = useState<'pending' | 'done'>(sample || clientId.length < 12 ? 'done' : 'pending');
  const [meta, setMeta] = useState<{ createdAt: string; phone: string | null } | null>(null);
  const client = remote ?? sample;
  const initial = client ? defaultView(client) : 'trial';
  const [view, setView] = useState<DetailView>(initial);
  const [backdrop, setBackdrop] = useState<Surface>(initial === 'live' ? 'live' : initial === 'loading' ? 'trial' : (initial as Surface));
  const [extraOutlets, setExtraOutlets] = useState<Outlet[]>([]);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (sample || clientId.length < 12) {
      setLookup('done');
      return;
    }
    setLookup('pending');
    api<ApiClientDetail>(`/platform/clients/${clientId}`)
      .then((row) => {
        const planName = row.subscription?.plan?.name;
        const plan: PlanName = planName === 'Growth' || planName === 'Scale' || planName === 'Starter' ? planName : 'Starter';
        const labels: Record<string, SubscriptionStatus> = {
          TRIALING: 'Trialing',
          ACTIVE: 'Active',
          PAST_DUE: 'Past due',
          CANCELLED: 'Cancelled',
          EXPIRED: 'Cancelled',
        };
        setRemote({
          id: row.id,
          name: row.name,
          slug: row.slug,
          owner: row.owners[0]?.name ?? '—',
          email: row.owners[0]?.email ?? '—',
          outlets: row.outlets.length,
          plan,
          subscription: labels[row.subscription?.status ?? ''] ?? 'Cancelled',
          period: row.subscription?.currentPeriodEnd ? formatWhen(row.subscription.currentPeriodEnd, false) : 'No subscription',
          status: row.isActive ? 'Active' : 'Suspended',
        });
        setMeta({ createdAt: row.createdAt, phone: row.owners[0]?.phone ?? null });
        setApiOutlets(
          row.outlets.map((outlet) => ({
            name: outlet.restaurant?.name ?? outlet.branchName,
            terminal: outlet.restaurant ? 'POS' : 'Unassigned',
            city: outlet.city ?? '—',
            tables: outlet.restaurant?.isPublished ? 'Published' : 'Unpublished',
            published: Boolean(outlet.restaurant?.isPublished),
            action: outlet.restaurant?.isPublished ? 'Open POS / Outlets' : 'Configure',
          })),
        );
        setLookup('done');
      })
      .catch(() => setLookup('done'));
  }, [clientId, sample]);

  useEffect(() => {
    document.title = client ? `DinePoint Platform · ${client.name}` : 'DinePoint Platform · Client';
    const next = client ? defaultView(client) : 'trial';
    setView(next);
    setBackdrop(next === 'live' ? 'live' : (next as Surface));
    setExtraOutlets([]);
    setCopied(false);
    setToast(null);
  }, [client, clientId]);

  const surface: Surface = view === 'dialog' || view === 'saved' ? backdrop : view === 'loading' ? 'trial' : view;
  const busy = view === 'loading';
  const suspended = surface === 'suspended';
  const message = view === 'saved' ? `Changes saved for ${client?.name ?? 'this client'}.` : toast;

  function show(next: DetailView) {
    setExtraOutlets([]);
    setCopied(false);
    setToast(null);
    if (next === 'dialog' || next === 'saved') setBackdrop('trial');
    setView(next);
  }

  function openDialog() {
    if (!client || busy) return;
    setBackdrop(surface);
    setToast(null);
    setView('dialog');
  }

  function closeDialog() {
    setView(backdrop);
  }

  if (!client && lookup === 'pending') {
    return (
      <PlatformShell active="clients" onNavigate={onNavigate} onSignOut={onSignOut}>
        <div className="platform-page">
          <section className="today-empty">
            <h1>Loading client</h1>
            <p>Fetching this organization from the platform.</p>
          </section>
        </div>
      </PlatformShell>
    );
  }

  if (!client) {
    return (
      <PlatformShell active="clients" onNavigate={onNavigate} onSignOut={onSignOut}>
        <div className="platform-page">
          <section className="today-empty">
            <h1>Client not found</h1>
            <p>This sample client is not in the platform list.</p>
            <button className="client-change" type="button" onClick={onBack}>
              Back to clients
            </button>
          </section>
        </div>
      </PlatformShell>
    );
  }

  const allowance = planAllowance[client.plan];
  const generated = client ? outletsFor(client, suspended, extraOutlets) : [];
  const outlets = apiOutlets
    ? apiOutlets.map((outlet) => (suspended ? { ...outlet, published: false, action: 'Configure' } : outlet))
    : generated;
  const used = outlets.length;

  function addOutlet() {
    if (!client || busy || used >= allowance.outlets) return;
    setExtraOutlets((current) => [
      ...current,
      {
        name: `${client.name} New outlet`,
        terminal: 'Unassigned',
        city: 'Kochi',
        tables: `0 / ${allowance.tables}`,
        published: false,
        action: 'Configure',
      },
    ]);
    setToast(`Outlet added for ${client.name}.`);
  }

  return (
    <PlatformShell active="clients" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="platform-page">
        <div className="inspect-bar floors-inspect">
          <span className="inspect-label">State demo:</span>
          <div role="group" aria-label="Inspect state">
            {pills.map((item) => (
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

        <section aria-labelledby="client-detail-title">
          <div className="client-crumb-row">
            <button className="client-crumb" type="button" onClick={onBack}>
              <span aria-hidden="true">←</span>
              Clients / {client.name}
            </button>
            <p>CLIENT-ID: {client.id.length > 12 ? client.id.slice(-8).toUpperCase() : clientCode(client)}</p>
          </div>

          {busy ? (
            <div className="today-loading" role="status" aria-live="polite">
              <p>Loading client…</p>
              <span className="skeleton-row" />
              <span className="skeleton-row" />
              <span className="skeleton-row" />
            </div>
          ) : (
            <>
              <div className="client-heading">
                <div>
                  <div className="client-title">
                    <h1 id="client-detail-title">{client.name}</h1>
                    <span className={suspended ? 'clients-status is-suspended' : 'clients-status is-active'}>
                      <i />
                      {suspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                  <p className="client-meta">
                    <span aria-hidden="true">⌂</span> {client.slug} <span aria-hidden="true">·</span> Created {meta?.createdAt ? formatWhen(meta.createdAt, false) : createdOn(client)}
                  </p>
                </div>
                <div className="client-actions">
                  {suspended ? (
                    <button className="client-restore" type="button" onClick={() => show('saved')}>
                      Restore client
                    </button>
                  ) : (
                    <button className="client-suspend" type="button" onClick={openDialog}>
                      <span aria-hidden="true">⊘</span> Suspend client
                    </button>
                  )}
                  <button className="client-change" type="button" onClick={() => setToast(`Subscription updated for ${client.name}.`)}>
                    Change subscription
                  </button>
                </div>
              </div>

              {message ? (
                <p className="save-toast" role="status">
                  {message}
                </p>
              ) : null}

              <article className="client-card">
                <header>
                  <h2>Owners & Administrators</h2>
                  <span>1 Primary Account</span>
                </header>
                <div className="client-fields">
                  <div>
                    <p>Primary owner</p>
                    <strong>{client.owner}</strong>
                    <span>Account Creator</span>
                  </div>
                  <div>
                    <p>Email address</p>
                    <div className="client-email">
                      <strong title={client.email}>{client.email}</strong>
                      <button type="button" aria-label={copied ? 'Email copied' : 'Copy email'} onClick={() => copyEmail(client.email, () => setCopied(true))}>
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span>Verified address</span>
                  </div>
                  <div>
                    <p>Phone</p>
                    <strong>{meta ? meta.phone || '—' : phoneFor(client)}</strong>
                    <span>Registered SMS OTP</span>
                  </div>
                  <div>
                    <p>Privilege level</p>
                    <span className="clients-chip client-privilege">{client.id === 'saffron' ? 'Primary Owner / Super Admin' : 'Primary Owner'}</span>
                  </div>
                </div>
              </article>

              <article className="client-card">
                <header>
                  <h2>Subscription & Licensing</h2>
                  <button type="button" onClick={() => setToast(`Plan change saved for ${client.name}.`)}>
                    Change plan →
                  </button>
                </header>
                {surface === 'none' ? (
                  <div className="today-empty">
                    <h3>No subscription</h3>
                    <p>Assign a plan before this client can publish outlets.</p>
                  </div>
                ) : (
                  <SubscriptionPanel client={client} surface={surface} />
                )}
              </article>

              <article className="client-card">
                <header>
                  <h2>
                    Outlets <span>{used}</span>
                  </h2>
                  <button className="client-add" type="button" onClick={addOutlet} disabled={used >= allowance.outlets}>
                    + Add outlet
                  </button>
                </header>
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Outlet</th>
                      <th>City</th>
                      <th>Tables</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outlets.map((outlet) => (
                      <tr key={outlet.name}>
                        <td>
                          <strong>{outlet.name}</strong>
                          <span className="client-terminal">POS terminal ID: {outlet.terminal}</span>
                        </td>
                        <td>{outlet.city}</td>
                        <td>{outlet.tables}</td>
                        <td>
                          <span className={outlet.published ? 'clients-status is-active' : 'clients-status is-suspended'}>
                            <i />
                            {outlet.published ? 'Published' : 'Unpublished'}
                          </span>
                        </td>
                        <td>
                          <button className={outlet.published ? 'client-link' : 'client-configure'} type="button">
                            {outlet.action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <footer className="client-card-foot">
                  <p>
                    Outlets can be created and managed by the client owner within plan allowance ({used} of {allowance.outlets} used).
                  </p>
                  <p>Geo-Zone: IN-KL</p>
                </footer>
              </article>
            </>
          )}
        </section>

        {view === 'dialog' ? (
          <div className="modal-backdrop" role="presentation" onClick={closeDialog}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="suspend-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="suspend-title">Suspend {client.name}?</h2>
              <p>Suspending this client takes their outlets offline and blocks staff sign-in. You can restore the account later.</p>
              <div className="modal-actions">
                <button className="rename-cancel" type="button" onClick={closeDialog}>
                  Cancel
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => {
                    if (client && client.id.length > 12) {
                      void api(`/platform/clients/${client.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ isActive: false }),
                      }).then(() => setView('suspended'));
                      return;
                    }
                    setView('suspended');
                  }}
                >
                  Suspend client
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}

function SubscriptionPanel({ client, surface }: { client: PlatformClient; surface: Exclude<Surface, 'none'> }) {
  const allowance = planAllowance[client.plan];
  const price = planPrice[client.plan];
  const trialDate = client.id === 'pepper' ? '28 Oct 2026' : '26 Oct 2026';
  const trialNote = client.id === 'pepper' ? '6 days remaining' : '4 days remaining';
  const details = {
    live: {
      status: 'Active',
      chip: 'is-active',
      label: 'Period ends',
      value: client.period.replace('Period ends ', ''),
      note: 'Billed cycle',
      footnote: 'Billed monthly. Card on file.',
    },
    trial: {
      status: 'Trialing',
      chip: 'is-trialing',
      label: 'Trial ends',
      value: client.id === 'saffron' || client.id === 'pepper' ? trialDate : '26 Oct 2026',
      note: trialNote,
      footnote:
        client.id === 'saffron'
          ? 'Trial converts automatically unless canceled. Card ending in 4122 on file.'
          : 'Trial converts automatically unless canceled.',
    },
    pastDue: {
      status: 'Past due',
      chip: 'is-past-due',
      label: 'Period ended',
      value: '1 Oct 2026',
      note: 'Invoice INV-2026-118',
      footnote: 'Payment is overdue. The account stays active until it is suspended.',
    },
    suspended: {
      status: 'Cancelled',
      chip: 'is-cancelled',
      label: 'Ended',
      value: client.period.startsWith('Ended') || client.period.startsWith('Period ended')
        ? client.period.replace('Period ended ', '').replace('Ended ', '')
        : '30 Sep 2026',
      note: 'Access removed',
      footnote: 'This client is suspended. Outlets stay offline until the account is restored.',
    },
  }[surface];

  return (
    <>
      <div className="client-fields">
        <div>
          <p>Current plan</p>
          <strong>{client.plan}</strong>
          <span>Billed Monthly</span>
        </div>
        <div>
          <p>Status</p>
          <span className={`clients-chip ${details.chip}`}>{details.status}</span>
        </div>
        <div>
          <p>{details.label}</p>
          <strong>{details.value}</strong>
          <span>{details.note}</span>
        </div>
        <div>
          <p>Price rate</p>
          <strong>
            {price}
            <small>/month</small>
          </strong>
          <span>+18% GST applicable</span>
        </div>
      </div>
      <div className="client-entitlements">
        <span>Plan Entitlements:</span>
        <span className="clients-chip">{allowance.outlets} outlets allowed</span>
        <span className="clients-chip">{allowance.tables} tables total</span>
        <span className="clients-chip">Reports included</span>
      </div>
      <p className="client-note">{details.footnote}</p>
    </>
  );
}

function defaultView(client: PlatformClient): DetailView {
  if (client.status === 'Suspended') return 'suspended';
  if (client.subscription === 'Past due') return 'pastDue';
  if (client.subscription === 'Cancelled') return 'none';
  if (client.subscription === 'Trialing') return 'trial';
  return 'live';
}

function clientCode(client: PlatformClient) {
  if (client.id === 'saffron') return 'IND-BLR-0824';
  const index = platformClients.findIndex((item) => item.id === client.id) + 1;
  return `IND-KL-${String(800 + index).padStart(4, '0')}`;
}

function createdOn(client: PlatformClient) {
  return client.id === 'saffron' ? '12 Oct 2026' : '4 Sep 2026';
}

function phoneFor(client: PlatformClient) {
  if (client.id === 'saffron') return '+91 98460 20034';
  const index = platformClients.findIndex((item) => item.id === client.id);
  return `+91 98460 ${String(21010 + index)}`;
}

function outletsFor(client: PlatformClient, unpublished: boolean, extra: Outlet[]): Outlet[] {
  const tables = planAllowance[client.plan].tables;
  const base =
    client.id === 'saffron'
      ? [
          { name: 'Saffron House Fort Nagar', terminal: 'POS-FN-01', city: 'Kochi', tables: '22 / 40', published: true, action: 'Open POS / Outlets' },
          { name: 'Saffron House Marine Drive', terminal: 'Unassigned', city: 'Kochi', tables: '14 / 40', published: false, action: 'Configure' },
        ]
      : Array.from({ length: client.outlets }, (_, index) => ({
          name: client.outlets === 1 ? client.name : `${client.name} ${index + 1}`,
          terminal: index === 0 ? `POS-0${index + 1}` : 'Unassigned',
          city: 'Kochi',
          tables: `${Math.max(4, 8 - index)} / ${tables}`,
          published: index === 0,
          action: index === 0 ? 'Open POS / Outlets' : 'Configure',
        }));

  return [...base, ...extra].map((outlet) =>
    unpublished ? { ...outlet, published: false, action: 'Configure' } : outlet,
  );
}

function copyEmail(email: string, onCopied: () => void) {
  onCopied();
  void navigator.clipboard?.writeText(email).catch(() => undefined);
}
