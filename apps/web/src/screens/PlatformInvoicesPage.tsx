import { useEffect, useState } from 'react';
import { api, formatWhen, toIso } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';
import { platformClients } from '../data/platformClients';

type InvoiceStatus = 'Due' | 'Paid' | 'Void';
type InvoiceView = 'default' | 'due' | 'create' | 'paid' | 'void' | 'empty' | 'loading' | 'custom';

type Invoice = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  slug: string;
  amount: number;
  period: string;
  status: InvoiceStatus;
  issued: string;
  reference: string;
};

type Draft = {
  clientId: string;
  amount: string;
  periodStart: string;
  periodEnd: string;
  reference: string;
};

const seed: Invoice[] = [
  { id: 'inv-118', number: 'INV-2026-118', clientId: 'lulu', clientName: 'Lulu Kitchen', slug: 'lulu-kitchen', amount: 4999, period: '1 Oct – 31 Oct 2026', status: 'Due', issued: '1 Oct 2026', reference: '—' },
  { id: 'inv-104', number: 'INV-2026-104', clientId: 'marine', clientName: 'Marine Spice', slug: 'marine-spice', amount: 999, period: '1 Sep – 30 Sep 2026', status: 'Paid', issued: 'Paid 2 Oct 2026', reference: 'UPI-88421' },
  { id: 'inv-099', number: 'INV-2026-099', clientId: 'old-town', clientName: 'Old Town Café', slug: 'old-town-cafe', amount: 999, period: '1 Sep – 30 Sep 2026', status: 'Void', issued: '1 Sep 2026', reference: '—' },
];

const pills: { id: Exclude<InvoiceView, 'custom'>; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'due', label: 'Filtered: Due' },
  { id: 'create', label: 'New invoice drawer' },
  { id: 'paid', label: 'Mark paid dialog' },
  { id: 'void', label: 'Void dialog' },
  { id: 'empty', label: 'Empty' },
  { id: 'loading', label: 'Loading' },
];

const blankDraft: Draft = { clientId: '', amount: '', periodStart: '', periodEnd: '', reference: '' };

type PlatformInvoicesPageProps = {
  onSignOut: () => void;
  onNavigate: (section: PlatformSection) => void;
  onOpenClient: (clientId: string) => void;
};

export function PlatformInvoicesPage({ onSignOut, onNavigate, onOpenClient }: PlatformInvoicesPageProps) {
  const [invoices, setInvoices] = useState(seed);
  const [clients, setClients] = useState(platformClients);
  const [view, setView] = useState<InvoiceView>('default');
  const [status, setStatus] = useState('All statuses');
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<{ type: 'paid' | 'void'; id: string } | null>(null);

  useEffect(() => {
    document.title = 'DinePoint Platform · Invoices';
    loadInvoices();
  }, []);

  function loadInvoices() {
    api<{ rows: ApiInvoice[] }>('/platform/invoices?pageSize=100')
      .then((data) => {
        if (data.rows.length > 0) setInvoices(data.rows.map(toInvoice));
      })
      .catch(() => undefined);
    api<{ rows: { id: string; name: string; slug: string }[] }>('/platform/clients?pageSize=100')
      .then((data) => {
        if (data.rows.length === 0) return;
        setClients(
          data.rows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            owner: '',
            email: '',
            outlets: 0,
            plan: 'Starter' as const,
            subscription: 'Active' as const,
            period: '',
            status: 'Active' as const,
          })),
        );
      })
      .catch(() => undefined);
  }

  const busy = view === 'loading';
  const source = view === 'empty' || busy ? [] : invoices;
  const visible = source.filter((invoice) => matches(invoice, query, status));
  const total = visible.reduce((sum, invoice) => sum + invoice.amount, 0);
  const counts = {
    due: visible.filter((invoice) => invoice.status === 'Due').length,
    paid: visible.filter((invoice) => invoice.status === 'Paid').length,
    void: visible.filter((invoice) => invoice.status === 'Void').length,
  };
  const activeInvoice = invoices.find((invoice) => invoice.id === dialog?.id) ?? null;

  function show(next: Exclude<InvoiceView, 'custom'>) {
    if (next === 'default') loadInvoices();
    else setInvoices(seed);
    setQuery('');
    setStatus(next === 'due' ? 'Due' : 'All statuses');
    setErrors({});
    setDraft(blankDraft);
    setDrawer(next === 'create');
    setDialog(next === 'paid' ? { type: 'paid', id: 'inv-118' } : next === 'void' ? { type: 'void', id: 'inv-118' } : null);
    setView(next);
  }

  function updateFilters(next: { query?: string; status?: string }) {
    const queryValue = next.query ?? query;
    const statusValue = next.status ?? status;
    setQuery(queryValue);
    setStatus(statusValue);
    setDrawer(false);
    setDialog(null);
    if (!queryValue.trim() && statusValue === 'All statuses') setView('default');
    else if (!queryValue.trim() && statusValue === 'Due') setView('due');
    else setView('custom');
  }

  function openCreate() {
    setDraft(blankDraft);
    setErrors({});
    setDialog(null);
    setDrawer(true);
    setView('create');
  }

  function closeDrawer() {
    setDrawer(false);
    setErrors({});
    if (view === 'create') setView('default');
  }

  function closeDialog() {
    setDialog(null);
    if (view === 'paid' || view === 'void') setView('default');
  }

  function openDialog(type: 'paid' | 'void', invoice: Invoice) {
    if (invoice.status !== 'Due') return;
    setDialog({ type, id: invoice.id });
    setDrawer(false);
    setView(invoice.id === 'inv-118' ? (type === 'paid' ? 'paid' : 'void') : 'custom');
  }

  function confirmDialog() {
    if (!dialog) return;
    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== dialog.id || invoice.status !== 'Due') return invoice;
        if (dialog.type === 'paid') return { ...invoice, status: 'Paid', issued: 'Paid 22 Oct 2026' };
        return { ...invoice, status: 'Void' };
      }),
    );
    setDialog(null);
    setView('custom');
    if (dialog.id.length > 12) {
      void api(`/platform/invoices/${dialog.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: dialog.type === 'paid' ? 'PAID' : 'VOID' }),
      })
        .then(() => loadInvoices())
        .catch(() => undefined);
    }
  }

  function saveInvoice() {
    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const client = clients.find((item) => item.id === draft.clientId);
    if (!client) return;
    const sequence = invoices.reduce((max, invoice) => Math.max(max, Number(invoice.number.split('-').at(-1) ?? 0)), 100);
    setInvoices((current) => [
      {
        id: `inv-${sequence + 1}`,
        number: `INV-2026-${sequence + 1}`,
        clientId: client.id,
        clientName: client.name,
        slug: client.slug,
        amount: Number(draft.amount),
        period: `${draft.periodStart.trim()} – ${draft.periodEnd.trim()}`,
        status: 'Due',
        issued: '22 Oct 2026',
        reference: draft.reference.trim() || '—',
      },
      ...current,
    ]);
    setDrawer(false);
    setDraft(blankDraft);
    setErrors({});
    setView('custom');
    const periodStart = toIso(draft.periodStart);
    const periodEnd = toIso(draft.periodEnd);
    if (client.id.length < 12) return;
    void api('/platform/invoices', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: client.id,
        amount: Number(draft.amount),
        ...(periodStart ? { periodStart } : {}),
        ...(periodEnd ? { periodEnd } : {}),
        ...(draft.reference.trim() ? { paymentReference: draft.reference.trim() } : {}),
      }),
    })
      .then(() => loadInvoices())
      .catch(() => undefined);
  }

  return (
    <PlatformShell active="invoices" onNavigate={onNavigate} onSignOut={onSignOut}>
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
        <p className="subs-sandbox">Manual Ledger · Read/Write Mode</p>

        <section aria-labelledby="invoices-title">
          <div className="subs-heading">
            <div>
              <h1 id="invoices-title">Invoices</h1>
              <p>Manual billing records for clients</p>
            </div>
            <button className="client-change" type="button" disabled={busy} onClick={openCreate}>
              + New invoice
            </button>
          </div>

          <form
            className="subs-bar"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <select aria-label="Status" value={status} disabled={busy} onChange={(event) => updateFilters({ status: event.target.value })}>
              <option>All statuses</option>
              <option>Due</option>
              <option>Paid</option>
              <option>Void</option>
            </select>
            <label className="clients-search">
              <span className="visually-hidden">Search client organization</span>
              <SearchIcon />
              <input value={query} placeholder="Search client organization" disabled={busy} onChange={(event) => updateFilters({ query: event.target.value })} />
            </label>
            <button className="subs-reset" type="button" disabled={busy} onClick={() => show('default')}>
              Reset
            </button>
            <span className="subs-count">
              <span className="status-dot" aria-hidden="true" />
              {visible.length} {visible.length === 1 ? 'invoice' : 'invoices'} · ₹{inr(total)} total
            </span>
          </form>

          {busy ? (
            <div className="today-loading" role="status" aria-live="polite">
              <p>Loading invoices…</p>
              <span className="skeleton-row" />
              <span className="skeleton-row" />
              <span className="skeleton-row" />
            </div>
          ) : (
            <div className="clients-card">
              {visible.length === 0 ? (
                <div className="today-empty">
                  <h2>{view === 'empty' ? 'No invoices yet' : 'No matching invoices'}</h2>
                  <p>{view === 'empty' ? 'Manual billing records will appear here.' : 'No invoices match this search or status.'}</p>
                </div>
              ) : (
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th>Period</th>
                      <th>Status</th>
                      <th>Issued</th>
                      <th>Reference</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <span className="invoice-no">
                            INV-
                            <br />
                            {invoice.number.slice(4)}
                          </span>
                        </td>
                        <td className="clients-identity">
                          <button className="clients-name" type="button" onClick={() => onOpenClient(invoice.clientId)}>
                            {invoice.clientName}
                          </button>
                          <span>{invoice.slug}</span>
                        </td>
                        <td>
                          <strong>₹{inr(invoice.amount)}</strong>
                        </td>
                        <td>{invoice.period}</td>
                        <td>
                          <span className={`clients-chip is-${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                        </td>
                        <td>{invoice.issued}</td>
                        <td>{invoice.reference}</td>
                        <td>
                          <div className="invoice-actions">
                            <button className="invoice-paid" type="button" disabled={invoice.status !== 'Due'} onClick={() => openDialog('paid', invoice)}>
                              Mark paid
                            </button>
                            <button className="invoice-void" type="button" disabled={invoice.status !== 'Due'} onClick={() => openDialog('void', invoice)}>
                              Void
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="invoice-foot">
                <p>
                  Showing {visible.length === 0 ? 0 : 1}–{visible.length} of {visible.length} invoices
                </p>
                <p className="invoice-legend">
                  <span>
                    <i className="is-due" />
                    {counts.due} Due
                  </span>
                  <span>
                    <i className="is-paid" />
                    {counts.paid} Paid
                  </span>
                  <span>
                    <i className="is-void" />
                    {counts.void} Void
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>

        {drawer ? (
          <div className="drawer-backdrop" role="presentation" onClick={closeDrawer}>
            <form
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-drawer-title"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault();
                saveInvoice();
              }}
            >
              <div className="drawer-heading">
                <h2 id="invoice-drawer-title">New invoice</h2>
                <button className="icon-button" type="button" aria-label="Close" onClick={closeDrawer}>
                  ×
                </button>
              </div>
              <p className="drawer-copy">Create a due invoice on the sample ledger. Nothing is sent to the API.</p>
              <label className="field">
                Client *
                <select
                  value={draft.clientId}
                  aria-invalid={Boolean(errors.clientId)}
                  onChange={(event) => {
                    setDraft({ ...draft, clientId: event.target.value });
                    if (errors.clientId) setErrors({ ...errors, clientId: '' });
                  }}
                >
                  <option value="">Choose a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId ? <span className="field-error">{errors.clientId}</span> : null}
              </label>
              <label className="field">
                Amount (INR) *
                <input
                  inputMode="numeric"
                  value={draft.amount}
                  aria-invalid={Boolean(errors.amount)}
                  onChange={(event) => {
                    setDraft({ ...draft, amount: event.target.value });
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }}
                />
                {errors.amount ? <span className="field-error">{errors.amount}</span> : null}
              </label>
              <label className="field">
                Period start *
                <input
                  value={draft.periodStart}
                  placeholder="1 Oct 2026"
                  aria-invalid={Boolean(errors.periodStart)}
                  onChange={(event) => {
                    setDraft({ ...draft, periodStart: event.target.value });
                    if (errors.periodStart) setErrors({ ...errors, periodStart: '' });
                  }}
                />
                {errors.periodStart ? <span className="field-error">{errors.periodStart}</span> : null}
              </label>
              <label className="field">
                Period end *
                <input
                  value={draft.periodEnd}
                  placeholder="31 Oct 2026"
                  aria-invalid={Boolean(errors.periodEnd)}
                  onChange={(event) => {
                    setDraft({ ...draft, periodEnd: event.target.value });
                    if (errors.periodEnd) setErrors({ ...errors, periodEnd: '' });
                  }}
                />
                {errors.periodEnd ? <span className="field-error">{errors.periodEnd}</span> : null}
              </label>
              <label className="field">
                Reference
                <input value={draft.reference} placeholder="UPI-88421" onChange={(event) => setDraft({ ...draft, reference: event.target.value })} />
              </label>
              <div className="modal-actions">
                <button className="rename-cancel" type="button" onClick={closeDrawer}>
                  Cancel
                </button>
                <button className="modal-primary" type="submit">
                  Create invoice
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {activeInvoice && dialog ? (
          <div className="modal-backdrop" role="presentation" onClick={closeDialog}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="invoice-dialog-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="invoice-dialog-title">
                {dialog.type === 'paid' ? `Mark ${activeInvoice.number} paid?` : `Void ${activeInvoice.number}?`}
              </h2>
              <p>
                {dialog.type === 'paid'
                  ? `This records ₹${inr(activeInvoice.amount)} as paid for ${activeInvoice.clientName}.`
                  : 'A void invoice stays on the ledger and cannot be marked paid.'}
              </p>
              <div className="modal-actions">
                <button className="rename-cancel" type="button" onClick={closeDialog}>
                  Cancel
                </button>
                <button className={dialog.type === 'paid' ? 'modal-primary' : 'danger-button'} type="button" onClick={confirmDialog}>
                  {dialog.type === 'paid' ? 'Mark paid' : 'Void invoice'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}

type ApiInvoice = {
  id: string;
  amount: string | number;
  status: 'DUE' | 'PAID' | 'VOID';
  periodStart: string | null;
  periodEnd: string | null;
  paymentReference: string | null;
  issuedAt: string;
  paidAt: string | null;
  organization: { id: string; name: string; slug: string };
};

const invoiceStatus = { DUE: 'Due', PAID: 'Paid', VOID: 'Void' } as const;

function toInvoice(row: ApiInvoice): Invoice {
  const period = row.periodStart && row.periodEnd ? `${formatWhen(row.periodStart, false)} – ${formatWhen(row.periodEnd, false)}` : '—';
  return {
    id: row.id,
    number: `INV-${row.id.slice(-8).toUpperCase()}`,
    clientId: row.organization.id,
    clientName: row.organization.name,
    slug: row.organization.slug,
    amount: Number(row.amount),
    period,
    status: invoiceStatus[row.status],
    issued: row.status === 'PAID' && row.paidAt ? `Paid ${formatWhen(row.paidAt, false)}` : formatWhen(row.issuedAt, false),
    reference: row.paymentReference || '—',
  };
}

function matches(invoice: Invoice, query: string, status: string) {
  const needle = query.trim().toLowerCase();
  if (needle && !`${invoice.clientName} ${invoice.slug} ${invoice.number}`.toLowerCase().includes(needle)) return false;
  if (status !== 'All statuses' && invoice.status !== status) return false;
  return true;
}

function validate(draft: Draft) {
  const errors: Record<string, string> = {};
  if (!draft.clientId) errors.clientId = 'Choose a client.';
  if (!/^[1-9]\d*$/.test(draft.amount.trim())) errors.amount = 'Enter an amount.';
  if (!draft.periodStart.trim()) errors.periodStart = 'Enter a period start.';
  if (!draft.periodEnd.trim()) errors.periodEnd = 'Enter a period end.';
  return errors;
}

function inr(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
