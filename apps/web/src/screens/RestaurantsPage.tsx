import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession, saveSession } from '../session';
import { RestaurantDetailsPage } from './RestaurantDetailsPage';

type RestaurantView = 'default' | 'empty' | 'loading';

type Restaurant = {
  id: string;
  name: string;
  area: string;
  phone: string;
  active: boolean;
};

const restaurants: Restaurant[] = [
  { id: 'fort', name: 'Saffron House', area: 'Fort Nagar, Kochi', phone: '0484 235 7788', active: true },
  { id: 'marine', name: 'Saffron House Marine Drive', area: 'Marine Drive, Kochi', phone: '0484 236 4410', active: true },
  { id: 'infopark', name: 'Saffron House Infopark', area: 'Kakkanad, Kochi', phone: '0484 271 9025', active: true },
  { id: 'lulu', name: 'Saffron House Lulu Mall Counter', area: 'Edappally, Kochi', phone: '0484 301 5566', active: false },
];

const views: { id: RestaurantView; label: string }[] = [
  { id: 'default', label: '1. Default (4 Outlets)' },
  { id: 'empty', label: '2. First-time Empty State' },
  { id: 'loading', label: '3. Loading Skeleton' },
];

type RestaurantsPageProps = {
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function RestaurantsPage({ onSignOut, onNavigate }: RestaurantsPageProps) {
  const [view, setView] = useState<RestaurantView>('default');
  const [items, setItems] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState(() => readSession()?.restaurantId ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');

  function choose(id: string, name?: string) {
    setSelectedId(id);
    const session = readSession();
    if (session) saveSession({ ...session, restaurantId: id, restaurantName: name ?? session.restaurantName });
  }

  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId) return;
    api<ApiRestaurant[]>(`/organizations/${session.organizationId}/restaurants`)
      .then((list) => {
        const mapped = list.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
          area: [restaurant.area, restaurant.city].filter((part): part is string => Boolean(part)).join(', ') || restaurant.branch.city || '—',
          phone: restaurant.phone || '—',
          active: restaurant.isActive,
        }));
        setItems(mapped);
        const current = readSession()?.restaurantId;
        const next = mapped.find((item) => item.id === current) ?? mapped[0];
        if (next) choose(next.id, next.name);
      })
      .catch(() => setNotice('Restaurants could not be loaded.'));
  }, [creating, editingId]);

  const signedIn = Boolean(readSession()?.organizationId);
  const visible = view === 'default' ? (signedIn ? items : restaurants) : [];

  if (creating || editingId) {
    return (
      <RestaurantDetailsPage
        restaurantId={creating ? undefined : editingId ?? undefined}
        onBack={() => {
          setCreating(false);
          setEditingId(null);
        }}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
      />
    );
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
        <p className="sync-note">Operational sync active</p>
      </div>

      <section className="today-page" aria-labelledby="restaurants-title">
        <div className="today-heading">
          <div>
            <h1 id="restaurants-title">Restaurants</h1>
            <p>{notice || 'Select a restaurant outlet to switch live terminal management and floor plans.'}</p>
          </div>
          <button className="sign-in-button today-action" type="button" onClick={() => setCreating(true)}>
            + Add restaurant
          </button>
        </div>

        {view === 'loading' ? <RestaurantSkeleton /> : null}
        {view === 'empty' ? <EmptyRestaurants /> : null}
        {view === 'default' ? (
          <ul className="restaurant-list">
            {visible.map((restaurant) => {
              const selected = restaurant.id === selectedId;
              return (
                <li key={restaurant.id} className={selected ? 'restaurant-card is-selected' : 'restaurant-card'}>
                  <span className="restaurant-mark" aria-hidden="true">
                    S
                  </span>
                  <div className="restaurant-copy">
                    <strong>
                      {restaurant.name}
                      {selected ? <span className="selected-pill">Selected</span> : null}
                    </strong>
                    <p>{restaurant.area}</p>
                  </div>
                  <p className="restaurant-phone">{restaurant.phone}</p>
                  <span className={restaurant.active ? 'outlet-status is-active' : 'outlet-status'}>
                    {restaurant.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    className={selected ? 'manage-button is-current' : 'manage-button'}
                    type="button"
                    onClick={() => choose(restaurant.id, restaurant.name)}
                  >
                    {selected ? 'Managing' : 'Manage'}
                  </button>
                  <button className="edit-button" type="button" onClick={() => setEditingId(restaurant.id)}>
                    Edit
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <footer className="today-meta">
          <p>
            <span className="status-dot" aria-hidden="true" />
            DinePoint Back Office &amp; POS Hub · India Edition (IST UTC+5:30)
          </p>
          <p className="key-hints">Firmware v2.8.4 · GSTIN 32AABCS1429B1Z0</p>
        </footer>
      </section>
    </AdminShell>
  );
}

type ApiRestaurant = {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  branch: { city: string | null };
};

function EmptyRestaurants() {
  return (
    <div className="today-empty">
      <h2>No restaurants yet</h2>
      <p>Add your first restaurant to start managing tables and spot bookings.</p>
    </div>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="today-loading" role="status" aria-live="polite">
      <p>Loading restaurants…</p>
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index} className="skeleton-row" />
      ))}
    </div>
  );
}
