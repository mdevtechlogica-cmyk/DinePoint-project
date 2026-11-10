import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';

type SpotView = 'default' | 'empty' | 'none' | 'invalid' | 'loading' | 'confirmed';

type FreeTable = {
  id: string;
  number: string;
  seats: number;
  climate: string;
  category: string;
};

const acHallTables: FreeTable[] = [
  { id: 't3', number: 'Table 3', seats: 4, climate: 'AC', category: 'Family' },
  { id: 't4', number: 'Table 4', seats: 4, climate: 'AC', category: 'Family' },
  { id: 't5', number: 'Table 5', seats: 6, climate: 'AC', category: 'Family' },
  { id: 't8', number: 'Table 8', seats: 2, climate: 'AC', category: 'Couples' },
];

const tablesByRoom: Record<string, FreeTable[]> = {
  'AC Dining Hall': acHallTables,
  'Family Room': [
    { id: 'f1', number: 'Table 11', seats: 4, climate: 'AC', category: 'Family' },
    { id: 'f2', number: 'Table 12', seats: 6, climate: 'AC', category: 'Family' },
  ],
  'Private Dining': [],
  'Window Cabin': [{ id: 'c1', number: 'Table 21', seats: 2, climate: 'AC', category: 'Non-family' }],
};

const roomsByFloor: Record<string, string[]> = {
  'Ground Floor': ['AC Dining Hall', 'Family Room', 'Private Dining'],
  'First Floor': ['Window Cabin'],
  Terrace: [],
};

type ApiFloor = { name: string; rooms: { name: string }[] };
type ApiTable = {
  id: string;
  tableNumber: number;
  seats: number;
  isAc: boolean;
  isFamilyFriendly: boolean;
  isActive: boolean;
  room: { name: string } | null;
};

const views: { id: SpotView; label: string }[] = [
  { id: 'default', label: '1. Default (Table 4)' },
  { id: 'empty', label: '2. Empty Form' },
  { id: 'none', label: '3. No Free Tables' },
  { id: 'invalid', label: '4. Validation Errors' },
  { id: 'loading', label: '5. Loading State' },
  { id: 'confirmed', label: '6. Confirmed' },
];

type Draft = {
  name: string;
  phone: string;
  party: number;
  floor: string;
  room: string;
  tableId: string;
  notes: string;
};

const filledDraft: Draft = {
  name: 'Ananya Nair',
  phone: '9847011223',
  party: 4,
  floor: 'Ground Floor',
  room: 'AC Dining Hall',
  tableId: 't4',
  notes: 'Birthday celebration, needs a cake table.',
};

type SpotBookingPageProps = {
  onCancel: () => void;
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function SpotBookingPage({ onCancel, onSignOut, onNavigate }: SpotBookingPageProps) {
  const [view, setView] = useState<SpotView>('default');
  const [draft, setDraft] = useState<Draft>(filledDraft);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [tableError, setTableError] = useState('');
  const [catalog, setCatalog] = useState<{
    roomsByFloor: Record<string, string[]>;
    tablesByRoom: Record<string, FreeTable[]>;
  } | null>(null);

  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId) return;
    const root = `/organizations/${session.organizationId}/restaurants/${session.restaurantId}`;
    Promise.all([api<ApiFloor[]>(`${root}/floors`), api<ApiTable[]>(`${root}/tables`)])
      .then(([floors, tables]) => {
        const roomsByFloor: Record<string, string[]> = {};
        const tablesByRoom: Record<string, FreeTable[]> = {};
        for (const floor of floors) {
          roomsByFloor[floor.name] = floor.rooms.map((room) => room.name);
          for (const room of floor.rooms) tablesByRoom[room.name] = [];
        }
        for (const table of tables.filter((item) => item.isActive)) {
          const roomName = table.room?.name;
          if (!roomName) continue;
          tablesByRoom[roomName] = [
            ...(tablesByRoom[roomName] ?? []),
            {
              id: table.id,
              number: `Table ${table.tableNumber}`,
              seats: table.seats,
              climate: table.isAc ? 'AC' : 'Non-AC',
              category: table.isFamilyFriendly ? 'Family' : 'Non-family',
            },
          ];
        }
        setCatalog({ roomsByFloor, tablesByRoom });
        const firstFloor = floors[0]?.name;
        const firstRoom = firstFloor ? roomsByFloor[firstFloor]?.[0] : undefined;
        const firstTable = firstRoom ? tablesByRoom[firstRoom]?.[0]?.id : '';
        if (firstFloor) {
          setDraft((current) => ({ ...current, floor: firstFloor, room: firstRoom ?? '', tableId: firstTable ?? '' }));
        }
      })
      .catch(() => undefined);
  }, []);

  const floorMap = catalog?.roomsByFloor ?? roomsByFloor;
  const tableMap = catalog?.tablesByRoom ?? tablesByRoom;
  const busy = view === 'loading';
  const rooms = floorMap[draft.floor] ?? [];
  const tables = tableMap[draft.room] ?? [];
  const selected = tables.find((table) => table.id === draft.tableId);

  function show(next: SpotView) {
    if (next === 'empty') {
      setDraft({ ...filledDraft, name: '', phone: '', party: 2, tableId: '', notes: '' });
    } else if (next === 'none') {
      setDraft({ ...filledDraft, room: 'Private Dining', tableId: '' });
    } else if (next === 'invalid') {
      setDraft({ ...filledDraft, name: '', phone: '9847', tableId: '', notes: '' });
    } else {
      setDraft(filledDraft);
    }
    setNameError(next === 'invalid' ? 'Enter the guest name.' : '');
    setPhoneError(next === 'invalid' ? 'Enter a 10-digit mobile number.' : '');
    setTableError(next === 'invalid' ? 'Select a free table.' : '');
    setView(next);
  }

  function update(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function changeFloor(floor: string) {
    const nextRooms = floorMap[floor] ?? [];
    update({ floor, room: nextRooms[0] ?? '', tableId: '' });
    setTableError('');
  }

  function changeRoom(room: string) {
    update({ room, tableId: '' });
    setTableError('');
  }

  function seatGuest() {
    if (busy) return;
    const nextNameError = draft.name.trim().length < 2 ? 'Enter the guest name.' : '';
    const nextPhoneError = draft.phone.length === 10 ? '' : 'Enter a 10-digit mobile number.';
    const nextTableError = draft.tableId ? '' : 'Select a free table.';
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setTableError(nextTableError);
    if (nextNameError || nextPhoneError || nextTableError) {
      setView('invalid');
      return;
    }
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId || draft.tableId.length < 12) {
      setView('confirmed');
      return;
    }
    setView('loading');
    void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/reservations`, {
      method: 'POST',
      body: JSON.stringify({
        guestName: draft.name.trim(),
        guestPhone: draft.phone,
        guestCount: draft.party,
        tableId: draft.tableId,
        specialRequests: draft.notes.trim() || undefined,
      }),
    })
      .then(() => setView('confirmed'))
      .catch(() => setView('invalid'));
  }

  return (
    <AdminShell active="spot" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">Staff QA presets:</span>
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

      <section className="today-page" aria-labelledby="spot-title">
        <div className="spot-heading">
          <div>
            <p className="walkin-kicker">
              <span>Walk-in express</span>
              Instant seating workflow
            </p>
            <h1 id="spot-title">New spot booking</h1>
            <p>Guest is at the restaurant now. The booking is created for the current time and marked Seated immediately.</p>
          </div>
          <p className="service-clock">
            <span className="status-dot" aria-hidden="true" />
            <span>
              <strong>Local service clock</strong>
              10:57 PM · Real-time sync
            </span>
          </p>
        </div>

        {view === 'confirmed' ? (
          <div className="confirm-card">
            <p className="walkin-kicker">
              <span>Seated</span>
            </p>
            <h2>{draft.name || 'Guest'} is seated</h2>
            <p>
              {selected?.number ?? 'Table 4'} · {draft.room || 'AC Dining Hall'} · {draft.floor}
            </p>
            <p>
              Party of {draft.party} · Booking time 10:57 PM, now
            </p>
            <button className="sign-in-button today-action" type="button" onClick={onCancel}>
              Back to today&apos;s bookings
            </button>
          </div>
        ) : (
          <form
            className="spot-card"
            onSubmit={(event) => {
              event.preventDefault();
              seatGuest();
            }}
          >
            <div className="section-heading">
              <h2>
                <span className="step-index">1</span>
                Guest profile &amp; party
              </h2>
              <span>Required for digital GST invoice</span>
            </div>
            <div className="form-grid">
              <label className="field">
                Guest name *
                <span className="input-icon">
                  <input
                    value={draft.name}
                    aria-invalid={Boolean(nameError)}
                    disabled={busy}
                    onChange={(event) => {
                      update({ name: event.target.value });
                      if (nameError) setNameError('');
                    }}
                  />
                  <button type="button" aria-label="Find guest" disabled={busy}>
                    <ContactIcon />
                  </button>
                </span>
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
                    placeholder="98470 11223"
                    onChange={(event) => {
                      update({ phone: event.target.value.replace(/\D/g, '').slice(0, 10) });
                      if (phoneError) setPhoneError('');
                    }}
                  />
                </span>
                {phoneError ? (
                  <span className="field-error">{phoneError}</span>
                ) : (
                  <span className="field-hint">10-digit Indian mobile number for order notifications</span>
                )}
              </label>
            </div>
            <label className="field party-field">
              <span className="field-label-row">
                Party size *
                <span>Covers: 1–20 guests</span>
              </span>
              <span className="party-stepper">
                <button type="button" aria-label="Decrease party size" disabled={busy || draft.party <= 1} onClick={() => update({ party: draft.party - 1 })}>
                  −
                </button>
                <output>{draft.party}</output>
                <button type="button" aria-label="Increase party size" disabled={busy || draft.party >= 20} onClick={() => update({ party: draft.party + 1 })}>
                  +
                </button>
              </span>
            </label>

            <div className="section-heading">
              <h2>
                <span className="step-index">2</span>
                Seating &amp; table allocation
              </h2>
              <span>Ground floor / live state</span>
            </div>
            <div className="form-grid">
              <label className="field">
                Floor level
                <select value={draft.floor} disabled={busy} onChange={(event) => changeFloor(event.target.value)}>
                  {Object.keys(floorMap).map((floor) => (
                    <option key={floor}>{floor}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Section / Room
                <select value={draft.room} disabled={busy || rooms.length === 0} onChange={(event) => changeRoom(event.target.value)}>
                  {rooms.length === 0 ? <option value="">No rooms</option> : null}
                  {rooms.map((room) => (
                    <option key={room}>{room}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-label-row">
              <span>Select available table *</span>
              <span>
                Showing only free tables. {tables.length} free in {draft.room || 'this room'}.
              </span>
            </div>
            {tables.length === 0 ? (
              <div className="today-empty">
                <h2>No free tables</h2>
                <p>No free tables in {draft.room || 'this room'} right now. Try another room or wait for a table to clear.</p>
              </div>
            ) : (
              <div className="table-picker" role="radiogroup" aria-label="Free tables">
                {tables.map((table) => {
                  const pressed = table.id === draft.tableId;
                  return (
                    <button
                      key={table.id}
                      className={pressed ? 'table-choice is-selected' : 'table-choice'}
                      type="button"
                      role="radio"
                      aria-checked={pressed}
                      disabled={busy}
                      onClick={() => {
                        update({ tableId: table.id });
                        if (tableError) setTableError('');
                      }}
                    >
                      {pressed ? <span className="choice-check">✓</span> : null}
                      <strong>{table.number}</strong>
                      <p>{table.seats} seats</p>
                      <span className="context-chip">{table.climate}</span>
                      <span className="context-chip">{table.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {tableError ? <p className="field-error">{tableError}</p> : null}

            <label className="field">
              <span className="field-label-row">
                Guest or kitchen instructions (optional)
                <span>Printed on steward KOT ticket</span>
              </span>
              <textarea
                rows={3}
                value={draft.notes}
                disabled={busy}
                onChange={(event) => update({ notes: event.target.value })}
              />
            </label>

            <div className="details-actions">
              <div className="spot-actions">
                <button className="sign-in-button today-action" type="submit" disabled={busy}>
                  {busy ? 'Seating guest…' : 'Seat guest'}
                </button>
                <button className="edit-button" type="button" onClick={onCancel}>
                  Cancel
                </button>
              </div>
              <p className="booking-now">
                <span className="status-dot" aria-hidden="true" />
                Booking time: 10:57 PM, now
              </p>
            </div>
          </form>
        )}

        <div className="rooms-sync">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Connected to Saffron House POS &amp; Table Synchronizer · {draft.floor} / {draft.room || 'No room'}
          </p>
          <p>Station #04 (Manager Touch Terminal)</p>
          <p>IST (UTC+5:30)</p>
        </div>
      </section>
    </AdminShell>
  );
}

function formatPhone(digits: string) {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function ContactIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M7 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
