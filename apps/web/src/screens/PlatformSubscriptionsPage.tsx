import { useEffect, useState } from 'react';
import { api, formatWhen, toIso } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';
import type { PlanName } from '../data/platformClients';

type SubsView = 'default' | 'pastDue' | 'change' | 'invalid' | 'saved' | 'loading' | 'custom';
type SubStatus = 'Trialing' | 'Active' | 'Past due' | 'Cancelled' | 'Expired';

type SubscriptionRow = {
  id: string;
  subscriptionId?: string;
  name: string;
  slug: string;
  plan: PlanName;
  status: SubStatus;
  trialEnd: string;
  periodEnd: string;
  updated: string;
};

type Draft = {
  plan: PlanName | '';
  status: SubStatus | '';
  trialEnd: string;
  periodEnd: string;
};

const pageSize = 8;
const plans: PlanName[] = ['Starter', 'Growth', 'Scale'];
const statuses: SubStatus[] = ['Trialing', 'Active', 'Past due', 'Cancelled', 'Expired'];

const seed: SubscriptionRow[] = [
  { id: 'saffron', name: 'Saffron House', slug: 'saffron-house', plan: 'Growth', status: 'Trialing', trialEnd: '26 Oct 2026', periodEnd: '22 Nov 2026', updated: '22 Oct 2026' },
  { id: 'marine', name: 'Marine Spice', slug: 'marine-spice', plan: 'Starter', status: 'Active', trialEnd: '—', periodEnd: '12 Nov 2026', updated: '12 Oct 2026' },
  { id: 'lulu', name: 'Lulu Kitchen', slug: 'lulu-kitchen', plan: 'Scale', status: 'Past due', trialEnd: '—', periodEnd: '1 Oct 2026', updated: '2 Oct 2026' },
  { id: 'old-town', name: 'Old Town Café', slug: 'old-town-cafe', plan: 'Starter', status: 'Cancelled', trialEnd: '—', periodEnd: '30 Sep 2026', updated: '30 Sep 2026' },
  { id: 'coastal', name: 'Coastal Curry', slug: 'coastal-curry', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '5 Nov 2026', updated: '5 Oct 2026' },
  { id: 'biryani', name: 'Biryani Junction', slug: 'biryani-junction', plan: 'Scale', status: 'Active', trialEnd: '—', periodEnd: '18 Nov 2026', updated: '18 Oct 2026' },
  { id: 'pepper', name: 'Pepper Trail', slug: 'pepper-trail', plan: 'Starter', status: 'Trialing', trialEnd: '28 Oct 2026', periodEnd: '28 Nov 2026', updated: '14 Oct 2026' },
  { id: 'malabar', name: 'Malabar Spices', slug: 'malabar-spices', plan: 'Starter', status: 'Expired', trialEnd: '—', periodEnd: '15 Sep 2026', updated: '15 Sep 2026' },
  { id: 'fort', name: 'Fort Kochi Grill', slug: 'fort-kochi-grill', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '2 Dec 2026', updated: '2 Oct 2026' },
  { id: 'thekkady', name: 'Thekkady Spice', slug: 'thekkady-spice', plan: 'Starter', status: 'Past due', trialEnd: '—', periodEnd: '18 Oct 2026', updated: '20 Oct 2026' },
  { id: 'alleppey', name: 'Alleppey Backwaters', slug: 'alleppey-backwaters', plan: 'Scale', status: 'Active', trialEnd: '—', periodEnd: '20 Nov 2026', updated: '8 Oct 2026' },
  { id: 'munnar', name: 'Munnar Tea House', slug: 'munnar-tea-house', plan: 'Starter', status: 'Active', trialEnd: '—', periodEnd: '8 Dec 2026', updated: '9 Oct 2026' },
  { id: 'calicut', name: 'Calicut Moplah', slug: 'calicut-moplah', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '14 Nov 2026', updated: '11 Oct 2026' },
  { id: 'trivandrum', name: 'Trivandrum Mess', slug: 'trivandrum-mess', plan: 'Starter', status: 'Active', trialEnd: '—', periodEnd: '18 Nov 2026', updated: '6 Oct 2026' },
  { id: 'kottayam', name: 'Kottayam Kitchen', slug: 'kottayam-kitchen', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '9 Dec 2026', updated: '4 Oct 2026' },
  { id: 'kannur', name: 'Kannur Theyyam', slug: 'kannur-theyyam', plan: 'Starter', status: 'Active', trialEnd: '—', periodEnd: '22 Nov 2026', updated: '3 Oct 2026' },
  { id: 'wayanad', name: 'Wayanad Wild', slug: 'wayanad-wild', plan: 'Scale', status: 'Active', trialEnd: '—', periodEnd: '1 Dec 2026', updated: '7 Oct 2026' },
  { id: 'palakkad', name: 'Palakkad Palate', slug: 'palakkad-palate', plan: 'Starter', status: 'Past due', trialEnd: '—', periodEnd: '10 Oct 2026', updated: '12 Oct 2026' },
  { id: 'thrissur', name: 'Thrissur Sadya', slug: 'thrissur-sadya', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '16 Nov 2026', updated: '10 Oct 2026' },
  { id: 'kollam', name: 'Kollam Catch', slug: 'kollam-catch', plan: 'Scale', status: 'Active', trialEnd: '—', periodEnd: '28 Nov 2026', updated: '13 Oct 2026' },
  { id: 'ernakulam', name: 'Ernakulam Eats', slug: 'ernakulam-eats', plan: 'Starter', status: 'Active', trialEnd: '—', periodEnd: '2 Dec 2026', updated: '1 Oct 2026' },
  { id: 'kozhikode', name: 'Kozhikode Court', slug: 'kozhikode-court', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '11 Dec 2026', updated: '15 Oct 2026' },
  { id: 'varkala', name: 'Varkala Cliff', slug: 'varkala-cliff', plan: 'Starter', status: 'Active', trialEnd: '—', periodEnd: '6 Nov 2026', updated: '16 Oct 2026' },
  { id: 'pondicherry', name: 'Pondicherry Bay', slug: 'pondicherry-bay', plan: 'Growth', status: 'Active', trialEnd: '—', periodEnd: '10 Dec 2026', updated: '17 Oct 2026' },
];

type ApiSubscription = {
  id: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string;
  plan: { name: string };
  organization: { id: string; name: string; slug: string };
};

const statusLabels: Record<string, SubStatus> = {
  TRIALING: 'Trialing',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

const pills: { id: Exclude<SubsView, 'custom'>; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'pastDue', label: 'Filtered: Past due' },
  { id: 'change', label: 'Change plan drawer' },
  { id: 'invalid', label: 'Validation error' },
  { id: 'saved', label: 'Saved toast' },
  { id: 'loading', label: 'Loading' },
];

const blankDraft: Draft = { plan: '', status: '', trialEnd: '', periodEnd: '' };

type PlatformSubscriptionsPageProps = {
  onSignOut: () => void;
  onNavigate: (section: PlatformSection) => void;
  onOpenClient: (clientId: string) => void;
};

export function PlatformSubscriptionsPage({ onSignOut, onNavigate, onOpenClient }: PlatformSubscriptionsPageProps) {
  const [rows, setRows] = useState(seed);
  const [planIds, setPlanIds] = useState<Record<string, string>>({});
  const [view, setView] = useState<SubsView>('default');
  const [status, setStatus] = useState('All statuses');
  const [plan, setPlan] = useState('All plans');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'DinePoint Platform · Subscriptions';
    loadSubscriptions();
  }, []);

  function loadSubscriptions() {
    Promise.all([
      api<{ rows: ApiSubscription[] }>('/platform/subscriptions?pageSize=100'),
      api<{ id: string; name: string }[]>('/platform/plans'),
    ])
      .then(([list, planList]) => {
        setPlanIds(Object.fromEntries(planList.map((item) => [item.name, item.id])));
        if (list.rows.length > 0) {
          setRows(
            list.rows.map((row) => ({
              id: row.organization.id,
              subscriptionId: row.id,
              name: row.organization.name,
              slug: row.organization.slug,
              plan: (row.plan.name === 'Growth' || row.plan.name === 'Scale' || row.plan.name === 'Starter' ? row.plan.name : 'Starter') as PlanName,
              status: statusLabels[row.status] ?? 'Active',
              trialEnd: row.trialEndsAt ? formatWhen(row.trialEndsAt, false) : '—',
              periodEnd: row.currentPeriodEnd ? formatWhen(row.currentPeriodEnd, false) : '—',
              updated: formatWhen(row.updatedAt, false),
            })),
          );
        }
      })
      .catch(() => undefined);
  }

  const busy = view === 'loading';
  const visible = busy ? [] : rows.filter((row) => matches(row, query, status, plan));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = pageRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = pageRows.length === 0 ? 0 : start + pageRows.length - 1;
  const editing = rows.find((row) => row.id === editingId) ?? null;

  function show(next: Exclude<SubsView, 'custom'>) {
    if (next === 'default') loadSubscriptions();
    else setRows(seed);
    setQuery('');
    setPlan('All plans');
    setPage(1);
    setErrors({});
    setToast(next === 'saved' ? 'Subscription updated for Saffron House.' : null);
    setStatus(next === 'pastDue' ? 'Past due' : 'All statuses');
    if (next === 'change') {
      const saffron = seed[0];
      setEditingId(saffron.id);
      setDraft(toDraft(saffron));
    } else if (next === 'invalid') {
      setEditingId(seed[0].id);
      setDraft(blankDraft);
      setErrors({
        plan: 'Choose a plan.',
        status: 'Choose a status.',
        periodEnd: 'Enter a period end.',
      });
    } else {
      setEditingId(null);
    }
    setView(next);
  }

  function updateFilters(next: { query?: string; status?: string; plan?: string }) {
    const queryValue = next.query ?? query;
    const statusValue = next.status ?? status;
    const planValue = next.plan ?? plan;
    setQuery(queryValue);
    setStatus(statusValue);
    setPlan(planValue);
    setPage(1);
    setEditingId(null);
    setToast(null);
    if (!queryValue.trim() && statusValue === 'All statuses' && planValue === 'All plans') setView('default');
    else if (!queryValue.trim() && statusValue === 'Past due' && planValue === 'All plans') setView('pastDue');
    else setView('custom');
  }

  function openChange(row: SubscriptionRow) {
    setEditingId(row.id);
    setDraft(toDraft(row));
    setErrors({});
    setToast(null);
    setView(row.id === 'saffron' ? 'change' : 'custom');
  }

  function closeDrawer() {
    setEditingId(null);
    setErrors({});
    setView(toast ? 'saved' : status === 'Past due' ? 'pastDue' : query || plan !== 'All plans' || status !== 'All statuses' ? 'custom' : 'default');
  }

  function saveChange() {
    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (!draft.plan && !draft.status && !draft.periodEnd) setView('invalid');
      return;
    }
    const client = rows.find((row) => row.id === editingId);
    if (!client) return;
    setRows((current) =>
      current.map((row) =>
        row.id === editingId
          ? {
              ...row,
              plan: draft.plan as PlanName,
              status: draft.status as SubStatus,
              trialEnd: draft.status === 'Trialing' ? draft.trialEnd : '—',
              periodEnd: draft.periodEnd,
              updated: '22 Oct 2026',
            }
          : row,
      ),
    );
    setEditingId(null);
    setErrors({});
    setToast(`Subscription updated for ${client.name}.`);
    setView('saved');
    const statusMap: Record<SubStatus, string> = { Trialing: 'TRIALING', Active: 'ACTIVE', 'Past due': 'PAST_DUE', Cancelled: 'CANCELLED', Expired: 'EXPIRED' };
    const status = draft.status ? statusMap[draft.status] : '';
    if (client.subscriptionId && draft.plan && planIds[draft.plan] && status) {
      void api(`/platform/subscriptions/${client.subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          planId: planIds[draft.plan],
          status,
          ...(draft.status === 'Trialing' && toIso(draft.trialEnd) ? { trialEndsAt: toIso(draft.trialEnd) } : {}),
          ...(toIso(draft.periodEnd) ? { currentPeriodEnd: toIso(draft.periodEnd) } : {}),
        }),
      })
        .then(() => loadSubscriptions())
        .catch(() => undefined);
    }
  }

  return (
    <PlatformShell active="subscriptions" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="platform-page">
        <div className="inspect-bar floors-inspect">
          <span className="inspect-label">State demo:</span>
          <div role="group" aria-label="Inspect state">
            {pills.map((item) => (
              <button key={item.id} type="button" className={view === item.id ? 'state-pill is-active' : 'state-pill'} aria-pressed={view === item.id} onClick={() => show(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <p className="subs-sandbox">
          <span className="status-dot" aria-hidden="true" />
          Live operational sandbox
        </p>

        <section aria-labelledby="subscriptions-title">
          <div className="subs-heading">
            <div>
              <h1 id="subscriptions-title">Subscriptions</h1>
              <p>Every client's current plan</p>
            </div>
            <span className="subs-count">
              <span className="status-dot" aria-hidden="true" />
              {busy ? 24 : visible.length} Total subscriptions
            </span>
          </div>

          <form
            className="subs-bar"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <select aria-label="Status" value={status} disabled={busy} onChange={(event) => updateFilters({ status: event.target.value })}>
              <option>All statuses</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select aria-label="Plan" value={plan} disabled={busy} onChange={(event) => updateFilters({ plan: event.target.value })}>
              <option>All plans</option>
              {plans.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <label className="clients-search">
              <span className="visually-hidden">Search client name or slug</span>
              <SearchIcon />
              <input value={query} placeholder="Search client name or slug..." disabled={busy} onChange={(event) => updateFilters({ query: event.target.value })} />
            </label>
            <button className="subs-reset" type="button" disabled={busy} onClick={() => show('default')}>
              Reset
            </button>
            {!busy ? <span className="subs-showing">Showing {start}–{end} of {visible.length}</span> : null}
          </form>

          {toast && !busy ? (
            <p className="save-toast" role="status">
              {toast}
            </p>
          ) : null}

          {busy ? (
            <div className="today-loading" role="status" aria-live="polite">
              <p>Loading subscriptions…</p>
              <span className="skeleton-row" />
              <span className="skeleton-row" />
              <span className="skeleton-row" />
            </div>
          ) : (
            <div className="clients-card">
              {pageRows.length === 0 ? (
                <div className="today-empty">
                  <h2>No matching subscriptions</h2>
                  <p>No client subscriptions match this search or these filters.</p>
                </div>
              ) : (
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Trial end</th>
                      <th>Period end</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id}>
                        <td className="clients-identity">
                          <button className="clients-name" type="button" onClick={() => onOpenClient(row.id)}>
                            {row.name}
                          </button>
                          <span>{row.slug}</span>
                        </td>
                        <td>{row.plan}</td>
                        <td>
                          <span className={`clients-chip is-${row.status.toLowerCase().replace(' ', '-')}`}>{row.status}</span>
                        </td>
                        <td>{row.trialEnd}</td>
                        <td>{row.periodEnd}</td>
                        <td>{row.updated}</td>
                        <td>
                          <button className="subs-change" type="button" onClick={() => openChange(row)}>
                            Change
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {visible.length > 0 ? (
                <div className="clients-pager">
                  <p>
                    Showing {start}–{end} of {visible.length}
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
          )}
        </section>

        {editing ? (
          <div className="drawer-backdrop" role="presentation" onClick={closeDrawer}>
            <form
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="subscription-drawer-title"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault();
                saveChange();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeDrawer();
              }}
            >
              <div className="drawer-heading">
                <h2 id="subscription-drawer-title">Change plan</h2>
                <button className="icon-button" type="button" aria-label="Close" onClick={closeDrawer}>
                  ×
                </button>
              </div>
              <p className="drawer-copy">
                Update the plan for {editing.name}. This stays on the sample list.
              </p>
              <label className="field">
                Client
                <input value={editing.name} readOnly />
              </label>
              <label className="field">
                Plan *
                <select
                  value={draft.plan}
                  aria-invalid={Boolean(errors.plan)}
                  onChange={(event) => {
                    setDraft({ ...draft, plan: event.target.value as Draft['plan'] });
                    if (errors.plan) setErrors({ ...errors, plan: '' });
                  }}
                >
                  <option value="">Choose a plan</option>
                  {plans.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                {errors.plan ? <span className="field-error">{errors.plan}</span> : null}
              </label>
              <label className="field">
                Status *
                <select
                  value={draft.status}
                  aria-invalid={Boolean(errors.status)}
                  onChange={(event) => {
                    setDraft({ ...draft, status: event.target.value as Draft['status'] });
                    if (errors.status) setErrors({ ...errors, status: '' });
                  }}
                >
                  <option value="">Choose a status</option>
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                {errors.status ? <span className="field-error">{errors.status}</span> : null}
              </label>
              <label className="field">
                Trial end
                <input
                  value={draft.trialEnd}
                  placeholder="26 Oct 2026"
                  aria-invalid={Boolean(errors.trialEnd)}
                  onChange={(event) => {
                    setDraft({ ...draft, trialEnd: event.target.value });
                    if (errors.trialEnd) setErrors({ ...errors, trialEnd: '' });
                  }}
                />
                {errors.trialEnd ? <span className="field-error">{errors.trialEnd}</span> : <span className="field-hint">Required while the subscription is trialing.</span>}
              </label>
              <label className="field">
                Period end *
                <input
                  value={draft.periodEnd}
                  placeholder="22 Nov 2026"
                  aria-invalid={Boolean(errors.periodEnd)}
                  onChange={(event) => {
                    setDraft({ ...draft, periodEnd: event.target.value });
                    if (errors.periodEnd) setErrors({ ...errors, periodEnd: '' });
                  }}
                />
                {errors.periodEnd ? <span className="field-error">{errors.periodEnd}</span> : null}
              </label>
              <div className="modal-actions">
                <button className="rename-cancel" type="button" onClick={closeDrawer}>
                  Cancel
                </button>
                <button className="modal-primary" type="submit">
                  Save change
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}

function matches(row: SubscriptionRow, query: string, status: string, plan: string) {
  const needle = query.trim().toLowerCase();
  if (needle && !`${row.name} ${row.slug}`.toLowerCase().includes(needle)) return false;
  if (status !== 'All statuses' && row.status !== status) return false;
  if (plan !== 'All plans' && row.plan !== plan) return false;
  return true;
}

function toDraft(row: SubscriptionRow): Draft {
  return {
    plan: row.plan,
    status: row.status,
    trialEnd: row.trialEnd === '—' ? '' : row.trialEnd,
    periodEnd: row.periodEnd,
  };
}

function validate(draft: Draft) {
  const errors: Record<string, string> = {};
  if (!draft.plan) errors.plan = 'Choose a plan.';
  if (!draft.status) errors.status = 'Choose a status.';
  if (draft.status === 'Trialing' && !draft.trialEnd.trim()) errors.trialEnd = 'Enter a trial end.';
  if (!draft.periodEnd.trim()) errors.periodEnd = 'Enter a period end.';
  return errors;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
