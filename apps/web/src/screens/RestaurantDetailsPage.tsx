import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession, saveSession } from '../session';

type DetailView = 'edit' | 'create' | 'validation' | 'saved' | 'saving';

type RestaurantDraft = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pin: string;
  active: boolean;
  outletId: string;
};

const filledDraft: RestaurantDraft = {
  name: 'Saffron House',
  description: 'Family restaurant serving Kerala and North Indian dishes.',
  phone: '+91 0484 235 7788',
  email: 'hello@saffronhouse.in',
  address: '2nd Floor, Marine Drive Road',
  area: 'Marine Drive',
  city: 'Kochi',
  state: 'Kerala',
  pin: '682031',
  active: true,
  outletId: 'SH-KOC-01',
};

const emptyDraft: RestaurantDraft = {
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  area: '',
  city: '',
  state: 'Kerala',
  pin: '',
  active: true,
  outletId: 'Not assigned',
};

const drafts: Record<string, RestaurantDraft> = {
  fort: filledDraft,
  marine: {
    ...filledDraft,
    name: 'Saffron House Marine Drive',
    phone: '+91 0484 236 4410',
    email: 'marine@saffronhouse.in',
    area: 'Marine Drive',
    outletId: 'SH-KOC-02',
  },
  infopark: {
    ...filledDraft,
    name: 'Saffron House Infopark',
    phone: '+91 0484 271 9025',
    email: 'infopark@saffronhouse.in',
    address: 'Infopark Campus',
    area: 'Kakkanad',
    outletId: 'SH-KOC-03',
  },
  lulu: {
    ...filledDraft,
    name: 'Saffron House Lulu Mall Counter',
    phone: '+91 0484 301 5566',
    email: 'lulu@saffronhouse.in',
    address: 'Lulu Mall, Food Court',
    area: 'Edappally',
    active: false,
    outletId: 'SH-KOC-04',
  },
};

const views: { id: DetailView; label: string }[] = [
  { id: 'edit', label: 'Edit Mode (Default)' },
  { id: 'create', label: 'Create Mode' },
  { id: 'validation', label: 'Validation Error' },
  { id: 'saved', label: 'Saved Toast' },
  { id: 'saving', label: 'Loading / Saving' },
];

const states = ['Kerala', 'Tamil Nadu', 'Karnataka'];

type ApiRestaurant = {
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  isActive: boolean;
  branch: { city: string | null };
};

type RestaurantDetailsPageProps = {
  restaurantId?: string;
  onBack: () => void;
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function RestaurantDetailsPage({
  restaurantId,
  onBack,
  onSignOut,
  onNavigate,
}: RestaurantDetailsPageProps) {
  const keepDraft = useRef(false);
  const [view, setView] = useState<DetailView>(restaurantId ? 'edit' : 'create');
  const [draft, setDraft] = useState<RestaurantDraft>(
    restaurantId ? drafts[restaurantId] ?? filledDraft : emptyDraft,
  );
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (keepDraft.current) {
      keepDraft.current = false;
      return;
    }
    if (view === 'create' || view === 'validation') {
      setDraft(emptyDraft);
      return;
    }
    if (view !== 'edit' || !restaurantId || drafts[restaurantId]) {
      setDraft(restaurantId ? drafts[restaurantId] ?? filledDraft : filledDraft);
      return;
    }
    const session = readSession();
    if (!session?.organizationId) return;
    api<ApiRestaurant>(`/organizations/${session.organizationId}/restaurants/${restaurantId}`)
      .then((restaurant) => {
        setDraft({
          name: restaurant.name,
          description: restaurant.description ?? '',
          phone: restaurant.phone ?? '',
          email: restaurant.email ?? '',
          address: restaurant.addressLine1 ?? '',
          area: restaurant.area ?? '',
          city: restaurant.city ?? restaurant.branch.city ?? '',
          state: restaurant.state ?? 'Kerala',
          pin: restaurant.postalCode ?? '',
          active: restaurant.isActive,
          outletId: restaurant.slug,
        });
      })
      .catch(() => undefined);
  }, [view, restaurantId]);

  async function persist() {
    if (saving || view === 'validation') return;
    if (draft.name.trim().length < 2 || draft.city.trim().length < 2) {
      keepDraft.current = true;
      setNotice('');
      setView('validation');
      return;
    }
    const session = readSession();
    if (!session?.organizationId) {
      keepDraft.current = true;
      setView('saved');
      return;
    }
    const body = {
      restaurantName: draft.name.trim(),
      branchName: draft.name.trim(),
      city: draft.city.trim(),
      description: draft.description.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      addressLine1: draft.address.trim() || undefined,
      area: draft.area.trim() || undefined,
      state: draft.state.trim() || undefined,
      postalCode: draft.pin.trim() || undefined,
    };
    setView('saving');
    try {
      if (restaurantId && !drafts[restaurantId]) {
        await api(`/organizations/${session.organizationId}/restaurants/${restaurantId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        const created = await api<{ id: string }>(`/organizations/${session.organizationId}/restaurants`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        const current = readSession();
        if (current) saveSession({ ...current, restaurantId: created.id, restaurantName: draft.name.trim() });
      }
      keepDraft.current = true;
      setNotice('');
      setView('saved');
    } catch (error) {
      keepDraft.current = true;
      setNotice(error instanceof ApiError ? error.message : 'The restaurant could not be saved.');
      setView(restaurantId && !drafts[restaurantId] ? 'edit' : 'create');
    }
  }

  const saving = view === 'saving';
  const showErrors = view === 'validation';
  const nameError = showErrors && draft.name.trim().length < 2 ? 'Enter the restaurant name.' : '';
  const phoneError = showErrors && draft.phone.trim().length < 7 ? 'Enter a phone number.' : '';
  const pinError = showErrors && !/^\d{6}$/.test(draft.pin) ? 'Enter a 6-digit postal code.' : '';
  const titleName = draft.name.trim() || 'New restaurant';

  function update(field: keyof RestaurantDraft, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <AdminShell active="restaurant" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar">
        <span>Screen state</span>
        <div role="group" aria-label="Inspect state">
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
      </div>

      <section className="today-page details-page" aria-labelledby="details-title">
        {view === 'saved' ? (
          <p className="save-toast" role="status">
            Restaurant details saved.
          </p>
        ) : null}
        {notice ? <p className="form-error">{notice}</p> : null}

        <p className="crumb">
          <button type="button" onClick={onBack}>
            Restaurants
          </button>
          <span aria-hidden="true">/</span>
          {titleName}
        </p>

        <div className="details-heading">
          <div>
            <h1 id="details-title">Restaurant details</h1>
            <p>Manage outlet contact details, physical address, and dine-in booking availability.</p>
          </div>
          <p className="outlet-id">Outlet ID: {draft.outletId}</p>
        </div>

        <form
          className="details-card"
          onSubmit={(event) => {
            event.preventDefault();
            void persist();
          }}
        >
          <SectionHeading icon="details" title="Basic details" step="Step 1 of 3" />

          <label className="field">
            <span>Restaurant name *</span>
            <input
              name="name"
              value={draft.name}
              disabled={saving}
              aria-invalid={nameError ? true : undefined}
              onChange={(event) => update('name', event.target.value)}
            />
            {nameError ? <span className="field-error">{nameError}</span> : <span className="field-hint">This name appears on the guest booking portal, invoices, and KOT receipts.</span>}
          </label>

          <label className="field">
            <span className="field-label-row">
              Description
              <span>Max 240 chars</span>
            </span>
            <textarea
              name="description"
              maxLength={240}
              rows={3}
              value={draft.description}
              disabled={saving}
              onChange={(event) => update('description', event.target.value)}
            />
            <span className="field-hint">Briefly describe your cuisine and dining concept for customer reservations.</span>
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Phone number *</span>
              <input
                name="phone"
                value={draft.phone}
                disabled={saving}
                aria-invalid={phoneError ? true : undefined}
                onChange={(event) => update('phone', event.target.value)}
              />
              {phoneError ? <span className="field-error">{phoneError}</span> : <span className="field-hint">Used for automated booking SMS and operational alerts.</span>}
            </label>
            <label className="field">
              <span>Contact email</span>
              <input
                name="email"
                type="email"
                value={draft.email}
                disabled={saving}
                onChange={(event) => update('email', event.target.value)}
              />
              <span className="field-hint">Guest reservation queries, daily audit digests, and receipts.</span>
            </label>
          </div>

          <SectionHeading icon="address" title="Physical address" step="Step 2 of 3" />

          <label className="field">
            <span>Address line</span>
            <input
              name="address"
              value={draft.address}
              disabled={saving}
              onChange={(event) => update('address', event.target.value)}
            />
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Area / Locality</span>
              <input name="area" value={draft.area} disabled={saving} onChange={(event) => update('area', event.target.value)} />
            </label>
            <label className="field">
              <span>City</span>
              <input name="city" value={draft.city} disabled={saving} onChange={(event) => update('city', event.target.value)} />
            </label>
            <label className="field">
              <span>State</span>
              <select
                name="state"
                value={draft.state}
                disabled={saving}
                onChange={(event) => update('state', event.target.value)}
              >
                {states.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Postal code (PIN) *</span>
              <input
                name="pin"
                inputMode="numeric"
                value={draft.pin}
                disabled={saving}
                aria-invalid={pinError ? true : undefined}
                onChange={(event) => update('pin', event.target.value)}
              />
              {pinError ? <span className="field-error">{pinError}</span> : null}
            </label>
          </div>

          <SectionHeading icon="status" title="Status & availability" step="Step 3 of 3" />

          <div className={draft.active ? 'availability is-on' : 'availability'}>
            <div>
              <strong>
                Active dining status
                {draft.active ? <span className="selected-pill">Online for bookings</span> : null}
              </strong>
              <p>When disabled, the front desk cannot accept spot bookings.</p>
            </div>
            <button
              className={draft.active ? 'switch is-on' : 'switch'}
              type="button"
              role="switch"
              aria-checked={draft.active}
              aria-label="Active dining status"
              disabled={saving}
              onClick={() => update('active', !draft.active)}
            />
          </div>

          <div className="details-actions">
            <button className="sign-in-button today-action" type="submit" disabled={saving}>
              {saving ? 'Saving…' : view === 'create' || view === 'validation' ? 'Create restaurant' : 'Save changes'}
            </button>
            <button className="edit-button" type="button" onClick={onBack} disabled={saving}>
              Cancel
            </button>
            <p className="key-hints">Ctrl submits · Esc cancels</p>
          </div>
        </form>

        <footer className="today-meta">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Connected to POS Terminal #01 (Main Counter)
          </p>
          <p className="key-hints">Last modified today at 04:15 PM by Suresh Pillai</p>
        </footer>
      </section>
    </AdminShell>
  );
}

function SectionHeading({ title, step }: { icon: string; title: string; step: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <span>{step}</span>
    </div>
  );
}
