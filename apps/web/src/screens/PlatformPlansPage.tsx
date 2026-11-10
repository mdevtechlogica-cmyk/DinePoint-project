import { useEffect, useState } from 'react';
import { api } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';

type PlansView = 'default' | 'edit' | 'create' | 'invalid' | 'saved' | 'loading' | 'custom';

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  outlets: number;
  tables: number;
  floors: number;
  rooms: number;
  reportDays: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
  reportsOn: boolean;
  adsEnabled: boolean;
  employeesEnabled: boolean;
  exportReports: boolean;
  featured?: boolean;
};

type Draft = {
  name: string;
  price: string;
  description: string;
  outlets: string;
  tables: string;
  floors: string;
  rooms: string;
  reportDays: string;
  smsPerMonth: string;
  whatsappPerMonth: string;
  reportsOn: boolean;
  adsEnabled: boolean;
  employeesEnabled: boolean;
  exportReports: boolean;
};

const seed: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    description: 'Single outlet starter with basic host-stand limits.',
    outlets: 1,
    tables: 10,
    floors: 2,
    rooms: 4,
    reportDays: 7,
    smsPerMonth: 0,
    whatsappPerMonth: 0,
    reportsOn: false,
    adsEnabled: true,
    employeesEnabled: false,
    exportReports: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 999,
    description: 'Multi-outlet groups with SMS/WhatsApp quotas and richer reports.',
    outlets: 3,
    tables: 60,
    floors: 5,
    rooms: 15,
    reportDays: 90,
    smsPerMonth: 200,
    whatsappPerMonth: 200,
    reportsOn: true,
    adsEnabled: false,
    employeesEnabled: true,
    exportReports: true,
    featured: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1999,
    description: 'Larger chains with high table limits and messaging volume.',
    outlets: 10,
    tables: 250,
    floors: -1,
    rooms: -1,
    reportDays: 365,
    smsPerMonth: 1000,
    whatsappPerMonth: 1000,
    reportsOn: true,
    adsEnabled: false,
    employeesEnabled: true,
    exportReports: true,
  },
];

const pills: { id: Exclude<PlansView, 'custom'>; label: string }[] = [
  { id: 'default', label: 'Default (3)' },
  { id: 'edit', label: 'Edit Growth' },
  { id: 'create', label: 'Create plan' },
  { id: 'invalid', label: 'Validation error' },
  { id: 'saved', label: 'Saved toast' },
  { id: 'loading', label: 'Loading' },
];

const blankDraft: Draft = {
  name: '',
  price: '',
  description: '',
  outlets: '',
  tables: '',
  floors: '2',
  rooms: '4',
  reportDays: '7',
  smsPerMonth: '0',
  whatsappPerMonth: '0',
  reportsOn: false,
  adsEnabled: true,
  employeesEnabled: false,
  exportReports: false,
};

type PlatformPlansPageProps = {
  onSignOut: () => void;
  onNavigate: (section: PlatformSection) => void;
};

export function PlatformPlansPage({ onSignOut, onNavigate }: PlatformPlansPageProps) {
  const [plans, setPlans] = useState(seed);
  const [view, setView] = useState<PlansView>('default');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'DinePoint Platform · Plans';
    loadPlans();
  }, []);

  function loadPlans() {
    api<ApiPlan[]>('/platform/plans')
      .then((list) => {
        if (list.length > 0) setPlans(list.map(mapPlan));
      })
      .catch(() => undefined);
  }

  const drawerOpen = view === 'edit' || view === 'create' || view === 'invalid' || view === 'custom';
  const busy = view === 'loading';

  function show(next: Exclude<PlansView, 'custom'>) {
    if (next === 'default') loadPlans();
    else setPlans(seed);
    setErrors({});
    setToast(next === 'saved' ? 'Growth plan saved.' : null);
    if (next === 'edit') {
      const growth = seed.find((plan) => plan.id === 'growth') ?? seed[0];
      setEditingId(growth.id);
      setDraft(toDraft(growth));
    } else if (next === 'create' || next === 'invalid') {
      setEditingId(null);
      setDraft(blankDraft);
      if (next === 'invalid') {
        setErrors({
          name: 'Plan name is required.',
          price: 'Enter a monthly price.',
          outlets: 'Enter the outlet allowance.',
          tables: 'Enter the table allowance.',
          floors: 'Enter floors per restaurant.',
          rooms: 'Enter rooms per restaurant.',
        });
      }
    } else {
      setEditingId(null);
    }
    setView(next);
  }

  function openEdit(plan: Plan) {
    setEditingId(plan.id);
    setDraft(toDraft(plan));
    setErrors({});
    setToast(null);
    setView(plan.id === 'growth' ? 'edit' : 'custom');
  }

  function openCreate() {
    setEditingId(null);
    setDraft(blankDraft);
    setErrors({});
    setToast(null);
    setView('create');
  }

  function closeDrawer() {
    setErrors({});
    setEditingId(null);
    setView(toast ? 'saved' : 'default');
  }

  function savePlan() {
    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (!editingId && !draft.name && !draft.price && !draft.outlets && !draft.tables) setView('invalid');
      return;
    }
    const next = fromDraft(draft, editingId);
    setPlans((current) => (editingId ? current.map((plan) => (plan.id === editingId ? { ...plan, ...next } : plan)) : [...current, next]));
    setEditingId(null);
    setErrors({});
    setToast(`${next.name} plan saved.`);
    setView('saved');
    const body = {
      name: next.name,
      description: next.description,
      monthlyPrice: next.price,
      annualPrice: next.price * 10,
    };
    const entitlements = [
      { key: 'outlets', value: next.outlets },
      { key: 'tables', value: next.tables },
      { key: 'max_floors_per_restaurant', value: next.floors },
      { key: 'max_rooms_per_restaurant', value: next.rooms },
      { key: 'report_history_days', value: next.reportDays },
      { key: 'sms_per_month', value: next.smsPerMonth },
      { key: 'whatsapp_per_month', value: next.whatsappPerMonth },
      { key: 'reports', value: next.reportsOn },
      { key: 'ads_enabled', value: next.adsEnabled },
      { key: 'employees_enabled', value: next.employeesEnabled },
      { key: 'export_reports', value: next.exportReports },
    ];
    const save = editingId && editingId.length > 12
      ? api<{ id: string }>(`/platform/plans/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) })
      : api<{ id: string }>('/platform/plans', { method: 'POST', body: JSON.stringify(body) });
    void save
      .then((plan) =>
        api(`/platform/plans/${plan.id}/entitlements`, {
          method: 'PUT',
          body: JSON.stringify({ entitlements }),
        }),
      )
      .then(() => loadPlans())
      .catch(() => undefined);
  }

  return (
    <PlatformShell active="plans" onNavigate={onNavigate} onSignOut={onSignOut}>
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

        <section aria-labelledby="plans-title">
          <div className="plans-heading">
            <div>
              <div className="plans-title">
                <h1 id="plans-title">Plans</h1>
                <span className="plans-kicker">INR Tiering</span>
              </div>
              <p>Plans DinePoint sells to restaurant clients and franchise partners.</p>
            </div>
            <button className="client-change" type="button" onClick={openCreate} disabled={busy}>
              + New plan
            </button>
          </div>

          {toast && !busy ? (
            <p className="save-toast" role="status">
              {toast}
            </p>
          ) : null}

          {busy ? (
            <div className="today-loading" role="status" aria-live="polite">
              <p>Loading plans…</p>
              <span className="skeleton-row" />
              <span className="skeleton-row" />
              <span className="skeleton-row" />
            </div>
          ) : (
            <div className="plan-grid">
              {plans.map((plan) => (
                <article key={plan.id} className={plan.featured ? 'plan-card is-featured' : 'plan-card'}>
                  {plan.featured ? <span className="plan-flag">Most deployed</span> : null}
                  <div className="plan-card-top">
                    <h2>{plan.name}</h2>
                    <span className="clients-status is-active">
                      <i /> Active
                    </span>
                  </div>
                  <strong className="plan-price">
                    ₹{inr(plan.price)} <small>/ month</small>
                  </strong>
                  <p className="plan-annual">
                    ₹{inr(plan.price * 10)} / year (billed annually, saves 16%)
                  </p>
                  <p className="plan-summary">{plan.description}</p>
                  <p className="plan-label">ENTITLEMENTS</p>
                  <ul className="plan-entitlements">
                    <li>
                      <span className="plan-mark">✓</span>
                      {limitText(plan.outlets)} outlet{plan.outlets === 1 ? '' : 's'}
                    </li>
                    <li>
                      <span className="plan-mark">✓</span>
                      {limitText(plan.tables)} tables / outlet
                    </li>
                    <li>
                      <span className="plan-mark">✓</span>
                      {limitText(plan.floors)} floors · {limitText(plan.rooms)} rooms
                    </li>
                    <li className={plan.reportsOn ? undefined : 'is-off'}>
                      <span className="plan-mark">{plan.reportsOn ? '✓' : '—'}</span>
                      {plan.reportsOn ? `${plan.reportDays}-day reports` : 'Basic logs only'}
                    </li>
                    <li>
                      <span className="plan-mark">✓</span>
                      {limitText(plan.smsPerMonth)} SMS ·{' '}
                      {limitText(plan.whatsappPerMonth)} WhatsApp / mo
                    </li>
                  </ul>
                  <button className="plan-edit" type="button" onClick={() => openEdit(plan)}>
                    Edit plan
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {drawerOpen ? (
          <div className="drawer-backdrop" role="presentation" onClick={closeDrawer}>
            <form
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="plan-drawer-title"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault();
                savePlan();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeDrawer();
              }}
            >
              <div className="drawer-heading">
                <h2 id="plan-drawer-title">{editingId ? `Edit ${draft.name || 'plan'}` : 'Create plan'}</h2>
                <button className="icon-button" type="button" aria-label="Close" onClick={closeDrawer}>
                  ×
                </button>
              </div>
              <p className="drawer-copy">Monthly price is billed in INR. The annual price is ten months, which saves 16%.</p>
              <label className="field">
                Plan name *
                <input
                  value={draft.name}
                  aria-invalid={Boolean(errors.name)}
                  autoFocus
                  onChange={(event) => {
                    setDraft({ ...draft, name: event.target.value });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
                {errors.name ? <span className="field-error">{errors.name}</span> : null}
              </label>
              <label className="field">
                Monthly price (INR) *
                <input
                  inputMode="numeric"
                  value={draft.price}
                  aria-invalid={Boolean(errors.price)}
                  onChange={(event) => {
                    setDraft({ ...draft, price: event.target.value });
                    if (errors.price) setErrors({ ...errors, price: '' });
                  }}
                />
                {errors.price ? <span className="field-error">{errors.price}</span> : <span className="field-hint">Whole rupees, before GST.</span>}
              </label>
              <label className="field">
                Description
                <input
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </label>
              <label className="field">
                Outlet locations *
                <input
                  inputMode="numeric"
                  value={draft.outlets}
                  aria-invalid={Boolean(errors.outlets)}
                  onChange={(event) => {
                    setDraft({ ...draft, outlets: event.target.value });
                    if (errors.outlets) setErrors({ ...errors, outlets: '' });
                  }}
                />
                {errors.outlets ? <span className="field-error">{errors.outlets}</span> : null}
              </label>
              <label className="field">
                Tables per restaurant * (-1 = unlimited)
                <input
                  inputMode="numeric"
                  value={draft.tables}
                  aria-invalid={Boolean(errors.tables)}
                  onChange={(event) => {
                    setDraft({ ...draft, tables: event.target.value });
                    if (errors.tables) setErrors({ ...errors, tables: '' });
                  }}
                />
                {errors.tables ? <span className="field-error">{errors.tables}</span> : null}
              </label>
              <label className="field">
                Floors per restaurant * (-1 = unlimited)
                <input
                  inputMode="numeric"
                  value={draft.floors}
                  aria-invalid={Boolean(errors.floors)}
                  onChange={(event) => {
                    setDraft({ ...draft, floors: event.target.value });
                    if (errors.floors) setErrors({ ...errors, floors: '' });
                  }}
                />
                {errors.floors ? <span className="field-error">{errors.floors}</span> : null}
              </label>
              <label className="field">
                Rooms per restaurant * (-1 = unlimited)
                <input
                  inputMode="numeric"
                  value={draft.rooms}
                  aria-invalid={Boolean(errors.rooms)}
                  onChange={(event) => {
                    setDraft({ ...draft, rooms: event.target.value });
                    if (errors.rooms) setErrors({ ...errors, rooms: '' });
                  }}
                />
                {errors.rooms ? <span className="field-error">{errors.rooms}</span> : null}
              </label>
              <label className="field">
                Report history (days)
                <input
                  inputMode="numeric"
                  value={draft.reportDays}
                  onChange={(event) => setDraft({ ...draft, reportDays: event.target.value })}
                />
              </label>
              <label className="field">
                SMS / month
                <input
                  inputMode="numeric"
                  value={draft.smsPerMonth}
                  onChange={(event) => setDraft({ ...draft, smsPerMonth: event.target.value })}
                />
              </label>
              <label className="field">
                WhatsApp / month
                <input
                  inputMode="numeric"
                  value={draft.whatsappPerMonth}
                  onChange={(event) => setDraft({ ...draft, whatsappPerMonth: event.target.value })}
                />
              </label>
              <label className="field checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.reportsOn}
                  onChange={(event) => setDraft({ ...draft, reportsOn: event.target.checked })}
                />
                Reports enabled
              </label>
              <label className="field checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.exportReports}
                  onChange={(event) => setDraft({ ...draft, exportReports: event.target.checked })}
                />
                CSV export
              </label>
              <label className="field checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.employeesEnabled}
                  onChange={(event) => setDraft({ ...draft, employeesEnabled: event.target.checked })}
                />
                Employees module
              </label>
              <label className="field checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.adsEnabled}
                  onChange={(event) => setDraft({ ...draft, adsEnabled: event.target.checked })}
                />
                Show ads
              </label>
              <div className="modal-actions">
                <button className="rename-cancel" type="button" onClick={closeDrawer}>
                  Cancel
                </button>
                <button className="modal-primary" type="submit">
                  Save plan
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}

type ApiPlan = {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: string | number;
  entitlements: { key: string; value: unknown }[];
};

function mapPlan(plan: ApiPlan): Plan {
  const value = (key: string) => plan.entitlements.find((item) => item.key === key)?.value;
  const asNumber = (key: string, fallback: number) => {
    const raw = value(key);
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  const asBool = (key: string, fallback: boolean) => {
    const raw = value(key);
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return fallback;
  };
  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.monthlyPrice),
    description: plan.description ?? '',
    outlets: asNumber('outlets', 1),
    tables: asNumber('tables', 10),
    floors: asNumber('max_floors_per_restaurant', 2),
    rooms: asNumber('max_rooms_per_restaurant', 4),
    reportDays: asNumber('report_history_days', 7),
    smsPerMonth: asNumber('sms_per_month', 0),
    whatsappPerMonth: asNumber('whatsapp_per_month', 0),
    reportsOn: asBool('reports', false),
    adsEnabled: asBool('ads_enabled', true),
    employeesEnabled: asBool('employees_enabled', false),
    exportReports: asBool('export_reports', false),
    featured: plan.name.toLowerCase().includes('growth'),
  };
}

function toDraft(plan: Plan): Draft {
  return {
    name: plan.name,
    price: String(plan.price),
    description: plan.description,
    outlets: String(plan.outlets),
    tables: String(plan.tables),
    floors: String(plan.floors),
    rooms: String(plan.rooms),
    reportDays: String(plan.reportDays),
    smsPerMonth: String(plan.smsPerMonth),
    whatsappPerMonth: String(plan.whatsappPerMonth),
    reportsOn: plan.reportsOn,
    adsEnabled: plan.adsEnabled,
    employeesEnabled: plan.employeesEnabled,
    exportReports: plan.exportReports,
  };
}

function fromDraft(draft: Draft, id: string | null): Plan {
  return {
    id: id ?? (draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan'),
    name: draft.name.trim(),
    price: Number(draft.price),
    description: draft.description.trim(),
    outlets: Number(draft.outlets),
    tables: Number(draft.tables),
    floors: Number(draft.floors),
    rooms: Number(draft.rooms),
    reportDays: Number(draft.reportDays || 7),
    smsPerMonth: Number(draft.smsPerMonth || 0),
    whatsappPerMonth: Number(draft.whatsappPerMonth || 0),
    reportsOn: draft.reportsOn,
    adsEnabled: draft.adsEnabled,
    employeesEnabled: draft.employeesEnabled,
    exportReports: draft.exportReports,
    featured: draft.name.toLowerCase().includes('growth'),
  };
}

function validate(draft: Draft) {
  const errors: Record<string, string> = {};
  const limitPattern = /^-1$|^[1-9]\d*$/;
  const zeroOk = /^-1$|^0$|^[1-9]\d*$/;
  if (!draft.name.trim()) errors.name = 'Plan name is required.';
  if (!/^\d+$/.test(draft.price.trim())) errors.price = 'Enter a monthly price (0 allowed).';
  if (!limitPattern.test(draft.outlets.trim())) errors.outlets = 'Enter outlets (or -1 unlimited).';
  if (!limitPattern.test(draft.tables.trim())) errors.tables = 'Enter tables (or -1 unlimited).';
  if (!limitPattern.test(draft.floors.trim())) errors.floors = 'Enter floors (or -1 unlimited).';
  if (!limitPattern.test(draft.rooms.trim())) errors.rooms = 'Enter rooms (or -1 unlimited).';
  if (draft.smsPerMonth && !zeroOk.test(draft.smsPerMonth.trim())) errors.smsPerMonth = 'Enter SMS quota.';
  if (draft.whatsappPerMonth && !zeroOk.test(draft.whatsappPerMonth.trim())) {
    errors.whatsappPerMonth = 'Enter WhatsApp quota.';
  }
  return errors;
}

function limitText(value: number) {
  return value < 0 ? 'Unlimited' : String(value);
}

function inr(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}
